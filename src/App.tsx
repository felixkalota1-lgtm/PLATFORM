import { useState, useEffect } from "react";
import { db, auth } from "./firebase";
import {
  collection,
  query,
  where,
  getDocs,
  setDoc,
  doc,
  deleteDoc,
  getDoc,
  updateDoc,
  orderBy,
  limit,
  startAfter,
  addDoc,
} from "firebase/firestore";
import { signInWithEmailAndPassword } from "firebase/auth";
import * as XLSX from "xlsx";
import { signUpWithEmailAndPassword } from "./firebaseAuth";
import CryptoJS from "crypto-js";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Quotations from "./pages/Quotations";
import Inquiries from "./pages/Inquiries";
import Settings from "./pages/Settings";
import History from "./pages/History";
import Vendors from "./pages/Vendors";

// ==========================================
// EMAIL NORMALIZATION UTILITY
// ==========================================
// CRITICAL: Use this for ALL email operations throughout the app
// Ensures emails are uniform format (lowercase + trimmed) everywhere
const normalizeEmail = (email: string | undefined | null): string => {
  return (email || "").toLowerCase().trim();
};

interface Product {
  id: string;
  name: string;
  partNumber: string;
  price: number;
  qty: number;
  stock: string;
  image?: string;
  currency?: string;
  seller?: string;
  addedAt?: number;
}

interface PDFTemplate {
  id: string;
  name: string;
  type: "quotation" | "inquiry";
  htmlContent: string;
  companyName: string;
  companyLogo?: string;
  createdAt: string;
  isDefault: boolean;
}

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  currency: string;
  quantity: number;
}

interface Order {
  id: string;
  marketplaceItemId?: string;
  itemName?: string;
  itemPrice?: number;
  itemCurrency?: string;
  quantity?: number;
  totalPrice: number;
  buyer: string;
  seller: string;
  status: "pending" | "accepted" | "shipped" | "delivered" | "cancelled";
  createdAt: number | string;
  updatedAt?: number;
  buyerNotes?: string;
  items?: OrderItem[];
  currency?: string;
  timestamp?: number;
}

const CURRENCY_OPTIONS = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "ZWK", symbol: "ZK", name: "Zambian Kwacha" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "ZAR", symbol: "R", name: "South African Rand" },
  { code: "NGN", symbol: "₦", name: "Nigerian Naira" },
  { code: "KES", symbol: "KSh", name: "Kenyan Shilling" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
];

// IndexedDB utilities for large product storage
const DB_NAME = "PSPMDatabase";
const STORE_NAME = "products";

const initIndexedDB = async (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 3);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("username", "username", { unique: false });
        store.createIndex("name", "name", { unique: false });
        store.createIndex("partNumber", "partNumber", { unique: false });
      }
      if (!db.objectStoreNames.contains("quotations")) {
        const quotationStore = db.createObjectStore("quotations", {
          keyPath: "id",
        });
        quotationStore.createIndex("username", "username", { unique: false });
        quotationStore.createIndex("number", "number", { unique: false });
      }
      if (!db.objectStoreNames.contains("inquiries")) {
        const inquiryStore = db.createObjectStore("inquiries", {
          keyPath: "id",
        });
        inquiryStore.createIndex("username", "username", { unique: false });
        inquiryStore.createIndex("number", "number", { unique: false });
      }
      if (!db.objectStoreNames.contains("templates")) {
        const templateStore = db.createObjectStore("templates", {
          keyPath: "id",
        });
        templateStore.createIndex("username", "username", { unique: false });
        templateStore.createIndex("type", "type", { unique: false });
      }
      if (!db.objectStoreNames.contains("cart")) {
        const cartStore = db.createObjectStore("cart", { keyPath: "id" });
        cartStore.createIndex("username", "username", { unique: false });
        cartStore.createIndex("seller", "seller", { unique: false });
      }
    };
  });
};

// ==========================================
// UTILITY FUNCTIONS (defined outside component)
// ==========================================

