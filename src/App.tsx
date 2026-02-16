import { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection,
  query,
  where,
  getDocs,
  setDoc,
  doc,
  deleteDoc,
  orderBy,
  limit,
  startAfter,
} from "firebase/firestore";
import * as XLSX from "xlsx";
import bcryptjs from "bcryptjs";
import CryptoJS from "crypto-js";
import jsPDF from "jspdf";
import Quotations from "./pages/Quotations";
import Inquiries from "./pages/Inquiries";
import Settings from "./pages/Settings";
import History from "./pages/History";

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

interface Order {
  id: string;
  marketplaceItemId: string;
  itemName: string;
  itemPrice: number;
  itemCurrency: string;
  quantity: number;
  totalPrice: number;
  buyer: string;
  seller: string;
  status: "pending" | "accepted" | "shipped" | "delivered" | "cancelled";
  createdAt: number;
  updatedAt: number;
  buyerNotes?: string;
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
    };
  });
};

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

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<string>("");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [loginForm, setLoginForm] = useState({
    emailOrUsername: "",
    password: "",
  });
  const [signupForm, setSignupForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [authError, setAuthError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [activeSubmenu, setActiveSubmenu] = useState<
    "marketplace" | "warehouse" | "allDocuments"
  >("warehouse");
  const [activeWarehouseTab, setActiveWarehouseTab] = useState<
    "products" | "upload" | "quotations" | "inquiries" | "orders" | "settings"
  >("products");
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
  const [hasLoadedIncomingOrders, setHasLoadedIncomingOrders] =
    useState(false);
  const [hasLoadedOutgoingOrders, setHasLoadedOutgoingOrders] =
    useState(false);
  const [activeOrdersView, setActiveOrdersView] = useState<
    "incoming" | "outgoing"
  >("incoming");
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
  const [quotationHistory, setQuotationHistory] = useState<any[]>([]);
  const [inquiryHistory, setInquiryHistory] = useState<any[]>([]);
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
  const loadUserDataOnLogin = async (username: string) => {
    try {
      // Load products from IndexedDB
      const products = await loadProductsFromIndexedDB(username);
      console.log(
        `Login: Loaded ${products?.length || 0} products for ${username}`,
      );

      // Load quotation and inquiry history with username
      const quotationHist = await loadQuotationHistory(username);
      const inquiryHist = await loadInquiryHistory(username);

      console.log(
        `Login: Loaded ${quotationHist?.length || 0} quotations and ${inquiryHist?.length || 0} inquiries`,
      );

      const cachedTab = localStorage.getItem(`cache_tab_${username}`);
      return {
        products: products || [],
        activeTab: cachedTab || "products",
        quotationHistory: quotationHist || [],
        inquiryHistory: inquiryHist || [],
      };
    } catch (error) {
      console.error("Error loading user data:", error);
      return {
        products: [],
        activeTab: "products",
        quotationHistory: [],
        inquiryHistory: [],
      };
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

  // Restore login session on page refresh
  useEffect(() => {
    const savedUser = localStorage.getItem("pspm_current_user");
    const savedTab =
      localStorage.getItem(`cache_tab_${savedUser}`) || "products";
    if (savedUser) {
      // Set user and login state FIRST (before async operations)
      setCurrentUser(savedUser);
      setIsLoggedIn(true);
      setActiveSubmenu("warehouse");

      // Set active warehouse tab immediately from localStorage
      setActiveWarehouseTab(
        (savedTab || "products") as
          | "products"
          | "upload"
          | "quotations"
          | "inquiries"
          | "settings",
      );

      // Load user data and history (will also call setQuotationHistory and setInquiryHistory)
      loadUserDataOnLogin(savedUser).then((data) => {
        console.log(`Page restore: User ${savedUser}, Tab ${savedTab}`);
        console.log(
          `SETTING STATE - data.quotationHistory:`,
          data.quotationHistory,
        );
        console.log(
          `SETTING STATE - data.inquiryHistory:`,
          data.inquiryHistory,
        );
        setProducts(data.products);
        setQuotationHistory(data.quotationHistory);
        setInquiryHistory(data.inquiryHistory);
        console.log(
          `Page restore: Loaded ${data.products.length} products, ${data.quotationHistory.length} quotations, ${data.inquiryHistory.length} inquiries`,
        );
      });
    }
  }, []);

  // Debug: Log when quotationHistory state changes
  useEffect(() => {
    console.log(`quotationHistory state changed:`, quotationHistory);
  }, [quotationHistory]);

  // Debug: Log when inquiryHistory state changes
  useEffect(() => {
    console.log(`inquiryHistory state changed:`, inquiryHistory);
  }, [inquiryHistory]);
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
    const quotationData = {
      id: meta.id || "Q-" + Date.now(),
      number: meta.number,
      date: meta.date,
      items: items,
      createdAt: new Date().toISOString(),
      username: currentUser,
    };
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
    const inquiryData = {
      id: meta.id || "I-" + Date.now(),
      number: meta.number,
      date: meta.date,
      items: items,
      createdAt: new Date().toISOString(),
      username: currentUser,
    };
    return new Promise((resolve, reject) => {
      const transaction = dbInstance.transaction(["inquiries"], "readwrite");
      const store = transaction.objectStore("inquiries");
      const request = store.add(inquiryData);
      request.onsuccess = () => resolve(inquiryData.id);
      request.onerror = () => reject(request.error);
    });
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
          const results = request.result.map((q) => ({
            id: q.id,
            number: q.number,
            date: q.date,
            items: q.items,
            createdAt: q.createdAt,
          }));
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
          const results = request.result.map((i) => ({
            id: i.id,
            number: i.number,
            date: i.date,
            items: i.items,
            createdAt: i.createdAt,
          }));
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
  const retractOrder = async (orderId: string) => {
    try {
      if (!db) return;

      // Delete from Firestore
      await deleteDoc(doc(db, "orders", orderId));

      // Remove from local state
      setOutgoingOrders((prev) =>
        prev.filter((order) => order.id !== orderId)
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
        text: "Error retracting order",
      });
    } finally {
      setShowRetractConfirm(false);
      setRetractingOrderId(null);
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

    if (signupForm.password.length < 3) {
      setAuthError("Password must be at least 3 characters");
      return;
    }

    if (signupForm.password !== signupForm.confirmPassword) {
      setAuthError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      // Check if username or email exists
      const { exists, by } = await checkUserExists(
        signupForm.username,
        signupForm.email,
      );
      if (exists) {
        setAuthError(
          `${by === "username" ? "Username" : "Email"} already taken`,
        );
        setIsLoading(false);
        return;
      }

      // Optimization #1: Hash password before storing (CRITICAL SECURITY)
      const hashedPassword = await bcryptjs.hash(signupForm.password, 10);

      // Create user in Firestore or localStorage
      if (db) {
        await setDoc(doc(db, "userSettings", signupForm.username), {
          username: signupForm.username,
          email: signupForm.email,
          password: hashedPassword,
          createdAt: new Date().toISOString(),
          // Optimization #5: REMOVED activeTab (no longer written on signup)
        });
      } else {
        // Fallback to localStorage
        const users = JSON.parse(localStorage.getItem("pspm_users") || "{}");
        users[signupForm.username] = {
          username: signupForm.username,
          email: signupForm.email,
          password: hashedPassword,
          createdAt: new Date().toISOString(),
        };
        localStorage.setItem("pspm_users", JSON.stringify(users));
      }

      // Login immediately after signup
      setProducts([]);
      setActiveWarehouseTab("products");
      setCurrentUser(signupForm.username);
      localStorage.setItem("pspm_current_user", signupForm.username);
      // Cache user for future logins (0 reads next time)
      cacheUserData(signupForm.username, signupForm.email);
      setIsLoggedIn(true);
      setSignupForm({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
      setAuthError("");
    } catch (error) {
      setAuthError("Error creating account. Please try again.");
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

    if (loginForm.password.length < 3) {
      setAuthError("Invalid credentials");
      return;
    }

    setIsLoading(true);
    try {
      // Check cache first (0 reads - optimization)
      let user = getCachedUserData(loginForm.emailOrUsername);

      // If not in cache, query Firestore (1-2 reads)
      if (!user) {
        user = await findUserByEmailOrUsername(loginForm.emailOrUsername);
        if (!user) {
          setAuthError("Invalid email/username or password");
          setIsLoading(false);
          return;
        }

        // Optimization #1: Verify hashed password
        try {
          const userDocs = await getDocs(
            query(
              collection(db || ({} as any), "userSettings"),
              where("username", "==", user.username),
            ),
          );
          if (userDocs.docs.length > 0) {
            const userData = userDocs.docs[0].data();
            const passwordMatch = await bcryptjs.compare(
              loginForm.password,
              userData.password,
            );
            if (!passwordMatch) {
              setAuthError("Invalid email/username or password");
              setIsLoading(false);
              return;
            }
          }
        } catch (e) {
          // Continue with login if password verification fails gracefully
        }

        // Cache the user for future logins (0 reads next time)
        cacheUserData(user.username, user.email);
      }

      // Single batch load (products + history from IndexedDB)
      const {
        products: userProducts,
        activeTab: userActiveTab,
        quotationHistory: userQuotationHistory,
        inquiryHistory: userInquiryHistory,
      } = await loadUserDataOnLogin(user.username);

      setProducts(userProducts);
      setActiveSubmenu(
        "warehouse" as "marketplace" | "warehouse" | "allDocuments",
      );
      setActiveWarehouseTab(
        (userActiveTab || "products") as
          | "products"
          | "upload"
          | "quotations"
          | "inquiries"
          | "settings",
      );
      setQuotationHistory(userQuotationHistory);
      setInquiryHistory(userInquiryHistory);
      setCurrentUser(user.username);
      localStorage.setItem("pspm_current_user", user.username);
      setIsLoggedIn(true);
      setLoginForm({ emailOrUsername: "", password: "" });
      setAuthError("");

      // Optimization #4: Reset inactivity timer on successful login
      resetInactivityTimer();
    } catch (error) {
      setAuthError("Error logging in. Please try again.");
      console.error("Login error:", error);
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
            Warehouse
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
              Warehouse Management
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
              onClick={() => setActiveWarehouseTab("upload")}
              style={{
                background: "transparent",
                border: "none",
                borderBottom:
                  activeWarehouseTab === "upload"
                    ? "3px solid #5b7c99"
                    : "2px solid transparent",
                padding: "18px 22px",
                cursor: "pointer",
                color: activeWarehouseTab === "upload" ? "#5b7c99" : "#64748b",
                fontWeight: activeWarehouseTab === "upload" ? "700" : "600",
                fontSize: "13px",
                transition: "all 0.25s ease",
                textTransform: "uppercase",
                letterSpacing: "0.3px",
              }}
              onMouseEnter={(e) => {
                if (activeWarehouseTab !== "upload") {
                  e.currentTarget.style.color = "#5b7c99";
                }
              }}
              onMouseLeave={(e) => {
                if (activeWarehouseTab !== "upload") {
                  e.currentTarget.style.color = "#64748b";
                }
              }}
            >
              Upload Portal
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
              onClick={() => {
                if (!hasLoadedIncomingOrders) {
                  loadIncomingOrders();
                }
                setActiveWarehouseTab("orders");
              }}
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
                                <button
                                  onClick={() => {
                                    setSelectedOrderItem(item);
                                    setOrderQuantity(1);
                                    setOrderNotes("");
                                    setShowPlaceOrderDialog(true);
                                  }}
                                  style={{
                                    width: "100%",
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
                                  Place Order
                                </button>
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
                      This will permanently retract your order. The seller will
                      not receive this order. This action cannot be undone.
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
                        onClick={() => retractOrder(retractingOrderId)}
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
                                      await saveInquiryToIndexedDB(
                                        selectedItems,
                                        newMeta,
                                      );
                                      const newHistory =
                                        await loadInquiryHistory();
                                      setInquiryHistory(newHistory);
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
                <Quotations
                  items={quotations}
                  history={quotationHistory}
                  onGeneratePDF={() => {
                    console.log("Generating quotation PDF...");
                    const newMeta = generateQuotationMetadata();
                    generateQuotationPDF(quotations).catch((err) =>
                      console.error("PDF generation error:", err),
                    );
                  }}
                  onSendEmail={async () => {
                    console.log("Sending quotation via email...");
                    try {
                      const newMeta = generateQuotationMetadata();
                      // Save to history first
                      await saveQuotationToIndexedDB(quotations, newMeta);
                      const newHistory =
                        await loadQuotationHistory(currentUser);
                      setQuotationHistory(newHistory);
                      // Generate PDF
                      await generateQuotationPDF(quotations);
                      // Then open email with content
                      const link = generateEmailLink("quotation", quotations);
                      console.log("Email link:", link);
                      window.open(link);
                      alert(
                        "Quotation saved to History!\n\nPDF generated and saved to your Downloads folder.\n\nTo attach it to your email:\n1. The PDF file is saved as: Quotation_" +
                          newMeta.number +
                          ".pdf\n2. In your email compose window, attach the file from Downloads\n3. Complete and send the email",
                      );
                    } catch (error) {
                      console.error("Error:", error);
                      alert(
                        "Error: " +
                          (error instanceof Error
                            ? error.message
                            : "Unknown error"),
                      );
                    }
                  }}
                  onDeleteHistory={(id) =>
                    setQuotationHistory(
                      quotationHistory.filter((q) => q.id !== id),
                    )
                  }
                />
              )}

              {activeWarehouseTab === "inquiries" && (
                <Inquiries
                  items={inquiries}
                  history={inquiryHistory}
                  onGeneratePDF={() => {
                    console.log("Generating inquiry PDF...");
                    const newMeta = generateInquiryMetadata();
                    generateInquiryPDF(inquiries).catch((err) =>
                      console.error("PDF generation error:", err),
                    );
                  }}
                  onSendEmail={async () => {
                    console.log("Sending inquiry via email...");
                    try {
                      const newMeta = generateInquiryMetadata();
                      // Save to history first
                      await saveInquiryToIndexedDB(inquiries, newMeta);
                      const newHistory = await loadInquiryHistory(currentUser);
                      setInquiryHistory(newHistory);
                      // Generate PDF
                      await generateInquiryPDF(inquiries);
                      // Then open email with content
                      const link = generateEmailLink("inquiry", inquiries);
                      console.log("Email link:", link);
                      window.open(link);
                      alert(
                        "Inquiry saved to History!\n\nPDF generated and saved to your Downloads folder.\n\nTo attach it to your email:\n1. The PDF file is saved as: Inquiry_" +
                          newMeta.number +
                          ".pdf\n2. In your email compose window, attach the file from Downloads\n3. Complete and send the email",
                      );
                    } catch (error) {
                      console.error("Error:", error);
                      alert(
                        "Error: " +
                          (error instanceof Error
                            ? error.message
                            : "Unknown error"),
                      );
                    }
                  }}
                  onDeleteHistory={(id) =>
                    setInquiryHistory(inquiryHistory.filter((i) => i.id !== id))
                  }
                />
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

                    {/* Orders View Selector Dropdown */}
                    <select
                      value={activeOrdersView}
                      onChange={(e) => {
                        const view = e.target.value as "incoming" | "outgoing";
                        setActiveOrdersView(view);
                        if (
                          view === "incoming" &&
                          !hasLoadedIncomingOrders
                        ) {
                          loadIncomingOrders();
                        } else if (
                          view === "outgoing" &&
                          !hasLoadedOutgoingOrders
                        ) {
                          loadOutgoingOrders();
                        }
                      }}
                      style={{
                        padding: "12px 16px",
                        borderRadius: "6px",
                        border: "1px solid #d0dce6",
                        background: "#ffffff",
                        color: "#1a365d",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "600",
                        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.04)",
                      }}
                    >
                      <option value="incoming">📥 Incoming Orders</option>
                      <option value="outgoing">📤 Outgoing Orders</option>
                    </select>
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
                                      index % 2 === 0
                                        ? "#ffffff"
                                        : "#f8fafc",
                                  }}
                                >
                                  <td
                                    style={{
                                      padding: "16px",
                                      color: "#1a365d",
                                      fontWeight: "600",
                                    }}
                                  >
                                    {order.itemName}
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
                                    {order.quantity} units
                                  </td>
                                  <td
                                    style={{
                                      padding: "16px",
                                      color: "#1a365d",
                                      fontWeight: "600",
                                    }}
                                  >
                                    {order.itemCurrency}{" "}
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
                                      index % 2 === 0
                                        ? "#ffffff"
                                        : "#f8fafc",
                                  }}
                                >
                                  <td
                                    style={{
                                      padding: "16px",
                                      color: "#1a365d",
                                      fontWeight: "600",
                                    }}
                                  >
                                    {order.itemName}
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
                                    {order.quantity} units
                                  </td>
                                  <td
                                    style={{
                                      padding: "16px",
                                      color: "#1a365d",
                                      fontWeight: "600",
                                    }}
                                  >
                                    {order.itemCurrency}{" "}
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

              {activeWarehouseTab === "settings" && (
                <Settings
                  quotationTemplate={quotationTemplate}
                  inquiryTemplate={inquiryTemplate}
                  onSaveTemplate={saveTemplate}
                  onLoadTemplate={loadTemplate}
                />
              )}

              {activeWarehouseTab === "upload" && (
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
      </main>
    </div>
  );
}