const saveProductToIndexedDB = async (
  username: string,
  product: Product,
): Promise<void> => {
  try {
    const database = await initIndexedDB();
    const transaction = database.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const productWithUser = { ...product, username };

    return new Promise((resolve, reject) => {
      const request = store.put(productWithUser);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.error("Error saving to IndexedDB:", error);
  }
};

const loadProductsFromIndexedDB = async (
  username: string,
): Promise<Product[]> => {
  try {
    const database = await initIndexedDB();
    const transaction = database.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index("username");
    const range = IDBKeyRange.only(username);

    return new Promise((resolve, reject) => {
      const request = index.getAll(range);
      request.onerror = () => {
        console.error("IndexedDB getAll error:", request.error);
        reject(request.error);
      };
      request.onsuccess = () => {
        const products = request.result.map(
          ({ username, ...product }) => product,
        );
        console.log(`Loaded ${products.length} products for user ${username}`);
        resolve(products);
      };
    });
  } catch (error) {
    console.error("Error loading from IndexedDB:", error);
    return [];
  }
};

const deleteProductFromIndexedDB = async (productId: string): Promise<void> => {
  try {
    const database = await initIndexedDB();
    const transaction = database.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.delete(productId);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.error("Error deleting from IndexedDB:", error);
  }
};

// Cart utility functions
const saveCartToIndexedDB = async (
  username: string,
  cartItems: Array<{
    productId: string;
    seller: string;
    name: string;
    price: number;
    currency: string;
    quantity: number;
    image?: string;
  }>,
): Promise<void> => {
  try {
    const database = await initIndexedDB();
    const transaction = database.transaction(["cart"], "readwrite");
    const store = transaction.objectStore("cart");

    // Clear existing cart for this user
    const index = store.index("username");
    const range = IDBKeyRange.only(username);
    const deleteRequest = index.getAll(range);

    return new Promise((resolve, reject) => {
      deleteRequest.onsuccess = () => {
        const items = deleteRequest.result;
        items.forEach((item) => store.delete(item.id));

        // Add new cart items
        cartItems.forEach((item, idx) => {
          store.add({
            id: `${username}_cart_${Date.now()}_${idx}`,
            username,
            ...item,
          });
        });
      };

      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => resolve();
    });
  } catch (error) {
    console.error("Error saving cart to IndexedDB:", error);
  }
};

const loadCartFromIndexedDB = async (
  username: string,
): Promise<
  Array<{
    productId: string;
    seller: string;
    name: string;
    price: number;
    currency: string;
    quantity: number;
    image?: string;
  }>
> => {
  try {
    const database = await initIndexedDB();
    const transaction = database.transaction(["cart"], "readonly");
    const store = transaction.objectStore("cart");
    const index = store.index("username");
    const range = IDBKeyRange.only(username);

    return new Promise((resolve, reject) => {
      const request = index.getAll(range);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const allItems = request.result;
        const cartItems = allItems.map((item) => ({
          productId: item.productId,
          seller: item.seller,
          name: item.name,
          price: item.price,
          currency: item.currency,
          quantity: item.quantity,
          image: item.image,
        }));
        resolve(cartItems);
      };
    });
  } catch (error) {
    console.error("Error loading cart from IndexedDB:", error);
    return [];
  }
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<string>("");
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("");
  const [currentUserCompany, setCurrentUserCompany] = useState<string>("");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [loginForm, setLoginForm] = useState({
    emailOrUsername: "",
    password: "",
  });
  const [signupForm, setSignupForm] = useState({
    username: "",
    email: "",
    companyName: "",
    password: "",
    confirmPassword: "",
  });
  const [authError, setAuthError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [pendingEmailVerification, setPendingEmailVerification] = useState<{
    email: string;
    username: string;
  } | null>(null);

  const [activeSubmenu, setActiveSubmenu] = useState<
    "marketplace" | "warehouse" | "allDocuments"
  >("warehouse");
  const [activeWarehouseTab, setActiveWarehouseTab] = useState<
    | "products"
    | "quotations"
    | "inquiries"
    | "orders"
    | "invoices"
    | "vendors"
    | "settings"
  >("products");
  const [activeProductsSubTab, setActiveProductsSubTab] = useState<
    "goods" | "upload"
  >("goods");
  const [activeMarketplaceTab, setActiveMarketplaceTab] = useState<
    "all" | "myListings"
  >("all");
  const [products, setProducts] = useState<Product[]>([]);
  const [marketplaceItems, setMarketplaceItems] = useState<Product[]>([]);
  const [hasLoadedMarketplace, setHasLoadedMarketplace] = useState(false);
  const [currentMarketplacePage, setCurrentMarketplacePage] = useState(1);
  const [hasMoreMarketplaceItems, setHasMoreMarketplaceItems] = useState(false);
  const [isLoadingMarketplace, setIsLoadingMarketplace] = useState(false);
  const [lastMarketplaceDoc, setLastMarketplaceDoc] = useState<any>(null);
  const [selectedMarketplaceItems, setSelectedMarketplaceItems] = useState<
    Set<string>
  >(new Set());
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState<"single" | "bulk">("single");
  const [singleProduct, setSingleProduct] = useState({
    name: "",
    partNumber: "",
    price: "",
    qty: "",
    stock: "In Stock",
  });
  const [selectedCurrency, setSelectedCurrency] = useState<string>("USD");
  const [uploadMessage, setUploadMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<Product>>({});
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
    new Set(),
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [confirmDelete, setConfirmDelete] = useState<{
    show: boolean;
    count: number;
  }>({ show: false, count: 0 });
  const [singleProductImage, setSingleProductImage] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
    status: string;
  } | null>(null);
  const [stockThreshold, setStockThreshold] = useState<number>(10);
  const [sortBy, setSortBy] = useState<
    "name" | "price" | "qty" | "partNumber" | "currency" | "default"
  >("default");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [partNumberFormat, setPartNumberFormat] = useState<
    "default" | "dash" | "space" | "slash"
  >("default");
  const [showFormatSelector, setShowFormatSelector] = useState<string | null>(
    null,
  );
  const [inactivityTimer, setInactivityTimer] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);
  const [quotations, setQuotations] = useState<Product[]>([]);
  const [inquiries, setInquiries] = useState<Product[]>([]);
  const [incomingOrders, setIncomingOrders] = useState<Order[]>([]);
  const [outgoingOrders, setOutgoingOrders] = useState<Order[]>([]);
  const [hasLoadedIncomingOrders, setHasLoadedIncomingOrders] = useState(false);
  const [hasLoadedOutgoingOrders, setHasLoadedOutgoingOrders] = useState(false);
  const [activeOrdersView, setActiveOrdersView] = useState<
    "incoming" | "outgoing"
  >("incoming");
  const [showCartModal, setShowCartModal] = useState(false);
  const [cart, setCart] = useState<
    Array<{
      productId: string;
      seller: string;
      name: string;
      price: number;
      currency: string;
      quantity: number;
      image?: string;
    }>
  >([]);
  const [hasLoadedCart, setHasLoadedCart] = useState(false);
  const [showPlaceOrderDialog, setShowPlaceOrderDialog] = useState(false);
  const [selectedOrderItem, setSelectedOrderItem] = useState<Product | null>(
    null,
  );
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [orderNotes, setOrderNotes] = useState("");
  const [showRetractConfirm, setShowRetractConfirm] = useState(false);
  const [retractingOrderId, setRetractingOrderId] = useState<string | null>(
    null,
  );
  const [showRetractQuotationConfirm, setShowRetractQuotationConfirm] =
    useState(false);
  const [retractingQuotationId, setRetractingQuotationId] = useState<
    string | null
  >(null);
  const [showRetractInquiryConfirm, setShowRetractInquiryConfirm] =
    useState(false);
  const [retractingInquiryId, setRetractingInquiryId] = useState<string | null>(
    null,
  );
  const [showOrderPreview, setShowOrderPreview] = useState(false);
  const [selectedOrderForPreview, setSelectedOrderForPreview] =
    useState<Order | null>(null);
  const [activeQuotationsView, setActiveQuotationsView] = useState<
    "incoming" | "outgoing"
  >("outgoing");
  const [showQuotationPreview, setShowQuotationPreview] = useState(false);
  const [selectedQuotationForPreview, setSelectedQuotationForPreview] =
    useState<any | null>(null);
  const [activeInquiriesView, setActiveInquiriesView] = useState<
    "incoming" | "outgoing"
  >("outgoing");
  const [activeInvoicesView, setActiveInvoicesView] = useState<
    "incoming" | "outgoing"
  >("outgoing");
  const [showInquiryPreview, setShowInquiryPreview] = useState(false);
  const [selectedInquiryForPreview, setSelectedInquiryForPreview] = useState<
    any | null
  >(null);
  const [showQuantityEditor, setShowQuantityEditor] = useState<{
    show: boolean;
    mode: "quotation" | "inquiry";
  }>({ show: false, mode: "quotation" });
  const [quantityEdits, setQuantityEdits] = useState<{ [key: string]: number }>(
    {},
  );
  const [quotationMetadata, setQuotationMetadata] = useState<{
    id: string;
    date: string;
    number: string;
  }>({
    id: "",
    date: new Date().toISOString().split("T")[0],
    number: "QT-" + Date.now(),
  });
  const [inquiryMetadata, setInquiryMetadata] = useState<{
    id: string;
    date: string;
    number: string;
  }>({
    id: "",
    date: new Date().toISOString().split("T")[0],
    number: "INQ-" + Date.now(),
  });
  const [quotationTemplate, setQuotationTemplate] =
    useState<PDFTemplate | null>(null);
  const [inquiryTemplate, setInquiryTemplate] = useState<PDFTemplate | null>(
    null,
  );
  const [inquiryLetterhead, setInquiryLetterhead] = useState<any | null>(null);
  const [preFillRecipient, setPreFillRecipient] = useState<{
    name: string;
    email: string;
    company: string;
  } | null>(null);
  const [quotationHistory, setQuotationHistory] = useState<any[]>([]);
  const [inquiryHistory, setInquiryHistory] = useState<any[]>([]);
  const [incomingInquiries, setIncomingInquiries] = useState<any[]>([]);
  const [isRefreshingInquiries, setIsRefreshingInquiries] = useState(false);
  const [acceptedVendorConnections, setAcceptedVendorConnections] = useState<
    Array<{ id: string; name: string; email: string; company?: string }>
  >([]);
  const [activeSubmenuTab, setActiveSubmenuTab] = useState<
    "current" | "history"
  >("current");
  const itemsPerPage = 50;
  const ENCRYPTION_KEY = "pspm_secure_2026";
  const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;
  const INACTIVITY_TIMEOUT = 24 * 60 * 60 * 1000;

  // Format number with commas (thousands separator)
  const formatNumber = (num: number): string => {
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Get first item name from order (handles both old and new order formats)
  const getFirstItemName = (order: Order): string => {
    if (order.items && order.items.length > 0) {
      return order.items[0].name;
    }
    return order.itemName || "Unknown Item";
  };

  // Get total item count from order
  const getTotalItemCount = (order: Order): number => {
    if (order.items && order.items.length > 0) {
      return order.items.reduce((sum, item) => sum + item.quantity, 0);
    }
    return order.quantity || 0;
  };

  // Get total number of different products in order
  const getProductCount = (order: Order): number => {
    if (order.items && order.items.length > 0) {
      return order.items.length;
    }
    return 1;
  };

  // Format part number with selected format
  const formatPartNumber = (partNum: string, format: string): string => {
    const clean = partNum.replace(/[^\d]/g, "");
    if (format === "default" || format === "default") return partNum;
    if (format === "dash") return clean.replace(/(\d{4})/g, "$1-").slice(0, -1);
    if (format === "space") return clean.replace(/(\d{4})/g, "$1 ").trim();
    if (format === "slash")
      return clean.replace(/(\d{4})/g, "$1/").slice(0, -1);
    return partNum;
  };

  // Generate default PDF template
  const getDefaultTemplate = (type: "quotation" | "inquiry"): PDFTemplate => {
    const title = type === "quotation" ? "QUOTATION" : "INQUIRY";
    return {
      id: `default-${type}`,
      name: `Default ${type === "quotation" ? "Quotation" : "Inquiry"} Template`,
      type,
      isDefault: true,
      companyName: "[Company Name]",
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
          <div style="border-bottom: 3px solid #5b7c99; padding-bottom: 20px; margin-bottom: 30px;">
            <h1 style="margin: 0; color: #5b7c99; font-size: 32px; text-align: center;">${title}</h1>
          </div>
          <table style="width: 100%; margin-bottom: 30px; font-size: 12px;">
            <tr>
              <td style="width: 50%;"><strong>${type === "quotation" ? "Quotation" : "Inquiry"} Number:</strong> {{NUMBER}}</td>
              <td style="width: 50%; text-align: right;"><strong>Date:</strong> {{DATE}}</td>
            </tr>
            <tr>
              <td colspan="2"><strong>Prepared by:</strong> {{USER}}</td>
            </tr>
          </table>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
            <thead>
              <tr style="background-color: #f0f4f8; border-bottom: 2px solid #5b7c99;">
                <th style="padding: 12px; text-align: left; font-weight: bold; color: #1a365d;">Product Name</th>
                <th style="padding: 12px; text-align: center; font-weight: bold; color: #1a365d;">Part Number</th>
                <th style="padding: 12px; text-align: center; font-weight: bold; color: #1a365d;">Unit Price</th>
                <th style="padding: 12px; text-align: center; font-weight: bold; color: #1a365d;">Quantity</th>
                <th style="padding: 12px; text-align: right; font-weight: bold; color: #1a365d;">Total</th>
              </tr>
            </thead>
            <tbody>
              {{TABLE_ROWS}}
            </tbody>
          </table>
          <div style="background-color: #f0f4f8; padding: 20px; text-align: right; border-top: 2px solid #5b7c99; border-bottom: 2px solid #5b7c99; margin-bottom: 30px;">
            <h3 style="margin: 0; color: #5b7c99;">TOTAL: {{TOTAL}}</h3>
          </div>
          <div style="text-align: center; color: #64748b; font-size: 11px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
            <p>Thank you for your business</p>
          </div>
        </div>
      `,
      createdAt: new Date().toISOString(),
    };
  };

  // Load or create default template
  const loadTemplate = async (type: "quotation" | "inquiry") => {
    try {
      const database = await initIndexedDB();
      const transaction = database.transaction(["templates"], "readonly");
      const store = transaction.objectStore("templates");

      return new Promise<PDFTemplate>((resolve) => {
        const request = store.get(`default-${type}`);
        request.onsuccess = () => {
          if (request.result) {
            if (type === "quotation") setQuotationTemplate(request.result);
            else setInquiryTemplate(request.result);
            resolve(request.result);
          } else {
            const template = getDefaultTemplate(type);
            // Save default template
            const writeTransaction = database.transaction(
              ["templates"],
              "readwrite",
            );
            const writeStore = writeTransaction.objectStore("templates");
            writeStore.put(template);

            if (type === "quotation") setQuotationTemplate(template);
            else setInquiryTemplate(template);
            resolve(template);
          }
        };
      });
    } catch (error) {
      console.error("Error loading template:", error);
      const template = getDefaultTemplate(type);
      if (type === "quotation") setQuotationTemplate(template);
      else setInquiryTemplate(template);
      return template;
    }
  };

  // Save template to IndexedDB
  const saveTemplate = async (template: PDFTemplate) => {
    try {
      const database = await initIndexedDB();
      const transaction = database.transaction(["templates"], "readwrite");
      const store = transaction.objectStore("templates");

      return new Promise<void>((resolve, reject) => {
        const request = store.put({ ...template, username: currentUser });
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          if (template.type === "quotation") setQuotationTemplate(template);
          else setInquiryTemplate(template);
          resolve();
        };
      });
    } catch (error) {
      console.error("Error saving template:", error);
    }
  };

  // Sort products based on sortBy state with direction
  const sortProducts = (products: Product[]): Product[] => {
    const sorted = [...products];
    let result;

    switch (sortBy) {
      case "name":
        result = sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "price":
        result = sorted.sort((a, b) => a.price - b.price);
        break;
      case "qty":
        result = sorted.sort((a, b) => a.qty - b.qty);
        break;
      case "partNumber":
        result = sorted.sort((a, b) =>
          a.partNumber.localeCompare(b.partNumber),
        );
        break;
      case "currency":
        result = sorted.sort((a, b) =>
          (a.currency || "USD").localeCompare(b.currency || "USD"),
        );
        break;
      default:
        return sorted;
    }

    // Apply sort direction
    return sortDirection === "desc" ? result.reverse() : result;
  };

  // Calculate inventory summary by currency
  const calculateInventorySummary = () => {
    const currencyTotals: { [key: string]: { total: number; qty: number } } =
      {};
    let totalQty = 0;

    filteredProducts.forEach((product) => {
      const curr = product.currency || "USD";
      if (!currencyTotals[curr]) {
        currencyTotals[curr] = { total: 0, qty: 0 };
      }
      currencyTotals[curr].total += product.price * product.qty;
      currencyTotals[curr].qty += product.qty;
      totalQty += product.qty;
    });

    return { currencyTotals, totalQty };
  };

  // Generate smart pagination numbers: 1, 2, 3, ..., current-1, current, current+1, ..., last
  const generatePageNumbers = (currentPage: number, totalPages: number) => {
    const pages: (number | string)[] = [];
    const sideSize = 2; // Show 2 pages on each side of current page

    // Always show first 3 pages
    for (let i = 1; i <= Math.min(3, totalPages); i++) {
      if (!pages.includes(i)) pages.push(i);
    }

    // Add ellipsis if gap exists
    if (currentPage - sideSize > 3) {
      if (!pages.includes("...")) pages.push("...");
    }

    // Add pages around current page
    for (let i = currentPage - sideSize; i <= currentPage + sideSize; i++) {
      if (i > 0 && i <= totalPages && !pages.includes(i)) {
        pages.push(i);
      }
    }

    // Add ellipsis before last pages if gap exists
    if (currentPage + sideSize < totalPages - 2) {
      if (!pages.includes("...")) pages.push("...");
    }

    // Always show last 3 pages
    for (let i = Math.max(totalPages - 2, 1); i <= totalPages; i++) {
      if (!pages.includes(i)) pages.push(i);
    }

    return pages;
  };

  // Load user products from IndexedDB (supports 100k+ items)
  const loadUserDataOnLogin = async (username: string, userEmail?: string) => {
    try {
      // Load products from IndexedDB
      const products = await loadProductsFromIndexedDB(username);
      console.log(
        `Login: Loaded ${products?.length || 0} products for ${username}`,
      );

      // Load quotation and inquiry history with username
      const quotationHist = await loadQuotationHistory(username);
      const inquiryHist = await loadInquiryHistory(username);
      const incomingInqHist = await loadIncomingInquiries(userEmail);

      console.log(
        `Login: Loaded ${quotationHist?.length || 0} quotations, ${inquiryHist?.length || 0} outgoing inquiries, and ${incomingInqHist?.length || 0} incoming inquiries`,
      );

      const cachedTab = localStorage.getItem(`cache_tab_${username}`);
      return {
        products: products || [],
        activeTab: cachedTab || "products",
        quotationHistory: quotationHist || [],
        inquiryHistory: inquiryHist || [],
        incomingInquiries: incomingInqHist || [],
      };
    } catch (error) {
      console.error("Error loading user data:", error);
      return {
        products: [],
        activeTab: "products",
        quotationHistory: [],
        inquiryHistory: [],
        incomingInquiries: [],
      };
    }
  };

  // Migration: Add searchable fields to existing users
  const migrateUserSearchableFields = async (username: string) => {
    try {
      if (!db) {
        console.log("⏭️  Migration: Skipped (localStorage mode)");
        return;
      }

      console.log(`🔄 Migration: Starting for user "${username}"`);
      const userDocRef = doc(db, "userSettings", username);
      const userSnap = await getDoc(userDocRef);

      if (!userSnap.exists()) {
        console.log(`⚠️  Migration: User document not found for "${username}"`);
        return;
      }

      const userData = userSnap.data();
      console.log(`📄 Migration: Current user data:`, userData);
      console.log(
        `📄 Migration: email = "${userData?.email}" (type: ${typeof userData?.email})`,
      );
      console.log(
        `📄 Migration: companyName = "${userData?.companyName}" (type: ${typeof userData?.companyName})`,
      );
      console.log(
        `📄 Migration: username = "${userData?.username}" (type: ${typeof userData?.username})`,
      );
      console.log(`📄 Migration: All keys:`, Object.keys(userData || {}));

      // Only migrate if missing searchable fields
      if (!userData.usernameSearchable || !userData.emailSearchable) {
        console.log(
          `🔧 Migration: Missing searchable fields, creating them...`,
        );

        const updateData = {
          usernameSearchable: (userData.username || "").toLowerCase().trim(),
          emailSearchable: (userData.email || "").toLowerCase().trim(),
          companyNameSearchable: (userData.companyName || "")
            .toLowerCase()
            .trim(),
        };

        console.log(`📝 Migration: Updating with:`, updateData);
        await updateDoc(userDocRef, updateData);
        console.log(`✅ Migration: Complete for "${username}"`);
      } else {
        console.log(
          `✓ Migration: Searchable fields already exist for "${username}"`,
        );
      }
    } catch (error) {
      console.error("❌ Migration error:", error);
    }
  };

  // MIGRATION: Copy all existing users from userSettings to vendorDirectory for vendor discovery
  const migrateUsersToVendorDirectory = async () => {
    try {
      if (!db) {
        console.log("⏭️  Migration: Skipped (localStorage mode)");
        return;
      }

      console.log(
        "\n════════════════════════════════════════════════════════════",
      );
      console.log(
        "🔄 MIGRATION: Copying all vendors to vendorDirectory collection",
      );
      console.log(
        "════════════════════════════════════════════════════════════\n",
      );

      // Fetch all users from userSettings
      const usersRef = collection(db, "userSettings");
      const allUsersDocs = await getDocs(usersRef);

      console.log(`📊 Found ${allUsersDocs.docs.length} users in userSettings`);

      let migratedCount = 0;
      let skippedCount = 0;

      for (const userDoc of allUsersDocs.docs) {
        const userData = userDoc.data();
        const username = userData.username;

        // Check if already exists in vendorDirectory
        const vendorDocRef = doc(db, "vendorDirectory", username);
        const vendorSnap = await getDoc(vendorDocRef);

        if (!vendorSnap.exists()) {
          // Prepare vendor directory entry with searchable fields
          const vendorData = {
            username: username,
            usernameSearchable: (username || "").toLowerCase().trim(),
            email: userData.email || "",
            emailSearchable: (userData.email || "").toLowerCase().trim(),
            companyName: userData.companyName || "",
            companyNameSearchable: (userData.companyName || "")
              .toLowerCase()
              .trim(),
            phone: userData.phone || "",
            address: userData.address || "",
            website: userData.website || "",
            createdAt: userData.createdAt || new Date().toISOString(),
            migratedAt: new Date().toISOString(),
          };

          // Copy to vendorDirectory
          await setDoc(vendorDocRef, vendorData);
          console.log(`✅ Migrated: ${username}`);
          migratedCount++;
        } else {
          console.log(`⏭️  Already exists: ${username}`);
          skippedCount++;
        }
      }

      console.log(
        "\n════════════════════════════════════════════════════════════",
      );
      console.log(
        `✅ MIGRATION COMPLETE: ${migratedCount} users migrated, ${skippedCount} already present`,
      );
      console.log(
        "════════════════════════════════════════════════════════════\n",
      );
    } catch (error) {
      console.error("❌ Migration error:", error);
    }
  };

  // DIAGNOSTIC: Check what's actually stored in Firestore
  const diagnosticCheckCollections = async (username: string) => {
    console.log(
      "\n════════════════════════════════════════════════════════════",
    );
    console.log("🔍 DIAGNOSTIC: Checking Firestore collections for:", username);
    console.log(
      "════════════════════════════════════════════════════════════\n",
    );

    try {
      if (!db) {
        console.log("⏭️  Diagnostic: Using localStorage mode");
        return;
      }

      // Check userSettings collection
      console.log("📋 Checking userSettings collection...");
      const userSettingsRef = doc(db, "userSettings", username);
      const userSettingsSnap = await getDoc(userSettingsRef);

      if (userSettingsSnap.exists()) {
        const data = userSettingsSnap.data();
        console.log("✓ userSettings/", username, "exists");
        console.log("  Fields present:", Object.keys(data || {}));
        console.log("  Full data:", data);
        console.log("  username:", data?.username);
        console.log(
          "  email:",
          data?.email,
          "(undefined means blocked by security rules)",
        );
        console.log(
          "  companyName:",
          data?.companyName,
          "(undefined means blocked by security rules)",
        );
        console.log(
          "  emailSearchable:",
          data?.emailSearchable,
          "(undefined means missing)",
        );
        console.log(
          "  companyNameSearchable:",
          data?.companyNameSearchable,
          "(undefined means missing)",
        );
        console.log(
          "  usernameSearchable:",
          data?.usernameSearchable,
          "(undefined means missing)",
        );
      } else {
        console.log("✗ userSettings/", username, "DOES NOT EXIST");
      }

      // Check vendorDirectory collection
      console.log("\n📋 Checking vendorDirectory collection...");
      const vendorDirRef = doc(db, "vendorDirectory", username);
      const vendorDirSnap = await getDoc(vendorDirRef);

      if (vendorDirSnap.exists()) {
        const data = vendorDirSnap.data();
        console.log("✓ vendorDirectory/", username, "exists");
        console.log("  Fields present:", Object.keys(data || {}));
        console.log("  Full data:", data);
        console.log("  username:", data?.username, "(should be present)");
        console.log("  email:", data?.email, "(should be present)");
        console.log("  companyName:", data?.companyName, "(should be present)");
        console.log(
          "  emailSearchable:",
          data?.emailSearchable,
          "(should be present)",
        );
        console.log(
          "  companyNameSearchable:",
          data?.companyNameSearchable,
          "(should be present)",
        );
        console.log(
          "  usernameSearchable:",
          data?.usernameSearchable,
          "(should be present)",
        );
      } else {
        console.log(
          "✗ vendorDirectory/",
          username,
          "DOES NOT EXIST - THIS WILL CAUSE SEARCH TO FAIL",
        );
      }

      console.log(
        "\n════════════════════════════════════════════════════════════",
      );
      console.log("🎯 DIAGNOSIS SUMMARY:");
      console.log(
        "════════════════════════════════════════════════════════════",
      );
      console.log("If email/companyName are undefined in userSettings:");
      console.log(
        "  → Security rules are BLOCKING these fields from being saved",
      );
      console.log("If vendorDirectory does NOT exist:");
      console.log(
        "  → Signup code did not write to vendorDirectory successfully",
      );
      console.log("If vendorDirectory exists with complete data:");
      console.log("  → We should search this collection for vendor discovery");
      console.log(
        "════════════════════════════════════════════════════════════\n",
      );
    } catch (error) {
      console.error("❌ Diagnostic error:", error);
    }
  };

  // Save product to IndexedDB (replaces localStorage for large datasets)
  const saveUserProduct = async (username: string, product: Product) => {
    try {
      await saveProductToIndexedDB(username, product);
    } catch (error) {
      console.error("Error saving product:", error);
    }
  };

  // Save active tab to Firestore or localStorage (write operation - necessary)
  const saveUserActiveTab = async (username: string, tab: string) => {
    try {
      if (!db) {
        // Fallback to localStorage
        localStorage.setItem(`cache_tab_${username}`, tab);
        return;
      }

      const docRef = doc(db, "userSettings", username);
      await setDoc(docRef, {
        username: username,
        activeTab: tab,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error saving active tab:", error);
      // Fallback to localStorage
      localStorage.setItem(`cache_tab_${username}`, tab);
    }
  };

  // Delete product from Firestore (write operation - necessary)
  const deleteUserProduct = async (username: string, productId: string) => {
    try {
      await deleteDoc(doc(db, "products", `${username}_${productId}`));
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  // CRITICAL SECURITY: Monitor Firebase Auth state (not just localStorage)
  // When user is deleted from Firebase, this listener will immediately log them out
  useEffect(() => {
    console.log("🔐 AUTH: Setting up Firebase Auth state listener");

    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser: any) => {
      if (!firebaseUser) {
        // Firebase Auth user deleted/logged out
        console.log("🔐 AUTH: No Firebase Auth user detected");
        setIsLoggedIn(false);
        setCurrentUser("");
        setCurrentUserEmail("");
        setCurrentUserCompany("");
        localStorage.removeItem("pspm_current_user");
        localStorage.removeItem("pspm_auth_uid");
        setPendingEmailVerification(null);
        setAuthError(""); // Clear any previous errors
        return;
      }

      console.log(
        "🔐 AUTH: Firebase Auth user found:",
        firebaseUser.uid,
        firebaseUser.email,
      );

      // User exists in Firebase Auth - verify & restore session
      const savedUser = localStorage.getItem("pspm_current_user");
      const savedSubmenu =
        localStorage.getItem(`cache_submenu_${savedUser}`) || "warehouse";
      const savedTab =
        localStorage.getItem(`cache_tab_${savedUser}`) || "products";
      const savedOrdersView =
        localStorage.getItem(`cache_orders_view_${savedUser}`) || "incoming";
      const savedUploadType =
        localStorage.getItem(`cache_upload_type_${savedUser}`) || "single";
      const savedMarketplaceTab =
        localStorage.getItem(`cache_marketplace_tab_${savedUser}`) || "all";
      const savedQuotationsView =
        localStorage.getItem(`cache_quotations_view_${savedUser}`) ||
        "outgoing";
      const savedInquiriesView =
        localStorage.getItem(`cache_inquiries_view_${savedUser}`) || "outgoing";

      if (savedUser) {
        try {
          // Verify user still exists in userProfiles
          const userProfileDoc = await getDoc(
            doc(db, "userProfiles", firebaseUser.uid),
          );
          if (!userProfileDoc.exists()) {
            console.error(
              "❌ AUTH: User profile not found in userProfiles collection",
            );
            setIsLoggedIn(false);
            setCurrentUser("");
            localStorage.removeItem("pspm_current_user");
            localStorage.removeItem("pspm_auth_uid");
            return;
          }

          // SYNC EMAIL VERIFICATION STATUS: Update Firestore if Firebase Auth emailVerified changed
          const firestoreEmailVerified =
            userProfileDoc.data().emailVerified || false;
          const firebaseEmailVerified = firebaseUser.emailVerified || false;

          if (firestoreEmailVerified !== firebaseEmailVerified) {
            console.log(
              `🔄 AUTH: Syncing email verification status - Firebase: ${firebaseEmailVerified}, Firestore: ${firestoreEmailVerified}`,
            );
            await updateDoc(doc(db, "userProfiles", firebaseUser.uid), {
              emailVerified: firebaseEmailVerified,
            });
            console.log(
              "✅ AUTH: Email verification status synced to Firestore",
            );
          }

          // User exists & verified - restore session
          console.log("✅ AUTH: User verified in Firestore, restoring session");
          setCurrentUser(savedUser);
          // ✅ NORMALIZE: Ensure email is stored normalized throughout the app
          setCurrentUserEmail(normalizeEmail(firebaseUser.email || ""));
          setCurrentUserCompany(userProfileDoc.data().companyName || "");
          setIsLoggedIn(true);
          setActiveSubmenu(
            (savedSubmenu as "marketplace" | "warehouse" | "allDocuments") ||
              "warehouse",
          );
          setActiveWarehouseTab(
            (savedTab || "products") as
              | "products"
              | "quotations"
              | "inquiries"
              | "orders"
              | "invoices"
              | "vendors"
              | "settings",
          );
          setActiveOrdersView(
            (savedOrdersView as "incoming" | "outgoing") || "incoming",
          );
          setUploadType((savedUploadType as "single" | "bulk") || "single");
          setActiveMarketplaceTab(
            (savedMarketplaceTab as "all" | "myListings") || "all",
          );
          setActiveQuotationsView(
            (savedQuotationsView as "incoming" | "outgoing") || "outgoing",
          );
          setActiveInquiriesView(
            (savedInquiriesView as "incoming" | "outgoing") || "outgoing",
          );

          // Load user data
          const data = await loadUserDataOnLogin(
            savedUser,
            firebaseUser.email || "",
          );
          setProducts(data.products);
          setQuotationHistory(data.quotationHistory);
          setInquiryHistory(data.inquiryHistory);
          setIncomingInquiries(data.incomingInquiries);
          console.log(
            `✅ AUTH: Restored session - ${data.products.length} products loaded`,
          );

          // Load letterhead
          const letterhead = await loadLetterhead(savedUser);
          if (letterhead) {
            setInquiryLetterhead(letterhead);
          }

          // Load accepted vendor connections for resending inquiries
          await loadAcceptedVendorConnections();

          // Load cart
          const cartItems = await loadCartFromIndexedDB(savedUser);
          setCart(cartItems);
          setHasLoadedCart(true);
        } catch (error) {
          console.error("❌ AUTH: Error restoring session:", error);
          setIsLoggedIn(false);
          setCurrentUser("");
          setCurrentUserEmail("");
          localStorage.removeItem("pspm_current_user");
          localStorage.removeItem("pspm_auth_uid");
        }
      } else {
        // Firebase Auth has user but localStorage doesn't - reset to login
        console.log(
          "⚠️ AUTH: Firebase Auth exists but no saved session - returning to login",
        );
        setIsLoggedIn(false);
      }
    });

    // Cleanup: Unsubscribe from auth listener
    return () => unsubscribe();
  }, []);

  // Debug: Log when quotationHistory state changes
  useEffect(() => {
    console.log(`quotationHistory state changed:`, quotationHistory);
  }, [quotationHistory]);

  // Save navigation state when activeSubmenu changes
  useEffect(() => {
    if (isLoggedIn && currentUser) {
      localStorage.setItem(`cache_submenu_${currentUser}`, activeSubmenu);
    }
  }, [activeSubmenu, isLoggedIn, currentUser]);

  // Save orders view state when it changes
  useEffect(() => {
    if (isLoggedIn && currentUser) {
      localStorage.setItem(
        `cache_orders_view_${currentUser}`,
        activeOrdersView,
      );
    }
  }, [activeOrdersView, isLoggedIn, currentUser]);

  // Save upload type when it changes
  useEffect(() => {
    if (isLoggedIn && currentUser) {
      localStorage.setItem(`cache_upload_type_${currentUser}`, uploadType);
    }
  }, [uploadType, isLoggedIn, currentUser]);

  // Save marketplace tab when it changes
  useEffect(() => {
    if (isLoggedIn && currentUser) {
      localStorage.setItem(
        `cache_marketplace_tab_${currentUser}`,
        activeMarketplaceTab,
      );
    }
  }, [activeMarketplaceTab, isLoggedIn, currentUser]);

  // Save quotations view when it changes
  useEffect(() => {
    if (isLoggedIn && currentUser) {
      localStorage.setItem(
        `cache_quotations_view_${currentUser}`,
        activeQuotationsView,
      );
    }
  }, [activeQuotationsView, isLoggedIn, currentUser]);

  // Save inquiries view when it changes
  useEffect(() => {
    if (isLoggedIn && currentUser) {
      localStorage.setItem(
        `cache_inquiries_view_${currentUser}`,
        activeInquiriesView,
      );
    }
  }, [activeInquiriesView, isLoggedIn, currentUser]);

  useEffect(() => {
    if (isLoggedIn && currentUser && activeSubmenu === "warehouse") {
      // Save to localStorage IMMEDIATELY for instant persistence on reload
      localStorage.setItem(`cache_tab_${currentUser}`, activeWarehouseTab);

      // Still debounce Firestore write for optimization
      debounceTabWrite(() => {
        saveUserActiveTab(currentUser, activeWarehouseTab);
      }, 2000); // Wait 2 seconds before saving to Firestore
    }
  }, [activeWarehouseTab, isLoggedIn, currentUser, activeSubmenu]);

  // Load marketplace items ONCE per login session (not every time user clicks Marketplace module)
  useEffect(() => {
    if (!isLoggedIn || hasLoadedMarketplace) return;

    setIsLoadingMarketplace(true);
    loadMarketplaceItems(1)
      .then(({ items, hasMore, lastDoc }) => {
        setMarketplaceItems(items);
        setHasMoreMarketplaceItems(hasMore);
        setLastMarketplaceDoc(lastDoc);
        setCurrentMarketplacePage(1);
        setHasLoadedMarketplace(true);
        setIsLoadingMarketplace(false);
      })
      .catch((error) => {
        console.error("Failed to load marketplace:", error);
        setIsLoadingMarketplace(false);
      });
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) return;

    const handleActivity = () => {
      resetInactivityTimer();
    };

    window.addEventListener("mousedown", handleActivity);
    window.addEventListener("keydown", handleActivity);

    resetInactivityTimer();

    return () => {
      window.removeEventListener("mousedown", handleActivity);
      window.removeEventListener("keydown", handleActivity);
    };
  }, [isLoggedIn]);

  // Debounce helper for tab writes (Optimization #2)
  const debounceTabWrite = (() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    return (callback: () => void, delay: number) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => callback(), delay);
    };
  })();

  // Check cached user first (0 reads - optimization)
  const getCachedUserData = (
    emailOrUsername: string,
  ): { username: string; email: string } | null => {
    try {
      const cachedData = localStorage.getItem(
        `pspm_user_cache_${emailOrUsername}`,
      );
      if (cachedData) {
        let data;
        try {
          // Try to decrypt (Optimization #8)
          const decrypted = CryptoJS.AES.decrypt(
            cachedData,
            ENCRYPTION_KEY,
          ).toString(CryptoJS.enc.Utf8);
          data = JSON.parse(decrypted);
        } catch (e) {
          // Fallback for unencrypted legacy cache
          data = JSON.parse(cachedData);
        }
        // Cache is valid for 7 days (Optimization #6)
        const cacheAge = Date.now() - data.timestamp;
        if (cacheAge < CACHE_EXPIRY_MS) {
          return { username: data.username, email: data.email };
        }
      }
    } catch (error) {
      console.error("Error reading cache:", error);
    }
    return null;
  };

  // Save user to cache after successful login (for future zero-read logins)
  const cacheUserData = (username: string, email: string) => {
    try {
      const data = { username, email, timestamp: Date.now() };
      // Encrypt cache for security (Optimization #8)
      const encrypted = CryptoJS.AES.encrypt(
        JSON.stringify(data),
        ENCRYPTION_KEY,
      ).toString();

      localStorage.setItem(`pspm_user_cache_${username}`, encrypted);
      localStorage.setItem(`pspm_user_cache_${email}`, encrypted);
    } catch (error) {
      console.error("Error saving cache:", error);
    }
  };

  // Check if username or email exists (Optimization #3: 50% fewer reads on signup)
  const checkUserExists = async (
    username: string,
    email: string,
  ): Promise<{ exists: boolean; by: string }> => {
    try {
      if (!db) {
        // Fallback to localStorage
        const users = JSON.parse(localStorage.getItem("pspm_users") || "{}");
        if (users[username]) return { exists: true, by: "username" };
        for (const user of Object.values(users)) {
          if ((user as any).email === email)
            return { exists: true, by: "email" };
        }
        return { exists: false, by: "" };
      }

      // Optimization #3: Check if input looks like email first
      const isEmail = email.includes("@");

      if (isEmail) {
        // Check email first if it looks like email (1 read)
        const emailQ = query(
          collection(db, "userSettings"),
          where("email", "==", email),
        );
        const emailSnapshot = await getDocs(emailQ);
        if (!emailSnapshot.empty) {
          return { exists: true, by: "email" };
        }
      }

      // Then check username (1 read)
      const q = query(
        collection(db, "userSettings"),
        where("username", "==", username),
      );
      const usernameSnapshot = await getDocs(q);
      if (!usernameSnapshot.empty) {
        return { exists: true, by: "username" };
      }

      return { exists: false, by: "" };
    } catch (error) {
      console.error("Error checking user:", error);
      // Fallback to localStorage
      const users = JSON.parse(localStorage.getItem("pspm_users") || "{}");
      if (users[username]) return { exists: true, by: "username" };
      for (const user of Object.values(users)) {
        if ((user as any).email === email) return { exists: true, by: "email" };
      }
      return { exists: false, by: "" };
    }
  };

  // Find user by email or username (1 optimized read for login)
  const findUserByEmailOrUsername = async (
    emailOrUsername: string,
  ): Promise<{ username: string; email: string } | null> => {
    try {
      if (!db) {
        // Fallback to localStorage
        const users = JSON.parse(localStorage.getItem("pspm_users") || "{}");
        if (users[emailOrUsername]) {
          return {
            username: emailOrUsername,
            email: users[emailOrUsername].email,
          };
        }
        for (const [username, user] of Object.entries(users)) {
          if ((user as any).email === emailOrUsername) {
            return { username, email: (user as any).email };
          }
        }
        return null;
      }

      // Try email first
      const emailQ = query(
        collection(db, "userSettings"),
        where("email", "==", emailOrUsername),
      );
      const emailSnapshot = await getDocs(emailQ);
      if (!emailSnapshot.empty) {
        const data = emailSnapshot.docs[0].data();
        return { username: data.username, email: data.email };
      }

      // Try username
      const usernameQ = query(
        collection(db, "userSettings"),
        where("username", "==", emailOrUsername),
      );
      const usernameSnapshot = await getDocs(usernameQ);
      if (!usernameSnapshot.empty) {
        const data = usernameSnapshot.docs[0].data();
        return { username: data.username, email: data.email };
      }

      return null;
    } catch (error) {
      console.error("Error finding user:", error);
      // Fallback to localStorage
      const users = JSON.parse(localStorage.getItem("pspm_users") || "{}");
      if (users[emailOrUsername]) {
        return {
          username: emailOrUsername,
          email: users[emailOrUsername].email,
        };
      }
      for (const [username, user] of Object.entries(users)) {
        if ((user as any).email === emailOrUsername) {
          return { username, email: (user as any).email };
        }
      }
      return null;
    }
  };

  // Save quotation to IndexedDB
  const saveQuotationToIndexedDB = async (items: Product[], metadata?: any) => {
    const dbInstance = await initIndexedDB();
    const meta = metadata || quotationMetadata;
    const totalPrice = items.reduce(
      (sum: number, item: any) =>
        sum + (item.price || 0) * (item.qty || item.quantity || 0),
      0,
    );
    const currency = items.length > 0 ? items[0].currency || "USD" : "USD";
    console.log("DEBUG saveQuotationToIndexedDB:", {
      itemsCount: items.length,
      calculatedTotalPrice: totalPrice,
      extractedCurrency: currency,
      firstItemPrice: items[0]?.price,
      firstItemQty: items[0]?.qty,
      firstItemCurrency: items[0]?.currency,
    });
    const quotationData = {
      id: meta.id || "Q-" + Date.now(),
      number: meta.number,
      date: meta.date,
      items: items,
      totalPrice: totalPrice,
      currency: currency,
      createdAt: new Date().toISOString(),
      username: currentUser,
    };
    console.log("DEBUG quotationData to be stored:", quotationData);
    return new Promise((resolve, reject) => {
      const transaction = dbInstance.transaction(["quotations"], "readwrite");
      const store = transaction.objectStore("quotations");
      const request = store.add(quotationData);
      request.onsuccess = () => resolve(quotationData.id);
      request.onerror = () => reject(request.error);
    });
  };

  // Save inquiry to IndexedDB
  const saveInquiryToIndexedDB = async (items: Product[], metadata?: any) => {
    const dbInstance = await initIndexedDB();
    const meta = metadata || inquiryMetadata;
    const totalPrice = items.reduce(
      (sum: number, item: any) =>
        sum + (item.price || 0) * (item.qty || item.quantity || 0),
      0,
    );
    const currency = items.length > 0 ? items[0].currency || "USD" : "USD";
    const inquiryData = {
      id: meta.id || "I-" + Date.now(),
      number: meta.number,
      date: meta.date,
      items: items,
      totalPrice: totalPrice,
      currency: currency,
      createdAt: new Date().toISOString(),
      username: currentUser,
    };
    return new Promise((resolve, reject) => {
      const transaction = dbInstance.transaction(["inquiries"], "readwrite");
      const store = transaction.objectStore("inquiries");
      const request = store.put(inquiryData);
      request.onsuccess = () => resolve(inquiryData.id);
      request.onerror = () => reject(request.error);
    });
  };

  // Generate PDF from displayed inquiry letter
  const generateInquiryPDFFromLetter = async (
    inquiry: any,
    letterElement: HTMLDivElement | null,
  ) => {
    try {
      if (!letterElement) {
        throw new Error("Letter element not found");
      }

      // Capture the letter element as a canvas image
      const canvas = await html2canvas(letterElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        allowTaint: true,
      });

      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Create PDF
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageHeight = doc.internal.pageSize.getHeight();
      const topMargin = 15; // mm
      const bottomMargin = 15; // mm
      const usablePageHeight = pageHeight - topMargin - bottomMargin; // Reduce height to add margins
      const pageHeightPixels = (usablePageHeight * canvas.width) / imgWidth; // Convert page height back to pixels

      // Calculate number of pages needed
      const pages = Math.ceil(canvas.height / pageHeightPixels);

      // Split canvas into sections and add to PDF
      for (let i = 0; i < pages; i++) {
        if (i > 0) {
          doc.addPage();
        }

        // Create a temporary canvas for this page section
        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = pageHeightPixels;

        const ctx = pageCanvas.getContext("2d");
        if (!ctx) throw new Error("Could not get canvas context");

        // Draw the portion of the original canvas for this page
        const sourceY = i * pageHeightPixels;
        ctx.drawImage(
          canvas,
          0,
          sourceY,
          canvas.width,
          pageHeightPixels,
          0,
          0,
          canvas.width,
          pageHeightPixels,
        );

        // Convert this page's canvas to image and add to PDF with margins
        const pageImgData = pageCanvas.toDataURL("image/png");
        doc.addImage(
          pageImgData,
          "PNG",
          0,
          topMargin,
          imgWidth,
          usablePageHeight,
        );
      }

      // Save to IndexedDB
      const inquiryData = {
        id: inquiry.id,
        number: inquiry.number,
        date: inquiry.date,
        recipientName: inquiry.recipientName,
        recipientEmail: inquiry.recipientEmail,
        recipientCompany: inquiry.recipientCompany,
        inquiryBody: inquiry.inquiryBody,
        items: inquiry.items,
        letterhead: inquiry.letterhead || null,
        createdAt: new Date().toISOString(),
        username: currentUser,
      };

      const dbInstance = await initIndexedDB();
      await new Promise((resolve, reject) => {
        const transaction = dbInstance.transaction(["inquiries"], "readwrite");
        const store = transaction.objectStore("inquiries");
        const request = store.put(inquiryData);
        request.onsuccess = () => resolve(inquiryData.id);
        request.onerror = () => reject(request.error);
      });

      // Update React state with new inquiry in history
      setInquiryHistory((prev) => [
        ...prev,
        {
          id: inquiry.id,
          number: inquiry.number,
          date: inquiry.date,
          items: inquiry.items,
          createdAt: new Date().toISOString(),
          recipientName: inquiry.recipientName,
          recipientEmail: inquiry.recipientEmail,
          recipientCompany: inquiry.recipientCompany,
          inquiryBody: inquiry.inquiryBody,
          letterhead: inquiry.letterhead || null,
        },
      ]);

      // Download PDF
      doc.save(`${inquiry.number}.pdf`);

      // Show success message
      alert(`Inquiry ${inquiry.number} generated and saved successfully!`);
      console.log(`Inquiry PDF generated: ${inquiry.number}`);

      return doc.output("datauristring");
    } catch (error) {
      console.error("Error generating inquiry PDF:", error);
      alert(
        `Error generating PDF: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  };

  // Generate formatted inquiry HTML for display to recipient
  const generateInquiryHtml = (inquiry: any): string => {
    const dateObj = new Date(inquiry.date || new Date());
    const formattedDate = dateObj.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const tableRows = (inquiry.items || [])
      .map(
        (item: any) => `
        <tr style="border-bottom: 1px solid #ddd;">
          <td style="padding: 10px; text-align: left;">${item.name || ""}</td>
          <td style="padding: 10px; text-align: center;">${item.partNumber || ""}</td>
          <td style="padding: 10px; text-align: right;">${item.qty || 0}</td>
        </tr>
      `,
      )
      .join("");

    const letterheadHtml =
      inquiry.letterhead && inquiry.letterhead.imageBase64
        ? `<div style="margin-bottom: 30px; text-align: center;">
          <img src="${inquiry.letterhead.imageBase64}" alt="Letterhead" style="max-width: 100%; height: auto; max-height: 120px;">
         </div>`
        : "";

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; color: #1a365d;">
        ${letterheadHtml}
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
          <div>
            <p style="font-size: 12px; color: #64748b; text-transform: uppercase; margin: 0 0 5px 0;">Date Issued</p>
            <p style="font-size: 16px; font-weight: bold; margin: 0;">${formattedDate}</p>
          </div>
          <div style="text-align: right;">
            <p style="font-size: 12px; color: #64748b; text-transform: uppercase; margin: 0 0 5px 0;">Inquiry Number</p>
            <p style="font-size: 16px; font-weight: bold; margin: 0;">${inquiry.number || ""}</p>
          </div>
        </div>

        <div style="margin-bottom: 30px;">
          <p style="font-size: 12px; color: #64748b; text-transform: uppercase; margin: 0 0 5px 0;">To:</p>
          <p style="font-size: 14px; font-weight: bold; margin: 0;">${inquiry.recipientName || ""}</p>
          <p style="font-size: 13px; margin: 5px 0 0 0;">${inquiry.recipientCompany || ""}</p>
          <p style="font-size: 13px; margin: 3px 0 0 0; color: #0284c7;">${inquiry.recipientEmail || ""}</p>
        </div>

        <div style="margin-bottom: 30px;">
          <p style="font-size: 16px; margin: 0 0 10px 0;">Dear ${inquiry.recipientName || ""},</p>
          ${inquiry.inquiryBody ? `<p style="font-size: 14px; line-height: 1.6; white-space: pre-wrap; margin: 0 0 20px 0;">${inquiry.inquiryBody}</p>` : ""}
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #f8fafc; border-bottom: 2px solid #0284c7;">
              <th style="padding: 12px; text-align: left; font-weight: 600; color: #0284c7;">Product Name</th>
              <th style="padding: 12px; text-align: center; font-weight: 600; color: #0284c7;">Part Number</th>
              <th style="padding: 12px; text-align: right; font-weight: 600; color: #0284c7;">Qty Required</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e2e8f0;">
          <p style="font-size: 12px; color: #64748b;">Best regards,</p>
          <p style="font-size: 14px; font-weight: bold; margin: 10px 0 0 0;">${currentUserCompany || ""}</p>
        </div>
      </div>
    `;

    return html;
  };

  // Delete inquiry from IndexedDB
  const deleteInquiryFromIndexedDB = async (
    inquiryId: string,
  ): Promise<void> => {
    try {
      const database = await initIndexedDB();
      const transaction = database.transaction(["inquiries"], "readwrite");
      const store = transaction.objectStore("inquiries");

      return new Promise((resolve, reject) => {
        const request = store.delete(inquiryId);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          console.log(`Inquiry ${inquiryId} deleted from IndexedDB`);
          resolve();
        };
      });
    } catch (error) {
      console.error("Error deleting inquiry from IndexedDB:", error);
    }
  };

  // Save inquiry to IndexedDB and history (without PDF generation)
  const saveInquiryToHistory = async (inquiry: any) => {
    try {
      if (!inquiry.recipientEmail) {
        throw new Error("Recipient email is required to send an inquiry");
      }

      // Save to IndexedDB
      const inquiryData = {
        id: inquiry.id,
        number: inquiry.number,
        date: inquiry.date,
        recipientName: inquiry.recipientName,
        recipientEmail: inquiry.recipientEmail,
        recipientCompany: inquiry.recipientCompany,
        inquiryBody: inquiry.inquiryBody,
        items: inquiry.items,
        letterhead: inquiry.letterhead || null,
        createdAt: new Date().toISOString(),
        username: currentUser,
      };

      const dbInstance = await initIndexedDB();
      await new Promise((resolve, reject) => {
        const transaction = dbInstance.transaction(["inquiries"], "readwrite");
        const store = transaction.objectStore("inquiries");
        const request = store.put(inquiryData);
        request.onsuccess = () => resolve(inquiryData.id);
        request.onerror = () => reject(request.error);
      });

      console.log(`✅ Inquiry saved to IndexedDB: ${inquiry.number}`);

      // Update React state with new inquiry in history
      setInquiryHistory((prev) => [
        ...prev,
        {
          id: inquiry.id,
          number: inquiry.number,
          date: inquiry.date,
          items: inquiry.items,
          createdAt: new Date().toISOString(),
          recipientName: inquiry.recipientName,
          recipientEmail: inquiry.recipientEmail,
          recipientCompany: inquiry.recipientCompany,
          inquiryBody: inquiry.inquiryBody,
          letterhead: inquiry.letterhead || null,
        },
      ]);

      // CRITICAL: Save to Firestore so recipient can receive it
      if (!db) {
        throw new Error(
          "Firestore not connected. Inquiry saved locally but not sent.",
        );
      }

      console.log(
        `📤 Sending inquiry to Firestore for recipient: ${inquiry.recipientEmail}`,
      );

      const sentInquiriesRef = collection(db, "sentInquiries");
      // ✅ NORMALIZE: Use utility function for consistency
      const normalizedSenderEmail = normalizeEmail(currentUserEmail);
      const normalizedRecipientEmail = normalizeEmail(inquiry.recipientEmail);

      console.log(`📝 NORMALIZED DATA:`);
      console.log(`   📧 Sender: "${normalizedSenderEmail}"`);
      console.log(`   📧 Recipient: "${normalizedRecipientEmail}"`);

      // ✅ RETRIEVE SENDER'S COMPANY from userProfiles
      let senderCompany = "N/A";
      try {
        const userProfilesRef = collection(db, "userProfiles");
        const userQuery = query(
          userProfilesRef,
          where("emailSearchable", "==", normalizedSenderEmail),
        );
        const userSnapshot = await getDocs(userQuery);
        if (!userSnapshot.empty) {
          const userDoc = userSnapshot.docs[0].data();
          senderCompany = userDoc.companyName || "N/A";
          console.log(`   🏢 Sender Company: "${senderCompany}"`);
        } else {
          console.log(`   ⚠️ Sender profile not found in userProfiles`);
        }
      } catch (error) {
        console.error(`   ❌ Error retrieving sender company:`, error);
      }

      // Generate formatted HTML for display to recipient
      const formattedHtml = generateInquiryHtml(inquiry);

      const docRef = await addDoc(sentInquiriesRef, {
        ...inquiryData,
        senderEmail: normalizedSenderEmail,
        senderCompany: senderCompany,
        recipientEmail: normalizedRecipientEmail,
        formattedHtml: formattedHtml,
        status: "sent",
        sentAt: new Date().toISOString(),
      });

      console.log(
        `✅ Inquiry sent to Firestore successfully with ID: ${docRef.id}`,
      );

      // Show comprehensive success message
      alert(
        `✅ Inquiry ${inquiry.number} saved and sent to ${inquiry.recipientEmail}!`,
      );
      console.log(
        `✅ Inquiry sent: ${inquiry.number} → ${inquiry.recipientEmail}`,
      );
    } catch (error) {
      console.error("❌ Error saving inquiry:", error);
      alert(
        `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  };

  // Resend an inquiry to multiple vendors
  const resendInquiryToVendors = async (
    inquiry: any,
    vendors: Array<{
      id: string;
      name: string;
      email: string;
      company?: string;
    }>,
  ) => {
    if (!inquiry || vendors.length === 0) {
      throw new Error("Invalid inquiry or no vendors selected");
    }

    if (!db) {
      throw new Error(
        "Firestore not connected. Cannot send inquiry to vendors.",
      );
    }

    // Validate and normalize inquiry data - provide defaults for missing fields
    const normalizedInquiry = {
      id: inquiry.id || `INQ-${Date.now()}`,
      number: inquiry.number || `INQ-${Date.now()}`,
      date: inquiry.date || new Date().toISOString(),
      recipientName: inquiry.recipientName || "",
      recipientEmail: inquiry.recipientEmail || "",
      recipientCompany: inquiry.recipientCompany || "",
      inquiryBody: inquiry.inquiryBody || "", // Default to empty string if undefined
      items: Array.isArray(inquiry.items) ? inquiry.items : [],
      letterhead: inquiry.letterhead || null,
      createdAt: inquiry.createdAt || new Date().toISOString(),
      username: inquiry.username || currentUser,
    };

    console.log(`📋 VALIDATING INQUIRY DATA:`, {
      number: normalizedInquiry.number,
      hasBody: !!normalizedInquiry.inquiryBody,
      itemsCount: normalizedInquiry.items.length,
      hasLetterhead: !!normalizedInquiry.letterhead,
    });

    const sentInquiriesRef = collection(db, "sentInquiries");
    const normalizedSenderEmail = currentUserEmail.toLowerCase().trim();
    const formattedHtml = generateInquiryHtml(normalizedInquiry);

    // ✅ RETRIEVE SENDER'S COMPANY from userProfiles
    let senderCompany = "N/A";
    try {
      const userProfilesRef = collection(db, "userProfiles");
      const userQuery = query(
        userProfilesRef,
        where("emailSearchable", "==", normalizedSenderEmail),
      );
      const userSnapshot = await getDocs(userQuery);
      if (!userSnapshot.empty) {
        const userDoc = userSnapshot.docs[0].data();
        senderCompany = userDoc.companyName || "N/A";
        console.log(`   🏢 Sender Company: "${senderCompany}"`);
      } else {
        console.log(`   ⚠️ Sender profile not found in userProfiles`);
      }
    } catch (error) {
      console.error(`   ❌ Error retrieving sender company:`, error);
    }

    const results = {
      success: [] as string[],
      failed: [] as { vendor: string; error: string }[],
    };

    console.log(
      `📤 Resending inquiry ${normalizedInquiry.number} to ${vendors.length} vendors`,
    );

    for (const vendor of vendors) {
      try {
        // ✅ NORMALIZE: Use utility function for consistency
        const normalizedVendorEmail = normalizeEmail(vendor.email);

        // ✅ CRITICAL: Validate vendor email is actually an email address (not username)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(normalizedVendorEmail)) {
          const errorMsg = `Invalid vendor email: "${vendor.email}" should be format like "name@domain.com". Vendor profile incomplete or not set up properly.`;
          console.error(`   ❌ ${errorMsg}`);
          results.failed.push({ vendor: vendor.name, error: errorMsg });
          continue; // Skip this vendor
        }

        console.log(
          `   📧 Sending to: ${vendor.name} (${normalizedVendorEmail})`,
        );

        // ✅ IMPORTANT: Create a clean vendor object without undefined fields
        // Firebase Firestore rejects undefined values, so we sanitize the object
        const cleanVendor = {
          id: vendor.id,
          name: vendor.name || vendor.id,
          email: normalizedVendorEmail,
          company: vendor.company || vendor.id, // Use vendor.id as fallback if company is undefined
        };

        // CRITICAL: Match the original send structure exactly so receiver can query/display correctly
        const firestoreData = {
          // Core inquiry fields (matches saveInquiryToHistory)
          id: `${normalizedInquiry.id}-${vendor.id}-${Date.now()}`,
          number: normalizedInquiry.number,
          date: normalizedInquiry.date,
          recipientName: vendor.name,
          recipientEmail: normalizedVendorEmail, // ✅ NORMALIZED - KEY: This is what receiver queries
          recipientCompany: cleanVendor.company, // ✅ Use cleaned company (with fallback)
          inquiryBody: normalizedInquiry.inquiryBody, // ← Always included (not conditional)
          items: normalizedInquiry.items, // ← Always included (not conditional)
          letterhead: normalizedInquiry.letterhead, // ← Always included
          createdAt: new Date().toISOString(),
          username: normalizedInquiry.username,

          // Firestore metadata (matches saveInquiryToHistory)
          senderEmail: normalizedSenderEmail, // ← For receiver to see who sent (also normalized)
          senderCompany: senderCompany, // ✅ ADD SENDER'S COMPANY
          formattedHtml: formattedHtml, // ← For beautiful display
          status: "sent" as const,
          sentAt: new Date().toISOString(),

          // Resend tracking (extra metadata)
          resendFrom: normalizedInquiry.id, // Track original inquiry ID
          originalRecipient: normalizeEmail(normalizedInquiry.recipientEmail), // ✅ NORMALIZED
          recipientContact: cleanVendor, // ✅ Use cleaned vendor object (no undefined values)
        };

        console.log(`   📝 FIRESTORE PAYLOAD:`, {
          recipientEmail: firestoreData.recipientEmail,
          senderEmail: firestoreData.senderEmail,
          hasInquiryBody: !!firestoreData.inquiryBody,
          itemsCount: firestoreData.items.length,
          keys: Object.keys(firestoreData).sort(),
        });

        // ✅ Log exactly what will be queried by the receiver
        console.log(
          `   🔍 Receiver will query for: recipientEmail == "${firestoreData.recipientEmail}"`,
        );
        console.log(
          `   ✨ This inquiry will appear in receiver's inbox when they have email: "${firestoreData.recipientEmail}"`,
        );

        const docRef = await addDoc(sentInquiriesRef, firestoreData);

        console.log(
          `   ✅ Sent to ${vendor.name} - Firestore Doc ID: ${docRef.id}`,
        );
        results.success.push(vendor.name);
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Unknown error";
        results.failed.push({ vendor: vendor.name, error: errorMsg });
        console.error(`   ❌ Failed to send to ${vendor.name}:`, errorMsg);
      }
    }

    console.log(
      `📊 Resend Summary - Success: ${results.success.length}, Failed: ${results.failed.length}`,
    );

    return results;
  };

  // Load incoming inquiries from Firestore
  const loadIncomingInquiries = async (userEmail?: string) => {
    try {
      // ✅ NORMALIZE: Use utility function for consistency
      const email = normalizeEmail(userEmail || currentUserEmail || "");
      if (!db || !email) {
        console.warn("⚠️ Cannot load incoming inquiries - no email provided");
        return [];
      }

      console.log(`📥 Querying incoming inquiries for email: ${email}`);
      const sentInquiriesRef = collection(db, "sentInquiries");
      const incomingQuery = query(
        sentInquiriesRef,
        where("recipientEmail", "==", email),
      );
      const snapshot = await getDocs(incomingQuery);
      const inquiries = snapshot.docs
        .map(
          (doc) =>
            ({
              ...doc.data(),
              firestoreId: doc.id,
            }) as any,
        )
        .sort(
          (a: any, b: any) =>
            new Date(b.sentAt || 0).getTime() -
            new Date(a.sentAt || 0).getTime(),
        );
      console.log(
        `✅ Loaded ${inquiries.length} incoming inquiries for email: ${email}`,
      );
      if (inquiries.length > 0) {
        console.log(
          `📥 Details:`,
          inquiries.map((i) => ({ from: i.senderEmail, subject: i.number })),
        );
      }
      return inquiries;
    } catch (error) {
      console.error("Error loading incoming inquiries:", error);
      return [];
    }
  };

  // Load accepted vendor connections for resending inquiries
  const loadAcceptedVendorConnections = async () => {
    try {
      if (!db || !currentUser) {
        console.warn(
          "⚠️ Cannot load vendor connections - missing db or currentUser",
        );
        return;
      }

      console.log(`📋 Loading all vendor connections for user: ${currentUser}`);

      const connectionsRef = collection(db, "vendorConnections");
      const vendorDirectoryRef = collection(db, "vendorDirectory");
      const userSettingsRef = collection(db, "userSettings");
      const userProfilesRef = collection(db, "userProfiles");

      // Query for all vendor connections (both directions)
      const initiatedByMeQuery = query(
        connectionsRef,
        where("initiatedByUser", "==", currentUser),
      );

      const sentToMeQuery = query(
        connectionsRef,
        where("targetUser", "==", currentUser),
      );

      const [initiatedSnapshot, sentToMeSnapshot] = await Promise.all([
        getDocs(initiatedByMeQuery),
        getDocs(sentToMeQuery),
      ]);

      const vendors: Array<{
        id: string;
        name: string;
        email: string;
        company?: string;
        status: "accepted" | "pending";
      }> = [];
      const seenIds = new Set<string>();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      // ✅ CRITICAL: Helper function to get vendor email with proper normalization
      const getVendorEmail = async (
        vendorId: string,
        vendorDocSnap: any,
        connectionData: any,
      ): Promise<string | null> => {
        console.log(
          `   🔍 DEBUG: Searching for email for vendor "${vendorId}"...`,
        );

        // 1. Try userProfiles first (has CAPITAL LETTER emails in some cases)
        try {
          const userProfileSnap = await getDoc(doc(userProfilesRef, vendorId));
          if (userProfileSnap.exists()) {
            const profileData = userProfileSnap.data() as any;
            const rawEmail = profileData.email;
            console.log(`   └─ userProfiles: exists=true, email="${rawEmail}"`);
            if (rawEmail) {
              const normalizedEmail = normalizeEmail(rawEmail);
              console.log(
                `      └─ normalized: "${normalizedEmail}", regex test: ${emailRegex.test(normalizedEmail)}`,
              );
              if (emailRegex.test(normalizedEmail)) {
                console.log(
                  `   ✓ Got email from userProfiles: ${rawEmail} → ${normalizedEmail}`,
                );
                return normalizedEmail;
              }
            }
          } else {
            console.log(`   └─ userProfiles: exists=false`);
          }
        } catch (e) {
          console.log(`   └─ userProfiles: error - ${(e as Error).message}`);
        }

        // 2. Try vendorDirectory
        console.log(
          `   └─ checking vendorDirectory: exists=${vendorDocSnap?.exists()}`,
        );
        if (vendorDocSnap?.exists()) {
          const vendorData = vendorDocSnap.data() as any;
          const rawEmail = vendorData.email;
          console.log(`      └─ vendorDirectory data: email="${rawEmail}"`);
          if (rawEmail) {
            const normalizedEmail = normalizeEmail(rawEmail);
            console.log(
              `         └─ normalized: "${normalizedEmail}", regex test: ${emailRegex.test(normalizedEmail)}`,
            );
            if (emailRegex.test(normalizedEmail)) {
              console.log(
                `   ✓ Got email from vendorDirectory: ${rawEmail} → ${normalizedEmail}`,
              );
              return normalizedEmail;
            } else {
              console.log(
                `         ❌ Regex failed for: "${normalizedEmail}" (this might be the blocker!)`,
              );
            }
          } else {
            console.log(`      └─ vendorDirectory.email is empty/null`);
          }
        } else {
          console.log(`      └─ vendorDirectory document does NOT exist`);
        }

        // 3. Try connection.companyData
        const companyDataEmail = connectionData?.companyData?.email;
        console.log(
          `   └─ checking connection.companyData: email="${companyDataEmail}"`,
        );
        if (companyDataEmail) {
          const normalizedEmail = normalizeEmail(companyDataEmail);
          console.log(
            `      └─ normalized: "${normalizedEmail}", regex test: ${emailRegex.test(normalizedEmail)}`,
          );
          if (emailRegex.test(normalizedEmail)) {
            console.log(
              `   ✓ Got email from connection data: ${companyDataEmail} → ${normalizedEmail}`,
            );
            return normalizedEmail;
          }
        }

        // 4. Try connection.email directly (might be stored at root level)
        const directEmail = connectionData?.email;
        console.log(
          `   └─ checking connection.email directly: "${directEmail}"`,
        );
        if (directEmail) {
          const normalizedEmail = normalizeEmail(directEmail);
          console.log(
            `      └─ normalized: "${normalizedEmail}", regex test: ${emailRegex.test(normalizedEmail)}`,
          );
          if (emailRegex.test(normalizedEmail)) {
            console.log(
              `   ✓ Got email from connection.email: ${directEmail} → ${normalizedEmail}`,
            );
            return normalizedEmail;
          }
        }

        // 5. Try userSettings (fallback for Firebase auth email)
        try {
          const userDocSnap = await getDoc(doc(userSettingsRef, vendorId));
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data() as any;
            const rawEmail = userData.email;
            console.log(`   └─ userSettings: exists=true, email="${rawEmail}"`);
            if (rawEmail) {
              const normalizedEmail = normalizeEmail(rawEmail);
              console.log(
                `      └─ normalized: "${normalizedEmail}", regex test: ${emailRegex.test(normalizedEmail)}`,
              );
              if (emailRegex.test(normalizedEmail)) {
                console.log(
                  `   ✓ Got email from userSettings: ${rawEmail} → ${normalizedEmail}`,
                );
                return normalizedEmail;
              }
            }
          } else {
            console.log(`   └─ userSettings: exists=false`);
          }
        } catch (e) {
          console.log(`   └─ userSettings: error - ${(e as Error).message}`);
        }

        // 6. Try querying vendorDirectory by username field (for vendors who may have username as searchable field)
        try {
          console.log(
            `   └─ Trying query-based search in vendorDirectory by username="${vendorId}"...`,
          );
          const usernameQuery = query(
            vendorDirectoryRef,
            where("username", "==", vendorId),
          );
          const queryResults = await getDocs(usernameQuery);
          if (queryResults.docs.length > 0) {
            const vendorData = queryResults.docs[0].data() as any;
            const rawEmail = vendorData.email;
            console.log(
              `      └─ Found in vendorDirectory via query: email="${rawEmail}"`,
            );
            if (rawEmail) {
              const normalizedEmail = normalizeEmail(rawEmail);
              console.log(
                `         └─ normalized: "${normalizedEmail}", regex test: ${emailRegex.test(normalizedEmail)}`,
              );
              if (emailRegex.test(normalizedEmail)) {
                console.log(
                  `   ✓ Got email from vendorDirectory query: ${rawEmail} → ${normalizedEmail}`,
                );
                return normalizedEmail;
              }
            }
          } else {
            console.log(`      └─ No results from vendorDirectory query`);
          }
        } catch (e) {
          console.log(
            `   └─ vendorDirectory query error - ${(e as Error).message}`,
          );
        }

        // 7. Try querying userSettings by username field
        try {
          console.log(
            `   └─ Trying query-based search in userSettings by username="${vendorId}"...`,
          );
          const usernameQuery = query(
            userSettingsRef,
            where("username", "==", vendorId),
          );
          const queryResults = await getDocs(usernameQuery);
          if (queryResults.docs.length > 0) {
            const userData = queryResults.docs[0].data() as any;
            const rawEmail = userData.email;
            console.log(
              `      └─ Found in userSettings via query: email="${rawEmail}"`,
            );
            if (rawEmail) {
              const normalizedEmail = normalizeEmail(rawEmail);
              console.log(
                `         └─ normalized: "${normalizedEmail}", regex test: ${emailRegex.test(normalizedEmail)}`,
              );
              if (emailRegex.test(normalizedEmail)) {
                console.log(
                  `   ✓ Got email from userSettings query: ${rawEmail} → ${normalizedEmail}`,
                );
                return normalizedEmail;
              }
            }
          } else {
            console.log(`      └─ No results from userSettings query`);
          }
        } catch (e) {
          console.log(
            `   └─ userSettings query error - ${(e as Error).message}`,
          );
        }

        // ❌ No valid email found anywhere
        console.log(
          `   ❌ FAILED to find valid email for vendor "${vendorId}" in any collection`,
        );
        return null;
      };

      // Process vendors I initiated connection with
      for (const docSnap of initiatedSnapshot.docs) {
        const connection = docSnap.data() as any;
        const targetUser = connection.targetUser;

        if (seenIds.has(targetUser)) continue;
        seenIds.add(targetUser);

        console.log(
          `\n📍 Processing vendor (initiated by me): "${targetUser}"`,
        );
        console.log(
          `   Connection document structure:`,
          JSON.stringify(
            {
              targetUser: connection.targetUser,
              initiatedByUser: connection.initiatedByUser,
              status: connection.status,
              companyData: connection.companyData,
              hasCompanyData: !!connection.companyData,
              allKeys: Object.keys(connection),
            },
            null,
            2,
          ),
        );

        try {
          const vendorDocSnap = await getDoc(
            doc(vendorDirectoryRef, targetUser),
          );
          console.log(
            `   vendorDirectory query result: exists=${vendorDocSnap.exists()}`,
          );
          if (vendorDocSnap.exists()) {
            console.log(
              `   vendorDirectory data keys: ${Object.keys(vendorDocSnap.data()).join(", ")}`,
            );
          }

          const email = await getVendorEmail(
            targetUser,
            vendorDocSnap,
            connection,
          );

          // ✅ IMPORTANT: Show vendor EVEN if email is missing
          // This allows users to see and interact with vendors while we try to find their email
          const vendorData = vendorDocSnap.exists()
            ? (vendorDocSnap.data() as any)
            : null;

          vendors.push({
            id: targetUser,
            name:
              vendorData?.companyName ||
              connection.companyData?.name ||
              targetUser,
            email: email || `${targetUser}@pending-email`, // Use fallback email with warning
            company: vendorData?.companyName || connection.companyData?.name,
            status: connection.status || "pending",
          });

          if (email) {
            console.log(`   ✅ ADDED vendor with email: ${email}`);
          } else {
            console.warn(
              `⚠️ ADDED vendor "${connection.companyData?.name || targetUser}" WITHOUT email (will attempt to retrieve when sending)`,
            );
          }
        } catch (error) {
          console.warn(`⚠️ Error loading vendor ${targetUser}:`, error);
        }
      }

      // Process vendors who initiated connections with me
      for (const docSnap of sentToMeSnapshot.docs) {
        const connection = docSnap.data() as any;
        const initiatorUser = connection.initiatedByUser;

        if (seenIds.has(initiatorUser)) continue;
        seenIds.add(initiatorUser);

        console.log(
          `\n📍 Processing vendor (initiated by them): "${initiatorUser}"`,
        );
        console.log(
          `   Connection document structure:`,
          JSON.stringify(
            {
              targetUser: connection.targetUser,
              initiatedByUser: connection.initiatedByUser,
              status: connection.status,
              companyData: connection.companyData,
              hasCompanyData: !!connection.companyData,
              allKeys: Object.keys(connection),
            },
            null,
            2,
          ),
        );

        try {
          const vendorDocSnap = await getDoc(
            doc(vendorDirectoryRef, initiatorUser),
          );
          console.log(
            `   vendorDirectory query result: exists=${vendorDocSnap.exists()}`,
          );
          if (vendorDocSnap.exists()) {
            console.log(
              `   vendorDirectory data keys: ${Object.keys(vendorDocSnap.data()).join(", ")}`,
            );
          }

          const email = await getVendorEmail(
            initiatorUser,
            vendorDocSnap,
            connection,
          );

          // ✅ IMPORTANT: Show vendor EVEN if email is missing
          // This allows users to see and interact with vendors while we try to find their email
          const vendorData = vendorDocSnap.exists()
            ? (vendorDocSnap.data() as any)
            : null;

          vendors.push({
            id: initiatorUser,
            name:
              vendorData?.companyName ||
              connection.companyData?.name ||
              initiatorUser,
            email: email || `${initiatorUser}@pending-email`, // Use fallback email with warning
            company: vendorData?.companyName || connection.companyData?.name,
            status: connection.status || "pending",
          });

          if (email) {
            console.log(`   ✅ ADDED vendor with email: ${email}`);
          } else {
            console.warn(
              `⚠️ ADDED vendor "${connection.companyData?.name || initiatorUser}" WITHOUT email (will attempt to retrieve when sending)`,
            );
          }
        } catch (error) {
          console.warn(`⚠️ Error loading vendor ${initiatorUser}:`, error);
        }
      }

      setAcceptedVendorConnections(vendors);
      const acceptedCount = vendors.filter(
        (v) => v.status === "accepted",
      ).length;
      const pendingCount = vendors.filter((v) => v.status === "pending").length;
      console.log(
        `✅ Loaded ${vendors.length} vendor connections (${acceptedCount} accepted, ${pendingCount} pending)`,
      );
      console.log(
        `   📍 acceptedVendorConnections state updated with ${vendors.length} vendors`,
      );
      if (vendors.length > 0) {
        console.log(
          `📋 Vendors:`,
          vendors.map((v) => ({
            name: v.name,
            email: v.email,
            status: v.status,
          })),
        );
      } else {
        console.warn(
          `   ⚠️ WARNING: No vendors with valid emails found. Ensure vendors have updated their profiles with email addresses.`,
        );
      }
    } catch (error) {
      console.error("❌ Error loading vendor connections:", error);
    }
  };

  // Generate PDF from template with items data
  const generatePDFFromTemplate = async (
    items: Product[],
    template: PDFTemplate | null,
    type: "quotation" | "inquiry",
    metadata: any,
  ) => {
    try {
      const activeTemplate = template || getDefaultTemplate(type);

      // Build table rows HTML
      const tableRows = items
        .map(
          (item, index) => `
        <tr style="border-bottom: 1px solid #e2e8f0; background-color: ${index % 2 === 0 ? "#ffffff" : "#f9fafb"};">
          <td style="padding: 12px; text-align: left;">${item.name}</td>
          <td style="padding: 12px; text-align: center;">${item.partNumber}</td>
          <td style="padding: 12px; text-align: center;">${item.currency || "USD"} ${item.price.toFixed(2)}</td>
          <td style="padding: 12px; text-align: center;">${item.qty}</td>
          <td style="padding: 12px; text-align: right;">${item.currency || "USD"} ${(item.price * item.qty).toFixed(2)}</td>
        </tr>
      `,
        )
        .join("");

      const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
      const totalFormatted = `${items[0]?.currency || "USD"} ${total.toFixed(2)}`;

      // Replace template placeholders
      let htmlContent = activeTemplate.htmlContent
        .replace("{{NUMBER}}", metadata.number)
        .replace("{{DATE}}", metadata.date)
        .replace("{{USER}}", currentUser)
        .replace("{{TABLE_ROWS}}", tableRows)
        .replace("{{TOTAL}}", totalFormatted)
        .replace("[Company Name]", activeTemplate.companyName);

      // Create a temporary container to render HTML
      const element = document.createElement("div");
      element.innerHTML = htmlContent;
      element.style.display = "none";
      document.body.appendChild(element);

      // Wait a bit for rendering
      await new Promise((resolve) => setTimeout(resolve, 500));

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const width = doc.internal.pageSize.getWidth();
      const height = doc.internal.pageSize.getHeight();
      const margin = 10;

      // Use HTML method to render
      await doc.html(element, {
        x: margin,
        y: margin,
        width: width - margin * 2,
        margin: [margin, margin, margin, margin],
        autoPaging: "text",
        html2canvas: { scale: 2 },
      });

      // Clean up
      document.body.removeChild(element);

      // Save to IndexedDB
      if (type === "quotation") {
        await saveQuotationToIndexedDB(items, metadata);
      } else {
        await saveInquiryToIndexedDB(items, metadata);
      }

      // Download PDF
      const fileName =
        type === "quotation"
          ? `Quotation_${metadata.number}.pdf`
          : `Inquiry_${metadata.number}.pdf`;
      doc.save(fileName);
      console.log(
        `${type === "quotation" ? "Quotation" : "Inquiry"} PDF generated successfully`,
      );

      return doc.output("datauristring");
    } catch (error) {
      console.error(`Error generating ${type} PDF:`, error);
      alert(
        `Error generating PDF: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  // Generate new quotation metadata
  const generateQuotationMetadata = () => {
    const newMetadata = {
      id: "Q-" + Date.now(),
      date: new Date().toISOString().split("T")[0],
      number: "QT-" + Date.now(),
    };
    setQuotationMetadata(newMetadata);
    return newMetadata;
  };

  // Generate new inquiry metadata
  const generateInquiryMetadata = () => {
    const newMetadata = {
      id: "I-" + Date.now(),
      date: new Date().toISOString().split("T")[0],
      number: "INQ-" + Date.now(),
    };
    setInquiryMetadata(newMetadata);
    return newMetadata;
  };

  // Load quotation history from IndexedDB
  const loadQuotationHistory = async (username?: string): Promise<any[]> => {
    try {
      const user = username || currentUser;
      console.log(
        `loadQuotationHistory called with username="${username}", using user="${user}"`,
      );
      const dbInstance = await initIndexedDB();
      return new Promise((resolve, reject) => {
        const transaction = dbInstance.transaction(["quotations"], "readonly");
        const store = transaction.objectStore("quotations");
        const index = store.index("username");
        const request = index.getAll(user);
        request.onsuccess = () => {
          console.log(
            `IndexedDB query for quotations with user="${user}" returned ${request.result.length} results`,
          );
          const results = request.result.map((q) => {
            const mapped = {
              id: q.id,
              number: q.number,
              date: q.date,
              items: q.items,
              totalPrice: q.totalPrice,
              currency: q.currency,
              createdAt: q.createdAt,
            };
            console.log("DEBUG Quota:", {
              id: q.id,
              stored: { totalPrice: q.totalPrice, currency: q.currency },
              mapped: {
                totalPrice: mapped.totalPrice,
                currency: mapped.currency,
              },
            });
            return mapped;
          });
          resolve(
            results.sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            ),
          );
        };
        request.onerror = () => {
          console.error(
            `IndexedDB query failed for quotations with user="${user}":`,
            request.error,
          );
          reject(request.error);
        };
      });
    } catch (error) {
      console.error("Error loading quotation history:", error);
      return [];
    }
  };

  // Load inquiry history from IndexedDB
  const loadInquiryHistory = async (username?: string): Promise<any[]> => {
    try {
      const user = username || currentUser;
      console.log(
        `loadInquiryHistory called with username="${username}", using user="${user}"`,
      );
      const dbInstance = await initIndexedDB();
      return new Promise((resolve, reject) => {
        const transaction = dbInstance.transaction(["inquiries"], "readonly");
        const store = transaction.objectStore("inquiries");
        const index = store.index("username");
        const request = index.getAll(user);
        request.onsuccess = () => {
          console.log(
            `IndexedDB query for inquiries with user="${user}" returned ${request.result.length} results`,
          );
          const results = request.result.map((i) => {
            const mapped = {
              id: i.id,
              number: i.number,
              date: i.date,
              items: i.items,
              totalPrice: i.totalPrice,
              currency: i.currency,
              createdAt: i.createdAt,
            };
            console.log("DEBUG Inquiry:", {
              id: i.id,
              stored: { totalPrice: i.totalPrice, currency: i.currency },
              mapped: {
                totalPrice: mapped.totalPrice,
                currency: mapped.currency,
              },
            });
            return mapped;
          });
          resolve(
            results.sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            ),
          );
        };
        request.onerror = () => {
          console.error(
            `IndexedDB query failed for inquiries with user="${user}":`,
            request.error,
          );
          reject(request.error);
        };
      });
    } catch (error) {
      console.error("Error loading inquiry history:", error);
      return [];
    }
  };

  // Load letterhead from Firestore
  const loadLetterhead = async (username: string): Promise<any | null> => {
    try {
      if (!db) {
        console.log("Firestore not available, cannot load letterhead");
        return null;
      }
      const docSnap = await getDocs(
        query(
          collection(db, "userSettings"),
          where("__name__", "==", `${username}_letterhead`),
        ),
      );
      if (docSnap.docs.length > 0) {
        console.log(`Loaded letterhead for ${username}`);
        return docSnap.docs[0].data();
      }
      console.log(`No letterhead found for ${username}`);
      return null;
    } catch (error) {
      console.error("Error loading letterhead:", error);
      return null;
    }
  };

  // Delete letterhead from Firestore
  const deleteLetterhead = async (username: string) => {
    try {
      if (!db) {
        console.log("Firestore not available, cannot delete letterhead");
        return;
      }
      await deleteDoc(doc(db, "userSettings", `${username}_letterhead`));
      setInquiryLetterhead(null);
      console.log(`Deleted letterhead for ${username}`);
    } catch (error) {
      console.error("Error deleting letterhead:", error);
    }
  };

  // Load marketplace items from Firestore with pagination (100 items per page = 1 READ)
  const loadMarketplaceItems = async (
    pageNumber: number = 1,
  ): Promise<{ items: Product[]; hasMore: boolean; lastDoc: any }> => {
    try {
      if (!db) {
        console.log("Firestore not available, using empty marketplace");
        return { items: [], hasMore: false, lastDoc: null };
      }

      const PAGE_SIZE = 100;
      const marketplaceRef = collection(db, "marketplace");

      let q;
      if (pageNumber === 1) {
        // First page: get 101 items to check if there are more
        q = query(marketplaceRef, orderBy("addedAt", "desc"), limit(101));
      } else {
        // Subsequent pages: use cursor pagination from last document
        if (!lastMarketplaceDoc) {
          console.warn("Cannot load page", pageNumber, "- no cursor document");
          return { items: [], hasMore: false, lastDoc: null };
        }
        q = query(
          marketplaceRef,
          orderBy("addedAt", "desc"),
          startAfter(lastMarketplaceDoc),
          limit(101),
        );
      }

      const snapshot = await getDocs(q);

      // Check if there are more items (we fetched 101 but only return 100)
      const hasMore = snapshot.docs.length > PAGE_SIZE;
      const docsToReturn = snapshot.docs.slice(0, PAGE_SIZE);
      const items = docsToReturn.map((doc) => ({
        ...doc.data(),
        id: doc.id,
        addedAt:
          typeof doc.data().addedAt === "string"
            ? parseInt(doc.data().addedAt)
            : doc.data().addedAt || 0,
      })) as Product[];

      const lastDoc =
        docsToReturn.length > 0 ? docsToReturn[docsToReturn.length - 1] : null;

      console.log(
        `Loaded page ${pageNumber}: ${items.length} items from global marketplace (hasMore: ${hasMore})`,
      );
      return {
        items: items.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0)),
        hasMore,
        lastDoc,
      };
    } catch (error) {
      console.error("Error loading marketplace items:", error);
      return { items: [], hasMore: false, lastDoc: null };
    }
  };

  // Load next page of marketplace items
  const loadMoreMarketplaceItems = async () => {
    if (isLoadingMarketplace || !hasMoreMarketplaceItems) return;

    setIsLoadingMarketplace(true);
    const nextPage = currentMarketplacePage + 1;

    loadMarketplaceItems(nextPage)
      .then(({ items, hasMore, lastDoc }) => {
        setMarketplaceItems((prev) => [...prev, ...items]);
        setHasMoreMarketplaceItems(hasMore);
        setLastMarketplaceDoc(lastDoc);
        setCurrentMarketplacePage(nextPage);
        setIsLoadingMarketplace(false);
      })
      .catch((error) => {
        console.error("Failed to load more marketplace items:", error);
        setIsLoadingMarketplace(false);
      });
  };

  // Delete items from marketplace (only user's own items)
  const deleteFromMarketplace = async (itemIds: string[]) => {
    try {
      if (!db) {
        setUploadMessage({ type: "error", text: "Marketplace not available" });
        return;
      }

      // Delete from Firestore
      for (const itemId of itemIds) {
        await deleteDoc(doc(db, "marketplace", itemId));
      }

      // Remove from local state
      setMarketplaceItems((prev) =>
        prev.filter((item) => !itemIds.includes(item.id)),
      );
      setSelectedMarketplaceItems(new Set());

      setUploadMessage({
        type: "success",
        text: `Removed ${itemIds.length} item(s) from marketplace`,
      });
      setTimeout(() => setUploadMessage(null), 3000);
    } catch (error) {
      console.error("Error deleting from marketplace:", error);
      setUploadMessage({
        type: "error",
        text: "Error removing items from marketplace",
      });
    }
  };

  // Place order for marketplace item (buyer initiates purchase)
  const placeOrder = async (
    marketplaceItem: Product,
    quantity: number,
    buyerNotes?: string,
  ) => {
    try {
      if (!db || !currentUser) {
        setUploadMessage({
          type: "error",
          text: "Cannot place order - not logged in",
        });
        return;
      }

      if (quantity <= 0 || quantity > (marketplaceItem.qty || 0)) {
        setUploadMessage({
          type: "error",
          text: "Invalid quantity selected",
        });
        return;
      }

      const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const now = Date.now();
      const newOrder: Order = {
        id: orderId,
        marketplaceItemId: marketplaceItem.id,
        itemName: marketplaceItem.name,
        itemPrice: marketplaceItem.price || 0,
        itemCurrency: marketplaceItem.currency || "USD",
        quantity,
        totalPrice: (marketplaceItem.price || 0) * quantity,
        buyer: currentUser,
        seller: (marketplaceItem.seller as string) || "Unknown",
        status: "pending",
        createdAt: now,
        updatedAt: now,
        buyerNotes,
      };

      // Save to Firestore
      await setDoc(doc(db, "orders", orderId), newOrder);

      // Add to outgoing orders locally for immediate feedback
      if (activeOrdersView === "outgoing") {
        setOutgoingOrders((prev) => [...prev, newOrder]);
      }

      setUploadMessage({
        type: "success",
        text: `Order placed successfully! Order ID: ${orderId}`,
      });
      setTimeout(() => setUploadMessage(null), 4000);
    } catch (error) {
      console.error("Error placing order:", error);
      setUploadMessage({
        type: "error",
        text: "Error placing order",
      });
    }
  };

  // Load incoming orders (where user is the seller)
  const loadIncomingOrders = async () => {
    try {
      if (!db || !currentUser) return;

      const ordersRef = collection(db, "orders");
      const q = query(ordersRef, where("seller", "==", currentUser));
      const snapshot = await getDocs(q);

      const loadedOrders = snapshot.docs.map((doc) => doc.data() as Order);
      setIncomingOrders(loadedOrders);
      setHasLoadedIncomingOrders(true);
    } catch (error) {
      console.error("Error loading incoming orders:", error);
    }
  };

  // Load outgoing orders (where user is the buyer)
  const loadOutgoingOrders = async () => {
    try {
      if (!db || !currentUser) return;

      const ordersRef = collection(db, "orders");
      const q = query(ordersRef, where("buyer", "==", currentUser));
      const snapshot = await getDocs(q);

      const loadedOrders = snapshot.docs.map((doc) => doc.data() as Order);
      setOutgoingOrders(loadedOrders);
      setHasLoadedOutgoingOrders(true);
    } catch (error) {
      console.error("Error loading outgoing orders:", error);
    }
  };

  // Update order status (for sellers on incoming orders)
  const updateOrderStatus = async (
    orderId: string,
    newStatus: Order["status"],
  ) => {
    try {
      if (!db) return;

      await setDoc(
        doc(db, "orders", orderId),
        {
          status: newStatus,
          updatedAt: Date.now(),
        } as Partial<Order>,
        { merge: true },
      );

      // Update local state
      setIncomingOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? { ...order, status: newStatus, updatedAt: Date.now() }
            : order,
        ),
      );

      setUploadMessage({
        type: "success",
        text: `Order status updated to ${newStatus}`,
      });
      setTimeout(() => setUploadMessage(null), 3000);
    } catch (error) {
      console.error("Error updating order:", error);
      setUploadMessage({
        type: "error",
        text: "Error updating order status",
      });
    }
  };

  // Retract outgoing order (buyer cancels order)
  const retractOrder = async (orderId: string | null) => {
    try {
      if (!db || !orderId) {
        console.error("Cannot retract order: missing db or orderId", {
          db: !!db,
          orderId,
        });
        setUploadMessage({
          type: "error",
          text: "Error: Order ID not found",
        });
        return;
      }

      console.log(`Retracting order: ${orderId}`);

      // Delete from Firestore
      await deleteDoc(doc(db, "orders", orderId));
      console.log(`Order ${orderId} deleted from Firestore`);

      // Remove from local state
      const updatedOrders = outgoingOrders.filter(
        (order) => order.id !== orderId,
      );
      setOutgoingOrders(updatedOrders);
      console.log(
        `Order removed from local state. Remaining orders: ${updatedOrders.length}`,
      );

      setUploadMessage({
        type: "success",
        text: "Order retracted successfully",
      });
      setTimeout(() => setUploadMessage(null), 3000);
    } catch (error) {
      console.error("Error retracting order:", error);
      setUploadMessage({
        type: "error",
        text: `Error retracting order: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      });
    } finally {
      setShowRetractConfirm(false);
      setRetractingOrderId(null);
    }
  };

  const retractQuotation = async (quotationId: string | null) => {
    try {
      if (!db || !quotationId) {
        console.error("Cannot retract quotation: missing db or quotationId", {
          db: !!db,
          quotationId,
        });
        setUploadMessage({
          type: "error",
          text: "Error: Quotation ID not found",
        });
        return;
      }

      console.log(`Retracting quotation: ${quotationId}`);

      // Delete from Firestore
      await deleteDoc(doc(db, "quotations", quotationId));
      console.log(`Quotation ${quotationId} deleted from Firestore`);

      // Remove from local state
      const updatedQuotations = quotationHistory.filter(
        (quote) => quote.id !== quotationId,
      );
      setQuotationHistory(updatedQuotations);
      console.log(
        `Quotation removed from local state. Remaining quotations: ${updatedQuotations.length}`,
      );

      setUploadMessage({
        type: "success",
        text: "Quotation retracted successfully",
      });
      setTimeout(() => setUploadMessage(null), 3000);
    } catch (error) {
      console.error("Error retracting quotation:", error);
      setUploadMessage({
        type: "error",
        text: `Error retracting quotation: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      });
    } finally {
      setShowRetractQuotationConfirm(false);
      setRetractingQuotationId(null);
    }
  };

  const retractInquiry = async (inquiryId: string | null) => {
    try {
      if (!db || !inquiryId) {
        console.error("Cannot retract inquiry: missing db or inquiryId", {
          db: !!db,
          inquiryId,
        });
        setUploadMessage({
          type: "error",
          text: "Error: Inquiry ID not found",
        });
        return;
      }

      console.log(`Retracting inquiry: ${inquiryId}`);

      // Delete from Firestore
      await deleteDoc(doc(db, "inquiries", inquiryId));
      console.log(`Inquiry ${inquiryId} deleted from Firestore`);

      // Remove from local state
      const updatedInquiries = inquiryHistory.filter(
        (inquiry) => inquiry.id !== inquiryId,
      );
      setInquiryHistory(updatedInquiries);
      console.log(
        `Inquiry removed from local state. Remaining inquiries: ${updatedInquiries.length}`,
      );

      setUploadMessage({
        type: "success",
        text: "Inquiry retracted successfully",
      });
      setTimeout(() => setUploadMessage(null), 3000);
    } catch (error) {
      console.error("Error retracting inquiry:", error);
      setUploadMessage({
        type: "error",
        text: `Error retracting inquiry: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      });
    } finally {
      setShowRetractInquiryConfirm(false);
      setRetractingInquiryId(null);
    }
  };

  // Checkout cart - creates separate orders for each seller
  const checkoutCart = async () => {
    try {
      if (!db || cart.length === 0) {
        setUploadMessage({
          type: "error",
          text: "Cart is empty",
        });
        return;
      }

      console.log(`Starting checkout with ${cart.length} items`);

      // Group cart items by seller
      const ordersBySeller: Record<
        string,
        Array<{
          productId: string;
          name: string;
          price: number;
          currency: string;
          quantity: number;
        }>
      > = {};

      cart.forEach((item) => {
        if (!ordersBySeller[item.seller]) {
          ordersBySeller[item.seller] = [];
        }
        ordersBySeller[item.seller].push({
          productId: item.productId,
          name: item.name,
          price: item.price,
          currency: item.currency,
          quantity: item.quantity,
        });
      });

      // Create separate order for each seller
      let successCount = 0;
      const sellerEmails: Record<string, string> = {};

      for (const [seller, items] of Object.entries(ordersBySeller)) {
        try {
          const totalPrice = items.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0,
          );

          const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

          const orderData = {
            id: orderId,
            buyer: currentUser,
            seller: seller,
            items: items,
            totalPrice: totalPrice,
            status: "pending",
            currency: items[0]?.currency || "USD",
            createdAt: new Date().toISOString(),
            timestamp: Date.now(),
          };

          console.log(`Creating order for seller ${seller}:`, orderData);

          // Save to Firestore
          await setDoc(doc(db, "orders", orderId), orderData);
          successCount++;
          sellerEmails[seller] = seller; // Store seller for potential notification
        } catch (sellerError) {
          console.error(
            `Error creating order for seller ${seller}:`,
            sellerError,
          );
        }
      }

      if (successCount > 0) {
        // Clear cart
        setCart([]);
        setHasLoadedCart(false);
        await saveCartToIndexedDB(currentUser, []);

        setUploadMessage({
          type: "success",
          text: `Orders placed successfully to ${successCount} seller(s)!`,
        });
        setTimeout(() => setUploadMessage(null), 3000);

        // Close cart modal
        setShowCartModal(false);

        // Reload outgoing orders to show new orders
        if (hasLoadedOutgoingOrders) {
          loadOutgoingOrders();
        }
      } else {
        setUploadMessage({
          type: "error",
          text: "Failed to create orders",
        });
      }
    } catch (error) {
      console.error("Error during checkout:", error);
      setUploadMessage({
        type: "error",
        text: `Checkout error: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  };

  // Generate PDF for quotation
  const generateQuotationPDF = async (items: Product[]) => {
    try {
      if (!items || items.length === 0) {
        console.warn("No items to generate quotation PDF");
        alert("No quotation items to generate PDF from");
        return;
      }

      const doc = new jsPDF();
      const pageHeight = doc.internal.pageSize.getHeight();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPosition = 15;

      // Header
      doc.setFontSize(20);
      doc.setTextColor(91, 124, 153);
      doc.text("QUOTATION", pageWidth / 2, yPosition, { align: "center" });

      yPosition += 10;
      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);
      doc.text(`Quotation Number: ${quotationMetadata.number}`, 15, yPosition);
      yPosition += 6;
      doc.text(`Date: ${quotationMetadata.date}`, 15, yPosition);
      yPosition += 6;
      doc.text(`Prepared by: ${currentUser}`, 15, yPosition);
      yPosition += 12;

      // Table headers
      const headers = [
        "Product Name",
        "Part Number",
        "Unit Price",
        "Quantity",
        "Total",
      ];
      const columnWidths = [60, 40, 30, 25, 35];
      const startX = 15;

      doc.setFillColor(240, 250, 255);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");

      let currentX = startX;
      headers.forEach((header, index) => {
        doc.text(header, currentX, yPosition, {
          maxWidth: columnWidths[index],
        });
        currentX += columnWidths[index];
      });

      yPosition += 7;
      doc.setDrawColor(100);
      doc.line(startX, yPosition, pageWidth - 15, yPosition);
      yPosition += 7;

      // Table data
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);

      items.forEach((item) => {
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = 15;
        }

        const lineData = [
          item.name,
          item.partNumber,
          `${item.currency || "USD"} ${item.price.toFixed(2)}`,
          item.qty.toString(),
          `${item.currency || "USD"} ${(item.price * item.qty).toFixed(2)}`,
        ];

        currentX = startX;
        lineData.forEach((data, index) => {
          doc.text(data, currentX, yPosition, {
            maxWidth: columnWidths[index],
          });
          currentX += columnWidths[index];
        });
        yPosition += 6;
      });

      yPosition += 5;
      doc.setDrawColor(100);
      doc.line(startX, yPosition, pageWidth - 15, yPosition);
      yPosition += 8;

      // Total
      const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(
        `TOTAL: ${items[0]?.currency || "USD"} ${total.toFixed(2)}`,
        pageWidth - 15,
        yPosition,
        { align: "right" },
      );

      doc.save(`Quotation_${quotationMetadata.number}.pdf`);
      console.log("Quotation PDF generated successfully");
    } catch (error) {
      console.error("Error generating quotation PDF:", error);
      alert(
        "Error generating PDF: " +
          (error instanceof Error ? error.message : "Unknown error"),
      );
    }
  };

  // Generate PDF for inquiry
  const generateInquiryPDF = async (items: Product[]) => {
    try {
      if (!items || items.length === 0) {
        console.warn("No items to generate inquiry PDF");
        alert("No inquiry items to generate PDF from");
        return;
      }

      const doc = new jsPDF();
      const pageHeight = doc.internal.pageSize.getHeight();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPosition = 15;

      // Header
      doc.setFontSize(20);
      doc.setTextColor(91, 124, 153);
      doc.text("INQUIRY", pageWidth / 2, yPosition, { align: "center" });

      yPosition += 10;
      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);
      doc.text(`Inquiry Number: ${inquiryMetadata.number}`, 15, yPosition);
      yPosition += 6;
      doc.text(`Date: ${inquiryMetadata.date}`, 15, yPosition);
      yPosition += 6;
      doc.text(`Prepared by: ${currentUser}`, 15, yPosition);
      yPosition += 12;

      // Table headers
      const headers = [
        "Product Name",
        "Part Number",
        "Unit Price",
        "Quantity",
        "Total",
      ];
      const columnWidths = [60, 40, 30, 25, 35];
      const startX = 15;

      doc.setFillColor(240, 250, 255);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");

      let currentX = startX;
      headers.forEach((header, index) => {
        doc.text(header, currentX, yPosition, {
          maxWidth: columnWidths[index],
        });
        currentX += columnWidths[index];
      });

      yPosition += 7;
      doc.setDrawColor(100);
      doc.line(startX, yPosition, pageWidth - 15, yPosition);
      yPosition += 7;

      // Table data
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);

      items.forEach((item) => {
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = 15;
        }

        const lineData = [
          item.name,
          item.partNumber,
          `${item.currency || "USD"} ${item.price.toFixed(2)}`,
          item.qty.toString(),
          `${item.currency || "USD"} ${(item.price * item.qty).toFixed(2)}`,
        ];

        currentX = startX;
        lineData.forEach((data, index) => {
          doc.text(data, currentX, yPosition, {
            maxWidth: columnWidths[index],
          });
          currentX += columnWidths[index];
        });
        yPosition += 6;
      });

      yPosition += 5;
      doc.setDrawColor(100);
      doc.line(startX, yPosition, pageWidth - 15, yPosition);
      yPosition += 8;

      // Total
      const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(
        `TOTAL: ${items[0]?.currency || "USD"} ${total.toFixed(2)}`,
        pageWidth - 15,
        yPosition,
        { align: "right" },
      );

      doc.save(`Inquiry_${inquiryMetadata.number}.pdf`);
      console.log("Inquiry PDF generated successfully");
    } catch (error) {
      console.error("Error generating inquiry PDF:", error);
      alert(
        "Error generating PDF: " +
          (error instanceof Error ? error.message : "Unknown error"),
      );
    }
  };

  // Generate email link for quotation/inquiry
  const generateEmailLink = (
    type: "quotation" | "inquiry",
    items: Product[],
  ) => {
    const fileName =
      type === "quotation"
        ? `Quotation_${quotationMetadata.number}`
        : `Inquiry_${inquiryMetadata.number}`;
    const subject = `${type === "quotation" ? "Quotation" : "Inquiry"} - ${fileName}`;
    const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
    const itemsList = items
      .map(
        (item) =>
          `${item.name} (${item.partNumber}): ${item.qty} @ ${item.currency || "USD"} ${item.price.toFixed(2)}`,
      )
      .join("%0D%0A");
    const body = `Dear,${""}%0D%0A%0D%0A${type === "quotation" ? "Please find attached our quotation" : "Please find attached our inquiry"}:%0D%0A%0D%0A${itemsList}%0D%0A%0D%0ATotal: ${items[0]?.currency || "USD"} ${total.toFixed(2)}%0D%0A%0D%0ABest regards,%0D%0A${currentUser}`;
    return `mailto:?subject=${subject}&body=${body}`;
  };

  // Sign up handler
  const handleSignup = async () => {
    if (
      !signupForm.username ||
      !signupForm.email ||
      !signupForm.companyName ||
      !signupForm.password ||
      !signupForm.confirmPassword
    ) {
      setAuthError("Please fill in all fields");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signupForm.email)) {
      setAuthError("Please enter a valid email address");
      return;
    }

    // Firebase Auth requires minimum 6 characters
    if (signupForm.password.length < 6) {
      setAuthError("Password must be at least 6 characters");
      return;
    }

    if (signupForm.password !== signupForm.confirmPassword) {
      setAuthError("Passwords do not match");
      return;
    }

    if (signupForm.companyName.trim().length < 2) {
      setAuthError("Company name must be at least 2 characters");
      return;
    }

    setIsLoading(true);
    try {
      const result = await signUpWithEmailAndPassword({
        email: signupForm.email,
        password: signupForm.password,
        username: signupForm.username,
        companyName: signupForm.companyName,
      });

      // DO NOT log in immediately - user must verify email first
      setPendingEmailVerification({
        email: result.email,
        username: result.username,
      });

      // Reset form
      setSignupForm({
        username: "",
        email: "",
        companyName: "",
        password: "",
        confirmPassword: "",
      });
      setAuthError("");
      console.log("✅ Signup successful");
    } catch (error: any) {
      const errorCode = error.message || String(error);
      if (errorCode.includes("email-already-in-use")) {
        setAuthError("Email is already registered");
      } else if (errorCode.includes("username-taken")) {
        setAuthError("Username is already taken");
      } else if (errorCode.includes("weak-password")) {
        setAuthError("Password is too weak");
      } else {
        setAuthError("Error creating account: " + errorCode);
      }
      console.error("Signup error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Login handler with password verification
  const handleLogin = async () => {
    if (!loginForm.emailOrUsername || !loginForm.password) {
      setAuthError("Please enter email/username and password");
      return;
    }

    if (loginForm.password.length < 6) {
      setAuthError("Invalid email/username or password");
      return;
    }

    setIsLoading(true);
    try {
      // Find user by email or username in userProfiles
      let userEmail: string | null = null;
      let userFound = false;

      // Check if input is email or username
      const isEmail = loginForm.emailOrUsername.includes("@");

      if (isEmail) {
        // Input is an email - search by emailSearchable
        const userDocs = await getDocs(
          query(
            collection(db, "userProfiles"),
            where(
              "emailSearchable",
              "==",
              loginForm.emailOrUsername.toLowerCase(),
            ),
          ),
        );
        if (userDocs.docs.length > 0) {
          userEmail = userDocs.docs[0].data().email;
          userFound = true;
        } else {
          // Email not found in our system
          setAuthError("Email not registered");
          setIsLoading(false);
          return;
        }
      } else {
        // Input is a username - search by usernameSearchable
        const userDocs = await getDocs(
          query(
            collection(db, "userProfiles"),
            where(
              "usernameSearchable",
              "==",
              loginForm.emailOrUsername.toLowerCase(),
            ),
          ),
        );
        if (userDocs.docs.length === 0) {
          setAuthError("Username not registered");
          setIsLoading(false);
          return;
        }
        userEmail = userDocs.docs[0].data().email;
        userFound = true;
      }

      if (!userEmail || !userFound) {
        setAuthError("User not registered");
        setIsLoading(false);
        return;
      }

      // User found in Firestore - now try Firebase Auth
      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(
          auth,
          userEmail,
          loginForm.password,
        );
      } catch (authError: any) {
        // Firebase Auth error - likely wrong password
        const errorCode = authError.code || "";
        if (
          errorCode.includes("wrong-password") ||
          errorCode.includes("invalid-login-credentials")
        ) {
          setAuthError("Incorrect password");
        } else if (errorCode.includes("user-not-found")) {
          // This shouldn't happen since we verified in Firestore, but handle it
          setAuthError("Email not registered");
        } else {
          setAuthError("Login failed. Please try again.");
        }
        setIsLoading(false);
        return;
      }

      const userData = userCredential.user;
      const uid = userData.uid;

      // IMPORTANT: Reload user to get latest email verification status
      await userData.reload();

      // Check if email is verified
      if (!userData.emailVerified) {
        setAuthError(
          `Email not verified. Verification link sent to ${userData.email}. Please check your email and click the verification link.`,
        );
        setIsLoading(false);
        return;
      }

      // Get username from userProfiles
      const userProfileDoc = await getDoc(doc(db, "userProfiles", uid));
      if (!userProfileDoc.exists()) {
        setAuthError("User profile not found");
        setIsLoading(false);
        return;
      }

      const profileData = userProfileDoc.data();
      const username = profileData.username;

      // Load user data
      const {
        products: userProducts,
        activeTab: userActiveTab,
        quotationHistory: userQuotationHistory,
        inquiryHistory: userInquiryHistory,
      } = await loadUserDataOnLogin(username, userEmail);

      setProducts(userProducts);
      setActiveSubmenu(
        "warehouse" as "marketplace" | "warehouse" | "allDocuments",
      );
      setActiveWarehouseTab(
        (userActiveTab || "products") as
          | "products"
          | "quotations"
          | "inquiries"
          | "orders"
          | "invoices"
          | "vendors"
          | "settings",
      );
      setCurrentUser(username);
      // ✅ NORMALIZE: Ensure email is stored normalized throughout the app
      setCurrentUserEmail(normalizeEmail(userEmail));
      localStorage.setItem("pspm_current_user", username);
      localStorage.setItem("pspm_auth_uid", uid);
      cacheUserData(username, normalizeEmail(userEmail));
      setIsLoggedIn(true);
      setLoginForm({ emailOrUsername: "", password: "" });
      setAuthError("");

      console.log("✅ Login successful");
    } catch (error: any) {
      // Catch any unexpected errors not handled above
      console.error("❌ Login error:", error);
      setAuthError("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter products by search query, apply threshold logic, and sort
  const filteredProducts = sortProducts(
    products
      .map((product) => ({
        ...product,
        stock:
          product.qty <= stockThreshold
            ? "Low Stock"
            : product.qty === 0
              ? "Out of Stock"
              : "In Stock",
      }))
      .filter(
        (product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.partNumber.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
  );

  // Paginate products
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Logout handler
  // Optimization #4: Session timeout auto-logout
  const resetInactivityTimer = () => {
    if (inactivityTimer) clearTimeout(inactivityTimer);

    const timer = setTimeout(() => {
      handleLogout();
      setAuthError("Session expired. Please log in again.");
    }, INACTIVITY_TIMEOUT);

    setInactivityTimer(timer);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser("");
    setCurrentUserEmail("");
    localStorage.removeItem("pspm_current_user");
    setProducts([]);
    setMarketplaceItems([]);
    setHasLoadedMarketplace(false);
    setCurrentMarketplacePage(1);
    setHasMoreMarketplaceItems(false);
    setLastMarketplaceDoc(null);
    setIsLoadingMarketplace(false);
    setSelectedProducts(new Set());
    setSelectedMarketplaceItems(new Set());
    setSearchQuery("");
    setCurrentPage(1);
    setActiveSubmenu("warehouse");
    setActiveWarehouseTab("products");
    setActiveMarketplaceTab("all");
    if (inactivityTimer) clearTimeout(inactivityTimer);
  };

  const handleSingleProductUpload = async () => {
    if (!singleProduct.name || !singleProduct.partNumber) {
      setUploadMessage({
        type: "error",
        text: "Please fill in all required fields",
      });
      return;
    }

    setIsLoading(true);
    try {
      const newProduct: Product = {
        id: Date.now().toString(),
        name: singleProduct.name,
        partNumber: singleProduct.partNumber,
        price: parseFloat(singleProduct.price) || 0,
        qty: parseInt(singleProduct.qty) || 0,
        stock: singleProduct.stock,
        image: singleProductImage || undefined,
        currency: selectedCurrency,
      };

      // Save to Firestore
      await saveUserProduct(currentUser, newProduct);

      const updatedProducts = [...products, newProduct];
      setProducts(updatedProducts);
      setSingleProduct({
        name: "",
        partNumber: "",
        price: "",
        qty: "",
        stock: "In Stock",
      });
      setSingleProductImage("");
      setUploadMessage({
        type: "success",
        text: "Product added successfully!",
      });
      setTimeout(() => setUploadMessage(null), 3000);
    } catch (error) {
      setUploadMessage({
        type: "error",
        text: "Error saving product. Please try again.",
      });
      console.error("Upload error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate by file extension (more reliable than MIME type)
    const fileName = file.name.toLowerCase();
    const isValidExtension =
      fileName.endsWith(".pdf") ||
      fileName.endsWith(".xls") ||
      fileName.endsWith(".xlsx");

    if (!isValidExtension) {
      setUploadMessage({
        type: "error",
        text: "Please upload a valid PDF or Excel file (.pdf, .xls, .xlsx)",
      });
      return;
    }

    setUploadFile(file);
    setUploadMessage({
      type: "success",
      text: `File "${file.name}" selected. Ready to process.`,
    });
  };

  const handleDeleteProducts = async (productIds: string[]) => {
    setConfirmDelete({ show: true, count: productIds.length });
  };

  const confirmDeleteAction = async (productIds: string[]) => {
    try {
      // Delete from IndexedDB
      for (const productId of productIds) {
        await deleteProductFromIndexedDB(productId);
      }

      // Update local state
      setProducts(products.filter((p) => !productIds.includes(p.id)));
      setSelectedProducts(new Set());
      setUploadMessage({
        type: "success",
        text: `Deleted ${productIds.length} product(s)`,
      });
      setConfirmDelete({ show: false, count: 0 });
      setTimeout(() => setUploadMessage(null), 3000);
    } catch (error) {
      console.error("Delete error:", error);
      setUploadMessage({ type: "error", text: "Error deleting products" });
      setConfirmDelete({ show: false, count: 0 });
    }
  };

  const handleSelectProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(products.map((p) => p.id)));
    }
  };

  const handleEditProduct = async (
    productId: string,
    updatedData: Partial<Product>,
  ) => {
    try {
      const updatedProduct = {
        ...products.find((p) => p.id === productId)!,
        ...updatedData,
      };
      await saveUserProduct(currentUser, updatedProduct);
      setProducts(
        products.map((p) => (p.id === productId ? updatedProduct : p)),
      );
      setEditingProductId(null);
      setEditingData({});
      setUploadMessage({
        type: "success",
        text: "Product updated successfully",
      });
      setTimeout(() => setUploadMessage(null), 3000);
    } catch (error) {
      setUploadMessage({ type: "error", text: "Error updating product" });
    }
  };

  const handleProcessBulkUpload = async () => {
    if (!uploadFile) {
      setUploadMessage({ type: "error", text: "Please select a file first" });
      return;
    }

    if (!currentUser) {
      setUploadMessage({
        type: "error",
        text: "You must be logged in to upload",
      });
      return;
    }

    try {
      setUploadMessage({
        type: "success",
        text: `Processing ${uploadFile.name}...`,
      });
      setUploadProgress({ current: 0, total: 0, status: "Parsing file..." });

      const fileName = uploadFile.name.toLowerCase();
      let newProducts: Product[] = [];

      if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
        // Parse Excel file
        const arrayBuffer = await uploadFile.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);

        // Map Excel data to products - stock auto-calculated from qty
        newProducts = data.map((row: any, index: number) => {
          const quantity = parseInt(row.qty || row.Qty || row.Quantity || 0);
          return {
            id: `${Date.now()}_${index}`,
            name: row.name || row.Name || row.Product || "Unknown",
            partNumber: row.partNumber || row.Part || row.PartNumber || "N/A",
            price: parseFloat(row.price || row.Price || 0),
            qty: quantity,
            stock: quantity > 0 ? "In Stock" : "Out of Stock",
            currency: row.currency || row.Currency || "USD",
          };
        });

        if (newProducts.length === 0) {
          setUploadMessage({
            type: "error",
            text: "No valid products found in Excel file",
          });
          setUploadFile(null);
          setUploadProgress(null);
          return;
        }
      } else if (fileName.endsWith(".pdf")) {
        setUploadMessage({
          type: "error",
          text: "PDF parsing not yet implemented. Please use Excel format (.xlsx or .xls)",
        });
        setUploadFile(null);
        setUploadProgress(null);
        return;
      }

      // Batch processing: save in chunks of 2000 items (IndexedDB is much faster than localStorage)
      const batchSize = 2000;
      let successCount = 0;
      const totalProducts = newProducts.length;
      setUploadProgress({
        current: 0,
        total: totalProducts,
        status: "Starting import...",
      });

      for (let i = 0; i < totalProducts; i += batchSize) {
        const batch = newProducts.slice(
          i,
          Math.min(i + batchSize, totalProducts),
        );
        const batchStartIndex = i;

        // Process batch items
        for (let j = 0; j < batch.length; j++) {
          try {
            await saveUserProduct(currentUser, batch[j]);
            successCount++;
            const currentIndex = batchStartIndex + j + 1;
            setUploadProgress({
              current: currentIndex,
              total: totalProducts,
              status: `Saving item ${currentIndex} of ${totalProducts}...`,
            });
          } catch (error) {
            console.error("Error saving product:", error);
          }
        }

        // Small delay between batches to prevent memory overflow
        if (i + batchSize < totalProducts) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      // Update local products array
      setProducts([...products, ...newProducts]);

      setUploadMessage({
        type: "success",
        text: `Successfully imported ${successCount} of ${totalProducts} product(s) from ${uploadFile.name}`,
      });
      setUploadFile(null);
      setUploadProgress(null);
      setTimeout(() => setUploadMessage(null), 5000);
    } catch (error) {
      console.error("Bulk upload error:", error);
      setUploadMessage({
        type: "error",
        text: `Error processing file: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
      setUploadFile(null);
      setUploadProgress(null);
    }
  };

  // If pending email verification, show verification screen
  if (pendingEmailVerification) {
    return (
      <div
        style={{
          display: "flex",
          height: "100vh",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(180deg, #e8f2f7 0%, #f0f7fa 100%)",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "450px",
            padding: "40px",
            background: "#ffffff",
            borderRadius: "12px",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
            border: "1px solid #e2e8f0",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "40px",
              marginBottom: "16px",
            }}
          >
            ✓
          </div>

          <h2
            style={{
              margin: "0 0 12px 0",
              fontSize: "20px",
              fontWeight: "700",
              color: "#0f172a",
            }}
          >
            Verify Your Email
          </h2>

          <p
            style={{
              margin: "0 0 24px 0",
              fontSize: "14px",
              color: "#64748b",
              lineHeight: "1.6",
            }}
          >
            We've sent a verification link to:
          </p>

          <div
            style={{
              background: "#f1f5f9",
              padding: "12px",
              borderRadius: "6px",
              marginBottom: "24px",
              fontSize: "14px",
              fontWeight: "600",
              color: "#0f172a",
              wordBreak: "break-all",
            }}
          >
            {pendingEmailVerification.email}
          </div>

          <div
            style={{
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderRadius: "6px",
              padding: "14px",
              marginBottom: "24px",
              color: "#1e40af",
              fontSize: "13px",
              lineHeight: "1.5",
            }}
          >
            <strong>📬 Check your email</strong>
            <br />
            Click the verification link in the email we sent. This confirms your
            email address and completes your signup.
          </div>

          <button
            onClick={() => {
              setPendingEmailVerification(null);
              setAuthMode("login");
            }}
            style={{
              width: "100%",
              padding: "10px 16px",
              background: "#3b82f6",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "600",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#2563eb";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#3b82f6";
            }}
          >
            Email Verified? Go to Login
          </button>

          <p
            style={{
              margin: "16px 0 0 0",
              fontSize: "12px",
              color: "#94a3b8",
            }}
          >
            Didn't receive an email? Check your spam folder or sign up again
            with a different email.
          </p>
        </div>
      </div>
    );
  }

  // If not logged in, show login/signup screen
  if (!isLoggedIn) {
    return (
      <div
        style={{
          display: "flex",
          height: "100vh",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(180deg, #e8f2f7 0%, #f0f7fa 100%)",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "400px",
            padding: "40px",
            background: "#ffffff",
            borderRadius: "12px",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
            border: "1px solid #e2e8f0",
          }}
        >
          <h1
            style={{
              margin: "0 0 8px 0",
              fontSize: "24px",
              fontWeight: "700",
              color: "#1a365d",
              textAlign: "center",
            }}
          >
            PSPM
          </h1>
          <p
            style={{
              margin: "0 0 24px 0",
              fontSize: "13px",
              color: "#64748b",
              textAlign: "center",
            }}
          >
            Platform Sales & Procurement
          </p>

          {/* Auth Mode Tabs */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              marginBottom: "24px",
              borderBottom: "1px solid #e2e8f0",
              paddingBottom: "12px",
            }}
          >
            <button
              onClick={() => {
                setAuthMode("login");
                setAuthError("");
              }}
              style={{
                flex: 1,
                padding: "8px 12px",
                background:
                  authMode === "login" ? "transparent" : "transparent",
                border: "none",
                borderBottom:
                  authMode === "login" ? "2px solid #5b7c99" : "transparent",
                color: authMode === "login" ? "#5b7c99" : "#64748b",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: authMode === "login" ? "600" : "500",
                transition: "all 0.2s ease",
              }}
            >
              Login
            </button>
            <button
              onClick={() => {
                setAuthMode("signup");
                setAuthError("");
              }}
              style={{
                flex: 1,
                padding: "8px 12px",
                background:
                  authMode === "signup" ? "transparent" : "transparent",
                border: "none",
                borderBottom:
                  authMode === "signup" ? "2px solid #5b7c99" : "transparent",
                color: authMode === "signup" ? "#5b7c99" : "#64748b",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: authMode === "signup" ? "600" : "500",
                transition: "all 0.2s ease",
              }}
            >
              Sign Up
            </button>
          </div>

          {/* Login Form */}
          {authMode === "login" && (
            <>
              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    fontSize: "13px",
                    fontWeight: "500",
                    color: "#64748b",
                  }}
                >
                  Email or Username
                </label>
                <input
                  type="text"
                  value={loginForm.emailOrUsername}
                  onChange={(e) => {
                    setLoginForm({
                      ...loginForm,
                      emailOrUsername: e.target.value,
                    });
                    setAuthError("");
                  }}
                  onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                  placeholder="Enter your email or username"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "13px",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    fontSize: "13px",
                    fontWeight: "500",
                    color: "#64748b",
                  }}
                >
                  Password
                </label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => {
                    setLoginForm({ ...loginForm, password: e.target.value });
                    setAuthError("");
                  }}
                  onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                  placeholder="Enter your password"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "13px",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              {authError && (
                <div
                  style={{
                    marginBottom: "16px",
                    padding: "10px 12px",
                    background: "#fee2e2",
                    border: "1px solid #fca5a5",
                    borderRadius: "6px",
                    color: "#dc2626",
                    fontSize: "12px",
                  }}
                >
                  {authError}
                </div>
              )}

              <button
                onClick={handleLogin}
                disabled={isLoading}
                style={{
                  width: "100%",
                  padding: "10px 16px",
                  background: isLoading ? "#cbd5e1" : "#5b7c99",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  fontSize: "13px",
                  fontWeight: "600",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.background = "#4a6fa5";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.background = "#5b7c99";
                  }
                }}
              >
                {isLoading ? "Logging in..." : "Login"}
              </button>
            </>
          )}

          {/* Signup Form */}
          {authMode === "signup" && (
            <>
              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    fontSize: "13px",
                    fontWeight: "500",
                    color: "#64748b",
                  }}
                >
                  Email
                </label>
                <input
                  type="email"
                  value={signupForm.email}
                  onChange={(e) => {
                    setSignupForm({ ...signupForm, email: e.target.value });
                    setAuthError("");
                  }}
                  placeholder="Enter your email"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "13px",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    fontSize: "13px",
                    fontWeight: "500",
                    color: "#64748b",
                  }}
                >
                  Company Name
                </label>
                <input
                  type="text"
                  value={signupForm.companyName}
                  onChange={(e) => {
                    setSignupForm({
                      ...signupForm,
                      companyName: e.target.value,
                    });
                    setAuthError("");
                  }}
                  placeholder="e.g., Acme Corporation"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "13px",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    fontSize: "13px",
                    fontWeight: "500",
                    color: "#64748b",
                  }}
                >
                  Username
                </label>
                <input
                  type="text"
                  value={signupForm.username}
                  onChange={(e) => {
                    setSignupForm({ ...signupForm, username: e.target.value });
                    setAuthError("");
                  }}
                  placeholder="Choose a username"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "13px",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    fontSize: "13px",
                    fontWeight: "500",
                    color: "#64748b",
                  }}
                >
                  Password
                </label>
                <input
                  type="password"
                  value={signupForm.password}
                  onChange={(e) => {
                    setSignupForm({ ...signupForm, password: e.target.value });
                    setAuthError("");
                  }}
                  placeholder="Min 3 characters"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "13px",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    fontSize: "13px",
                    fontWeight: "500",
                    color: "#64748b",
                  }}
                >
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={signupForm.confirmPassword}
                  onChange={(e) => {
                    setSignupForm({
                      ...signupForm,
                      confirmPassword: e.target.value,
                    });
                    setAuthError("");
                  }}
                  placeholder="Confirm your password"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "13px",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              {authError && (
                <div
                  style={{
                    marginBottom: "16px",
                    padding: "10px 12px",
                    background: "#fee2e2",
                    border: "1px solid #fca5a5",
                    borderRadius: "6px",
                    color: "#dc2626",
                    fontSize: "12px",
                  }}
                >
                  {authError}
                </div>
              )}

              <button
                onClick={handleSignup}
                disabled={isLoading}
                style={{
                  width: "100%",
                  padding: "10px 16px",
                  background: isLoading ? "#cbd5e1" : "#16a34a",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  fontSize: "13px",
                  fontWeight: "600",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.background = "#15803d";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.background = "#16a34a";
                  }
                }}
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </button>
            </>
          )}

          <p
            style={{
              margin: "16px 0 0 0",
              fontSize: "11px",
              color: "#94a3b8",
              textAlign: "center",
            }}
          >
            {authMode === "login"
              ? "Don't have an account? Click Sign Up tab"
              : "Already have an account? Click Login tab"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", background: "#ffffff" }}>
      {/* Left Sidebar */}
      <aside
        style={{
          width: "250px",
          background:
            "linear-gradient(180deg, #ffffff 0%, #f5f8fa 40%, #eef3f7 100%)",
          borderRight: "1px solid #d0dce6",
          display: "flex",
          flexDirection: "column",
          paddingTop: "24px",
          overflow: "auto",
          boxShadow: "inset -1px 0 3px rgba(0, 0, 0, 0.03)",
        }}
      >
        <div style={{ padding: "0 24px", marginBottom: "48px" }}>
          <h1
            style={{
              margin: "0",
              fontSize: "18px",
              fontWeight: "800",
              color: "#000000",
              letterSpacing: "-0.5px",
              textTransform: "uppercase",
            }}
          >
            PSPM
          </h1>
          <p
            style={{
              margin: "6px 0 0 0",
              fontSize: "11px",
              color: "#64748b",
              fontWeight: "500",
              letterSpacing: "0.2px",
            }}
          >
            User:{" "}
            <span style={{ fontWeight: "600", color: "#5b7c99" }}>
              {currentUser}
            </span>
          </p>
        </div>

        <nav style={{ flex: 1 }}>
          <div
            onClick={() => setActiveSubmenu("warehouse")}
            style={{
              padding: "14px 18px",
              cursor: "pointer",
              background:
                activeSubmenu === "warehouse"
                  ? "rgba(91, 124, 153, 0.12)"
                  : "rgba(100, 116, 139, 0.08)",
              borderLeft:
                activeSubmenu === "warehouse"
                  ? "4px solid #5b7c99"
                  : "4px solid transparent",
              transition: "all 0.3s ease",
              color: activeSubmenu === "warehouse" ? "#5b7c99" : "#64748b",
              fontWeight: activeSubmenu === "warehouse" ? "700" : "600",
              fontSize: "13px",
              marginLeft: "8px",
              marginRight: "8px",
              borderRadius: "0 6px 6px 0",
              letterSpacing: "0.3px",
              boxShadow:
                activeSubmenu === "warehouse"
                  ? "inset 0 1px 2px rgba(91, 124, 153, 0.08)"
                  : "inset 0 1px 2px rgba(100, 116, 139, 0.04)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background =
                activeSubmenu === "warehouse"
                  ? "rgba(91, 124, 153, 0.18)"
                  : "rgba(100, 116, 139, 0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background =
                activeSubmenu === "warehouse"
                  ? "rgba(91, 124, 153, 0.12)"
                  : "rgba(100, 116, 139, 0.08)";
            }}
          >
            Hub
          </div>
          <div
            onClick={() => setActiveSubmenu("marketplace")}
            style={{
              padding: "14px 18px",
              cursor: "pointer",
              background:
                activeSubmenu === "marketplace"
                  ? "rgba(91, 124, 153, 0.12)"
                  : "rgba(100, 116, 139, 0.08)",
              borderLeft:
                activeSubmenu === "marketplace"
                  ? "4px solid #5b7c99"
                  : "4px solid transparent",
              transition: "all 0.3s ease",
              color: activeSubmenu === "marketplace" ? "#5b7c99" : "#64748b",
              fontWeight: activeSubmenu === "marketplace" ? "700" : "600",
              fontSize: "13px",
              marginLeft: "8px",
              marginRight: "8px",
              borderRadius: "0 6px 6px 0",
              letterSpacing: "0.3px",
              boxShadow:
                activeSubmenu === "marketplace"
                  ? "inset 0 1px 2px rgba(91, 124, 153, 0.08)"
                  : "inset 0 1px 2px rgba(100, 116, 139, 0.04)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background =
                activeSubmenu === "marketplace"
                  ? "rgba(91, 124, 153, 0.18)"
                  : "rgba(100, 116, 139, 0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background =
                activeSubmenu === "marketplace"
                  ? "rgba(91, 124, 153, 0.12)"
                  : "rgba(100, 116, 139, 0.08)";
            }}
          >
            Marketplace
          </div>
          <div
            onClick={() => setActiveSubmenu("allDocuments")}
            style={{
              padding: "14px 18px",
              cursor: "pointer",
              background:
                activeSubmenu === "allDocuments"
                  ? "rgba(91, 124, 153, 0.12)"
                  : "rgba(100, 116, 139, 0.08)",
              borderLeft:
                activeSubmenu === "allDocuments"
                  ? "4px solid #5b7c99"
                  : "4px solid transparent",
              transition: "all 0.3s ease",
              color: activeSubmenu === "allDocuments" ? "#5b7c99" : "#64748b",
              fontWeight: activeSubmenu === "allDocuments" ? "700" : "600",
              fontSize: "13px",
              marginLeft: "8px",
              marginRight: "8px",
              marginTop: "8px",
              borderRadius: "0 6px 6px 0",
              letterSpacing: "0.3px",
              boxShadow:
                activeSubmenu === "allDocuments"
                  ? "inset 0 1px 2px rgba(91, 124, 153, 0.08)"
                  : "inset 0 1px 2px rgba(100, 116, 139, 0.04)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background =
                activeSubmenu === "allDocuments"
                  ? "rgba(91, 124, 153, 0.18)"
                  : "rgba(100, 116, 139, 0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background =
                activeSubmenu === "allDocuments"
                  ? "rgba(91, 124, 153, 0.12)"
                  : "rgba(100, 116, 139, 0.08)";
            }}
          >
            All Documents
          </div>
        </nav>

        <div
          style={{
            padding: "0 16px 28px 16px",
            borderTop: "1px solid rgba(2, 132, 199, 0.08)",
            marginTop: "auto",
          }}
        >
          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              padding: "11px 12px",
              background: "#fee2e2",
              color: "#dc2626",
              border: "1px solid #fca5a5",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "700",
              transition: "all 0.25s ease",
              letterSpacing: "0.2px",
              textTransform: "uppercase",
              boxShadow: "0 1px 2px rgba(220, 38, 38, 0.08)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#fecaca";
              e.currentTarget.style.boxShadow =
                "0 4px 8px rgba(220, 38, 38, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#fee2e2";
              e.currentTarget.style.boxShadow =
                "0 1px 2px rgba(220, 38, 38, 0.08)";
            }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          overflow: "auto",
          background: "#fafbff",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Marketplace Header */}
        {activeSubmenu === "marketplace" && (
          <div
            style={{
              background: "#ffffff",
              borderBottom: "1px solid #e2e8f0",
              padding: "20px 32px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.04)",
            }}
          >
            <h1
              style={{
                fontSize: "28px",
                fontWeight: "800",
                color: "#000000",
                margin: 0,
                letterSpacing: "-0.6px",
                textTransform: "uppercase",
              }}
            >
              Marketplace
            </h1>
            <div
              style={{
                fontSize: "12px",
                color: "#64748b",
                fontWeight: "500",
                letterSpacing: "0.2px",
              }}
            >
              User:{" "}
              <strong style={{ color: "#5b7c99", fontSize: "13px" }}>
                {currentUser}
              </strong>
            </div>
          </div>
        )}

        {/* Top Bar with Title */}
        {activeSubmenu === "warehouse" && (
          <div
            style={{
              background: "#ffffff",
              borderBottom: "1px solid #e2e8f0",
              padding: "20px 32px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.04)",
            }}
          >
            <h1
              style={{
                fontSize: "28px",
                fontWeight: "800",
                color: "#000000",
                margin: 0,
                letterSpacing: "-0.6px",
                textTransform: "uppercase",
              }}
            >
              Hub
            </h1>
            <div
              style={{
                fontSize: "12px",
                color: "#64748b",
                fontWeight: "500",
                letterSpacing: "0.2px",
              }}
            >
              User:{" "}
              <strong style={{ color: "#5b7c99", fontSize: "13px" }}>
                {currentUser}
              </strong>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        {activeSubmenu === "warehouse" && (
          <div
            style={{
              padding: "0 32px",
              borderBottom: "1px solid #e2e8f0",
              background: "#ffffff",
              display: "flex",
              alignItems: "center",
              gap: "0",
              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.02)",
            }}
          >
            <button
              onClick={() => setActiveWarehouseTab("products")}
              style={{
                background: "transparent",
                border: "none",
                borderBottom:
                  activeWarehouseTab === "products"
                    ? "3px solid #5b7c99"
                    : "2px solid transparent",
                padding: "18px 22px",
                cursor: "pointer",
                color:
                  activeWarehouseTab === "products" ? "#5b7c99" : "#64748b",
                fontWeight: activeWarehouseTab === "products" ? "700" : "600",
                fontSize: "13px",
                transition: "all 0.25s ease",
                textTransform: "uppercase",
                letterSpacing: "0.3px",
              }}
              onMouseEnter={(e) => {
                if (activeWarehouseTab !== "products") {
                  e.currentTarget.style.color = "#5b7c99";
                }
              }}
              onMouseLeave={(e) => {
                if (activeWarehouseTab !== "products") {
                  e.currentTarget.style.color = "#64748b";
                }
              }}
            >
              All Products
            </button>

            <button
              onClick={() => setActiveWarehouseTab("inquiries")}
              style={{
                background: "transparent",
                border: "none",
                borderBottom:
                  activeWarehouseTab === "inquiries"
                    ? "3px solid #5b7c99"
                    : "2px solid transparent",
                padding: "18px 22px",
                cursor: "pointer",
                color:
                  activeWarehouseTab === "inquiries" ? "#5b7c99" : "#64748b",
                fontWeight: activeWarehouseTab === "inquiries" ? "700" : "600",
                fontSize: "13px",
                transition: "all 0.25s ease",
                textTransform: "uppercase",
                letterSpacing: "0.3px",
              }}
              onMouseEnter={(e) => {
                if (activeWarehouseTab !== "inquiries") {
                  e.currentTarget.style.color = "#5b7c99";
                }
              }}
              onMouseLeave={(e) => {
                if (activeWarehouseTab !== "inquiries") {
                  e.currentTarget.style.color = "#64748b";
                }
              }}
            >
              Inquiries
            </button>

            <button
              onClick={() => setActiveWarehouseTab("quotations")}
              style={{
                background: "transparent",
                border: "none",
                borderBottom:
                  activeWarehouseTab === "quotations"
                    ? "3px solid #5b7c99"
                    : "2px solid transparent",
                padding: "18px 22px",
                cursor: "pointer",
                color:
                  activeWarehouseTab === "quotations" ? "#5b7c99" : "#64748b",
                fontWeight: activeWarehouseTab === "quotations" ? "700" : "600",
                fontSize: "13px",
                transition: "all 0.25s ease",
                textTransform: "uppercase",
                letterSpacing: "0.3px",
              }}
              onMouseEnter={(e) => {
                if (activeWarehouseTab !== "quotations") {
                  e.currentTarget.style.color = "#5b7c99";
                }
              }}
              onMouseLeave={(e) => {
                if (activeWarehouseTab !== "quotations") {
                  e.currentTarget.style.color = "#64748b";
                }
              }}
            >
              Quotations
            </button>

            <button
              onClick={() => setActiveWarehouseTab("orders")}
              style={{
                background: "transparent",
                border: "none",
                borderBottom:
                  activeWarehouseTab === "orders"
                    ? "3px solid #5b7c99"
                    : "2px solid transparent",
                padding: "18px 22px",
                cursor: "pointer",
                color: activeWarehouseTab === "orders" ? "#5b7c99" : "#64748b",
                fontWeight: activeWarehouseTab === "orders" ? "700" : "600",
                fontSize: "13px",
                transition: "all 0.25s ease",
                textTransform: "uppercase",
                letterSpacing: "0.3px",
              }}
              onMouseEnter={(e) => {
                if (activeWarehouseTab !== "orders") {
                  e.currentTarget.style.color = "#5b7c99";
                }
              }}
              onMouseLeave={(e) => {
                if (activeWarehouseTab !== "orders") {
                  e.currentTarget.style.color = "#64748b";
                }
              }}
            >
              Orders
            </button>

            <button
              onClick={() => setActiveWarehouseTab("invoices")}
              style={{
                background: "transparent",
                border: "none",
                borderBottom:
                  activeWarehouseTab === "invoices"
                    ? "3px solid #5b7c99"
                    : "2px solid transparent",
                padding: "18px 22px",
                cursor: "pointer",
                color:
                  activeWarehouseTab === "invoices" ? "#5b7c99" : "#64748b",
                fontWeight: activeWarehouseTab === "invoices" ? "700" : "600",
                fontSize: "13px",
                transition: "all 0.25s ease",
                textTransform: "uppercase",
                letterSpacing: "0.3px",
              }}
              onMouseEnter={(e) => {
                if (activeWarehouseTab !== "invoices") {
                  e.currentTarget.style.color = "#5b7c99";
                }
              }}
              onMouseLeave={(e) => {
                if (activeWarehouseTab !== "invoices") {
                  e.currentTarget.style.color = "#64748b";
                }
              }}
            >
              Invoices
            </button>

            <button
              onClick={() => setActiveWarehouseTab("vendors")}
              style={{
                background: "transparent",
                border: "none",
                borderBottom:
                  activeWarehouseTab === "vendors"
                    ? "3px solid #5b7c99"
                    : "2px solid transparent",
                padding: "18px 22px",
                cursor: "pointer",
                color: activeWarehouseTab === "vendors" ? "#5b7c99" : "#64748b",
                fontWeight: activeWarehouseTab === "vendors" ? "700" : "600",
                fontSize: "13px",
                transition: "all 0.25s ease",
                textTransform: "uppercase",
                letterSpacing: "0.3px",
              }}
              onMouseEnter={(e) => {
                if (activeWarehouseTab !== "vendors") {
                  e.currentTarget.style.color = "#5b7c99";
                }
              }}
              onMouseLeave={(e) => {
                if (activeWarehouseTab !== "vendors") {
                  e.currentTarget.style.color = "#64748b";
                }
              }}
            >
              Vendors
            </button>

            <button
              onClick={() => setActiveWarehouseTab("settings")}
              style={{
                background: "transparent",
                border: "none",
                borderBottom:
                  activeWarehouseTab === "settings"
                    ? "3px solid #5b7c99"
                    : "2px solid transparent",
                padding: "18px 22px",
                cursor: "pointer",
                color:
                  activeWarehouseTab === "settings" ? "#5b7c99" : "#64748b",
                fontWeight: activeWarehouseTab === "settings" ? "700" : "600",
                fontSize: "13px",
                transition: "all 0.25s ease",
                textTransform: "uppercase",
                letterSpacing: "0.3px",
              }}
              onMouseEnter={(e) => {
                if (activeWarehouseTab !== "settings") {
                  e.currentTarget.style.color = "#5b7c99";
                }
              }}
              onMouseLeave={(e) => {
                if (activeWarehouseTab !== "settings") {
                  e.currentTarget.style.color = "#64748b";
                }
              }}
            >
              Settings
            </button>
          </div>
        )}

        {/* Content Area */}
        <div
          style={{
            flex: 1,
            padding: "32px",
            overflow: "auto",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {activeSubmenu === "marketplace" ? (
            <div>
              {/* Marketplace Tabs */}
              <div
                style={{
                  display: "flex",
                  gap: "20px",
                  marginBottom: "28px",
                  borderBottom: "2px solid #d0dce6",
                  paddingBottom: "16px",
                }}
              >
                <button
                  onClick={() => {
                    setActiveMarketplaceTab("all");
                    setCurrentMarketplacePage(1);
                    setLastMarketplaceDoc(null);
                  }}
                  style={{
                    padding: "10px 20px",
                    background: "transparent",
                    border: "none",
                    borderBottom:
                      activeMarketplaceTab === "all"
                        ? "3px solid #5b7c99"
                        : "2px solid transparent",
                    color:
                      activeMarketplaceTab === "all" ? "#5b7c99" : "#64748b",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: activeMarketplaceTab === "all" ? "700" : "600",
                    transition: "all 0.25s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (activeMarketplaceTab !== "all")
                      e.currentTarget.style.color = "#5b7c99";
                  }}
                  onMouseLeave={(e) => {
                    if (activeMarketplaceTab !== "all")
                      e.currentTarget.style.color = "#64748b";
                  }}
                >
                  All Listings
                </button>
                <button
                  onClick={() => {
                    setActiveMarketplaceTab("myListings");
                    setCurrentMarketplacePage(1);
                    setLastMarketplaceDoc(null);
                  }}
                  style={{
                    padding: "10px 20px",
                    background: "transparent",
                    border: "none",
                    borderBottom:
                      activeMarketplaceTab === "myListings"
                        ? "3px solid #5b7c99"
                        : "2px solid transparent",
                    color:
                      activeMarketplaceTab === "myListings"
                        ? "#5b7c99"
                        : "#64748b",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight:
                      activeMarketplaceTab === "myListings" ? "700" : "600",
                    transition: "all 0.25s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (activeMarketplaceTab !== "myListings")
                      e.currentTarget.style.color = "#5b7c99";
                  }}
                  onMouseLeave={(e) => {
                    if (activeMarketplaceTab !== "myListings")
                      e.currentTarget.style.color = "#64748b";
                  }}
                >
                  My Listings
                </button>
              </div>

              {/* All Listings Tab */}
              {activeMarketplaceTab === "all" && (
                <div>
                  <h2
                    style={{
                      margin: "0 0 28px 0",
                      fontSize: "24px",
                      fontWeight: "800",
                      color: "#5b7c99",
                      letterSpacing: "-0.5px",
                      textTransform: "uppercase",
                    }}
                  >
                    All Marketplace Items (
                    {
                      marketplaceItems.filter(
                        (item) => item.seller !== currentUser,
                      ).length
                    }
                    )
                  </h2>
                  {marketplaceItems.filter(
                    (item) => item.seller !== currentUser,
                  ).length === 0 ? (
                    <div
                      style={{
                        padding: "32px",
                        background: "#f8fafc",
                        borderRadius: "12px",
                        border: "1px solid #d0dce6",
                        textAlign: "center",
                        color: "#64748b",
                      }}
                    >
                      <p
                        style={{
                          margin: "0",
                          fontSize: "14px",
                          fontWeight: "500",
                        }}
                      >
                        No marketplace items yet. Start adding products from
                        your warehouse.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fill, minmax(300px, 1fr))",
                          gap: "20px",
                        }}
                      >
                        {marketplaceItems
                          .filter((item) => item.seller !== currentUser)
                          .map((item) => (
                            <div
                              key={item.id}
                              style={{
                                background: "#ffffff",
                                border: "1px solid #d0dce6",
                                borderRadius: "8px",
                                overflow: "hidden",
                                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.04)",
                                transition: "all 0.25s ease",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.boxShadow =
                                  "0 4px 12px rgba(0, 0, 0, 0.08)";
                                e.currentTarget.style.transform =
                                  "translateY(-2px)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.boxShadow =
                                  "0 2px 4px rgba(0, 0, 0, 0.04)";
                                e.currentTarget.style.transform =
                                  "translateY(0)";
                              }}
                            >
                              {/* Product Image */}
                              <div
                                style={{
                                  width: "100%",
                                  height: "180px",
                                  background: item.image
                                    ? `url(${item.image})`
                                    : "#f0f4f8",
                                  backgroundSize: "cover",
                                  backgroundPosition: "center",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  borderBottom: "1px solid #e2e8f0",
                                  position: "relative",
                                }}
                              >
                                {!item.image && (
                                  <div
                                    style={{
                                      fontSize: "48px",
                                      color: "#cbd5e1",
                                      fontWeight: "300",
                                    }}
                                  >
                                    📦
                                  </div>
                                )}
                              </div>
                              {/* Product Details */}
                              <div style={{ padding: "16px" }}>
                                <h3
                                  style={{
                                    margin: "0 0 8px 0",
                                    fontSize: "15px",
                                    fontWeight: "700",
                                    color: "#1a365d",
                                  }}
                                >
                                  {item.name}
                                </h3>
                                <p
                                  style={{
                                    margin: "0 0 8px 0",
                                    fontSize: "12px",
                                    color: "#64748b",
                                  }}
                                >
                                  Part: {item.partNumber}
                                </p>
                                <p
                                  style={{
                                    margin: "0 0 8px 0",
                                    fontSize: "13px",
                                    fontWeight: "600",
                                    color: "#5b7c99",
                                  }}
                                >
                                  Price: {item.currency || "USD"}{" "}
                                  {formatNumber(item.price || 0)}
                                </p>
                                <p
                                  style={{
                                    margin: "0 0 8px 0",
                                    fontSize: "12px",
                                    color: "#64748b",
                                  }}
                                >
                                  Available: {item.qty || 0} units
                                </p>
                                <p
                                  style={{
                                    margin: "0 0 12px 0",
                                    fontSize: "11px",
                                    color: "#94a3b8",
                                  }}
                                >
                                  Seller:{" "}
                                  <strong>
                                    {(item.seller as any) || "Unknown"}
                                  </strong>
                                </p>
                                <div
                                  style={{
                                    display: "flex",
                                    gap: "8px",
                                  }}
                                >
                                  <button
                                    onClick={() => {
                                      // Add to Cart
                                      const newCartItem = {
                                        productId: item.id,
                                        seller:
                                          (item.seller as string) || "Unknown",
                                        name: item.name,
                                        price: item.price || 0,
                                        currency: item.currency || "USD",
                                        quantity: 1,
                                        image: item.image,
                                      };

                                      // Check if already in cart
                                      const existingIndex = cart.findIndex(
                                        (cartItem) =>
                                          cartItem.productId === item.id &&
                                          cartItem.seller ===
                                            newCartItem.seller,
                                      );

                                      let updatedCart;
                                      if (existingIndex >= 0) {
                                        // Item already in cart, increase quantity
                                        updatedCart = cart.map(
                                          (cartItem, idx) =>
                                            idx === existingIndex
                                              ? {
                                                  ...cartItem,
                                                  quantity:
                                                    cartItem.quantity + 1,
                                                }
                                              : cartItem,
                                        );
                                      } else {
                                        // New item, add to cart
                                        updatedCart = [...cart, newCartItem];
                                      }

                                      setCart(updatedCart);
                                      saveCartToIndexedDB(
                                        currentUser,
                                        updatedCart,
                                      );

                                      setUploadMessage({
                                        type: "success",
                                        text: "Added to cart!",
                                      });
                                      setTimeout(
                                        () => setUploadMessage(null),
                                        2000,
                                      );
                                    }}
                                    style={{
                                      flex: 1,
                                      padding: "8px 12px",
                                      background: "#0284c7",
                                      color: "white",
                                      border: "none",
                                      borderRadius: "6px",
                                      cursor: "pointer",
                                      fontSize: "12px",
                                      fontWeight: "600",
                                      transition: "all 0.25s ease",
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background =
                                        "#0369a1";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background =
                                        "#0284c7";
                                    }}
                                  >
                                    Add to Cart
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedOrderItem(item);
                                      setOrderQuantity(1);
                                      setOrderNotes("");
                                      setShowPlaceOrderDialog(true);
                                    }}
                                    style={{
                                      flex: 1,
                                      padding: "8px 12px",
                                      background: "#16a34a",
                                      color: "white",
                                      border: "none",
                                      borderRadius: "6px",
                                      cursor: "pointer",
                                      fontSize: "12px",
                                      fontWeight: "600",
                                      transition: "all 0.25s ease",
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background =
                                        "#14931d";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background =
                                        "#16a34a";
                                    }}
                                  >
                                    Order
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                      {hasMoreMarketplaceItems && (
                        <div style={{ marginTop: "32px", textAlign: "center" }}>
                          <button
                            onClick={loadMoreMarketplaceItems}
                            disabled={isLoadingMarketplace}
                            style={{
                              padding: "12px 28px",
                              background: isLoadingMarketplace
                                ? "#cbd5e1"
                                : "#5b7c99",
                              color: "white",
                              border: "none",
                              borderRadius: "8px",
                              cursor: isLoadingMarketplace
                                ? "not-allowed"
                                : "pointer",
                              fontSize: "14px",
                              fontWeight: "600",
                              transition: "all 0.25s ease",
                              opacity: isLoadingMarketplace ? 0.7 : 1,
                            }}
                            onMouseEnter={(e) => {
                              if (!isLoadingMarketplace) {
                                e.currentTarget.style.background = "#4a6fa5";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isLoadingMarketplace) {
                                e.currentTarget.style.background = "#5b7c99";
                              }
                            }}
                          >
                            {isLoadingMarketplace
                              ? "Loading..."
                              : "Load More Items"}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* My Listings Tab */}
              {activeMarketplaceTab === "myListings" && (
                <div>
                  <h2
                    style={{
                      margin: "0 0 28px 0",
                      fontSize: "24px",
                      fontWeight: "800",
                      color: "#5b7c99",
                      letterSpacing: "-0.5px",
                      textTransform: "uppercase",
                    }}
                  >
                    My Listings (
                    {
                      marketplaceItems.filter(
                        (item) => item.seller === currentUser,
                      ).length
                    }
                    )
                  </h2>

                  {/* My Listings Controls */}
                  {marketplaceItems.filter(
                    (item) => item.seller === currentUser,
                  ).length > 0 &&
                    selectedMarketplaceItems.size > 0 && (
                      <div
                        style={{
                          marginBottom: "20px",
                          display: "flex",
                          gap: "12px",
                        }}
                      >
                        <button
                          onClick={() => {
                            deleteFromMarketplace(
                              Array.from(selectedMarketplaceItems),
                            );
                          }}
                          style={{
                            padding: "10px 20px",
                            background: "#dc2626",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "13px",
                            fontWeight: "600",
                            transition: "all 0.25s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#b91c1c";
                            e.currentTarget.style.transform =
                              "translateY(-2px)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#dc2626";
                            e.currentTarget.style.transform = "translateY(0)";
                          }}
                        >
                          Remove ({selectedMarketplaceItems.size}) Listing(s)
                        </button>
                      </div>
                    )}

                  {marketplaceItems.filter(
                    (item) => item.seller === currentUser,
                  ).length === 0 ? (
                    <div
                      style={{
                        padding: "32px",
                        background: "#f8fafc",
                        borderRadius: "12px",
                        border: "1px solid #d0dce6",
                        textAlign: "center",
                        color: "#64748b",
                      }}
                    >
                      <p
                        style={{
                          margin: "0",
                          fontSize: "14px",
                          fontWeight: "500",
                        }}
                      >
                        You haven't posted any listings yet. Add products to the
                        marketplace from your warehouse.
                      </p>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fill, minmax(300px, 1fr))",
                        gap: "20px",
                      }}
                    >
                      {marketplaceItems
                        .filter((item) => item.seller === currentUser)
                        .map((item) => (
                          <div
                            key={item.id}
                            style={{
                              background: "#ffffff",
                              border: selectedMarketplaceItems.has(item.id)
                                ? "2px solid #5b7c99"
                                : "1px solid #d0dce6",
                              borderRadius: "8px",
                              overflow: "hidden",
                              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.04)",
                              transition: "all 0.25s ease",
                              position: "relative",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.boxShadow =
                                "0 4px 12px rgba(0, 0, 0, 0.08)";
                              e.currentTarget.style.transform =
                                "translateY(-2px)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.boxShadow =
                                "0 2px 4px rgba(0, 0, 0, 0.04)";
                              e.currentTarget.style.transform = "translateY(0)";
                            }}
                          >
                            {/* Checkbox */}
                            <input
                              type="checkbox"
                              checked={selectedMarketplaceItems.has(item.id)}
                              onChange={(e) => {
                                const newSelected = new Set(
                                  selectedMarketplaceItems,
                                );
                                if (e.target.checked) {
                                  newSelected.add(item.id);
                                } else {
                                  newSelected.delete(item.id);
                                }
                                setSelectedMarketplaceItems(newSelected);
                              }}
                              style={{
                                position: "absolute",
                                top: "12px",
                                right: "12px",
                                width: "18px",
                                height: "18px",
                                cursor: "pointer",
                                zIndex: 10,
                              }}
                            />
                            {/* Product Image */}
                            <div
                              style={{
                                width: "100%",
                                height: "180px",
                                background: item.image
                                  ? `url(${item.image})`
                                  : "#f0f4f8",
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                borderBottom: "1px solid #e2e8f0",
                              }}
                            >
                              {!item.image && (
                                <div
                                  style={{
                                    fontSize: "48px",
                                    color: "#cbd5e1",
                                    fontWeight: "300",
                                  }}
                                >
                                  📦
                                </div>
                              )}
                            </div>
                            {/* Product Details */}
                            <div style={{ padding: "16px" }}>
                              <h3
                                style={{
                                  margin: "0 0 8px 0",
                                  fontSize: "15px",
                                  fontWeight: "700",
                                  color: "#1a365d",
                                }}
                              >
                                {item.name}
                              </h3>
                              <p
                                style={{
                                  margin: "0 0 8px 0",
                                  fontSize: "12px",
                                  color: "#64748b",
                                }}
                              >
                                Part: {item.partNumber}
                              </p>
                              <p
                                style={{
                                  margin: "0 0 8px 0",
                                  fontSize: "13px",
                                  fontWeight: "600",
                                  color: "#5b7c99",
                                }}
                              >
                                Price: {item.currency || "USD"}{" "}
                                {formatNumber(item.price || 0)}
                              </p>
                              <p
                                style={{
                                  margin: "0 0 12px 0",
                                  fontSize: "12px",
                                  color: "#64748b",
                                }}
                              >
                                Available: {item.qty || 0} units
                              </p>
                              <div style={{ display: "flex", gap: "8px" }}>
                                <button
                                  onClick={() =>
                                    deleteFromMarketplace([item.id])
                                  }
                                  style={{
                                    flex: 1,
                                    padding: "8px 12px",
                                    background: "#dc2626",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    fontSize: "12px",
                                    fontWeight: "600",
                                    transition: "all 0.25s ease",
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background =
                                      "#b91c1c";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background =
                                      "#dc2626";
                                  }}
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* Place Order Dialog */}
              {showPlaceOrderDialog && selectedOrderItem && (
                <div
                  style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "rgba(0, 0, 0, 0.5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1000,
                  }}
                  onClick={() => setShowPlaceOrderDialog(false)}
                >
                  <div
                    style={{
                      background: "#ffffff",
                      borderRadius: "12px",
                      padding: "32px",
                      maxWidth: "500px",
                      width: "90%",
                      boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h2
                      style={{
                        margin: "0 0 24px 0",
                        fontSize: "20px",
                        fontWeight: "800",
                        color: "#1a365d",
                      }}
                    >
                      Place Order
                    </h2>

                    <div
                      style={{
                        background: "#f8fafc",
                        padding: "16px",
                        borderRadius: "8px",
                        marginBottom: "24px",
                      }}
                    >
                      <p
                        style={{
                          margin: "0 0 8px 0",
                          fontWeight: "600",
                          color: "#1a365d",
                        }}
                      >
                        {selectedOrderItem.name}
                      </p>
                      <p
                        style={{
                          margin: "0",
                          fontSize: "14px",
                          color: "#64748b",
                        }}
                      >
                        Part: {selectedOrderItem.partNumber}
                      </p>
                      <p
                        style={{
                          margin: "8px 0 0 0",
                          fontSize: "14px",
                          color: "#5b7c99",
                          fontWeight: "600",
                        }}
                      >
                        Price: {selectedOrderItem.currency || "USD"}{" "}
                        {formatNumber(selectedOrderItem.price || 0)} per unit
                      </p>
                    </div>

                    <div style={{ marginBottom: "24px" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          fontWeight: "600",
                          color: "#1a365d",
                          fontSize: "14px",
                        }}
                      >
                        Quantity (Max: {selectedOrderItem.qty || 0})
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={selectedOrderItem.qty || 0}
                        value={orderQuantity}
                        onChange={(e) =>
                          setOrderQuantity(
                            Math.max(
                              1,
                              Math.min(
                                parseInt(e.target.value) || 1,
                                selectedOrderItem.qty || 0,
                              ),
                            ),
                          )
                        }
                        style={{
                          width: "100%",
                          padding: "12px",
                          border: "1px solid #d0dce6",
                          borderRadius: "6px",
                          fontSize: "14px",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: "24px" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          fontWeight: "600",
                          color: "#1a365d",
                          fontSize: "14px",
                        }}
                      >
                        Notes (Optional)
                      </label>
                      <textarea
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        placeholder="Add any special notes for this order..."
                        style={{
                          width: "100%",
                          padding: "12px",
                          border: "1px solid #d0dce6",
                          borderRadius: "6px",
                          fontSize: "14px",
                          fontFamily: "inherit",
                          minHeight: "100px",
                          boxSizing: "border-box",
                          resize: "vertical",
                        }}
                      />
                    </div>

                    <div
                      style={{
                        background: "#f1f5f9",
                        padding: "16px",
                        borderRadius: "8px",
                        marginBottom: "24px",
                      }}
                    >
                      <p
                        style={{
                          margin: "0",
                          fontSize: "13px",
                          color: "#64748b",
                        }}
                      >
                        Total: {selectedOrderItem.currency || "USD"}{" "}
                        {formatNumber(
                          (selectedOrderItem.price || 0) * orderQuantity,
                        )}
                      </p>
                    </div>

                    <div style={{ display: "flex", gap: "12px" }}>
                      <button
                        onClick={() => setShowPlaceOrderDialog(false)}
                        style={{
                          flex: 1,
                          padding: "12px",
                          background: "#e2e8f0",
                          color: "#1a365d",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontWeight: "600",
                          fontSize: "14px",
                          transition: "all 0.25s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#cbd5e1";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#e2e8f0";
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={async () => {
                          await placeOrder(
                            selectedOrderItem,
                            orderQuantity,
                            orderNotes,
                          );
                          setShowPlaceOrderDialog(false);
                        }}
                        style={{
                          flex: 1,
                          padding: "12px",
                          background: "#16a34a",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontWeight: "600",
                          fontSize: "14px",
                          transition: "all 0.25s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#14931d";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#16a34a";
                        }}
                      >
                        Place Order
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : activeSubmenu === "warehouse" ? (
            <>
              {activeWarehouseTab === "products" && (
                <div>
                  <div style={{ marginBottom: "28px" }}>
                    <h2
                      style={{
                        margin: "0 0 18px 0",
                        fontSize: "22px",
                        fontWeight: "800",
                        color: "#5b7c99",
                        letterSpacing: "-0.3px",
                        textTransform: "uppercase",
                      }}
                    >
                      All Products ({products.length})
                    </h2>
                    <input
                      type="text"
                      placeholder="Search by product name or part number..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{
                        width: "100%",
                        maxWidth: "500px",
                        padding: "12px 16px",
                        border: "1px solid #d0dce6",
                        borderRadius: "8px",
                        fontSize: "14px",
                        color: "#1a365d",
                        background: "#ffffff",
                        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.04)",
                        transition: "all 0.25s ease",
                        fontWeight: "500",
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = "#5b7c99";
                        e.currentTarget.style.boxShadow =
                          "0 2px 8px rgba(2, 132, 199, 0.12), inset 0 0 0 3px rgba(2, 132, 199, 0.08)";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = "#d0dce6";
                        e.currentTarget.style.boxShadow =
                          "0 2px 4px rgba(0, 0, 0, 0.04)";
                      }}
                    />
                  </div>

                  {/* Inventory Summary & Sort Controls */}
                  {products.length > 0 && (
                    <div
                      style={{
                        marginBottom: "28px",
                        display: "flex",
                        gap: "28px",
                        justifyContent: "space-between",
                      }}
                    >
                      {/* Stock Quantity - Left Side */}
                      <div style={{ display: "flex" }}>
                        <div
                          style={{
                            background: "#f8fafc",
                            border: "1px solid #e2e8f0",
                            borderRadius: "8px",
                            padding: "10px 16px",
                            minWidth: "180px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            textAlign: "center",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "11px",
                              color: "#64748b",
                              fontWeight: "700",
                              textTransform: "uppercase",
                              letterSpacing: "0.3px",
                              marginBottom: "4px",
                            }}
                          >
                            Total Stock Quantity
                          </div>
                          <div
                            style={{
                              fontSize: "24px",
                              fontWeight: "800",
                              color: "#1a365d",
                            }}
                          >
                            {calculateInventorySummary().totalQty.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {/* Currency Valuations & Sort Controls - Right Side */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "12px",
                          alignItems: "flex-end",
                        }}
                      >
                        {/* Currency Valuations */}
                        <div
                          style={{
                            display: "flex",
                            gap: "12px",
                            flexWrap: "wrap",
                            justifyContent: "flex-end",
                          }}
                        >
                          {Object.entries(
                            calculateInventorySummary().currencyTotals,
                          ).map(([currency, data]) => {
                            const currencyData = CURRENCY_OPTIONS.find(
                              (c) => c.code === currency,
                            );
                            return (
                              <div
                                key={currency}
                                style={{
                                  background: "#f8fafc",
                                  border: "1px solid #e2e8f0",
                                  borderRadius: "8px",
                                  padding: "10px 16px",
                                  minWidth: "180px",
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: "11px",
                                    color: "#64748b",
                                    fontWeight: "700",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.3px",
                                    marginBottom: "4px",
                                  }}
                                >
                                  Total Valuation ({currency})
                                </div>
                                <div
                                  style={{
                                    fontSize: "20px",
                                    fontWeight: "800",
                                    color: "#1a365d",
                                  }}
                                >
                                  {currencyData?.symbol}
                                  {formatNumber(data.total)}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Sort Controls */}
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            alignItems: "center",
                            flexWrap: "wrap",
                            justifyContent: "flex-end",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "11px",
                              color: "#64748b",
                              fontWeight: "700",
                              textTransform: "uppercase",
                              letterSpacing: "0.3px",
                            }}
                          >
                            Sort By:
                          </div>
                          {[
                            "default",
                            "name",
                            "price",
                            "qty",
                            "partNumber",
                            "currency",
                          ].map((option) => (
                            <button
                              key={option}
                              onClick={() => {
                                if (sortBy === option) {
                                  setSortDirection(
                                    sortDirection === "asc" ? "desc" : "asc",
                                  );
                                } else {
                                  setSortBy(option as any);
                                  setSortDirection("asc");
                                }
                              }}
                              style={{
                                padding: "8px 14px",
                                background:
                                  sortBy === option ? "#5b7c99" : "#f0f4f8",
                                color:
                                  sortBy === option ? "#ffffff" : "#64748b",
                                border: "none",
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: sortBy === option ? "700" : "600",
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                textTransform: "capitalize",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                              onMouseEnter={(e) => {
                                if (sortBy !== option) {
                                  e.currentTarget.style.background = "#e2e8f0";
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (sortBy !== option) {
                                  e.currentTarget.style.background = "#f0f4f8";
                                }
                              }}
                            >
                              {option}
                              {sortBy === option && (
                                <span
                                  style={{
                                    fontSize: "14px",
                                    fontWeight: "bold",
                                  }}
                                >
                                  {sortDirection === "asc" ? "↑" : "↓"}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Stock Threshold Setting */}
                  {products.length > 0 && (
                    <div
                      style={{
                        marginBottom: "28px",
                        display: "flex",
                        gap: "16px",
                        alignItems: "center",
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        padding: "16px 20px",
                      }}
                    >
                      <label
                        style={{
                          fontSize: "12px",
                          color: "#64748b",
                          fontWeight: "700",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                          margin: 0,
                        }}
                      >
                        Low Stock Threshold:
                      </label>
                      <input
                        type="number"
                        value={stockThreshold}
                        onChange={(e) =>
                          setStockThreshold(parseInt(e.target.value) || 10)
                        }
                        style={{
                          width: "80px",
                          padding: "8px 12px",
                          border: "1px solid #d0dce6",
                          borderRadius: "6px",
                          fontSize: "13px",
                          color: "#1a365d",
                          fontWeight: "600",
                        }}
                        min="0"
                      />
                      <span style={{ fontSize: "12px", color: "#64748b" }}>
                        Products with qty at or below this level will show as
                        "Low Stock"
                      </span>
                    </div>
                  )}

                  {products.length === 0 ? (
                    <div
                      style={{
                        padding: "48px 32px",
                        textAlign: "center",
                        background: "#f8fafc",
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
                      }}
                    >
                      <p
                        style={{
                          color: "#64748b",
                          margin: "0",
                          fontSize: "14px",
                          lineHeight: "1.6",
                        }}
                      >
                        No products uploaded yet. Use the Upload Portal to add
                        products.
                      </p>
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <div
                      style={{
                        padding: "40px",
                        textAlign: "center",
                        background: "#f9fafb",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <p
                        style={{
                          color: "#64748b",
                          margin: "0",
                          fontSize: "14px",
                        }}
                      >
                        No products match your search. Try different keywords.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div
                        style={{
                          background: "#ffffff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "10px",
                          overflow: "hidden",
                          marginBottom: "24px",
                          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.06)",
                        }}
                      >
                        <table
                          style={{ width: "100%", borderCollapse: "collapse" }}
                        >
                          <thead>
                            <tr
                              style={{
                                background: "#f8fafc",
                                borderBottom: "2px solid #e2e8f0",
                              }}
                            >
                              <th
                                style={{
                                  padding: "14px 16px",
                                  textAlign: "center",
                                  fontSize: "12px",
                                  fontWeight: "700",
                                  color: "#475569",
                                  borderRight: "1px solid #e2e8f0",
                                  width: "40px",
                                  letterSpacing: "0.3px",
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={
                                    paginatedProducts.length > 0 &&
                                    paginatedProducts.every((p) =>
                                      selectedProducts.has(p.id),
                                    )
                                  }
                                  onChange={() => {
                                    const newSelected = new Set(
                                      selectedProducts,
                                    );
                                    paginatedProducts.forEach((p) => {
                                      if (
                                        paginatedProducts.every((pr) =>
                                          selectedProducts.has(pr.id),
                                        )
                                      ) {
                                        newSelected.delete(p.id);
                                      } else {
                                        newSelected.add(p.id);
                                      }
                                    });
                                    setSelectedProducts(newSelected);
                                  }}
                                  style={{ cursor: "pointer" }}
                                />
                              </th>
                              <th
                                style={{
                                  padding: "12px 16px",
                                  textAlign: "center",
                                  fontSize: "12px",
                                  fontWeight: "600",
                                  color: "#64748b",
                                  borderRight: "1px solid #e2e8f0",
                                }}
                              >
                                Image
                              </th>
                              <th
                                style={{
                                  padding: "12px 16px",
                                  textAlign: "center",
                                  fontSize: "12px",
                                  fontWeight: "600",
                                  color: "#64748b",
                                  borderRight: "1px solid #e2e8f0",
                                }}
                              >
                                Product Name
                              </th>
                              <th
                                style={{
                                  padding: "12px 16px",
                                  textAlign: "center",
                                  fontSize: "12px",
                                  fontWeight: "600",
                                  color: "#64748b",
                                  borderRight: "1px solid #e2e8f0",
                                }}
                              >
                                Part Number
                              </th>
                              <th
                                style={{
                                  padding: "12px 16px",
                                  textAlign: "center",
                                  fontSize: "12px",
                                  fontWeight: "600",
                                  color: "#64748b",
                                  borderRight: "1px solid #e2e8f0",
                                }}
                              >
                                Price
                              </th>
                              <th
                                style={{
                                  padding: "12px 16px",
                                  textAlign: "center",
                                  fontSize: "12px",
                                  fontWeight: "600",
                                  color: "#64748b",
                                  borderRight: "1px solid #e2e8f0",
                                }}
                              >
                                Currency
                              </th>
                              <th
                                style={{
                                  padding: "12px 16px",
                                  textAlign: "center",
                                  fontSize: "12px",
                                  fontWeight: "600",
                                  color: "#64748b",
                                  borderRight: "1px solid #e2e8f0",
                                }}
                              >
                                Qty
                              </th>
                              <th
                                style={{
                                  padding: "12px 16px",
                                  textAlign: "center",
                                  fontSize: "12px",
                                  fontWeight: "600",
                                  color: "#64748b",
                                  borderRight: "1px solid #e2e8f0",
                                }}
                              >
                                Stock
                              </th>
                              <th
                                style={{
                                  padding: "12px 16px",
                                  textAlign: "center",
                                  fontSize: "12px",
                                  fontWeight: "600",
                                  color: "#64748b",
                                }}
                              >
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedProducts.map((product, index) => (
                              <tr
                                key={product.id}
                                style={{
                                  borderBottom:
                                    index < paginatedProducts.length - 1
                                      ? "1px solid #f1f5f9"
                                      : "none",
                                  background:
                                    index % 2 === 0 ? "#ffffff" : "#f9fafb",
                                  opacity: selectedProducts.has(product.id)
                                    ? 0.7
                                    : 1,
                                }}
                              >
                                <td
                                  style={{
                                    padding: "12px 16px",
                                    textAlign: "center",
                                    borderRight: "1px solid #e2e8f0",
                                    width: "40px",
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedProducts.has(product.id)}
                                    onChange={() =>
                                      handleSelectProduct(product.id)
                                    }
                                    style={{ cursor: "pointer" }}
                                  />
                                </td>
                                <td
                                  style={{
                                    padding: "12px 16px",
                                    textAlign: "center",
                                    borderRight: "1px solid #e2e8f0",
                                  }}
                                >
                                  {editingProductId === product.id ? (
                                    <label
                                      style={{
                                        cursor: "pointer",
                                        display: "inline-block",
                                      }}
                                    >
                                      <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            const reader = new FileReader();
                                            reader.onload = (event) => {
                                              setEditingData({
                                                ...editingData,
                                                image: event.target
                                                  ?.result as string,
                                              });
                                            };
                                            reader.readAsDataURL(file);
                                          }
                                        }}
                                        style={{ display: "none" }}
                                      />
                                      <div
                                        style={{
                                          width: "40px",
                                          height: "40px",
                                          background:
                                            editingData.image || product.image
                                              ? "#f1f5f9"
                                              : "#e2e8f0",
                                          borderRadius: "4px",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          color: "#5b7c99",
                                          fontSize: "20px",
                                          border: "2px solid #5b7c99",
                                          cursor: "pointer",
                                          overflow: "hidden",
                                        }}
                                      >
                                        {editingData.image || product.image ? (
                                          <img
                                            src={
                                              editingData.image || product.image
                                            }
                                            alt="product"
                                            style={{
                                              width: "100%",
                                              height: "100%",
                                              objectFit: "cover",
                                            }}
                                          />
                                        ) : (
                                          <span></span>
                                        )}
                                      </div>
                                    </label>
                                  ) : (
                                    <div
                                      style={{
                                        width: "40px",
                                        height: "40px",
                                        background: "#f1f5f9",
                                        borderRadius: "4px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "#cbd5e1",
                                        fontSize: "12px",
                                        overflow: "hidden",
                                      }}
                                    >
                                      {product.image ? (
                                        <img
                                          src={product.image}
                                          alt="product"
                                          style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                          }}
                                        />
                                      ) : (
                                        "No image"
                                      )}
                                    </div>
                                  )}
                                </td>
                                <td
                                  style={{
                                    padding: "12px 16px",
                                    fontSize: "13px",
                                    color: "#1a365d",
                                    fontWeight: "500",
                                    borderRight: "1px solid #e2e8f0",
                                    textAlign: "center",
                                  }}
                                >
                                  {editingProductId === product.id ? (
                                    <input
                                      type="text"
                                      value={editingData.name || product.name}
                                      onChange={(e) =>
                                        setEditingData({
                                          ...editingData,
                                          name: e.target.value,
                                        })
                                      }
                                      style={{
                                        width: "100%",
                                        padding: "6px",
                                        border: "1px solid #5b7c99",
                                        borderRadius: "4px",
                                        fontSize: "13px",
                                      }}
                                    />
                                  ) : (
                                    product.name
                                  )}
                                </td>
                                <td
                                  style={{
                                    padding: "12px 16px",
                                    fontSize: "13px",
                                    color: "#64748b",
                                    borderRight: "1px solid #e2e8f0",
                                    textAlign: "center",
                                  }}
                                >
                                  {editingProductId === product.id ? (
                                    <div
                                      style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "8px",
                                      }}
                                    >
                                      <input
                                        type="text"
                                        value={
                                          editingData.partNumber ||
                                          product.partNumber
                                        }
                                        onChange={(e) =>
                                          setEditingData({
                                            ...editingData,
                                            partNumber: e.target.value,
                                          })
                                        }
                                        style={{
                                          width: "100%",
                                          padding: "6px",
                                          border: "1px solid #5b7c99",
                                          borderRadius: "4px",
                                          fontSize: "13px",
                                        }}
                                      />
                                      <select
                                        value={partNumberFormat}
                                        onChange={(e) =>
                                          setPartNumberFormat(
                                            e.target.value as any,
                                          )
                                        }
                                        style={{
                                          width: "100%",
                                          padding: "6px",
                                          border: "1px solid #d0dce6",
                                          borderRadius: "4px",
                                          fontSize: "12px",
                                          color: "#64748b",
                                          cursor: "pointer",
                                        }}
                                      >
                                        <option value="default">
                                          Format: 1234432112
                                        </option>
                                        <option value="dash">
                                          Format: 1234-4321-12
                                        </option>
                                        <option value="space">
                                          Format: 1234 4321 12
                                        </option>
                                        <option value="slash">
                                          Format: 1234/4321/12
                                        </option>
                                      </select>
                                    </div>
                                  ) : (
                                    formatPartNumber(
                                      product.partNumber,
                                      partNumberFormat,
                                    )
                                  )}
                                </td>
                                <td
                                  style={{
                                    padding: "12px 16px",
                                    textAlign: "center",
                                    fontSize: "13px",
                                    color: "#1a365d",
                                    fontWeight: "500",
                                    borderRight: "1px solid #e2e8f0",
                                  }}
                                >
                                  {editingProductId === product.id ? (
                                    <input
                                      type="number"
                                      value={editingData.price || product.price}
                                      onChange={(e) =>
                                        setEditingData({
                                          ...editingData,
                                          price: parseFloat(e.target.value),
                                        })
                                      }
                                      style={{
                                        width: "100px",
                                        padding: "6px",
                                        border: "1px solid #5b7c99",
                                        borderRadius: "4px",
                                        fontSize: "13px",
                                      }}
                                    />
                                  ) : (
                                    (() => {
                                      const currencyData =
                                        CURRENCY_OPTIONS.find(
                                          (c) =>
                                            c.code ===
                                            (product.currency || "USD"),
                                        );
                                      const symbol =
                                        currencyData?.symbol || "$";
                                      return `${symbol}${formatNumber(product.price)}`;
                                    })()
                                  )}
                                </td>
                                <td
                                  style={{
                                    padding: "12px 16px",
                                    textAlign: "center",
                                    fontSize: "13px",
                                    color: "#1a365d",
                                    fontWeight: "500",
                                    borderRight: "1px solid #e2e8f0",
                                  }}
                                >
                                  {editingProductId === product.id ? (
                                    <select
                                      value={
                                        editingData.currency ||
                                        product.currency ||
                                        "USD"
                                      }
                                      onChange={(e) =>
                                        setEditingData({
                                          ...editingData,
                                          currency: e.target.value,
                                        })
                                      }
                                      style={{
                                        width: "100%",
                                        padding: "6px",
                                        border: "1px solid #5b7c99",
                                        borderRadius: "4px",
                                        fontSize: "13px",
                                        cursor: "pointer",
                                      }}
                                    >
                                      {CURRENCY_OPTIONS.map((curr) => (
                                        <option
                                          key={curr.code}
                                          value={curr.code}
                                        >
                                          {curr.code}
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    product.currency || "USD"
                                  )}
                                </td>
                                <td
                                  style={{
                                    padding: "12px 16px",
                                    textAlign: "center",
                                    fontSize: "13px",
                                    color: "#1a365d",
                                    fontWeight: "500",
                                    borderRight: "1px solid #e2e8f0",
                                  }}
                                >
                                  {editingProductId === product.id ? (
                                    <input
                                      type="number"
                                      value={editingData.qty ?? product.qty}
                                      onChange={(e) =>
                                        setEditingData({
                                          ...editingData,
                                          qty: parseInt(e.target.value),
                                        })
                                      }
                                      style={{
                                        width: "80px",
                                        padding: "6px",
                                        border: "1px solid #5b7c99",
                                        borderRadius: "4px",
                                        fontSize: "13px",
                                      }}
                                    />
                                  ) : (
                                    product.qty.toLocaleString()
                                  )}
                                </td>
                                <td
                                  style={{
                                    padding: "12px 16px",
                                    fontSize: "13px",
                                    borderRight: "1px solid #e2e8f0",
                                    textAlign: "center",
                                  }}
                                >
                                  <span
                                    style={{
                                      background:
                                        product.stock === "In Stock"
                                          ? "#dcfce7"
                                          : product.stock === "Low Stock"
                                            ? "#fef3c7"
                                            : "#fee2e2",
                                      color:
                                        product.stock === "In Stock"
                                          ? "#16a34a"
                                          : product.stock === "Low Stock"
                                            ? "#d97706"
                                            : "#dc2626",
                                      padding: "4px 8px",
                                      borderRadius: "4px",
                                      fontSize: "12px",
                                      fontWeight: "500",
                                    }}
                                  >
                                    {product.stock}
                                  </span>
                                </td>
                                <td
                                  style={{
                                    padding: "12px 16px",
                                    textAlign: "center",
                                    fontSize: "12px",
                                    display: "flex",
                                    gap: "6px",
                                    justifyContent: "center",
                                  }}
                                >
                                  {editingProductId === product.id ? (
                                    <>
                                      <button
                                        onClick={() =>
                                          handleEditProduct(product.id, {
                                            ...editingData,
                                            stock:
                                              (editingData.qty || product.qty) >
                                              0
                                                ? "In Stock"
                                                : "Out of Stock",
                                          })
                                        }
                                        style={{
                                          padding: "4px 10px",
                                          background: "#16a34a",
                                          color: "white",
                                          border: "none",
                                          borderRadius: "4px",
                                          cursor: "pointer",
                                          fontSize: "12px",
                                          fontWeight: "500",
                                        }}
                                      >
                                        Save
                                      </button>
                                      <button
                                        onClick={() => {
                                          setEditingProductId(null);
                                          setEditingData({});
                                        }}
                                        style={{
                                          padding: "4px 10px",
                                          background: "#dc2626",
                                          color: "white",
                                          border: "none",
                                          borderRadius: "4px",
                                          cursor: "pointer",
                                          fontSize: "12px",
                                          fontWeight: "500",
                                        }}
                                      >
                                        Cancel
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setEditingProductId(product.id);
                                        setEditingData({});
                                      }}
                                      style={{
                                        padding: "4px 10px",
                                        background: "#5b7c99",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "4px",
                                        cursor: "pointer",
                                        fontSize: "12px",
                                        fontWeight: "500",
                                      }}
                                    >
                                      Edit
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination Controls */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "16px 0",
                        }}
                      >
                        <span style={{ fontSize: "13px", color: "#64748b" }}>
                          Showing{" "}
                          {paginatedProducts.length > 0
                            ? (currentPage - 1) * itemsPerPage + 1
                            : 0}{" "}
                          -{" "}
                          {Math.min(
                            currentPage * itemsPerPage,
                            filteredProducts.length,
                          )}{" "}
                          of {filteredProducts.length} results
                        </span>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            onClick={() =>
                              setCurrentPage(Math.max(1, currentPage - 1))
                            }
                            disabled={currentPage === 1}
                            style={{
                              padding: "6px 12px",
                              background:
                                currentPage === 1 ? "#e2e8f0" : "#5b7c99",
                              color: currentPage === 1 ? "#94a3b8" : "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor:
                                currentPage === 1 ? "not-allowed" : "pointer",
                              fontSize: "12px",
                              fontWeight: "500",
                            }}
                          >
                            Previous
                          </button>
                          {generatePageNumbers(currentPage, totalPages).map(
                            (page, index) => {
                              if (page === "...") {
                                return (
                                  <span
                                    key={`ellipsis-${index}`}
                                    style={{
                                      padding: "6px 0",
                                      color: "#94a3b8",
                                      fontSize: "12px",
                                    }}
                                  >
                                    ...
                                  </span>
                                );
                              }
                              return (
                                <button
                                  key={page}
                                  onClick={() => setCurrentPage(page as number)}
                                  style={{
                                    padding: "6px 12px",
                                    background:
                                      currentPage === page
                                        ? "#5b7c99"
                                        : "#ffffff",
                                    color:
                                      currentPage === page
                                        ? "white"
                                        : "#5b7c99",
                                    border: `1px solid ${currentPage === page ? "#5b7c99" : "#e2e8f0"}`,
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                    fontSize: "12px",
                                    fontWeight: "500",
                                  }}
                                >
                                  {page}
                                </button>
                              );
                            },
                          )}
                          <button
                            onClick={() =>
                              setCurrentPage(
                                Math.min(totalPages, currentPage + 1),
                              )
                            }
                            disabled={currentPage === totalPages}
                            style={{
                              padding: "6px 12px",
                              background:
                                currentPage === totalPages
                                  ? "#e2e8f0"
                                  : "#5b7c99",
                              color:
                                currentPage === totalPages
                                  ? "#94a3b8"
                                  : "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor:
                                currentPage === totalPages
                                  ? "not-allowed"
                                  : "pointer",
                              fontSize: "12px",
                              fontWeight: "500",
                            }}
                          >
                            Next
                          </button>
                        </div>
                      </div>

                      {/* Delete Confirmation Modal */}
                      {confirmDelete.show && (
                        <div
                          style={{
                            padding: "16px",
                            background: "#fee2e2",
                            borderTop: "1px solid #fca5a5",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            borderRadius: "8px",
                            marginBottom: "16px",
                          }}
                        >
                          <span
                            style={{
                              color: "#dc2626",
                              fontSize: "13px",
                              fontWeight: "500",
                            }}
                          >
                            Are you sure you want to delete{" "}
                            {confirmDelete.count} item
                            {confirmDelete.count > 1 ? "s" : ""}? This action
                            cannot be undone.
                          </span>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button
                              onClick={() => {
                                confirmDeleteAction(
                                  Array.from(selectedProducts),
                                );
                              }}
                              style={{
                                padding: "6px 16px",
                                background: "#dc2626",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "12px",
                                fontWeight: "500",
                              }}
                            >
                              Yes, Delete
                            </button>
                            <button
                              onClick={() =>
                                setConfirmDelete({ show: false, count: 0 })
                              }
                              style={{
                                padding: "6px 16px",
                                background: "#ffffff",
                                color: "#dc2626",
                                border: "1px solid #dc2626",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "12px",
                                fontWeight: "500",
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Quantity Editor Modal */}
                      {showQuantityEditor.show && selectedProducts.size > 0 && (
                        <div
                          style={{
                            position: "fixed",
                            inset: 0,
                            background: "rgba(0,0,0,0.5)",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            zIndex: 1001,
                          }}
                        >
                          <div
                            style={{
                              background: "white",
                              borderRadius: "12px",
                              boxShadow: "0 12px 48px rgba(0,0,0,0.15)",
                              maxWidth: "600px",
                              width: "90%",
                              maxHeight: "80vh",
                              overflow: "auto",
                            }}
                          >
                            <div
                              style={{
                                padding: "24px 32px",
                                borderBottom: "1px solid #e2e8f0",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <h2
                                style={{
                                  margin: 0,
                                  fontSize: "18px",
                                  fontWeight: "700",
                                  color: "#1a365d",
                                }}
                              >
                                {showQuantityEditor.mode === "quotation"
                                  ? "Adjust Quotation Quantities"
                                  : "Adjust Inquiry Quantities"}
                              </h2>
                              <button
                                onClick={() =>
                                  setShowQuantityEditor({
                                    show: false,
                                    mode: "quotation",
                                  })
                                }
                                style={{
                                  background: "none",
                                  border: "none",
                                  fontSize: "20px",
                                  cursor: "pointer",
                                  color: "#64748b",
                                  padding: "0",
                                  width: "24px",
                                  height: "24px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                ×
                              </button>
                            </div>
                            <div style={{ padding: "24px 32px" }}>
                              {products
                                .filter((p) => selectedProducts.has(p.id))
                                .map((product) => (
                                  <div
                                    key={product.id}
                                    style={{
                                      marginBottom: "20px",
                                      padding: "16px",
                                      background: "#f8fafc",
                                      borderRadius: "8px",
                                      border: "1px solid #e2e8f0",
                                    }}
                                  >
                                    <div
                                      style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "start",
                                        marginBottom: "12px",
                                      }}
                                    >
                                      <div>
                                        <p
                                          style={{
                                            margin: "0 0 4px 0",
                                            fontSize: "14px",
                                            fontWeight: "600",
                                            color: "#1a365d",
                                          }}
                                        >
                                          {product.name}
                                        </p>
                                        <p
                                          style={{
                                            margin: "0",
                                            fontSize: "12px",
                                            color: "#64748b",
                                          }}
                                        >
                                          Part: {product.partNumber}
                                        </p>
                                        <p
                                          style={{
                                            margin: "4px 0 0 0",
                                            fontSize: "12px",
                                            color: "#64748b",
                                          }}
                                        >
                                          Price: {product.currency || "USD"}{" "}
                                          {product.price.toFixed(2)}
                                        </p>
                                      </div>
                                      <div style={{ textAlign: "right" }}>
                                        <p
                                          style={{
                                            margin: "0 0 8px 0",
                                            fontSize: "12px",
                                            color: "#64748b",
                                            fontWeight: "500",
                                          }}
                                        >
                                          Quantity
                                        </p>
                                        <input
                                          type="number"
                                          min="1"
                                          value={
                                            quantityEdits[product.id] ||
                                            product.qty
                                          }
                                          onChange={(e) =>
                                            setQuantityEdits({
                                              ...quantityEdits,
                                              [product.id]:
                                                parseInt(e.target.value) || 1,
                                            })
                                          }
                                          style={{
                                            width: "80px",
                                            padding: "8px 12px",
                                            border: "1px solid #d0dce6",
                                            borderRadius: "6px",
                                            fontSize: "14px",
                                            fontWeight: "600",
                                            textAlign: "center",
                                          }}
                                        />
                                        <p
                                          style={{
                                            margin: "8px 0 0 0",
                                            fontSize: "12px",
                                            color: "#5b7c99",
                                            fontWeight: "600",
                                          }}
                                        >
                                          Total: {product.currency || "USD"}{" "}
                                          {(
                                            product.price *
                                            (quantityEdits[product.id] ||
                                              product.qty)
                                          ).toFixed(2)}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                            </div>
                            <div
                              style={{
                                padding: "16px 32px",
                                borderTop: "1px solid #e2e8f0",
                                display: "flex",
                                gap: "12px",
                                justifyContent: "flex-end",
                              }}
                            >
                              <button
                                onClick={() =>
                                  setShowQuantityEditor({
                                    show: false,
                                    mode: "quotation",
                                  })
                                }
                                style={{
                                  padding: "10px 24px",
                                  background: "#e2e8f0",
                                  color: "#1a365d",
                                  border: "none",
                                  borderRadius: "6px",
                                  cursor: "pointer",
                                  fontSize: "13px",
                                  fontWeight: "600",
                                }}
                              >
                                Cancel
                              </button>
                              <button
                                onClick={async () => {
                                  const selectedItems = products
                                    .filter((p) => selectedProducts.has(p.id))
                                    .map((p) => ({
                                      ...p,
                                      qty: quantityEdits[p.id] || p.qty,
                                    }));
                                  console.log(
                                    "DEBUG: Selected items:",
                                    selectedItems.map((s) => ({
                                      id: s.id,
                                      name: s.name,
                                      price: s.price,
                                      qty: s.qty,
                                      currency: s.currency,
                                    })),
                                  );
                                  try {
                                    if (
                                      showQuantityEditor.mode === "quotation"
                                    ) {
                                      const newMeta =
                                        generateQuotationMetadata();
                                      setQuotations(selectedItems);
                                      await saveQuotationToIndexedDB(
                                        selectedItems,
                                        newMeta,
                                      );
                                      const newHistory =
                                        await loadQuotationHistory();
                                      setQuotationHistory(newHistory);
                                    } else {
                                      const newMeta = generateInquiryMetadata();
                                      setInquiries(selectedItems);
                                      // Don't save to IndexedDB yet - will save when PDF is generated
                                      // Items are just in the current composition area
                                    }
                                  } catch (error) {
                                    console.error(
                                      "Error saving to IndexedDB:",
                                      error,
                                    );
                                    alert(
                                      "Error saving document: " +
                                        (error instanceof Error
                                          ? error.message
                                          : "Unknown error"),
                                    );
                                  }
                                  setSelectedProducts(new Set());
                                  setShowQuantityEditor({
                                    show: false,
                                    mode: "quotation",
                                  });
                                  setActiveWarehouseTab(
                                    showQuantityEditor.mode === "quotation"
                                      ? "quotations"
                                      : "inquiries",
                                  );
                                }}
                                style={{
                                  padding: "10px 24px",
                                  background:
                                    showQuantityEditor.mode === "quotation"
                                      ? "#5b7c99"
                                      : "#64748b",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "6px",
                                  cursor: "pointer",
                                  fontSize: "13px",
                                  fontWeight: "600",
                                }}
                              >
                                Confirm & Add
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Floating Action Bar for Quotations & Inquiries */}
                      {selectedProducts.size > 0 &&
                        !confirmDelete.show &&
                        !showQuantityEditor.show && (
                          <div
                            style={{
                              position: "fixed",
                              bottom: "32px",
                              left: "50%",
                              transform: "translateX(-50%)",
                              background: "white",
                              border: "1px solid #d0dce6",
                              borderRadius: "12px",
                              padding: "16px 24px",
                              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              gap: "16px",
                              zIndex: 1000,
                            }}
                          >
                            <span
                              style={{
                                fontSize: "13px",
                                fontWeight: "600",
                                color: "#5b7c99",
                              }}
                            >
                              {selectedProducts.size} product(s) selected
                            </span>
                            <button
                              onClick={() => {
                                const selectedItems = products.filter((p) =>
                                  selectedProducts.has(p.id),
                                );
                                const edits: { [key: string]: number } = {};
                                selectedItems.forEach((item) => {
                                  edits[item.id] = item.qty;
                                });
                                setQuantityEdits(edits);
                                setShowQuantityEditor({
                                  show: true,
                                  mode: "quotation",
                                });
                              }}
                              style={{
                                padding: "10px 20px",
                                background: "#5b7c99",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "13px",
                                fontWeight: "600",
                                transition: "all 0.25s ease",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "#4a6fa5";
                                e.currentTarget.style.transform =
                                  "translateY(-2px)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "#5b7c99";
                                e.currentTarget.style.transform =
                                  "translateY(0)";
                              }}
                            >
                              Add to Quotation
                            </button>
                            <button
                              onClick={() => {
                                const selectedItems = products.filter((p) =>
                                  selectedProducts.has(p.id),
                                );
                                const edits: { [key: string]: number } = {};
                                selectedItems.forEach((item) => {
                                  edits[item.id] = item.qty;
                                });
                                setQuantityEdits(edits);
                                setShowQuantityEditor({
                                  show: true,
                                  mode: "inquiry",
                                });
                              }}
                              style={{
                                padding: "10px 20px",
                                background: "#64748b",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "13px",
                                fontWeight: "600",
                                transition: "all 0.25s ease",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "#475569";
                                e.currentTarget.style.transform =
                                  "translateY(-2px)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "#64748b";
                                e.currentTarget.style.transform =
                                  "translateY(0)";
                              }}
                            >
                              Add to Inquiry
                            </button>
                            <button
                              onClick={async () => {
                                const selectedItems = products.filter((p) =>
                                  selectedProducts.has(p.id),
                                );
                                try {
                                  if (!db) {
                                    setUploadMessage({
                                      type: "error",
                                      text: "Marketplace not available. Firebase connection required.",
                                    });
                                    return;
                                  }

                                  // Generate marketplace items with consistent IDs
                                  const now = Date.now(); // Use timestamp number instead of ISO string
                                  const newMarketplaceItems = selectedItems.map(
                                    (item, index) => {
                                      const marketplaceId = `MP-${now}-${Math.random().toString(36).substr(2, 9)}-${index}`;
                                      return {
                                        ...item,
                                        id: marketplaceId,
                                        addedAt: now,
                                        seller: currentUser,
                                      };
                                    },
                                  );

                                  // Save to Firestore marketplace collection (global, visible to all users)
                                  for (const item of newMarketplaceItems) {
                                    await setDoc(
                                      doc(db, "marketplace", item.id),
                                      item,
                                    );
                                  }

                                  // Reset pagination to show newly added items at the top
                                  setCurrentMarketplacePage(1);
                                  setLastMarketplaceDoc(null);

                                  // Reload marketplace from page 1 to show new items
                                  const { items, hasMore, lastDoc } =
                                    await loadMarketplaceItems(1);
                                  setMarketplaceItems(items);
                                  setHasMoreMarketplaceItems(hasMore);
                                  setLastMarketplaceDoc(lastDoc);

                                  setSelectedProducts(new Set());
                                  setUploadMessage({
                                    type: "success",
                                    text: `Added ${selectedItems.length} item(s) to marketplace`,
                                  });
                                  setTimeout(
                                    () => setUploadMessage(null),
                                    3000,
                                  );
                                } catch (error) {
                                  console.error(
                                    "Error adding to marketplace:",
                                    error,
                                  );
                                  setUploadMessage({
                                    type: "error",
                                    text: "Error adding items to marketplace",
                                  });
                                }
                              }}
                              style={{
                                padding: "10px 20px",
                                background: "#059669",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "13px",
                                fontWeight: "600",
                                transition: "all 0.25s ease",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "#047857";
                                e.currentTarget.style.transform =
                                  "translateY(-2px)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "#059669";
                                e.currentTarget.style.transform =
                                  "translateY(0)";
                              }}
                            >
                              Add to Marketplace
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteProducts(
                                  Array.from(selectedProducts),
                                )
                              }
                              style={{
                                padding: "10px 20px",
                                background: "#dc2626",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "13px",
                                fontWeight: "600",
                                transition: "all 0.25s ease",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "#b91c1c";
                                e.currentTarget.style.transform =
                                  "translateY(-2px)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "#dc2626";
                                e.currentTarget.style.transform =
                                  "translateY(0)";
                              }}
                            >
                              Delete Selected
                            </button>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              )}

              {activeWarehouseTab === "quotations" && (
                <div>
                  <div style={{ marginBottom: "28px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "18px",
                      }}
                    >
                      <h2
                        style={{
                          margin: "0",
                          fontSize: "22px",
                          fontWeight: "800",
                          color: "#5b7c99",
                          letterSpacing: "-0.3px",
                          textTransform: "uppercase",
                        }}
                      >
                        {activeQuotationsView === "incoming"
                          ? `Incoming Quotations (${0})`
                          : `Outgoing Quotations (${quotationHistory.length})`}
                      </h2>
                    </div>

                    {/* Quotations View Selector - Side by Side Buttons */}
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                      }}
                    >
                      <button
                        onClick={() => {
                          setActiveQuotationsView("incoming");
                        }}
                        style={{
                          padding: "10px 16px",
                          borderRadius: "6px",
                          border:
                            activeQuotationsView === "incoming"
                              ? "2px solid #0284c7"
                              : "1px solid #d0dce6",
                          background:
                            activeQuotationsView === "incoming"
                              ? "#0284c7"
                              : "#ffffff",
                          color:
                            activeQuotationsView === "incoming"
                              ? "white"
                              : "#1a365d",
                          cursor: "pointer",
                          fontSize: "14px",
                          fontWeight: "600",
                          transition: "all 0.25s ease",
                          boxShadow:
                            activeQuotationsView === "incoming"
                              ? "0 4px 8px rgba(2, 132, 199, 0.2)"
                              : "0 2px 4px rgba(0, 0, 0, 0.04)",
                        }}
                        onMouseEnter={(e) => {
                          if (activeQuotationsView !== "incoming") {
                            e.currentTarget.style.background = "#f0f9ff";
                            e.currentTarget.style.borderColor = "#0284c7";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (activeQuotationsView !== "incoming") {
                            e.currentTarget.style.background = "#ffffff";
                            e.currentTarget.style.borderColor = "#d0dce6";
                          }
                        }}
                      >
                        Incoming Quotations
                      </button>
                      <button
                        onClick={() => {
                          setActiveQuotationsView("outgoing");
                        }}
                        style={{
                          padding: "10px 16px",
                          borderRadius: "6px",
                          border:
                            activeQuotationsView === "outgoing"
                              ? "2px solid #0284c7"
                              : "1px solid #d0dce6",
                          background:
                            activeQuotationsView === "outgoing"
                              ? "#0284c7"
                              : "#ffffff",
                          color:
                            activeQuotationsView === "outgoing"
                              ? "white"
                              : "#1a365d",
                          cursor: "pointer",
                          fontSize: "14px",
                          fontWeight: "600",
                          transition: "all 0.25s ease",
                          boxShadow:
                            activeQuotationsView === "outgoing"
                              ? "0 4px 8px rgba(2, 132, 199, 0.2)"
                              : "0 2px 4px rgba(0, 0, 0, 0.04)",
                        }}
                        onMouseEnter={(e) => {
                          if (activeQuotationsView !== "outgoing") {
                            e.currentTarget.style.background = "#f0f9ff";
                            e.currentTarget.style.borderColor = "#0284c7";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (activeQuotationsView !== "outgoing") {
                            e.currentTarget.style.background = "#ffffff";
                            e.currentTarget.style.borderColor = "#d0dce6";
                          }
                        }}
                      >
                        📤 Outgoing Quotations
                      </button>
                    </div>
                  </div>

                  {/* Incoming Quotations - Always Blank (Feature to be implemented later) */}
                  {activeQuotationsView === "incoming" && (
                    <div
                      style={{
                        background: "#f8fafc",
                        border: "2px dashed #cbd5e1",
                        borderRadius: "8px",
                        padding: "48px 32px",
                        textAlign: "center",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "16px",
                          color: "#64748b",
                          margin: "0",
                        }}
                      >
                        No incoming quotations yet. When other users send
                        quotations to you, they will appear here.
                      </p>
                    </div>
                  )}

                  {/* Outgoing Quotations */}
                  {activeQuotationsView === "outgoing" && (
                    <>
                      {quotationHistory.length === 0 ? (
                        <div
                          style={{
                            background: "#f8fafc",
                            border: "2px dashed #cbd5e1",
                            borderRadius: "8px",
                            padding: "48px 32px",
                            textAlign: "center",
                          }}
                        >
                          <p
                            style={{
                              fontSize: "16px",
                              color: "#64748b",
                              margin: "0",
                            }}
                          >
                            No outgoing quotations yet. Create a quotation in
                            the Quotation Builder above.
                          </p>
                        </div>
                      ) : (
                        <div
                          style={{
                            overflowX: "auto",
                            borderRadius: "8px",
                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                          }}
                        >
                          <table
                            style={{
                              width: "100%",
                              borderCollapse: "collapse",
                              background: "#ffffff",
                            }}
                          >
                            <thead>
                              <tr
                                style={{
                                  background: "#f1f5f9",
                                  borderBottom: "2px solid #e2e8f0",
                                }}
                              >
                                <th
                                  style={{
                                    padding: "16px",
                                    textAlign: "left",
                                    fontWeight: "700",
                                    color: "#5b7c99",
                                    fontSize: "13px",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.3px",
                                  }}
                                >
                                  Quote #
                                </th>
                                <th
                                  style={{
                                    padding: "16px",
                                    textAlign: "left",
                                    fontWeight: "700",
                                    color: "#5b7c99",
                                    fontSize: "13px",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.3px",
                                  }}
                                >
                                  Product Name
                                </th>
                                <th
                                  style={{
                                    padding: "16px",
                                    textAlign: "left",
                                    fontWeight: "700",
                                    color: "#5b7c99",
                                    fontSize: "13px",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.3px",
                                  }}
                                >
                                  Total Price
                                </th>
                                <th
                                  style={{
                                    padding: "16px",
                                    textAlign: "center",
                                    fontWeight: "700",
                                    color: "#5b7c99",
                                    fontSize: "13px",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.3px",
                                  }}
                                >
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {quotationHistory.map((quote, index) => (
                                <tr
                                  key={index}
                                  style={{
                                    borderBottom: "1px solid #e2e8f0",
                                    background:
                                      index % 2 === 0 ? "#ffffff" : "#f8fafc",
                                  }}
                                >
                                  <td
                                    style={{
                                      padding: "16px",
                                      color: "#1a365d",
                                      fontWeight: "600",
                                      fontSize: "13px",
                                    }}
                                  >
                                    {quote.number || quote.id.substring(0, 8)}
                                  </td>
                                  <td
                                    style={{
                                      padding: "16px",
                                      color: "#64748b",
                                      fontSize: "13px",
                                    }}
                                  >
                                    {quote.items && quote.items.length > 0
                                      ? quote.items[0].name
                                      : "N/A"}
                                  </td>
                                  <td
                                    style={{
                                      padding: "16px",
                                      color: "#1a365d",
                                      fontWeight: "600",
                                      fontSize: "13px",
                                    }}
                                  >
                                    {quote.currency || "USD"}{" "}
                                    {formatNumber(quote.totalPrice || 0)}
                                  </td>
                                  <td
                                    style={{
                                      padding: "16px",
                                      textAlign: "center",
                                    }}
                                  >
                                    <div
                                      style={{
                                        display: "flex",
                                        gap: "8px",
                                        justifyContent: "center",
                                      }}
                                    >
                                      <button
                                        onClick={() => {
                                          setSelectedQuotationForPreview(quote);
                                          setShowQuotationPreview(true);
                                        }}
                                        style={{
                                          padding: "6px 12px",
                                          background: "#0284c7",
                                          color: "white",
                                          border: "none",
                                          borderRadius: "4px",
                                          cursor: "pointer",
                                          fontSize: "12px",
                                          fontWeight: "600",
                                          transition: "all 0.25s ease",
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.background =
                                            "#0369a1";
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.background =
                                            "#0284c7";
                                        }}
                                      >
                                        Preview
                                      </button>
                                      <button
                                        onClick={() => {
                                          setRetractingQuotationId(quote.id);
                                          setShowRetractQuotationConfirm(true);
                                        }}
                                        style={{
                                          padding: "6px 12px",
                                          background: "#dc2626",
                                          color: "white",
                                          border: "none",
                                          borderRadius: "4px",
                                          cursor: "pointer",
                                          fontSize: "12px",
                                          fontWeight: "600",
                                          transition: "all 0.25s ease",
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.background =
                                            "#b91c1c";
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.background =
                                            "#dc2626";
                                        }}
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {activeWarehouseTab === "inquiries" && (
                <div>
                  <div style={{ marginBottom: "28px" }}>
                    <div
                      style={{
                        display: "flex",
                        gap: "12px",
                        marginBottom: "18px",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div style={{ display: "flex", gap: "12px" }}>
                        <button
                          onClick={() => {
                            setActiveInquiriesView("incoming");
                          }}
                          style={{
                            padding: "10px 16px",
                            borderRadius: "6px",
                            border:
                              activeInquiriesView === "incoming"
                                ? "2px solid #0284c7"
                                : "1px solid #d0dce6",
                            background:
                              activeInquiriesView === "incoming"
                                ? "#0284c7"
                                : "#ffffff",
                            color:
                              activeInquiriesView === "incoming"
                                ? "white"
                                : "#1a365d",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: "600",
                            transition: "all 0.25s ease",
                            boxShadow:
                              activeInquiriesView === "incoming"
                                ? "0 4px 8px rgba(2, 132, 199, 0.2)"
                                : "0 2px 4px rgba(0, 0, 0, 0.04)",
                          }}
                          onMouseEnter={(e) => {
                            if (activeInquiriesView !== "incoming") {
                              e.currentTarget.style.background = "#f0f9ff";
                              e.currentTarget.style.borderColor = "#0284c7";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (activeInquiriesView !== "incoming") {
                              e.currentTarget.style.background = "#ffffff";
                              e.currentTarget.style.borderColor = "#d0dce6";
                            }
                          }}
                        >
                          Incoming Inquiries ({incomingInquiries.length})
                        </button>
                        <button
                          onClick={() => {
                            setActiveInquiriesView("outgoing");
                          }}
                          style={{
                            padding: "10px 16px",
                            borderRadius: "6px",
                            border:
                              activeInquiriesView === "outgoing"
                                ? "2px solid #0284c7"
                                : "1px solid #d0dce6",
                            background:
                              activeInquiriesView === "outgoing"
                                ? "#0284c7"
                                : "#ffffff",
                            color:
                              activeInquiriesView === "outgoing"
                                ? "white"
                                : "#1a365d",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: "600",
                            transition: "all 0.25s ease",
                            boxShadow:
                              activeInquiriesView === "outgoing"
                                ? "0 4px 8px rgba(2, 132, 199, 0.2)"
                                : "0 2px 4px rgba(0, 0, 0, 0.04)",
                          }}
                          onMouseEnter={(e) => {
                            if (activeInquiriesView !== "outgoing") {
                              e.currentTarget.style.background = "#f0f9ff";
                              e.currentTarget.style.borderColor = "#0284c7";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (activeInquiriesView !== "outgoing") {
                              e.currentTarget.style.background = "#ffffff";
                              e.currentTarget.style.borderColor = "#d0dce6";
                            }
                          }}
                        >
                          Outgoing Inquiries ({inquiryHistory.length})
                        </button>
                      </div>
                      <button
                        onClick={async () => {
                          if (
                            activeInquiriesView === "incoming" &&
                            currentUserEmail
                          ) {
                            setIsRefreshingInquiries(true);
                            try {
                              const inquiries =
                                await loadIncomingInquiries(currentUserEmail);
                              setIncomingInquiries(inquiries);
                              console.log(
                                `✅ Refreshed incoming inquiries: ${inquiries.length} found`,
                              );
                            } catch (error) {
                              console.error(
                                "❌ Failed to refresh inquiries:",
                                error,
                              );
                            } finally {
                              setIsRefreshingInquiries(false);
                            }
                          }
                        }}
                        style={{
                          padding: "10px 16px",
                          borderRadius: "6px",
                          border: "1px solid #d0dce6",
                          background: isRefreshingInquiries
                            ? "#e0f2fe"
                            : "#ffffff",
                          color: "#1a365d",
                          cursor: isRefreshingInquiries
                            ? "not-allowed"
                            : "pointer",
                          fontSize: "14px",
                          fontWeight: "600",
                          transition: "all 0.25s ease",
                          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.04)",
                          opacity: isRefreshingInquiries ? 0.7 : 1,
                        }}
                        onMouseEnter={(e) => {
                          if (!isRefreshingInquiries) {
                            e.currentTarget.style.background = "#f0f9ff";
                            e.currentTarget.style.borderColor = "#0284c7";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isRefreshingInquiries) {
                            e.currentTarget.style.background = "#ffffff";
                            e.currentTarget.style.borderColor = "#d0dce6";
                          }
                        }}
                        disabled={isRefreshingInquiries}
                      >
                        {isRefreshingInquiries ? "Refreshing..." : "Refresh"}
                      </button>
                    </div>
                  </div>

                  {/* Incoming Inquiries */}
                  {activeInquiriesView === "incoming" && (
                    <div>
                      {incomingInquiries.length === 0 ? (
                        <div
                          style={{
                            background: "#f8fafc",
                            border: "2px dashed #cbd5e1",
                            borderRadius: "8px",
                            padding: "48px 32px",
                            textAlign: "center",
                          }}
                        >
                          <p
                            style={{
                              fontSize: "16px",
                              color: "#64748b",
                              margin: "0",
                            }}
                          >
                            No incoming inquiries yet. When other users send
                            inquiries to you, they will appear here.
                          </p>
                        </div>
                      ) : (
                        <div
                          style={{
                            overflowX: "auto",
                            borderRadius: "8px",
                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                          }}
                        >
                          <table
                            style={{
                              width: "100%",
                              borderCollapse: "collapse",
                              background: "#ffffff",
                            }}
                          >
                            <thead>
                              <tr
                                style={{
                                  background: "#f1f5f9",
                                  borderBottom: "2px solid #e2e8f0",
                                }}
                              >
                                <th
                                  style={{
                                    padding: "16px",
                                    textAlign: "left",
                                    fontWeight: "700",
                                    color: "#5b7c99",
                                    fontSize: "13px",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.3px",
                                  }}
                                >
                                  Inquiry #
                                </th>
                                <th
                                  style={{
                                    padding: "16px",
                                    textAlign: "left",
                                    fontWeight: "700",
                                    color: "#5b7c99",
                                    fontSize: "13px",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.3px",
                                  }}
                                >
                                  From
                                </th>
                                <th
                                  style={{
                                    padding: "16px",
                                    textAlign: "left",
                                    fontWeight: "700",
                                    color: "#5b7c99",
                                    fontSize: "13px",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.3px",
                                  }}
                                >
                                  Company
                                </th>
                                <th
                                  style={{
                                    padding: "16px",
                                    textAlign: "left",
                                    fontWeight: "700",
                                    color: "#5b7c99",
                                    fontSize: "13px",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.3px",
                                  }}
                                >
                                  Date
                                </th>
                                <th
                                  style={{
                                    padding: "16px",
                                    textAlign: "center",
                                    fontWeight: "700",
                                    color: "#5b7c99",
                                    fontSize: "13px",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.3px",
                                  }}
                                >
                                  Items
                                </th>
                                <th
                                  style={{
                                    padding: "16px",
                                    textAlign: "center",
                                    fontWeight: "700",
                                    color: "#5b7c99",
                                    fontSize: "13px",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.3px",
                                  }}
                                >
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {incomingInquiries.map((inquiry, index) => (
                                <tr
                                  key={inquiry.firestoreId}
                                  style={{
                                    borderBottom: "1px solid #e2e8f0",
                                    background:
                                      index % 2 === 0 ? "#ffffff" : "#f9fafb",
                                  }}
                                >
                                  <td
                                    style={{
                                      padding: "14px 16px",
                                      fontWeight: "600",
                                      color: "#1a365d",
                                    }}
                                  >
                                    {inquiry.number}
                                  </td>
                                  <td
                                    style={{
                                      padding: "14px 16px",
                                      color: "#475569",
                                    }}
                                  >
                                    {inquiry.senderEmail}
                                  </td>
                                  <td
                                    style={{
                                      padding: "14px 16px",
                                      color: "#64748b",
                                    }}
                                  >
                                    {inquiry.senderCompany || "N/A"}
                                  </td>
                                  <td
                                    style={{
                                      padding: "14px 16px",
                                      color: "#64748b",
                                      fontSize: "13px",
                                    }}
                                  >
                                    {new Date(
                                      inquiry.sentAt,
                                    ).toLocaleDateString()}
                                  </td>
                                  <td
                                    style={{
                                      padding: "14px 16px",
                                      textAlign: "center",
                                      color: "#1a365d",
                                      fontWeight: "600",
                                    }}
                                  >
                                    {inquiry.items?.length || 0}
                                  </td>
                                  <td
                                    style={{
                                      padding: "14px 16px",
                                      textAlign: "center",
                                    }}
                                  >
                                    <button
                                      onClick={() => {
                                        setSelectedInquiryForPreview(inquiry);
                                        setShowInquiryPreview(true);
                                      }}
                                      style={{
                                        padding: "6px 12px",
                                        background: "#0284c7",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "4px",
                                        cursor: "pointer",
                                        fontSize: "12px",
                                        fontWeight: "600",
                                        marginRight: "8px",
                                      }}
                                    >
                                      View
                                    </button>
                                    <button
                                      onClick={() => {
                                        // Create a quotation reply linked to this inquiry
                                        setActiveWarehouseTab("quotations");
                                        alert(
                                          "Quotation builder opened. Link this quotation to inquiry " +
                                            inquiry.number,
                                        );
                                      }}
                                      style={{
                                        padding: "6px 12px",
                                        background: "#16a34a",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "4px",
                                        cursor: "pointer",
                                        fontSize: "12px",
                                        fontWeight: "600",
                                      }}
                                    >
                                      Reply Quote
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Outgoing Inquiries */}
                  {activeInquiriesView === "outgoing" && (
                    <Inquiries
                      items={inquiries}
                      history={inquiryHistory}
                      letterhead={inquiryLetterhead}
                      vendors={acceptedVendorConnections}
                      preFillRecipient={preFillRecipient || undefined}
                      onGeneratePDF={async (inquiry, letterRef) => {
                        if (inquiry && letterRef) {
                          await generateInquiryPDFFromLetter(
                            inquiry,
                            letterRef,
                          );
                        } else {
                          alert("Please compose an inquiry first");
                        }
                      }}
                      onSaveInquiry={async (inquiry) => {
                        await saveInquiryToHistory(inquiry);
                      }}
                      onSendEmail={() => {
                        alert("Email feature coming soon!");
                      }}
                      onDeleteHistory={async (id) => {
                        if (id === "clear-current") {
                          setInquiries([]);
                        } else {
                          // Delete from state
                          setInquiryHistory(
                            inquiryHistory.filter((i) => i.id !== id),
                          );
                          // Delete from IndexedDB
                          await deleteInquiryFromIndexedDB(id);
                        }
                      }}
                      onResendToVendors={async (inquiry, vendors) => {
                        return await resendInquiryToVendors(inquiry, vendors);
                      }}
                      onNavigateToVendors={() => {
                        setActiveWarehouseTab("vendors");
                      }}
                      onRefreshVendors={async () => {
                        console.log(
                          "🔄 Refreshing vendors for resend modal...",
                        );
                        await loadAcceptedVendorConnections();
                      }}
                    />
                  )}
                </div>
              )}

              {activeWarehouseTab === "orders" && (
                <div>
                  <div style={{ marginBottom: "28px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "18px",
                      }}
                    >
                      <h2
                        style={{
                          margin: "0",
                          fontSize: "22px",
                          fontWeight: "800",
                          color: "#5b7c99",
                          letterSpacing: "-0.3px",
                          textTransform: "uppercase",
                        }}
                      >
                        {activeOrdersView === "incoming"
                          ? `Incoming Orders (${incomingOrders.length})`
                          : `Outgoing Orders (${outgoingOrders.length})`}
                      </h2>
                      {activeOrdersView === "outgoing" && (
                        <button
                          onClick={() => {
                            if (!hasLoadedOutgoingOrders) {
                              loadOutgoingOrders();
                            } else {
                              loadOutgoingOrders();
                            }
                          }}
                          style={{
                            padding: "10px 16px",
                            background: "#5b7c99",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "12px",
                            fontWeight: "600",
                            transition: "all 0.25s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#4a6fa5";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#5b7c99";
                          }}
                        >
                          🔄 Refresh Status
                        </button>
                      )}
                    </div>

                    {/* Orders View Selector - Side by Side Buttons */}
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                      }}
                    >
                      <button
                        onClick={() => {
                          setActiveOrdersView("incoming");
                          if (!hasLoadedIncomingOrders) {
                            loadIncomingOrders();
                          }
                        }}
                        style={{
                          padding: "10px 16px",
                          borderRadius: "6px",
                          border:
                            activeOrdersView === "incoming"
                              ? "2px solid #0284c7"
                              : "1px solid #d0dce6",
                          background:
                            activeOrdersView === "incoming"
                              ? "#0284c7"
                              : "#ffffff",
                          color:
                            activeOrdersView === "incoming"
                              ? "white"
                              : "#1a365d",
                          cursor: "pointer",
                          fontSize: "14px",
                          fontWeight: "600",
                          transition: "all 0.25s ease",
                          boxShadow:
                            activeOrdersView === "incoming"
                              ? "0 4px 8px rgba(2, 132, 199, 0.2)"
                              : "0 2px 4px rgba(0, 0, 0, 0.04)",
                        }}
                        onMouseEnter={(e) => {
                          if (activeOrdersView !== "incoming") {
                            e.currentTarget.style.background = "#f0f9ff";
                            e.currentTarget.style.borderColor = "#0284c7";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (activeOrdersView !== "incoming") {
                            e.currentTarget.style.background = "#ffffff";
                            e.currentTarget.style.borderColor = "#d0dce6";
                          }
                        }}
                      >
                        📥 Incoming Orders
                      </button>
                      <button
                        onClick={() => {
                          setActiveOrdersView("outgoing");
                          if (!hasLoadedOutgoingOrders) {
                            loadOutgoingOrders();
                          }
                        }}
                        style={{
                          padding: "10px 16px",
                          borderRadius: "6px",
                          border:
                            activeOrdersView === "outgoing"
                              ? "2px solid #0284c7"
                              : "1px solid #d0dce6",
                          background:
                            activeOrdersView === "outgoing"
                              ? "#0284c7"
                              : "#ffffff",
                          color:
                            activeOrdersView === "outgoing"
                              ? "white"
                              : "#1a365d",
                          cursor: "pointer",
                          fontSize: "14px",
                          fontWeight: "600",
                          transition: "all 0.25s ease",
                          boxShadow:
                            activeOrdersView === "outgoing"
                              ? "0 4px 8px rgba(2, 132, 199, 0.2)"
                              : "0 2px 4px rgba(0, 0, 0, 0.04)",
                        }}
                        onMouseEnter={(e) => {
                          if (activeOrdersView !== "outgoing") {
                            e.currentTarget.style.background = "#f0f9ff";
                            e.currentTarget.style.borderColor = "#0284c7";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (activeOrdersView !== "outgoing") {
                            e.currentTarget.style.background = "#ffffff";
                            e.currentTarget.style.borderColor = "#d0dce6";
                          }
                        }}
                      >
                        📤 Outgoing Orders
                      </button>
                    </div>
                  </div>

                  {/* Incoming Orders Table */}
                  {activeOrdersView === "incoming" && (
                    <>
                      {incomingOrders.length === 0 ? (
                        <div
                          style={{
                            background: "#f8fafc",
                            border: "2px dashed #cbd5e1",
                            borderRadius: "8px",
                            padding: "48px 32px",
                            textAlign: "center",
                          }}
                        >
                          <p
                            style={{
                              fontSize: "16px",
                              color: "#64748b",
                              margin: "0",
                            }}
                          >
                            No incoming orders yet. When buyers purchase your
                            items from the marketplace, they will appear here.
                          </p>
                        </div>
                      ) : (
                        <div
                          style={{
                            overflowX: "auto",
                            borderRadius: "8px",
                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                          }}
                        >
                          <table
                            style={{
                              width: "100%",
                              borderCollapse: "collapse",
                              background: "#ffffff",
                            }}
                          >
                            <thead>
                              <tr
                                style={{
                                  background: "#f1f5f9",
                                  borderBottom: "2px solid #e2e8f0",
                                }}
                              >
                                <th
                                  style={{
                                    padding: "16px",
                                    textAlign: "left",
                                    fontWeight: "700",
                                    color: "#5b7c99",
                                    fontSize: "13px",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.3px",
                                  }}
                                >
                                  Item Name
                                </th>
                                <th
                                  style={{
                                    padding: "16px",
                                    textAlign: "left",
                                    fontWeight: "700",
                                    color: "#5b7c99",
                                    fontSize: "13px",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.3px",
                                  }}
                                >
                                  Buyer
                                </th>
                                <th
                                  style={{
                                    padding: "16px",
                                    textAlign: "left",
                                    fontWeight: "700",
                                    color: "#5b7c99",
                                    fontSize: "13px",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.3px",
                                  }}
                                >
                                  Qty
                                </th>
                                <th
                                  style={{
                                    padding: "16px",
                                    textAlign: "left",
                                    fontWeight: "700",
                                    color: "#5b7c99",
                                    fontSize: "13px",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.3px",
                                  }}
                                >
                                  Total Price
                                </th>
                                <th
                                  style={{
                                    padding: "16px",
                                    textAlign: "left",
                                    fontWeight: "700",
                                    color: "#5b7c99",
                                    fontSize: "13px",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.3px",
                                  }}
                                >
                                  Status
                                </th>
                                <th
                                  style={{
                                    padding: "16px",
                                    textAlign: "center",
                                    fontWeight: "700",
                                    color: "#5b7c99",
                                    fontSize: "13px",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.3px",
                                  }}
                                >
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {incomingOrders.map((order, index) => (
                                <tr
                                  key={order.id}
                                  style={{
                                    borderBottom: "1px solid #e2e8f0",
                                    background:
                                      index % 2 === 0 ? "#ffffff" : "#f8fafc",
                                  }}
                                >
                                  <td
                                    style={{
                                      padding: "16px",
                                      color: "#1a365d",
                                      fontWeight: "600",
                                    }}
                                  >
                                    {getFirstItemName(order)}{" "}
                                    {getProductCount(order) > 1
                                      ? `(+${getProductCount(order) - 1} more)`
                                      : ""}
                                  </td>
                                  <td
                                    style={{
                                      padding: "16px",
                                      color: "#64748b",
                                    }}
                                  >
                                    {order.buyer}
                                  </td>
                                  <td
                                    style={{
                                      padding: "16px",
                                      color: "#64748b",
                                    }}
                                  >
                                    {getTotalItemCount(order)} units
                                  </td>
                                  <td
                                    style={{
                                      padding: "16px",
                                      color: "#1a365d",
                                      fontWeight: "600",
                                    }}
                                  >
                                    {order.currency || order.itemCurrency}{" "}
                                    {formatNumber(order.totalPrice)}
                                  </td>
                                  <td style={{ padding: "16px" }}>
                                    <span
                                      style={{
                                        padding: "6px 12px",
                                        borderRadius: "6px",
                                        fontSize: "12px",
                                        fontWeight: "700",
                                        textTransform: "uppercase",
                                        color:
                                          order.status === "pending"
                                            ? "#b45309"
                                            : order.status === "accepted"
                                              ? "#0369a1"
                                              : order.status === "shipped"
                                                ? "#7c3aed"
                                                : order.status === "delivered"
                                                  ? "#16a34a"
                                                  : "#dc2626",
                                        background:
                                          order.status === "pending"
                                            ? "#fef3c7"
                                            : order.status === "accepted"
                                              ? "#cffafe"
                                              : order.status === "shipped"
                                                ? "#ede9fe"
                                                : order.status === "delivered"
                                                  ? "#dcfce7"
                                                  : "#fee2e2",
                                      }}
                                    >
                                      {order.status}
                                    </span>
                                  </td>
                                  <td
                                    style={{
                                      padding: "16px",
                                      textAlign: "center",
                                    }}
                                  >
                                    <div
                                      style={{
                                        display: "flex",
                                        gap: "8px",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        flexWrap: "wrap",
                                      }}
                                    >
                                      <button
                                        onClick={() => {
                                          setSelectedOrderForPreview(order);
                                          setShowOrderPreview(true);
                                        }}
                                        style={{
                                          padding: "8px 12px",
                                          background: "#0284c7",
                                          color: "white",
                                          border: "none",
                                          borderRadius: "6px",
                                          cursor: "pointer",
                                          fontSize: "12px",
                                          fontWeight: "600",
                                          transition: "all 0.25s ease",
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.background =
                                            "#0369a1";
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.background =
                                            "#0284c7";
                                        }}
                                      >
                                        Preview
                                      </button>
                                      <select
                                        value={order.status}
                                        onChange={(e) =>
                                          updateOrderStatus(
                                            order.id,
                                            e.target.value as Order["status"],
                                          )
                                        }
                                        style={{
                                          padding: "8px 12px",
                                          borderRadius: "6px",
                                          border: "1px solid #cbd5e1",
                                          background: "#ffffff",
                                          color: "#1a365d",
                                          cursor: "pointer",
                                          fontSize: "12px",
                                          fontWeight: "600",
                                        }}
                                      >
                                        <option value="pending">Pending</option>
                                        <option value="accepted">
                                          Accepted
                                        </option>
                                        <option value="shipped">Shipped</option>
                                        <option value="delivered">
                                          Delivered
                                        </option>
                                        <option value="cancelled">
                                          Cancelled
                                        </option>
                                      </select>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </>
                  )}

                  {/* Outgoing Orders Table */}
                  {activeOrdersView === "outgoing" && (
                    <>
                      {outgoingOrders.length === 0 ? (
                        <div
                          style={{
                            background: "#f8fafc",
                            border: "2px dashed #cbd5e1",
                            borderRadius: "8px",
                            padding: "48px 32px",
                            textAlign: "center",
                          }}
                        >
                          <p
                            style={{
                              fontSize: "16px",
                              color: "#64748b",
                              margin: "0",
                            }}
                          >
                            You haven't placed any orders yet. Browse the
                            marketplace and place an order to see it here.
                          </p>
                        </div>
                      ) : (
                        <div
                          style={{
                            overflowX: "auto",
                            borderRadius: "8px",
                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                          }}
                        >
                          <table
                            style={{
                              width: "100%",
                              borderCollapse: "collapse",
                              background: "#ffffff",
                            }}
                          >
                            <thead>
                              <tr
                                style={{
                                  background: "#f1f5f9",
                                  borderBottom: "2px solid #e2e8f0",
                                }}
                              >
                                <th
                                  style={{
                                    padding: "16px",
                                    textAlign: "left",
                                    fontWeight: "700",
                                    color: "#5b7c99",
                                    fontSize: "13px",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.3px",
                                  }}
                                >
                                  Item Name
                                </th>
                                <th
                                  style={{
                                    padding: "16px",
                                    textAlign: "left",
                                    fontWeight: "700",
                                    color: "#5b7c99",
                                    fontSize: "13px",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.3px",
                                  }}
                                >
                                  Seller
                                </th>
                                <th
                                  style={{
                                    padding: "16px",
                                    textAlign: "left",
                                    fontWeight: "700",
                                    color: "#5b7c99",
                                    fontSize: "13px",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.3px",
                                  }}
                                >
                                  Qty
                                </th>
                                <th
                                  style={{
                                    padding: "16px",
                                    textAlign: "left",
                                    fontWeight: "700",
                                    color: "#5b7c99",
                                    fontSize: "13px",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.3px",
                                  }}
                                >
                                  Total Price
                                </th>
                                <th
                                  style={{
                                    padding: "16px",
                                    textAlign: "left",
                                    fontWeight: "700",
                                    color: "#5b7c99",
                                    fontSize: "13px",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.3px",
                                  }}
                                >
                                  Status
                                </th>
                                <th
                                  style={{
                                    padding: "16px",
                                    textAlign: "center",
                                    fontWeight: "700",
                                    color: "#5b7c99",
                                    fontSize: "13px",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.3px",
                                  }}
                                >
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {outgoingOrders.map((order, index) => (
                                <tr
                                  key={order.id}
                                  style={{
                                    borderBottom: "1px solid #e2e8f0",
                                    background:
                                      index % 2 === 0 ? "#ffffff" : "#f8fafc",
                                  }}
                                >
                                  <td
                                    style={{
                                      padding: "16px",
                                      color: "#1a365d",
                                      fontWeight: "600",
                                    }}
                                  >
                                    {getFirstItemName(order)}{" "}
                                    {getProductCount(order) > 1
                                      ? `(+${getProductCount(order) - 1} more)`
                                      : ""}
                                  </td>
                                  <td
                                    style={{
                                      padding: "16px",
                                      color: "#64748b",
                                    }}
                                  >
                                    {order.seller}
                                  </td>
                                  <td
                                    style={{
                                      padding: "16px",
                                      color: "#64748b",
                                    }}
                                  >
                                    {getTotalItemCount(order)} units
                                  </td>
                                  <td
                                    style={{
                                      padding: "16px",
                                      color: "#1a365d",
                                      fontWeight: "600",
                                    }}
                                  >
                                    {order.currency || order.itemCurrency}{" "}
                                    {formatNumber(order.totalPrice)}
                                  </td>
                                  <td style={{ padding: "16px" }}>
                                    <span
                                      style={{
                                        padding: "6px 12px",
                                        borderRadius: "6px",
                                        fontSize: "12px",
                                        fontWeight: "700",
                                        textTransform: "uppercase",
                                        color:
                                          order.status === "pending"
                                            ? "#b45309"
                                            : order.status === "accepted"
                                              ? "#0369a1"
                                              : order.status === "shipped"
                                                ? "#7c3aed"
                                                : order.status === "delivered"
                                                  ? "#16a34a"
                                                  : "#dc2626",
                                        background:
                                          order.status === "pending"
                                            ? "#fef3c7"
                                            : order.status === "accepted"
                                              ? "#cffafe"
                                              : order.status === "shipped"
                                                ? "#ede9fe"
                                                : order.status === "delivered"
                                                  ? "#dcfce7"
                                                  : "#fee2e2",
                                      }}
                                    >
                                      {order.status}
                                    </span>
                                  </td>
                                  <td
                                    style={{
                                      padding: "16px",
                                      textAlign: "center",
                                    }}
                                  >
                                    <div
                                      style={{
                                        display: "flex",
                                        gap: "8px",
                                        justifyContent: "center",
                                      }}
                                    >
                                      <button
                                        onClick={() => {
                                          setSelectedOrderForPreview(order);
                                          setShowOrderPreview(true);
                                        }}
                                        style={{
                                          padding: "8px 12px",
                                          background: "#0284c7",
                                          color: "white",
                                          border: "none",
                                          borderRadius: "6px",
                                          cursor: "pointer",
                                          fontSize: "12px",
                                          fontWeight: "600",
                                          transition: "all 0.25s ease",
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.background =
                                            "#0369a1";
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.background =
                                            "#0284c7";
                                        }}
                                      >
                                        Preview
                                      </button>
                                      <button
                                        onClick={() => {
                                          setRetractingOrderId(order.id);
                                          setShowRetractConfirm(true);
                                        }}
                                        style={{
                                          padding: "8px 12px",
                                          background: "#dc2626",
                                          color: "white",
                                          border: "none",
                                          borderRadius: "6px",
                                          cursor: "pointer",
                                          fontSize: "12px",
                                          fontWeight: "600",
                                          transition: "all 0.25s ease",
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.background =
                                            "#b91c1c";
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.background =
                                            "#dc2626";
                                        }}
                                      >
                                        Retract
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {activeWarehouseTab === "invoices" && (
                <div>
                  <div style={{ marginBottom: "28px" }}>
                    <h2
                      style={{
                        margin: "0 0 20px 0",
                        fontSize: "24px",
                        fontWeight: "800",
                        color: "#5b7c99",
                        letterSpacing: "-0.5px",
                        textTransform: "uppercase",
                      }}
                    >
                      Invoices
                    </h2>

                    <div
                      style={{
                        display: "flex",
                        gap: "12px",
                        borderBottom: "2px solid #e2e8f0",
                        marginBottom: "28px",
                      }}
                    >
                      <button
                        onClick={() => setActiveInvoicesView("incoming")}
                        style={{
                          padding: "12px 18px",
                          background: "transparent",
                          border: "none",
                          borderBottom:
                            activeInvoicesView === "incoming"
                              ? "3px solid #5b7c99"
                              : "transparent",
                          color:
                            activeInvoicesView === "incoming"
                              ? "#5b7c99"
                              : "#64748b",
                          fontWeight:
                            activeInvoicesView === "incoming" ? "700" : "600",
                          fontSize: "13px",
                          cursor: "pointer",
                          transition: "all 0.25s ease",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                          marginBottom: "-2px",
                        }}
                      >
                        Incoming Invoices (0)
                      </button>
                      <button
                        onClick={() => setActiveInvoicesView("outgoing")}
                        style={{
                          padding: "12px 18px",
                          background: "transparent",
                          border: "none",
                          borderBottom:
                            activeInvoicesView === "outgoing"
                              ? "3px solid #5b7c99"
                              : "transparent",
                          color:
                            activeInvoicesView === "outgoing"
                              ? "#5b7c99"
                              : "#64748b",
                          fontWeight:
                            activeInvoicesView === "outgoing" ? "700" : "600",
                          fontSize: "13px",
                          cursor: "pointer",
                          transition: "all 0.25s ease",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                          marginBottom: "-2px",
                        }}
                      >
                        Outgoing Invoices (0)
                      </button>
                    </div>
                  </div>

                  {activeInvoicesView === "incoming" && (
                    <div
                      style={{
                        padding: "32px",
                        textAlign: "center",
                        background: "#f8fafc",
                        borderRadius: "8px",
                        border: "2px dashed #cbd5e1",
                      }}
                    >
                      <p
                        style={{
                          margin: "0",
                          fontSize: "16px",
                          color: "#64748b",
                        }}
                      >
                        No incoming invoices yet
                      </p>
                    </div>
                  )}

                  {activeInvoicesView === "outgoing" && (
                    <div
                      style={{
                        padding: "32px",
                        textAlign: "center",
                        background: "#f8fafc",
                        borderRadius: "8px",
                        border: "2px dashed #cbd5e1",
                      }}
                    >
                      <p
                        style={{
                          margin: "0",
                          fontSize: "16px",
                          color: "#64748b",
                        }}
                      >
                        No outgoing invoices yet
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeWarehouseTab === "vendors" && (
                <Vendors
                  db={db}
                  currentUser={currentUser}
                  onSendInquiry={(company) => {
                    // Pre-fill recipient data and navigate to inquiries (outgoing)
                    setPreFillRecipient({
                      name: company.username,
                      email: company.email,
                      company: company.name,
                    });
                    setActiveWarehouseTab("inquiries");
                    setActiveInquiriesView("outgoing");
                  }}
                  onSendQuotation={(company) => {
                    // Pre-fill recipient data and navigate to quotations
                    setPreFillRecipient({
                      name: company.username,
                      email: company.email,
                      company: company.name,
                    });
                    setActiveWarehouseTab("quotations");
                  }}
                  onSendOrder={(company) => {
                    // Pre-fill recipient data and navigate to orders
                    setPreFillRecipient({
                      name: company.username,
                      email: company.email,
                      company: company.name,
                    });
                    setActiveWarehouseTab("orders");
                  }}
                  onSendInvoice={(company) => {
                    // Pre-fill recipient data and navigate to invoices
                    setPreFillRecipient({
                      name: company.username,
                      email: company.email,
                      company: company.name,
                    });
                    setActiveWarehouseTab("invoices");
                    setActiveInvoicesView("outgoing");
                  }}
                  currentUserEmail={currentUser}
                  currentUserCompany={currentUserCompany}
                />
              )}

              {activeWarehouseTab === "settings" && (
                <Settings
                  quotationTemplate={quotationTemplate}
                  inquiryTemplate={inquiryTemplate}
                  inquiryLetterhead={inquiryLetterhead}
                  onSaveTemplate={saveTemplate}
                  onLoadTemplate={loadTemplate}
                  onSaveLetterhead={(letterhead) => {
                    setInquiryLetterhead(letterhead);
                    if (db) {
                      setDoc(
                        doc(db, "userSettings", `${currentUser}_letterhead`),
                        letterhead,
                      ).catch((err) =>
                        console.error("Error saving letterhead:", err),
                      );
                    } else {
                      localStorage.setItem(
                        `pspm_letterhead_${currentUser}`,
                        JSON.stringify(letterhead),
                      );
                    }
                  }}
                  onDeleteLetterhead={() => deleteLetterhead(currentUser)}
                />
              )}

              {false && (
                <div>
                  <h2
                    style={{
                      margin: "0 0 28px 0",
                      fontSize: "24px",
                      fontWeight: "800",
                      color: "#5b7c99",
                      letterSpacing: "-0.5px",
                      textTransform: "uppercase",
                    }}
                  >
                    Upload Portal
                  </h2>

                  {uploadMessage && (
                    <div
                      style={{
                        marginBottom: "24px",
                        padding: "14px 18px",
                        background:
                          uploadMessage.type === "success"
                            ? "#dcfce7"
                            : "#fee2e2",
                        border: `2px solid ${uploadMessage.type === "success" ? "#86efac" : "#fca5a5"}`,
                        borderRadius: "8px",
                        color:
                          uploadMessage.type === "success"
                            ? "#15803d"
                            : "#dc2626",
                        fontSize: "13px",
                        fontWeight: "600",
                        boxShadow: `0 2px 8px ${uploadMessage.type === "success" ? "rgba(22, 163, 74, 0.1)" : "rgba(220, 38, 38, 0.1)"}`,
                      }}
                    >
                      {uploadMessage.text}
                    </div>
                  )}

                  {/* Upload Type Selector - Premium Buttons */}
                  <div
                    style={{
                      marginBottom: "28px",
                      display: "flex",
                      gap: "12px",
                      background:
                        "linear-gradient(135deg, #f8fafc 0%, #f0f7fa 100%)",
                      padding: "8px",
                      borderRadius: "10px",
                      border: "1px solid #d0dce6",
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.03)",
                    }}
                  >
                    <button
                      onClick={() => setUploadType("single")}
                      style={{
                        flex: 1,
                        padding: "13px 18px",
                        background:
                          uploadType === "single"
                            ? "linear-gradient(135deg, #5b7c99 0%, #4a6fa5 100%)"
                            : "transparent",
                        color: uploadType === "single" ? "#ffffff" : "#64748b",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "13px",
                        fontWeight: uploadType === "single" ? "700" : "600",
                        transition: "all 0.25s ease",
                        boxShadow:
                          uploadType === "single"
                            ? "0 4px 12px rgba(2, 132, 199, 0.25)"
                            : "none",
                        textTransform: "uppercase",
                        letterSpacing: "0.3px",
                      }}
                      onMouseEnter={(e) => {
                        if (uploadType !== "single") {
                          e.currentTarget.style.background =
                            "rgba(2, 132, 199, 0.08)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (uploadType !== "single") {
                          e.currentTarget.style.background = "transparent";
                        }
                      }}
                    >
                      Single Product
                    </button>
                    <button
                      onClick={() => setUploadType("bulk")}
                      style={{
                        flex: 1,
                        padding: "13px 18px",
                        background:
                          uploadType === "bulk"
                            ? "linear-gradient(135deg, #5b7c99 0%, #4a6fa5 100%)"
                            : "transparent",
                        color: uploadType === "bulk" ? "#ffffff" : "#64748b",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "13px",
                        fontWeight: uploadType === "bulk" ? "700" : "600",
                        transition: "all 0.25s ease",
                        boxShadow:
                          uploadType === "bulk"
                            ? "0 4px 12px rgba(2, 132, 199, 0.25)"
                            : "none",
                        textTransform: "uppercase",
                        letterSpacing: "0.3px",
                      }}
                      onMouseEnter={(e) => {
                        if (uploadType !== "bulk") {
                          e.currentTarget.style.background =
                            "rgba(2, 132, 199, 0.08)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (uploadType !== "bulk") {
                          e.currentTarget.style.background = "transparent";
                        }
                      }}
                    >
                      Bulk Upload
                    </button>
                  </div>

                  {/* Single Product Upload */}
                  {uploadType === "single" && (
                    <div
                      style={{
                        background: "#ffffff",
                        border: "1px solid #d0dce6",
                        borderRadius: "12px",
                        padding: "32px",
                        marginBottom: "28px",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.06)",
                      }}
                    >
                      <h3
                        style={{
                          margin: "0 0 24px 0",
                          fontSize: "18px",
                          fontWeight: "800",
                          color: "#5b7c99",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                        }}
                      >
                        Add Single Product
                      </h3>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr 1fr",
                          gap: "20px",
                          marginBottom: "20px",
                        }}
                      >
                        <div>
                          <label
                            style={{
                              display: "block",
                              marginBottom: "8px",
                              fontSize: "11px",
                              fontWeight: "800",
                              color: "#475569",
                              textTransform: "uppercase",
                              letterSpacing: "0.4px",
                            }}
                          >
                            Product Name *
                          </label>
                          <input
                            type="text"
                            value={singleProduct.name}
                            onChange={(e) =>
                              setSingleProduct({
                                ...singleProduct,
                                name: e.target.value,
                              })
                            }
                            placeholder="e.g., PD/DD Filter Kit"
                            style={{
                              width: "100%",
                              padding: "11px 14px",
                              border: "1px solid #d0dce6",
                              borderRadius: "7px",
                              fontSize: "13px",
                              boxSizing: "border-box",
                              background: "#ffffff",
                              transition: "all 0.25s ease",
                              fontWeight: "500",
                            }}
                            onFocus={(e) => {
                              e.currentTarget.style.borderColor = "#5b7c99";
                              e.currentTarget.style.boxShadow =
                                "0 0 0 4px rgba(2, 132, 199, 0.1), inset 0 0 0 1px rgba(2, 132, 199, 0.1)";
                            }}
                            onBlur={(e) => {
                              e.currentTarget.style.borderColor = "#d0dce6";
                              e.currentTarget.style.boxShadow = "none";
                            }}
                          />
                        </div>
                        <div>
                          <label
                            style={{
                              display: "block",
                              marginBottom: "8px",
                              fontSize: "11px",
                              fontWeight: "800",
                              color: "#475569",
                              textTransform: "uppercase",
                              letterSpacing: "0.4px",
                            }}
                          >
                            Part Number *
                          </label>
                          <input
                            type="text"
                            value={singleProduct.partNumber}
                            onChange={(e) =>
                              setSingleProduct({
                                ...singleProduct,
                                partNumber: e.target.value,
                              })
                            }
                            placeholder="e.g., 0000000338"
                            style={{
                              width: "100%",
                              padding: "11px 14px",
                              border: "1px solid #d0dce6",
                              borderRadius: "7px",
                              fontSize: "13px",
                              boxSizing: "border-box",
                              background: "#ffffff",
                              transition: "all 0.25s ease",
                              fontWeight: "500",
                            }}
                            onFocus={(e) => {
                              e.currentTarget.style.borderColor = "#5b7c99";
                              e.currentTarget.style.boxShadow =
                                "0 0 0 4px rgba(2, 132, 199, 0.1), inset 0 0 0 1px rgba(2, 132, 199, 0.1)";
                            }}
                            onBlur={(e) => {
                              e.currentTarget.style.borderColor = "#d0dce6";
                              e.currentTarget.style.boxShadow = "none";
                            }}
                          />
                        </div>
                        <div>
                          <label
                            style={{
                              display: "block",
                              marginBottom: "8px",
                              fontSize: "11px",
                              fontWeight: "800",
                              color: "#475569",
                              textTransform: "uppercase",
                              letterSpacing: "0.4px",
                            }}
                          >
                            Price
                          </label>
                          <input
                            type="number"
                            value={singleProduct.price}
                            onChange={(e) =>
                              setSingleProduct({
                                ...singleProduct,
                                price: e.target.value,
                              })
                            }
                            placeholder="0.00"
                            step="0.01"
                            style={{
                              width: "100%",
                              padding: "11px 14px",
                              border: "1px solid #d0dce6",
                              borderRadius: "7px",
                              fontSize: "13px",
                              boxSizing: "border-box",
                              background: "#ffffff",
                              transition: "all 0.25s ease",
                              fontWeight: "500",
                            }}
                            onFocus={(e) => {
                              e.currentTarget.style.borderColor = "#5b7c99";
                              e.currentTarget.style.boxShadow =
                                "0 0 0 4px rgba(2, 132, 199, 0.1), inset 0 0 0 1px rgba(2, 132, 199, 0.1)";
                            }}
                            onBlur={(e) => {
                              e.currentTarget.style.borderColor = "#d0dce6";
                              e.currentTarget.style.boxShadow = "none";
                            }}
                          />
                        </div>
                        <div>
                          <label
                            style={{
                              display: "block",
                              marginBottom: "8px",
                              fontSize: "11px",
                              fontWeight: "800",
                              color: "#475569",
                              textTransform: "uppercase",
                              letterSpacing: "0.4px",
                            }}
                          >
                            Currency
                          </label>
                          <select
                            value={selectedCurrency}
                            onChange={(e) =>
                              setSelectedCurrency(e.target.value)
                            }
                            style={{
                              width: "100%",
                              padding: "11px 14px",
                              border: "1px solid #d0dce6",
                              borderRadius: "7px",
                              fontSize: "13px",
                              boxSizing: "border-box",
                              transition: "all 0.25s ease",
                              fontWeight: "500",
                              color: "#1a365d",
                              background: "#ffffff",
                              cursor: "pointer",
                            }}
                            onFocus={(e) => {
                              e.currentTarget.style.borderColor = "#5b7c99";
                              e.currentTarget.style.boxShadow =
                                "0 0 0 4px rgba(2, 132, 199, 0.1), inset 0 0 0 1px rgba(2, 132, 199, 0.1)";
                            }}
                            onBlur={(e) => {
                              e.currentTarget.style.borderColor = "#d0dce6";
                              e.currentTarget.style.boxShadow = "none";
                            }}
                          >
                            {CURRENCY_OPTIONS.map((curr) => (
                              <option key={curr.code} value={curr.code}>
                                {curr.code} - {curr.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label
                            style={{
                              display: "block",
                              marginBottom: "8px",
                              fontSize: "11px",
                              fontWeight: "800",
                              color: "#475569",
                              textTransform: "uppercase",
                              letterSpacing: "0.4px",
                            }}
                          >
                            Quantity
                          </label>
                          <input
                            type="number"
                            value={singleProduct.qty}
                            onChange={(e) =>
                              setSingleProduct({
                                ...singleProduct,
                                qty: e.target.value,
                              })
                            }
                            placeholder="0"
                            style={{
                              width: "100%",
                              padding: "11px 14px",
                              border: "1px solid #d0dce6",
                              borderRadius: "7px",
                              fontSize: "13px",
                              boxSizing: "border-box",
                              transition: "all 0.25s ease",
                              fontWeight: "500",
                            }}
                            onFocus={(e) => {
                              e.currentTarget.style.borderColor = "#5b7c99";
                              e.currentTarget.style.boxShadow =
                                "0 0 0 4px rgba(2, 132, 199, 0.1), inset 0 0 0 1px rgba(2, 132, 199, 0.1)";
                            }}
                            onBlur={(e) => {
                              e.currentTarget.style.borderColor = "#d0dce6";
                              e.currentTarget.style.boxShadow = "none";
                            }}
                          />
                        </div>
                        <div>
                          <label
                            style={{
                              display: "block",
                              marginBottom: "8px",
                              fontSize: "11px",
                              fontWeight: "800",
                              color: "#475569",
                              textTransform: "uppercase",
                              letterSpacing: "0.4px",
                            }}
                          >
                            Stock Status
                          </label>
                          <select
                            value={singleProduct.stock}
                            onChange={(e) =>
                              setSingleProduct({
                                ...singleProduct,
                                stock: e.target.value,
                              })
                            }
                            style={{
                              width: "100%",
                              padding: "11px 14px",
                              border: "1px solid #d0dce6",
                              borderRadius: "7px",
                              fontSize: "13px",
                              boxSizing: "border-box",
                              transition: "all 0.25s ease",
                              fontWeight: "500",
                              color: "#1a365d",
                              background: "#ffffff",
                              cursor: "pointer",
                            }}
                            onFocus={(e) => {
                              e.currentTarget.style.borderColor = "#5b7c99";
                              e.currentTarget.style.boxShadow =
                                "0 0 0 4px rgba(2, 132, 199, 0.1), inset 0 0 0 1px rgba(2, 132, 199, 0.1)";
                            }}
                            onBlur={(e) => {
                              e.currentTarget.style.borderColor = "#d0dce6";
                              e.currentTarget.style.boxShadow = "none";
                            }}
                          >
                            <option>In Stock</option>
                            <option>Out of Stock</option>
                            <option>Low Stock</option>
                          </select>
                        </div>
                      </div>

                      {/* Image Upload */}
                      <div style={{ marginBottom: "24px" }}>
                        <label
                          style={{
                            display: "block",
                            marginBottom: "12px",
                            fontSize: "11px",
                            fontWeight: "800",
                            color: "#475569",
                            textTransform: "uppercase",
                            letterSpacing: "0.4px",
                          }}
                        >
                          Product Image
                        </label>
                        <div
                          style={{
                            display: "flex",
                            gap: "14px",
                            alignItems: "flex-start",
                          }}
                        >
                          <label
                            style={{
                              cursor: "pointer",
                              display: "inline-block",
                            }}
                          >
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (event) => {
                                    setSingleProductImage(
                                      event.target?.result as string,
                                    );
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              style={{ display: "none" }}
                            />
                            <div
                              style={{
                                width: "90px",
                                height: "90px",
                                background: singleProductImage
                                  ? "#f1f5f9"
                                  : "#f0f7fa",
                                borderRadius: "8px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#5b7c99",
                                fontSize: "28px",
                                border: "2px dashed #d0dce6",
                                cursor: "pointer",
                                overflow: "hidden",
                                transition: "all 0.2s ease",
                                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.03)",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = "#5b7c99";
                                e.currentTarget.style.boxShadow =
                                  "0 4px 8px rgba(2, 132, 199, 0.12)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = "#d0dce6";
                                e.currentTarget.style.boxShadow =
                                  "0 2px 4px rgba(0, 0, 0, 0.03)";
                              }}
                            >
                              {singleProductImage ? (
                                <img
                                  src={singleProductImage}
                                  alt="preview"
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                  }}
                                />
                              ) : (
                                <span style={{ fontSize: "36px" }}></span>
                              )}
                            </div>
                          </label>
                          <div style={{ flex: 1 }}>
                            <p
                              style={{
                                margin: "0 0 10px 0",
                                fontSize: "13px",
                                color: "#64748b",
                                lineHeight: "1.5",
                                fontWeight: "500",
                              }}
                            >
                              Click the image box to upload a product image
                            </p>
                            {singleProductImage && (
                              <button
                                onClick={() => setSingleProductImage("")}
                                style={{
                                  padding: "7px 14px",
                                  background: "#fee2e2",
                                  color: "#dc2626",
                                  border: "1px solid #fca5a5",
                                  borderRadius: "6px",
                                  cursor: "pointer",
                                  fontSize: "12px",
                                  fontWeight: "600",
                                  transition: "all 0.2s ease",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.2px",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = "#fecaca";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = "#fee2e2";
                                }}
                              >
                                Remove Image
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={handleSingleProductUpload}
                        style={{
                          background:
                            "linear-gradient(135deg, #5b7c99 0%, #4a6fa5 100%)",
                          color: "#ffffff",
                          border: "none",
                          padding: "12px 24px",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontSize: "13px",
                          fontWeight: "700",
                          transition: "all 0.25s ease",
                          boxShadow: "0 4px 12px rgba(2, 132, 199, 0.2)",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow =
                            "0 6px 16px rgba(2, 132, 199, 0.28)";
                          e.currentTarget.style.transform = "translateY(-2px)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow =
                            "0 4px 12px rgba(2, 132, 199, 0.2)";
                          e.currentTarget.style.transform = "translateY(0px)";
                        }}
                      >
                        Add Product
                      </button>
                    </div>
                  )}

                  {/* Bulk Upload */}
                  {uploadType === "bulk" && (
                    <div
                      style={{
                        background: "#ffffff",
                        border: "1px solid #d0dce6",
                        borderRadius: "12px",
                        padding: "32px",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.06)",
                      }}
                    >
                      <h3
                        style={{
                          margin: "0 0 24px 0",
                          fontSize: "18px",
                          fontWeight: "800",
                          color: "#5b7c99",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                        }}
                      >
                        Bulk Upload
                      </h3>

                      <div style={{ marginBottom: "24px" }}>
                        <label
                          style={{
                            display: "block",
                            marginBottom: "12px",
                            fontSize: "11px",
                            fontWeight: "800",
                            color: "#475569",
                            textTransform: "uppercase",
                            letterSpacing: "0.4px",
                          }}
                        >
                          Select File (PDF or Excel)
                        </label>
                        <div
                          style={{
                            position: "relative",
                            display: "inline-block",
                            width: "100%",
                          }}
                        >
                          <input
                            type="file"
                            accept=".pdf,.xls,.xlsx"
                            onChange={handleBulkFileUpload}
                            style={{
                              position: "absolute",
                              opacity: "0",
                              width: "100%",
                              height: "100%",
                              cursor: "pointer",
                            }}
                          />
                          <div
                            style={{
                              padding: "32px",
                              border: "2px dashed #d0dce6",
                              borderRadius: "10px",
                              textAlign: "center",
                              background: "#f8fafc",
                              cursor: "pointer",
                              transition: "all 0.25s ease",
                              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.02)",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "#f0f7fa";
                              e.currentTarget.style.borderColor = "#5b7c99";
                              e.currentTarget.style.boxShadow =
                                "0 4px 8px rgba(2, 132, 199, 0.12)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "#f8fafc";
                              e.currentTarget.style.borderColor = "#d0dce6";
                              e.currentTarget.style.boxShadow =
                                "0 2px 4px rgba(0, 0, 0, 0.02)";
                            }}
                          >
                            <p
                              style={{
                                color: "#5b7c99",
                                margin: "0 0 8px 0",
                                fontSize: "16px",
                                fontWeight: "700",
                              }}
                            >
                              {uploadFile
                                ? `${uploadFile.name}`
                                : "Click to select file"}
                            </p>
                            <p
                              style={{
                                color: "#64748b",
                                margin: "4px 0 0 0",
                                fontSize: "13px",
                                fontWeight: "500",
                              }}
                            >
                              or drag your file here
                            </p>
                            <p
                              style={{
                                color: "#94a3b8",
                                margin: "6px 0 0 0",
                                fontSize: "12px",
                                letterSpacing: "0.2px",
                                textTransform: "uppercase",
                              }}
                            >
                              Supported: PDF, XLS, XLSX
                            </p>
                          </div>
                        </div>
                      </div>

                      {uploadProgress && (
                        <div
                          style={{
                            marginBottom: "24px",
                            padding: "18px",
                            background:
                              "linear-gradient(135deg, #f3f6f9 0%, #e0f2fe 100%)",
                            border: "1px solid #bae6fd",
                            borderRadius: "10px",
                            boxShadow: "0 2px 8px rgba(2, 132, 199, 0.1)",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              marginBottom: "10px",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "12px",
                                fontWeight: "700",
                                color: "#5b7c99",
                                textTransform: "uppercase",
                                letterSpacing: "0.2px",
                              }}
                            >
                              {uploadProgress.status}
                            </span>
                            <span
                              style={{
                                fontSize: "12px",
                                color: "#5b7c99",
                                fontWeight: "600",
                              }}
                            >
                              {uploadProgress.current} / {uploadProgress.total}
                            </span>
                          </div>
                          <div
                            style={{
                              width: "100%",
                              height: "10px",
                              background: "#bae6fd",
                              borderRadius: "6px",
                              overflow: "hidden",
                              boxShadow: "inset 0 1px 2px rgba(0, 0, 0, 0.05)",
                            }}
                          >
                            <div
                              style={{
                                width: `${(uploadProgress.current / uploadProgress.total) * 100}%`,
                                height: "100%",
                                background:
                                  "linear-gradient(90deg, #5b7c99 0%, #4a6fa5 100%)",
                                transition: "width 0.3s ease",
                                boxShadow: "0 0 8px rgba(2, 132, 199, 0.3)",
                              }}
                            />
                          </div>
                          <p
                            style={{
                              margin: "10px 0 0 0",
                              fontSize: "12px",
                              color: "#64748b",
                              fontWeight: "500",
                            }}
                          >
                            Processing... Do not close this page or refresh
                            browser
                          </p>
                        </div>
                      )}

                      <button
                        onClick={handleProcessBulkUpload}
                        disabled={!uploadFile || uploadProgress !== null}
                        style={{
                          background:
                            uploadFile && !uploadProgress
                              ? "linear-gradient(135deg, #5b7c99 0%, #4a6fa5 100%)"
                              : "#cbd5e1",
                          color: "#ffffff",
                          border: "none",
                          padding: "13px 28px",
                          borderRadius: "8px",
                          cursor:
                            uploadFile && !uploadProgress
                              ? "pointer"
                              : "not-allowed",
                          fontSize: "13px",
                          fontWeight: "700",
                          transition: "all 0.25s ease",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                          boxShadow:
                            uploadFile && !uploadProgress
                              ? "0 4px 12px rgba(2, 132, 199, 0.2)"
                              : "none",
                        }}
                        onMouseEnter={(e) => {
                          if (uploadFile && !uploadProgress) {
                            e.currentTarget.style.boxShadow =
                              "0 6px 16px rgba(2, 132, 199, 0.28)";
                            e.currentTarget.style.transform =
                              "translateY(-2px)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (uploadFile && !uploadProgress) {
                            e.currentTarget.style.boxShadow =
                              "0 4px 12px rgba(2, 132, 199, 0.2)";
                            e.currentTarget.style.transform = "translateY(0px)";
                          }
                        }}
                      >
                        {uploadProgress ? "Processing..." : "Process Upload"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : activeSubmenu === "allDocuments" ? (
            <div>
              <h2
                style={{
                  margin: "0 0 28px 0",
                  fontSize: "24px",
                  fontWeight: "800",
                  color: "#5b7c99",
                  letterSpacing: "-0.5px",
                  textTransform: "uppercase",
                }}
              >
                All Documents
              </h2>
              <div
                style={{
                  padding: "32px",
                  background: "#f8fafc",
                  borderRadius: "12px",
                  border: "1px solid #d0dce6",
                  textAlign: "center",
                  color: "#64748b",
                }}
              >
                <p style={{ margin: "0", fontSize: "14px", fontWeight: "500" }}>
                  No documents yet. Content coming soon.
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Retract Order Confirmation Dialog */}
        {showRetractConfirm && retractingOrderId && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1001,
            }}
            onClick={() => {
              setShowRetractConfirm(false);
              setRetractingOrderId(null);
            }}
          >
            <div
              style={{
                background: "#ffffff",
                borderRadius: "12px",
                padding: "32px",
                maxWidth: "400px",
                width: "90%",
                boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2
                style={{
                  margin: "0 0 16px 0",
                  fontSize: "18px",
                  fontWeight: "800",
                  color: "#1a365d",
                }}
              >
                Are you sure?
              </h2>

              <p
                style={{
                  margin: "0 0 24px 0",
                  fontSize: "14px",
                  color: "#64748b",
                  lineHeight: "1.6",
                }}
              >
                This will permanently retract your order. The seller will not
                receive this order. This action cannot be undone.
              </p>

              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={() => {
                    setShowRetractConfirm(false);
                    setRetractingOrderId(null);
                  }}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "#e2e8f0",
                    color: "#1a365d",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "14px",
                    transition: "all 0.25s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#cbd5e1";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#e2e8f0";
                  }}
                >
                  Keep Order
                </button>
                <button
                  onClick={() => {
                    if (retractingOrderId) {
                      retractOrder(retractingOrderId);
                    } else {
                      console.error(
                        "Retract button clicked but retractingOrderId is null",
                      );
                      setUploadMessage({
                        type: "error",
                        text: "Error: Order ID not found",
                      });
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "#dc2626",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "14px",
                    transition: "all 0.25s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#b91c1c";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#dc2626";
                  }}
                >
                  Retract Order
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Retract Quotation Confirmation Dialog */}
        {showRetractQuotationConfirm && retractingQuotationId && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1001,
            }}
            onClick={() => {
              setShowRetractQuotationConfirm(false);
              setRetractingQuotationId(null);
            }}
          >
            <div
              style={{
                background: "#ffffff",
                borderRadius: "12px",
                padding: "32px",
                maxWidth: "400px",
                width: "90%",
                boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2
                style={{
                  margin: "0 0 16px 0",
                  fontSize: "18px",
                  fontWeight: "800",
                  color: "#1a365d",
                }}
              >
                Are you sure?
              </h2>

              <p
                style={{
                  margin: "0 0 24px 0",
                  fontSize: "14px",
                  color: "#64748b",
                  lineHeight: "1.6",
                }}
              >
                This will permanently delete your quotation. This action cannot
                be undone.
              </p>

              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={() => {
                    setShowRetractQuotationConfirm(false);
                    setRetractingQuotationId(null);
                  }}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "#e2e8f0",
                    color: "#1a365d",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "14px",
                    transition: "all 0.25s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#cbd5e1";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#e2e8f0";
                  }}
                >
                  Keep Quotation
                </button>
                <button
                  onClick={() => {
                    if (retractingQuotationId) {
                      retractQuotation(retractingQuotationId);
                    } else {
                      console.error(
                        "Retract button clicked but retractingQuotationId is null",
                      );
                      setUploadMessage({
                        type: "error",
                        text: "Error: Quotation ID not found",
                      });
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "#dc2626",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "14px",
                    transition: "all 0.25s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#b91c1c";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#dc2626";
                  }}
                >
                  Delete Quotation
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Retract Inquiry Confirmation Dialog */}
        {showRetractInquiryConfirm && retractingInquiryId && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1001,
            }}
            onClick={() => {
              setShowRetractInquiryConfirm(false);
              setRetractingInquiryId(null);
            }}
          >
            <div
              style={{
                background: "#ffffff",
                borderRadius: "12px",
                padding: "32px",
                maxWidth: "400px",
                width: "90%",
                boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2
                style={{
                  margin: "0 0 16px 0",
                  fontSize: "18px",
                  fontWeight: "800",
                  color: "#1a365d",
                }}
              >
                Are you sure?
              </h2>

              <p
                style={{
                  margin: "0 0 24px 0",
                  fontSize: "14px",
                  color: "#64748b",
                  lineHeight: "1.6",
                }}
              >
                This will permanently delete your inquiry. This action cannot be
                undone.
              </p>

              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={() => {
                    setShowRetractInquiryConfirm(false);
                    setRetractingInquiryId(null);
                  }}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "#e2e8f0",
                    color: "#1a365d",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "14px",
                    transition: "all 0.25s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#cbd5e1";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#e2e8f0";
                  }}
                >
                  Keep Inquiry
                </button>
                <button
                  onClick={() => {
                    if (retractingInquiryId) {
                      retractInquiry(retractingInquiryId);
                    } else {
                      console.error(
                        "Retract button clicked but retractingInquiryId is null",
                      );
                      setUploadMessage({
                        type: "error",
                        text: "Error: Inquiry ID not found",
                      });
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "#dc2626",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "14px",
                    transition: "all 0.25s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#b91c1c";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#dc2626";
                  }}
                >
                  Delete Inquiry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Order Preview Modal */}
        {showOrderPreview && selectedOrderForPreview && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1001,
            }}
            onClick={() => {
              setShowOrderPreview(false);
              setSelectedOrderForPreview(null);
            }}
          >
            <div
              style={{
                background: "#ffffff",
                borderRadius: "12px",
                padding: "32px",
                maxWidth: "700px",
                width: "90%",
                maxHeight: "80vh",
                overflowY: "auto",
                boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2
                style={{
                  margin: "0 0 24px 0",
                  fontSize: "22px",
                  fontWeight: "800",
                  color: "#1a365d",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>Order Details</span>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    color:
                      selectedOrderForPreview.status === "pending"
                        ? "#b45309"
                        : selectedOrderForPreview.status === "accepted"
                          ? "#0369a1"
                          : selectedOrderForPreview.status === "shipped"
                            ? "#7c3aed"
                            : selectedOrderForPreview.status === "delivered"
                              ? "#16a34a"
                              : "#dc2626",
                    background:
                      selectedOrderForPreview.status === "pending"
                        ? "#fef3c7"
                        : selectedOrderForPreview.status === "accepted"
                          ? "#cffafe"
                          : selectedOrderForPreview.status === "shipped"
                            ? "#ede9fe"
                            : selectedOrderForPreview.status === "delivered"
                              ? "#dcfce7"
                              : "#fee2e2",
                  }}
                >
                  {selectedOrderForPreview.status}
                </span>
              </h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                  marginBottom: "24px",
                  padding: "16px",
                  background: "#f8fafc",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div>
                  <p
                    style={{
                      margin: "0 0 4px 0",
                      fontSize: "12px",
                      fontWeight: "700",
                      color: "#5b7c99",
                      textTransform: "uppercase",
                      letterSpacing: "0.3px",
                    }}
                  >
                    Order ID
                  </p>
                  <p
                    style={{
                      margin: "0",
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#1a365d",
                      wordBreak: "break-all",
                    }}
                  >
                    {selectedOrderForPreview.id}
                  </p>
                </div>
                <div>
                  <p
                    style={{
                      margin: "0 0 4px 0",
                      fontSize: "12px",
                      fontWeight: "700",
                      color: "#5b7c99",
                      textTransform: "uppercase",
                      letterSpacing: "0.3px",
                    }}
                  >
                    Total Items
                  </p>
                  <p
                    style={{
                      margin: "0",
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#1a365d",
                    }}
                  >
                    {getProductCount(selectedOrderForPreview)} product(s),{" "}
                    {getTotalItemCount(selectedOrderForPreview)} unit(s)
                  </p>
                </div>
                <div>
                  <p
                    style={{
                      margin: "0 0 4px 0",
                      fontSize: "12px",
                      fontWeight: "700",
                      color: "#5b7c99",
                      textTransform: "uppercase",
                      letterSpacing: "0.3px",
                    }}
                  >
                    From
                  </p>
                  <p
                    style={{
                      margin: "0",
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#1a365d",
                    }}
                  >
                    {selectedOrderForPreview.buyer}
                  </p>
                </div>
                <div>
                  <p
                    style={{
                      margin: "0 0 4px 0",
                      fontSize: "12px",
                      fontWeight: "700",
                      color: "#5b7c99",
                      textTransform: "uppercase",
                      letterSpacing: "0.3px",
                    }}
                  >
                    To
                  </p>
                  <p
                    style={{
                      margin: "0",
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#1a365d",
                    }}
                  >
                    {selectedOrderForPreview.seller}
                  </p>
                </div>
              </div>

              <h3
                style={{
                  margin: "0 0 16px 0",
                  fontSize: "16px",
                  fontWeight: "700",
                  color: "#1a365d",
                }}
              >
                Items in Order
              </h3>

              <div
                style={{
                  marginBottom: "24px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background: "#f8fafc",
                        borderBottom: "1px solid #e2e8f0",
                      }}
                    >
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "left",
                          fontWeight: "700",
                          color: "#5b7c99",
                          fontSize: "12px",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                        }}
                      >
                        Product Name
                      </th>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "center",
                          fontWeight: "700",
                          color: "#5b7c99",
                          fontSize: "12px",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                        }}
                      >
                        Qty
                      </th>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "right",
                          fontWeight: "700",
                          color: "#5b7c99",
                          fontSize: "12px",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                        }}
                      >
                        Unit Price
                      </th>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "right",
                          fontWeight: "700",
                          color: "#5b7c99",
                          fontSize: "12px",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                        }}
                      >
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrderForPreview.items &&
                    selectedOrderForPreview.items.length > 0 ? (
                      selectedOrderForPreview.items.map((item, index) => (
                        <tr
                          key={index}
                          style={{
                            borderBottom: "1px solid #e2e8f0",
                            background: index % 2 === 0 ? "#ffffff" : "#f8fafc",
                          }}
                        >
                          <td
                            style={{
                              padding: "12px",
                              color: "#1a365d",
                              fontWeight: "600",
                              fontSize: "13px",
                            }}
                          >
                            {item.name}
                          </td>
                          <td
                            style={{
                              padding: "12px",
                              textAlign: "center",
                              color: "#64748b",
                              fontSize: "13px",
                            }}
                          >
                            {item.quantity}
                          </td>
                          <td
                            style={{
                              padding: "12px",
                              textAlign: "right",
                              color: "#64748b",
                              fontSize: "13px",
                            }}
                          >
                            {item.currency || selectedOrderForPreview.currency}{" "}
                            {formatNumber(item.price)}
                          </td>
                          <td
                            style={{
                              padding: "12px",
                              textAlign: "right",
                              color: "#1a365d",
                              fontWeight: "600",
                              fontSize: "13px",
                            }}
                          >
                            {item.currency || selectedOrderForPreview.currency}{" "}
                            {formatNumber(item.price * item.quantity)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={4}
                          style={{
                            padding: "16px",
                            textAlign: "center",
                            color: "#64748b",
                            fontSize: "13px",
                          }}
                        >
                          No items in this order
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  padding: "16px",
                  background: "#f8fafc",
                  borderTop: "1px solid #e2e8f0",
                  borderRadius: "0 0 8px 8px",
                  marginBottom: "24px",
                }}
              >
                <div>
                  <p
                    style={{
                      margin: "0 0 8px 0",
                      fontSize: "12px",
                      fontWeight: "700",
                      color: "#5b7c99",
                      textTransform: "uppercase",
                      letterSpacing: "0.3px",
                    }}
                  >
                    Total Order Price
                  </p>
                  <p
                    style={{
                      margin: "0",
                      fontSize: "18px",
                      fontWeight: "800",
                      color: "#1a365d",
                    }}
                  >
                    {selectedOrderForPreview.currency ||
                      selectedOrderForPreview.itemCurrency}{" "}
                    {formatNumber(selectedOrderForPreview.totalPrice)}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowOrderPreview(false);
                  setSelectedOrderForPreview(null);
                }}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "#0284c7",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "14px",
                  transition: "all 0.25s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#0369a1";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#0284c7";
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Quotation Preview Modal */}
        {showQuotationPreview && selectedQuotationForPreview && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1001,
            }}
            onClick={() => {
              setShowQuotationPreview(false);
              setSelectedQuotationForPreview(null);
            }}
          >
            <div
              style={{
                background: "#ffffff",
                borderRadius: "12px",
                padding: "32px",
                maxWidth: "700px",
                width: "90%",
                maxHeight: "80vh",
                overflowY: "auto",
                boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2
                style={{
                  margin: "0 0 24px 0",
                  fontSize: "22px",
                  fontWeight: "800",
                  color: "#1a365d",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>Quotation Details</span>
              </h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                  marginBottom: "24px",
                  padding: "16px",
                  background: "#f8fafc",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div>
                  <p
                    style={{
                      margin: "0 0 4px 0",
                      fontSize: "12px",
                      fontWeight: "700",
                      color: "#5b7c99",
                      textTransform: "uppercase",
                      letterSpacing: "0.3px",
                    }}
                  >
                    Quotation ID
                  </p>
                  <p
                    style={{
                      margin: "0",
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#1a365d",
                      wordBreak: "break-all",
                    }}
                  >
                    {selectedQuotationForPreview.number ||
                      selectedQuotationForPreview.id.substring(0, 8)}
                  </p>
                </div>
                <div>
                  <p
                    style={{
                      margin: "0 0 4px 0",
                      fontSize: "12px",
                      fontWeight: "700",
                      color: "#5b7c99",
                      textTransform: "uppercase",
                      letterSpacing: "0.3px",
                    }}
                  >
                    Total Items
                  </p>
                  <p
                    style={{
                      margin: "0",
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#1a365d",
                    }}
                  >
                    {(() => {
                      const items = selectedQuotationForPreview.items || [];
                      const totalUnits = items.reduce(
                        (sum: number, item: any) =>
                          sum + (item.qty || item.quantity || 0),
                        0,
                      );
                      return `${items.length} product(s), ${totalUnits} unit(s)`;
                    })()}
                  </p>
                </div>
              </div>

              <h3
                style={{
                  margin: "0 0 16px 0",
                  fontSize: "16px",
                  fontWeight: "700",
                  color: "#1a365d",
                }}
              >
                Items in Quotation
              </h3>

              <div
                style={{
                  marginBottom: "24px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background: "#f8fafc",
                        borderBottom: "1px solid #e2e8f0",
                      }}
                    >
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "left",
                          fontWeight: "700",
                          color: "#5b7c99",
                          fontSize: "12px",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                        }}
                      >
                        Product Name
                      </th>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "center",
                          fontWeight: "700",
                          color: "#5b7c99",
                          fontSize: "12px",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                        }}
                      >
                        Qty
                      </th>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "right",
                          fontWeight: "700",
                          color: "#5b7c99",
                          fontSize: "12px",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                        }}
                      >
                        Unit Price
                      </th>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "right",
                          fontWeight: "700",
                          color: "#5b7c99",
                          fontSize: "12px",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                        }}
                      >
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedQuotationForPreview.items &&
                    selectedQuotationForPreview.items.length > 0 ? (
                      selectedQuotationForPreview.items.map(
                        (item: any, index: number) => {
                          const qty = item.qty || item.quantity || 0;
                          const price = item.price || 0;
                          const currency = item.currency || "USD";
                          return (
                            <tr
                              key={index}
                              style={{
                                borderBottom: "1px solid #e2e8f0",
                                background:
                                  index % 2 === 0 ? "#ffffff" : "#f8fafc",
                              }}
                            >
                              <td
                                style={{
                                  padding: "12px",
                                  color: "#1a365d",
                                  fontWeight: "600",
                                  fontSize: "13px",
                                }}
                              >
                                {item.name}
                              </td>
                              <td
                                style={{
                                  padding: "12px",
                                  textAlign: "center",
                                  color: "#64748b",
                                  fontSize: "13px",
                                }}
                              >
                                {qty}
                              </td>
                              <td
                                style={{
                                  padding: "12px",
                                  textAlign: "right",
                                  color: "#64748b",
                                  fontSize: "13px",
                                }}
                              >
                                {currency} {formatNumber(price)}
                              </td>
                              <td
                                style={{
                                  padding: "12px",
                                  textAlign: "right",
                                  color: "#1a365d",
                                  fontWeight: "600",
                                  fontSize: "13px",
                                }}
                              >
                                {currency} {formatNumber(price * qty)}
                              </td>
                            </tr>
                          );
                        },
                      )
                    ) : (
                      <tr>
                        <td
                          colSpan={4}
                          style={{
                            padding: "16px",
                            textAlign: "center",
                            color: "#64748b",
                            fontSize: "13px",
                          }}
                        >
                          No items in this quotation
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  padding: "16px",
                  background: "#f8fafc",
                  borderTop: "1px solid #e2e8f0",
                  borderRadius: "0 0 8px 8px",
                  marginBottom: "24px",
                }}
              >
                <div>
                  <p
                    style={{
                      margin: "0 0 8px 0",
                      fontSize: "12px",
                      fontWeight: "700",
                      color: "#5b7c99",
                      textTransform: "uppercase",
                      letterSpacing: "0.3px",
                    }}
                  >
                    Total Quotation Price
                  </p>
                  <p
                    style={{
                      margin: "0",
                      fontSize: "18px",
                      fontWeight: "800",
                      color: "#1a365d",
                    }}
                  >
                    {(() => {
                      const items = selectedQuotationForPreview.items || [];
                      const totalPrice = items.reduce(
                        (sum: number, item: any) =>
                          sum +
                          (item.price || 0) * (item.qty || item.quantity || 0),
                        0,
                      );
                      const currency =
                        items.length > 0 ? items[0].currency || "USD" : "USD";
                      return `${currency} ${formatNumber(totalPrice)}`;
                    })()}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowQuotationPreview(false);
                  setSelectedQuotationForPreview(null);
                }}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "#0284c7",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "14px",
                  transition: "all 0.25s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#0369a1";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#0284c7";
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Inquiry Preview Modal */}
        {showInquiryPreview && selectedInquiryForPreview && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1001,
            }}
            onClick={() => {
              setShowInquiryPreview(false);
              setSelectedInquiryForPreview(null);
            }}
          >
            <div
              style={{
                background: "#ffffff",
                borderRadius: "12px",
                padding: "32px",
                maxWidth: "700px",
                width: "90%",
                maxHeight: "80vh",
                overflowY: "auto",
                boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2
                style={{
                  margin: "0 0 24px 0",
                  fontSize: "22px",
                  fontWeight: "800",
                  color: "#1a365d",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>Inquiry Details</span>
              </h2>

              {selectedInquiryForPreview.formattedHtml ? (
                <div
                  dangerouslySetInnerHTML={{
                    __html: selectedInquiryForPreview.formattedHtml,
                  }}
                  style={{ marginBottom: "24px" }}
                />
              ) : (
                <>
                  {selectedInquiryForPreview.letterhead && (
                    <div
                      style={{
                        marginBottom: "24px",
                        padding: "16px",
                        background: "#f8fafc",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <img
                        src={selectedInquiryForPreview.letterhead.imageBase64}
                        alt="Letterhead"
                        style={{
                          maxWidth: "100%",
                          height: "auto",
                          borderRadius: "4px",
                        }}
                      />
                    </div>
                  )}

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "16px",
                      marginBottom: "24px",
                      padding: "16px",
                      background: "#f8fafc",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          margin: "0 0 4px 0",
                          fontSize: "12px",
                          fontWeight: "700",
                          color: "#5b7c99",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                        }}
                      >
                        From
                      </p>
                      <p
                        style={{
                          margin: "0",
                          fontSize: "13px",
                          fontWeight: "600",
                          color: "#1a365d",
                        }}
                      >
                        {selectedInquiryForPreview.senderEmail || "Unknown"}
                      </p>
                    </div>
                    <div>
                      <p
                        style={{
                          margin: "0 0 4px 0",
                          fontSize: "12px",
                          fontWeight: "700",
                          color: "#5b7c99",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                        }}
                      >
                        Date
                      </p>
                      <p
                        style={{
                          margin: "0",
                          fontSize: "13px",
                          fontWeight: "600",
                          color: "#1a365d",
                        }}
                      >
                        {selectedInquiryForPreview.date || "N/A"}
                      </p>
                    </div>
                  </div>

                  {selectedInquiryForPreview.inquiryBody && (
                    <div
                      style={{
                        marginBottom: "24px",
                        padding: "16px",
                        background: "#f8fafc",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <p
                        style={{
                          margin: "0 0 8px 0",
                          fontSize: "12px",
                          fontWeight: "700",
                          color: "#5b7c99",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                        }}
                      >
                        Inquiry Description
                      </p>
                      <p
                        style={{
                          margin: "0",
                          fontSize: "14px",
                          color: "#1a365d",
                          lineHeight: "1.6",
                          whiteSpace: "pre-wrap",
                          wordWrap: "break-word",
                        }}
                      >
                        {selectedInquiryForPreview.inquiryBody}
                      </p>
                    </div>
                  )}

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "16px",
                      marginBottom: "24px",
                      padding: "16px",
                      background: "#f8fafc",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          margin: "0 0 4px 0",
                          fontSize: "12px",
                          fontWeight: "700",
                          color: "#5b7c99",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                        }}
                      >
                        Inquiry ID
                      </p>
                      <p
                        style={{
                          margin: "0",
                          fontSize: "13px",
                          fontWeight: "600",
                          color: "#1a365d",
                          wordBreak: "break-all",
                        }}
                      >
                        {selectedInquiryForPreview.number ||
                          selectedInquiryForPreview.id.substring(0, 8)}
                      </p>
                    </div>
                    <div>
                      <p
                        style={{
                          margin: "0 0 4px 0",
                          fontSize: "12px",
                          fontWeight: "700",
                          color: "#5b7c99",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                        }}
                      >
                        Total Items
                      </p>
                      <p
                        style={{
                          margin: "0",
                          fontSize: "13px",
                          fontWeight: "600",
                          color: "#1a365d",
                        }}
                      >
                        {(() => {
                          const items = selectedInquiryForPreview.items || [];
                          const totalUnits = items.reduce(
                            (sum: number, item: any) =>
                              sum + (item.qty || item.quantity || 0),
                            0,
                          );
                          return `${items.length} product(s), ${totalUnits} unit(s)`;
                        })()}
                      </p>
                    </div>
                  </div>

                  <h3
                    style={{
                      margin: "0 0 16px 0",
                      fontSize: "16px",
                      fontWeight: "700",
                      color: "#1a365d",
                    }}
                  >
                    Items in Inquiry
                  </h3>

                  <div
                    style={{
                      marginBottom: "24px",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      overflow: "hidden",
                    }}
                  >
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                      }}
                    >
                      <thead>
                        <tr
                          style={{
                            background: "#f8fafc",
                            borderBottom: "1px solid #e2e8f0",
                          }}
                        >
                          <th
                            style={{
                              padding: "12px",
                              textAlign: "left",
                              fontWeight: "700",
                              color: "#5b7c99",
                              fontSize: "12px",
                              textTransform: "uppercase",
                              letterSpacing: "0.3px",
                            }}
                          >
                            Product Name
                          </th>
                          <th
                            style={{
                              padding: "12px",
                              textAlign: "center",
                              fontWeight: "700",
                              color: "#5b7c99",
                              fontSize: "12px",
                              textTransform: "uppercase",
                              letterSpacing: "0.3px",
                            }}
                          >
                            Qty
                          </th>
                          <th
                            style={{
                              padding: "12px",
                              textAlign: "right",
                              fontWeight: "700",
                              color: "#5b7c99",
                              fontSize: "12px",
                              textTransform: "uppercase",
                              letterSpacing: "0.3px",
                            }}
                          >
                            Unit Price
                          </th>
                          <th
                            style={{
                              padding: "12px",
                              textAlign: "right",
                              fontWeight: "700",
                              color: "#5b7c99",
                              fontSize: "12px",
                              textTransform: "uppercase",
                              letterSpacing: "0.3px",
                            }}
                          >
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedInquiryForPreview.items &&
                        selectedInquiryForPreview.items.length > 0 ? (
                          selectedInquiryForPreview.items.map(
                            (item: any, index: number) => {
                              const qty = item.qty || item.quantity || 0;
                              const price = item.price || 0;
                              const currency = item.currency || "USD";
                              return (
                                <tr
                                  key={index}
                                  style={{
                                    borderBottom: "1px solid #e2e8f0",
                                    background:
                                      index % 2 === 0 ? "#ffffff" : "#f8fafc",
                                  }}
                                >
                                  <td
                                    style={{
                                      padding: "12px",
                                      color: "#1a365d",
                                      fontWeight: "600",
                                      fontSize: "13px",
                                    }}
                                  >
                                    {item.name}
                                  </td>
                                  <td
                                    style={{
                                      padding: "12px",
                                      textAlign: "center",
                                      color: "#64748b",
                                      fontSize: "13px",
                                    }}
                                  >
                                    {qty}
                                  </td>
                                  <td
                                    style={{
                                      padding: "12px",
                                      textAlign: "right",
                                      color: "#64748b",
                                      fontSize: "13px",
                                    }}
                                  >
                                    {currency} {formatNumber(price)}
                                  </td>
                                  <td
                                    style={{
                                      padding: "12px",
                                      textAlign: "right",
                                      color: "#1a365d",
                                      fontWeight: "600",
                                      fontSize: "13px",
                                    }}
                                  >
                                    {currency} {formatNumber(price * qty)}
                                  </td>
                                </tr>
                              );
                            },
                          )
                        ) : (
                          <tr>
                            <td
                              colSpan={4}
                              style={{
                                padding: "16px",
                                textAlign: "center",
                                color: "#64748b",
                                fontSize: "13px",
                              }}
                            >
                              No items in this inquiry
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      padding: "16px",
                      background: "#f8fafc",
                      borderTop: "1px solid #e2e8f0",
                      borderRadius: "0 0 8px 8px",
                      marginBottom: "24px",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          margin: "0 0 8px 0",
                          fontSize: "12px",
                          fontWeight: "700",
                          color: "#5b7c99",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                        }}
                      >
                        Total Inquiry Amount
                      </p>
                      <p
                        style={{
                          margin: "0",
                          fontSize: "18px",
                          fontWeight: "800",
                          color: "#1a365d",
                        }}
                      >
                        {(() => {
                          const items = selectedInquiryForPreview.items || [];
                          const totalPrice = items.reduce(
                            (sum: number, item: any) =>
                              sum +
                              (item.price || 0) *
                                (item.qty || item.quantity || 0),
                            0,
                          );
                          const currency =
                            items.length > 0
                              ? items[0].currency || "USD"
                              : "USD";
                          return `${currency} ${formatNumber(totalPrice)}`;
                        })()}
                      </p>
                    </div>
                  </div>
                </>
              )}

              <button
                onClick={() => {
                  setShowInquiryPreview(false);
                  setSelectedInquiryForPreview(null);
                }}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "#0284c7",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "14px",
                  transition: "all 0.25s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#0369a1";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#0284c7";
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Floating Cart Button */}
        {isLoggedIn && activeSubmenu !== "allDocuments" && (
          <button
            onClick={() => setShowCartModal(true)}
            style={{
              position: "fixed",
              top: "20px",
              right: "20px",
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              background: "#0284c7",
              color: "white",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(2, 132, 199, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              fontWeight: "700",
              transition: "all 0.25s ease",
              zIndex: 999,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#0369a1";
              e.currentTarget.style.boxShadow =
                "0 8px 20px rgba(2, 132, 199, 0.4)";
              e.currentTarget.style.transform = "scale(1.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#0284c7";
              e.currentTarget.style.boxShadow =
                "0 4px 12px rgba(2, 132, 199, 0.3)";
              e.currentTarget.style.transform = "scale(1)";
            }}
            title={`Cart (${cart.length} items)`}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "2px",
              }}
            >
              <span style={{ fontSize: "24px" }}>🛒</span>
              {cart.length > 0 && (
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: "700",
                    backgroundColor: "#ff6b6b",
                    color: "white",
                    borderRadius: "50%",
                    width: "24px",
                    height: "24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "absolute",
                    top: "-8px",
                    right: "-8px",
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                  }}
                >
                  {cart.length}
                </span>
              )}
            </div>
          </button>
        )}

        {/* Cart Modal */}
        {showCartModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
            onClick={() => setShowCartModal(false)}
          >
            <div
              style={{
                background: "#ffffff",
                borderRadius: "12px",
                padding: "32px",
                maxWidth: "600px",
                width: "90%",
                maxHeight: "80vh",
                overflow: "auto",
                boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "24px",
                }}
              >
                <h2
                  style={{
                    margin: "0",
                    fontSize: "22px",
                    fontWeight: "800",
                    color: "#1a365d",
                  }}
                >
                  🛒 Shopping Cart
                </h2>
                <button
                  onClick={() => setShowCartModal(false)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "24px",
                    cursor: "pointer",
                    color: "#64748b",
                    padding: "0",
                    width: "32px",
                    height: "32px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ×
                </button>
              </div>

              {cart.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "48px 24px",
                    background: "#f8fafc",
                    borderRadius: "8px",
                    border: "1px solid #d0dce6",
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 8px 0",
                      fontSize: "18px",
                      fontWeight: "600",
                      color: "#64748b",
                    }}
                  >
                    Your cart is empty
                  </p>
                  <p
                    style={{
                      margin: "0",
                      fontSize: "13px",
                      color: "#94a3b8",
                    }}
                  >
                    Browse the marketplace to add items
                  </p>
                </div>
              ) : (
                <div>
                  {/* Cart Items Table */}
                  <div
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "10px",
                      overflow: "hidden",
                      marginBottom: "24px",
                    }}
                  >
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                      }}
                    >
                      <thead>
                        <tr
                          style={{
                            background: "#f8fafc",
                            borderBottom: "2px solid #e2e8f0",
                          }}
                        >
                          <th
                            style={{
                              padding: "12px 16px",
                              textAlign: "left",
                              fontSize: "12px",
                              fontWeight: "700",
                              color: "#475569",
                              letterSpacing: "0.3px",
                            }}
                          >
                            Product
                          </th>
                          <th
                            style={{
                              padding: "12px 16px",
                              textAlign: "center",
                              fontSize: "12px",
                              fontWeight: "700",
                              color: "#475569",
                              letterSpacing: "0.3px",
                            }}
                          >
                            Qty
                          </th>
                          <th
                            style={{
                              padding: "12px 16px",
                              textAlign: "center",
                              fontSize: "12px",
                              fontWeight: "700",
                              color: "#475569",
                              letterSpacing: "0.3px",
                            }}
                          >
                            Price
                          </th>
                          <th
                            style={{
                              padding: "12px 16px",
                              textAlign: "center",
                              fontSize: "12px",
                              fontWeight: "700",
                              color: "#475569",
                              letterSpacing: "0.3px",
                            }}
                          >
                            Total
                          </th>
                          <th
                            style={{
                              padding: "12px 16px",
                              textAlign: "center",
                              fontSize: "12px",
                              fontWeight: "700",
                              color: "#475569",
                              letterSpacing: "0.3px",
                            }}
                          >
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {cart.map((item, index) => (
                          <tr
                            key={`${item.productId}_${item.seller}_${index}`}
                            style={{
                              borderBottom:
                                index < cart.length - 1
                                  ? "1px solid #f1f5f9"
                                  : "none",
                              background:
                                index % 2 === 0 ? "#ffffff" : "#f9fafb",
                            }}
                          >
                            <td
                              style={{
                                padding: "12px 16px",
                                fontSize: "13px",
                                color: "#1a365d",
                                fontWeight: "500",
                              }}
                            >
                              <div>
                                <p
                                  style={{
                                    margin: "0 0 4px 0",
                                    fontWeight: "600",
                                  }}
                                >
                                  {item.name}
                                </p>
                                <p
                                  style={{
                                    margin: "0",
                                    fontSize: "11px",
                                    color: "#64748b",
                                  }}
                                >
                                  {item.seller}
                                </p>
                              </div>
                            </td>
                            <td
                              style={{
                                padding: "12px 16px",
                                textAlign: "center",
                                fontSize: "13px",
                                color: "#1a365d",
                                fontWeight: "500",
                              }}
                            >
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => {
                                  const newQty = Math.max(
                                    1,
                                    parseInt(e.target.value) || 1,
                                  );
                                  const updatedCart = cart.map((cartItem) =>
                                    cartItem.productId === item.productId &&
                                    cartItem.seller === item.seller
                                      ? {
                                          ...cartItem,
                                          quantity: newQty,
                                        }
                                      : cartItem,
                                  );
                                  setCart(updatedCart);
                                  saveCartToIndexedDB(currentUser, updatedCart);
                                }}
                                style={{
                                  width: "60px",
                                  padding: "6px",
                                  border: "1px solid #d0dce6",
                                  borderRadius: "4px",
                                  fontSize: "13px",
                                  textAlign: "center",
                                }}
                              />
                            </td>
                            <td
                              style={{
                                padding: "12px 16px",
                                textAlign: "center",
                                fontSize: "13px",
                                color: "#1a365d",
                                fontWeight: "500",
                              }}
                            >
                              {item.currency} {formatNumber(item.price)}
                            </td>
                            <td
                              style={{
                                padding: "12px 16px",
                                textAlign: "center",
                                fontSize: "13px",
                                color: "#1a365d",
                                fontWeight: "600",
                              }}
                            >
                              {item.currency}{" "}
                              {formatNumber(item.price * item.quantity)}
                            </td>
                            <td
                              style={{
                                padding: "12px 16px",
                                textAlign: "center",
                              }}
                            >
                              <button
                                onClick={() => {
                                  const updatedCart = cart.filter(
                                    (cartItem, idx) =>
                                      !(
                                        cartItem.productId === item.productId &&
                                        cartItem.seller === item.seller &&
                                        idx === index
                                      ),
                                  );
                                  setCart(updatedCart);
                                  saveCartToIndexedDB(currentUser, updatedCart);
                                }}
                                style={{
                                  padding: "6px 10px",
                                  background: "#dc2626",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "4px",
                                  cursor: "pointer",
                                  fontSize: "12px",
                                  fontWeight: "500",
                                  transition: "all 0.25s ease",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = "#b91c1c";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = "#dc2626";
                                }}
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary Section */}
                  <div
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      padding: "16px",
                      marginBottom: "24px",
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "16px",
                      }}
                    >
                      {Array.from(
                        new Set(cart.map((item) => item.currency)),
                      ).map((currency) => {
                        const total = cart
                          .filter((item) => item.currency === currency)
                          .reduce(
                            (sum, item) => sum + item.price * item.quantity,
                            0,
                          );
                        return (
                          <div key={currency} style={{ textAlign: "center" }}>
                            <p
                              style={{
                                margin: "0 0 6px 0",
                                fontSize: "11px",
                                color: "#64748b",
                                fontWeight: "700",
                                textTransform: "uppercase",
                                letterSpacing: "0.2px",
                              }}
                            >
                              Total ({currency})
                            </p>
                            <p
                              style={{
                                margin: "0",
                                fontSize: "18px",
                                fontWeight: "800",
                                color: "#1a365d",
                              }}
                            >
                              {currency} {formatNumber(total)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                    <div
                      style={{
                        marginTop: "16px",
                        paddingTop: "16px",
                        borderTop: "1px solid #d0dce6",
                        fontSize: "12px",
                        color: "#64748b",
                      }}
                    >
                      <p style={{ margin: "0 0 4px 0" }}>
                        Total Items: <strong>{cart.length}</strong>
                      </p>
                      <p
                        style={{
                          margin: "0",
                          fontSize: "11px",
                          color: "#94a3b8",
                        }}
                      >
                        Will be split into{" "}
                        {new Set(cart.map((item) => item.seller)).size} order(s)
                        by seller
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: "flex", gap: "12px" }}>
                    <button
                      onClick={() => setShowCartModal(false)}
                      style={{
                        flex: 1,
                        padding: "12px",
                        background: "#e2e8f0",
                        color: "#1a365d",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: "600",
                        fontSize: "14px",
                        transition: "all 0.25s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#cbd5e1";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#e2e8f0";
                      }}
                    >
                      Continue Shopping
                    </button>
                    <button
                      onClick={checkoutCart}
                      style={{
                        flex: 1,
                        padding: "12px",
                        background: "#16a34a",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: "600",
                        fontSize: "14px",
                        transition: "all 0.25s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#14931d";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#16a34a";
                      }}
                    >
                      Checkout ({new Set(cart.map((item) => item.seller)).size}{" "}
                      order
                      {new Set(cart.map((item) => item.seller)).size > 1
                        ? "s"
                        : ""}
                      )
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
