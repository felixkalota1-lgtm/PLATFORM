import React from "react";

interface Product {
  id: string;
  name: string;
  partNumber: string;
  price: number;
  qty: number;
  stock: string;
  image?: string;
  currency?: string;
}

interface HistoryItem {
  id: string;
  number: string;
  date: string;
  items: any[];
  createdAt: string;
  recipientName?: string;
  recipientEmail?: string;
  recipientCompany?: string;
  inquiryBody?: string;
  letterhead?: Letterhead | null;
}

interface Letterhead {
  id: string;
  imageBase64: string;
  fileName: string;
  uploadedAt: string;
  type: "inquiry";
}

interface InquiriesProps {
  items: Product[];
  history?: HistoryItem[];
  letterhead?: Letterhead | null;
  vendors?: Array<{
    id: string;
    name: string;
    email: string;
    company?: string;
    status?: "accepted" | "pending";
  }>;
  onGeneratePDF?: (
    inquiry: any,
    letterRef: HTMLDivElement | null,
  ) => Promise<void>;
  onSaveInquiry?: (inquiry: any) => Promise<void>;
  onSendEmail?: () => void;
  onDeleteHistory?: (id: string) => void;
  onResendToVendors?: (
    inquiry: any,
    vendors: Array<{ id: string; name: string; email: string }>,
  ) => Promise<any>;
  onNavigateToVendors?: () => void;
  onRefreshVendors?: () => Promise<void>;
  preFillRecipient?: {
    name: string;
    email: string;
    company: string;
  };
}

export default function Inquiries({
  items,
  history = [],
  letterhead = null,
  vendors = [],
  onGeneratePDF,
  onSaveInquiry,
  onSendEmail,
  onDeleteHistory,
  onResendToVendors,
  onNavigateToVendors,
  onRefreshVendors,
  preFillRecipient,
}: InquiriesProps) {
  const [selectedHistoryId, setSelectedHistoryId] = React.useState<
    string | null
  >(null);
  const [previewId, setPreviewId] = React.useState<string | null>(null);
  const [showCompositor, setShowCompositor] = React.useState(false);
  const [showAddProduct, setShowAddProduct] = React.useState(false);
  const [showVendorSelectionModal, setShowVendorSelectionModal] =
    React.useState(false);
  const [selectedVendorIds, setSelectedVendorIds] = React.useState<Set<string>>(
    new Set(),
  );
  const [inquiryForResend, setInquiryForResend] =
    React.useState<HistoryItem | null>(null);
  const [isResendingInquiry, setIsResendingInquiry] = React.useState(false);
  const [localItems, setLocalItems] = React.useState<Product[]>(items);
  const [newProduct, setNewProduct] = React.useState({
    name: "",
    partNumber: "",
    qty: 1,
    price: 0,
  });
  const [compositorData, setCompositorData] = React.useState({
    recipientName: preFillRecipient?.name || "",
    recipientEmail: preFillRecipient?.email || "",
    recipientCompany: preFillRecipient?.company || "",
    inquiryBody: "",
  });
  const [currentInquiry, setCurrentInquiry] = React.useState<{
    id: string;
    number: string;
    date: string;
    recipientName: string;
    recipientEmail: string;
    recipientCompany: string;
    inquiryBody: string;
    items: Product[];
    letterhead: Letterhead | null;
  } | null>(null);
  const letterRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    console.log(
      `Inquiries component received - items: ${items.length}, history: ${history.length}`,
    );
    // Auto-focus on compositor if recipient is pre-filled
    if (preFillRecipient && !showCompositor) {
      setShowCompositor(true);
    }
    // Sync items from parent with local state
    setLocalItems(items);
  }, [preFillRecipient, items]);

  React.useEffect(() => {
    // Update compositor data when preFillRecipient changes
    if (preFillRecipient) {
      setCompositorData({
        recipientName: preFillRecipient.name,
        recipientEmail: preFillRecipient.email,
        recipientCompany: preFillRecipient.company,
        inquiryBody: "",
      });
    }
  }, [preFillRecipient]);

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.price * item.qty, 0);
  };

  const formatCurrency = (value: number, currency?: string) => {
    const symbol =
      currency === "USD"
        ? "$"
        : currency === "ZWK"
          ? "ZK"
          : currency === "EUR"
            ? "€"
            : "£";
    return `${symbol}${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleCompositorSubmit = async () => {
    if (!compositorData.recipientName || !compositorData.inquiryBody) {
      alert("Please fill in recipient name and inquiry message");
      return;
    }
    if (localItems.length === 0) {
      alert("Please add at least one item to the inquiry");
      return;
    }
    // Create an inquiry metadata
    const inquiryId = "I-" + Date.now();
    const inquiryNumber = "INQ-" + Date.now();
    const today = new Date().toISOString().split("T")[0];

    const composedInquiry = {
      id: inquiryId,
      number: inquiryNumber,
      date: today,
      recipientName: compositorData.recipientName,
      recipientEmail: compositorData.recipientEmail,
      recipientCompany: compositorData.recipientCompany,
      inquiryBody: compositorData.inquiryBody,
      items: [...localItems],
      letterhead: letterhead || null,
    };

    setCurrentInquiry(composedInquiry);
    setShowCompositor(false);

    // Save inquiry to IndexedDB and history
    if (onSaveInquiry) {
      try {
        await onSaveInquiry(composedInquiry);
      } catch (error) {
        console.error("Error saving inquiry:", error);
        alert("Failed to save inquiry");
      }
    }
  };

  const handleAddManualProduct = () => {
    if (!newProduct.name.trim()) {
      alert("Please enter a product name");
      return;
    }

    const product: Product = {
      id: "manual-" + Date.now(),
      name: newProduct.name,
      partNumber: newProduct.partNumber || "N/A",
      price: newProduct.price,
      qty: newProduct.qty,
      stock: "Manual Entry",
      currency: "USD",
    };

    setLocalItems([...localItems, product]);
    setNewProduct({ name: "", partNumber: "", qty: 1, price: 0 });
    setShowAddProduct(false);
  };

  const handleRemoveProduct = (productId: string) => {
    setLocalItems(localItems.filter((p) => p.id !== productId));
  };

  const handleGeneratePDF = async () => {
    if (!currentInquiry) {
      alert("Please compose an inquiry first");
      return;
    }
    // Call the parent callback with the composed inquiry data
    if (onGeneratePDF) {
      try {
        await onGeneratePDF(currentInquiry, letterRef.current);
      } catch (error) {
        console.error("Error generating PDF:", error);
        alert("Failed to generate PDF. Check console for details.");
      }
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div
        style={{
          padding: "24px 32px",
          borderBottom: "1px solid #e2e8f0",
          background: "#ffffff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2
          style={{
            margin: "0",
            fontSize: "24px",
            fontWeight: "700",
            color: "#1a365d",
          }}
        >
          Inquiries
        </h2>
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={() => {
              setCompositorData({
                recipientName: "",
                recipientEmail: "",
                recipientCompany: "",
                inquiryBody: "",
              });
              setShowCompositor(!showCompositor);
            }}
            style={{
              padding: "10px 20px",
              background: "#16a34a",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "600",
              transition: "all 0.25s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#15803d";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#16a34a";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Create Inquiry
          </button>
          {items.length > 0 && (
            <>
              <button
                onClick={() => setShowCompositor(!showCompositor)}
                style={{
                  padding: "10px 20px",
                  background: "#0284c7",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "600",
                  transition: "all 0.25s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#0369a1";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#0284c7";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                Compose with Items
              </button>
              <button
                onClick={handleGeneratePDF}
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
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#5b7c99";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                Generate & Download PDF
              </button>
              <button
                onClick={onSendEmail}
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
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#64748b";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                Send via Email
              </button>
            </>
          )}
          {(localItems.length > 0 || history.length > 0) && (
            <button
              onClick={() => {
                if (window.confirm("Delete this inquiry?")) {
                  onDeleteHistory?.("clear-current");
                }
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
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#dc2626";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              Retract
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: "32px", overflow: "auto" }}>
        {/* Products Section */}
        <div style={{ marginBottom: "32px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <h3
              style={{
                margin: "0",
                fontSize: "16px",
                fontWeight: "700",
                color: "#1a365d",
              }}
            >
              Inquiry Items ({localItems.length})
            </h3>
            <button
              onClick={() => setShowAddProduct(!showAddProduct)}
              style={{
                padding: "8px 16px",
                background: "#2563eb",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "600",
                transition: "all 0.25s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#1d4ed8";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#2563eb";
              }}
            >
              + Add Product
            </button>
          </div>

          {/* Add Product Form */}
          {showAddProduct && (
            <div
              style={{
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                borderRadius: "8px",
                padding: "16px",
                marginBottom: "16px",
              }}
            >
              <h4
                style={{
                  margin: "0 0 12px 0",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#1a365d",
                }}
              >
                Add Product Manually
              </h4>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr 1fr",
                  gap: "12px",
                  marginBottom: "12px",
                }}
              >
                <input
                  type="text"
                  placeholder="Product Name"
                  value={newProduct.name}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, name: e.target.value })
                  }
                  style={{
                    padding: "8px 12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "4px",
                    fontSize: "13px",
                    fontFamily: "inherit",
                  }}
                />
                <input
                  type="text"
                  placeholder="Part #"
                  value={newProduct.partNumber}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, partNumber: e.target.value })
                  }
                  style={{
                    padding: "8px 12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "4px",
                    fontSize: "13px",
                    fontFamily: "inherit",
                  }}
                />
                <input
                  type="number"
                  placeholder="Qty"
                  min="1"
                  value={newProduct.qty}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      qty: parseInt(e.target.value) || 1,
                    })
                  }
                  style={{
                    padding: "8px 12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "4px",
                    fontSize: "13px",
                    fontFamily: "inherit",
                  }}
                />
                <input
                  type="number"
                  placeholder="Price (optional)"
                  step="0.01"
                  value={newProduct.price}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      price: parseFloat(e.target.value) || 0,
                    })
                  }
                  style={{
                    padding: "8px 12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "4px",
                    fontSize: "13px",
                    fontFamily: "inherit",
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={handleAddManualProduct}
                  style={{
                    padding: "8px 16px",
                    background: "#10b981",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "600",
                  }}
                >
                  Add
                </button>
                <button
                  onClick={() => setShowAddProduct(false)}
                  style={{
                    padding: "8px 16px",
                    background: "#e2e8f0",
                    color: "#1a365d",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "600",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Products List */}
          {localItems.length > 0 && (
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "13px",
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: "#f1f5f9",
                      borderBottom: "1px solid #e2e8f0",
                    }}
                  >
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        fontWeight: "600",
                        color: "#1a365d",
                        fontSize: "12px",
                      }}
                    >
                      Product
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "center",
                        fontWeight: "600",
                        color: "#1a365d",
                        fontSize: "12px",
                      }}
                    >
                      Part #
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "center",
                        fontWeight: "600",
                        color: "#1a365d",
                        fontSize: "12px",
                      }}
                    >
                      Qty
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "center",
                        fontWeight: "600",
                        color: "#1a365d",
                        fontSize: "12px",
                      }}
                    >
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {localItems.map((item, index) => (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: "1px solid #e2e8f0",
                        background: index % 2 === 0 ? "#ffffff" : "#f9fafb",
                      }}
                    >
                      <td
                        style={{
                          padding: "12px",
                          color: "#1a365d",
                          fontWeight: "500",
                        }}
                      >
                        {item.name}
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          textAlign: "center",
                          color: "#64748b",
                        }}
                      >
                        {item.partNumber}
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          textAlign: "center",
                          color: "#1a365d",
                          fontWeight: "600",
                        }}
                      >
                        {item.qty}
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          textAlign: "center",
                        }}
                      >
                        <button
                          onClick={() => handleRemoveProduct(item.id)}
                          style={{
                            padding: "4px 8px",
                            background: "#fee2e2",
                            color: "#991b1b",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "12px",
                            fontWeight: "600",
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
          )}

          {localItems.length === 0 && (
            <div
              style={{
                padding: "24px",
                textAlign: "center",
                background: "#f9fafb",
                borderRadius: "8px",
                border: "1px dashed #cbd5e1",
              }}
            >
              <p
                style={{
                  margin: "0",
                  color: "#64748b",
                  fontSize: "13px",
                }}
              >
                No items added yet. Click "Add Product" to add items to your
                inquiry.
              </p>
            </div>
          )}
        </div>

        {showCompositor && (
          <div
            style={{
              background: "#f0f9ff",
              border: "2px solid #0284c7",
              borderRadius: "8px",
              padding: "24px",
              marginBottom: "32px",
            }}
          >
            <h3
              style={{
                margin: "0 0 20px 0",
                fontSize: "16px",
                fontWeight: "700",
                color: "#1a365d",
              }}
            >
              Compose Inquiry Letter
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
                marginBottom: "16px",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: "600",
                    marginBottom: "6px",
                    color: "#1a365d",
                  }}
                >
                  Recipient Name *
                </label>
                <input
                  type="text"
                  value={compositorData.recipientName}
                  onChange={(e) =>
                    setCompositorData({
                      ...compositorData,
                      recipientName: e.target.value,
                    })
                  }
                  placeholder="e.g., John Smith"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    fontSize: "13px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "4px",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: "600",
                    marginBottom: "6px",
                    color: "#1a365d",
                  }}
                >
                  Email Address
                </label>
                <input
                  type="email"
                  value={compositorData.recipientEmail}
                  onChange={(e) =>
                    setCompositorData({
                      ...compositorData,
                      recipientEmail: e.target.value,
                    })
                  }
                  placeholder="recipient@company.com"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    fontSize: "13px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "4px",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: "600",
                  marginBottom: "6px",
                  color: "#1a365d",
                }}
              >
                Company Name
              </label>
              <input
                type="text"
                value={compositorData.recipientCompany}
                onChange={(e) =>
                  setCompositorData({
                    ...compositorData,
                    recipientCompany: e.target.value,
                  })
                }
                placeholder="Company Ltd."
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  fontSize: "13px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "4px",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: "600",
                  marginBottom: "6px",
                  color: "#1a365d",
                }}
              >
                Inquiry Message *
              </label>
              <textarea
                value={compositorData.inquiryBody}
                onChange={(e) =>
                  setCompositorData({
                    ...compositorData,
                    inquiryBody: e.target.value,
                  })
                }
                placeholder="Write your inquiry message here..."
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  fontSize: "13px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "4px",
                  boxSizing: "border-box",
                  minHeight: "120px",
                  fontFamily: "inherit",
                  resize: "vertical",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={handleCompositorSubmit}
                style={{
                  padding: "10px 24px",
                  background: "#16a34a",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "600",
                }}
              >
                Save & Preview
              </button>
              <button
                onClick={() => setShowCompositor(false)}
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
            </div>
          </div>
        )}

        {localItems.length === 0 && history.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              paddingTop: "60px",
              color: "#64748b",
            }}
          >
            <p
              style={{
                fontSize: "16px",
                fontWeight: "500",
                margin: "0 0 8px 0",
              }}
            >
              No inquiries yet
            </p>
            <p style={{ fontSize: "13px", margin: "0", color: "#94a3b8" }}>
              Click "Add Product" to add items and create an inquiry
            </p>
          </div>
        ) : (
          <div>
            {localItems.length > 0 && (
              <>
                {/* Formal Inquiry Letter */}
                <div
                  ref={letterRef}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #d0dce6",
                    borderRadius: "8px",
                    padding: "40px",
                    marginBottom: "32px",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
                  }}
                >
                  {/* Letterhead */}
                  {letterhead && (
                    <div
                      style={{
                        marginBottom: "40px",
                        paddingBottom: "24px",
                        borderBottom: "2px solid #e2e8f0",
                        textAlign: "center",
                      }}
                    >
                      <img
                        src={letterhead.imageBase64}
                        alt="Company Letterhead"
                        style={{
                          maxHeight: "120px",
                          objectFit: "contain",
                        }}
                      />
                    </div>
                  )}

                  {/* Date & Document Number */}
                  <div
                    style={{
                      marginBottom: "32px",
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          margin: "0 0 4px 0",
                          fontSize: "11px",
                          color: "#94a3b8",
                          fontWeight: "600",
                          textTransform: "uppercase",
                        }}
                      >
                        Date Issued
                      </p>
                      <p
                        style={{
                          margin: "0",
                          fontSize: "14px",
                          color: "#1a365d",
                          fontWeight: "600",
                        }}
                      >
                        {new Date().toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <div>
                      <p
                        style={{
                          margin: "0 0 4px 0",
                          fontSize: "11px",
                          color: "#94a3b8",
                          fontWeight: "600",
                          textTransform: "uppercase",
                        }}
                      >
                        Inquiry Number
                      </p>
                      <p
                        style={{
                          margin: "0",
                          fontSize: "14px",
                          color: "#1a365d",
                          fontWeight: "600",
                        }}
                      >
                        INQ-{Date.now()}
                      </p>
                    </div>
                  </div>

                  {/* Recipient Address */}
                  <div style={{ marginBottom: "32px" }}>
                    <p
                      style={{
                        margin: "0 0 12px 0",
                        fontSize: "12px",
                        color: "#64748b",
                        fontWeight: "600",
                      }}
                    >
                      To:
                    </p>
                    <p
                      style={{
                        margin: "0 0 4px 0",
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#1a365d",
                      }}
                    >
                      {compositorData.recipientName || "Valued Supplier"}
                    </p>
                    {compositorData.recipientCompany && (
                      <p
                        style={{
                          margin: "0",
                          fontSize: "12px",
                          color: "#64748b",
                        }}
                      >
                        {compositorData.recipientCompany}
                      </p>
                    )}
                    {compositorData.recipientEmail && (
                      <p
                        style={{
                          margin: "0",
                          fontSize: "12px",
                          color: "#64748b",
                        }}
                      >
                        {compositorData.recipientEmail}
                      </p>
                    )}
                  </div>

                  {/* Salutation */}
                  <div style={{ marginBottom: "24px" }}>
                    <p
                      style={{
                        margin: "0 0 12px 0",
                        fontSize: "14px",
                        color: "#1a365d",
                      }}
                    >
                      Dear{" "}
                      {compositorData.recipientName
                        ? compositorData.recipientName.split(" ")[0]
                        : "Sir/Madam"}
                      ,
                    </p>
                  </div>

                  {/* Inquiry Body */}
                  <div style={{ marginBottom: "32px" }}>
                    <p
                      style={{
                        margin: "0 0 16px 0",
                        fontSize: "14px",
                        lineHeight: "1.6",
                        color: "#475569",
                      }}
                    >
                      {compositorData.inquiryBody ||
                        "We hope this inquiries finds you well. We are interested in the following products and would like to request further information regarding availability and pricing."}
                    </p>
                  </div>

                  {/* Items Table */}
                  <div style={{ marginBottom: "32px", overflowX: "auto" }}>
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        pageBreakInside: "avoid" as any,
                      }}
                    >
                      <thead>
                        <tr
                          style={{
                            background: "#f8fafc",
                            borderBottom: "2px solid #e2e8f0",
                            pageBreakInside: "avoid" as any,
                          }}
                        >
                          <th
                            style={{
                              padding: "12px",
                              textAlign: "left",
                              fontSize: "12px",
                              fontWeight: "700",
                              color: "#1a365d",
                              textTransform: "uppercase",
                            }}
                          >
                            Product Name
                          </th>
                          <th
                            style={{
                              padding: "12px",
                              textAlign: "center",
                              fontSize: "12px",
                              fontWeight: "700",
                              color: "#1a365d",
                              textTransform: "uppercase",
                            }}
                          >
                            Part Number
                          </th>
                          <th
                            style={{
                              padding: "12px",
                              textAlign: "center",
                              fontSize: "12px",
                              fontWeight: "700",
                              color: "#1a365d",
                              textTransform: "uppercase",
                            }}
                          >
                            Quantity Required
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {localItems.map((item, index) => (
                          <tr
                            key={item.id}
                            style={{
                              borderBottom: "1px solid #e2e8f0",
                              background:
                                index % 2 === 0 ? "#ffffff" : "#f9fafb",
                              pageBreakInside: "avoid" as any,
                            }}
                          >
                            <td
                              style={{
                                padding: "12px",
                                fontSize: "13px",
                                color: "#1a365d",
                              }}
                            >
                              {item.name}
                            </td>
                            <td
                              style={{
                                padding: "12px",
                                textAlign: "center",
                                fontSize: "13px",
                                color: "#64748b",
                              }}
                            >
                              {item.partNumber}
                            </td>
                            <td
                              style={{
                                padding: "12px",
                                textAlign: "center",
                                fontSize: "13px",
                                color: "#1a365d",
                                fontWeight: "600",
                              }}
                            >
                              {item.qty}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Closing */}
                  <div
                    style={{
                      marginBottom: "40px",
                      paddingTop: "24px",
                      borderTop: "1px solid #e2e8f0",
                    }}
                  >
                    <p
                      style={{
                        margin: "0 0 12px 0",
                        fontSize: "14px",
                        lineHeight: "1.6",
                        color: "#475569",
                      }}
                    >
                      We would appreciate your prompt response regarding the
                      above inquiry. Please provide detailed information on
                      pricing, lead times, and any applicable discounts.
                    </p>
                    <p
                      style={{
                        margin: "0 0 12px 0",
                        fontSize: "14px",
                        color: "#475569",
                      }}
                    >
                      Thank you for your attention to this matter.
                    </p>
                    <p
                      style={{
                        margin: "0 0 40px 0",
                        fontSize: "14px",
                        color: "#475569",
                      }}
                    >
                      Best regards,
                    </p>
                    <p
                      style={{
                        margin: "0",
                        fontSize: "12px",
                        color: "#64748b",
                        borderTop: "1px solid #cbd5e1",
                        paddingTop: "40px",
                        minHeight: "60px",
                      }}
                    >
                      [Signature line for printing]
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Inquiry History */}
            {history && history.length > 0 && (
              <div style={{ marginTop: "32px" }}>
                <h3
                  style={{
                    margin: "0 0 18px 0",
                    fontSize: "18px",
                    fontWeight: "700",
                    color: "#5b7c99",
                  }}
                >
                  Previous Inquiries ({history.length})
                </h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: "16px",
                  }}
                >
                  {history.map((histItem) => (
                    <div
                      key={histItem.id}
                      onClick={() =>
                        setSelectedHistoryId(
                          selectedHistoryId === histItem.id
                            ? null
                            : histItem.id,
                        )
                      }
                      style={{
                        padding: "20px",
                        border: "1px solid #d0dce6",
                        borderRadius: "8px",
                        cursor: "pointer",
                        background:
                          selectedHistoryId === histItem.id
                            ? "#f0f4f8"
                            : "#ffffff",
                        transition: "all 0.2s ease",
                        boxShadow:
                          selectedHistoryId === histItem.id
                            ? "0 4px 12px rgba(0, 0, 0, 0.08)"
                            : "none",
                      }}
                    >
                      <p
                        style={{
                          margin: "0 0 8px 0",
                          fontWeight: "600",
                          color: "#1a365d",
                          fontSize: "14px",
                        }}
                      >
                        {histItem.number}
                      </p>
                      <p
                        style={{
                          margin: "0 0 4px 0",
                          color: "#64748b",
                          fontSize: "12px",
                        }}
                      >
                        {new Date(histItem.date).toLocaleDateString()}
                      </p>
                      {histItem.recipientName && (
                        <p
                          style={{
                            margin: "0",
                            color: "#94a3b8",
                            fontSize: "12px",
                          }}
                        >
                          To: {histItem.recipientName}
                        </p>
                      )}
                      {selectedHistoryId === histItem.id && (
                        <div
                          style={{
                            marginTop: "12px",
                            paddingTop: "12px",
                            borderTop: "1px solid #e2e8f0",
                            display: "flex",
                            gap: "8px",
                            flexWrap: "wrap",
                          }}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewId(
                                previewId === histItem.id ? null : histItem.id,
                              );
                            }}
                            style={{
                              flex: 1,
                              minWidth: "60px",
                              padding: "6px 12px",
                              background: "#5b7c99",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "12px",
                              fontWeight: "600",
                            }}
                          >
                            Preview
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setInquiryForResend(histItem);
                              setSelectedVendorIds(new Set());
                              setShowVendorSelectionModal(true);
                              // Refresh vendors when modal opens
                              if (onRefreshVendors) {
                                onRefreshVendors().catch((err) =>
                                  console.error(
                                    "Failed to refresh vendors:",
                                    err,
                                  ),
                                );
                              }
                            }}
                            style={{
                              flex: 1,
                              minWidth: "60px",
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
                            Send
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm("Delete this inquiry?")) {
                                if (onDeleteHistory)
                                  onDeleteHistory(histItem.id);
                              }
                            }}
                            style={{
                              flex: 1,
                              minWidth: "60px",
                              padding: "6px 12px",
                              background: "#dc2626",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "12px",
                              fontWeight: "600",
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Preview Section */}
                {previewId && history && (
                  <div style={{ marginTop: "32px" }}>
                    {(() => {
                      const previewItem = history.find(
                        (item) => item.id === previewId,
                      );
                      if (!previewItem) return null;

                      return (
                        <div
                          style={{
                            background: "#ffffff",
                            border: "1px solid #d0dce6",
                            borderRadius: "8px",
                            padding: "40px",
                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
                          }}
                        >
                          {/* Letterhead - if available */}
                          {previewItem.letterhead?.imageBase64 && (
                            <div
                              style={{
                                marginBottom: "40px",
                                paddingBottom: "24px",
                                borderBottom: "2px solid #e2e8f0",
                                textAlign: "center",
                              }}
                            >
                              <img
                                src={previewItem.letterhead.imageBase64}
                                alt="Company Letterhead"
                                style={{
                                  maxHeight: "120px",
                                  objectFit: "contain",
                                }}
                              />
                            </div>
                          )}

                          {/* Date & Number */}
                          <div
                            style={{
                              marginBottom: "32px",
                              display: "grid",
                              gridTemplateColumns: "1fr 1fr",
                            }}
                          >
                            <div>
                              <p
                                style={{
                                  margin: "0 0 4px 0",
                                  fontSize: "11px",
                                  color: "#94a3b8",
                                  fontWeight: "600",
                                  textTransform: "uppercase",
                                }}
                              >
                                Date Issued
                              </p>
                              <p
                                style={{
                                  margin: "0",
                                  fontSize: "14px",
                                  color: "#1a365d",
                                  fontWeight: "600",
                                }}
                              >
                                {new Date(previewItem.date).toLocaleDateString(
                                  "en-US",
                                  {
                                    weekday: "long",
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  },
                                )}
                              </p>
                            </div>
                            <div>
                              <p
                                style={{
                                  margin: "0 0 4px 0",
                                  fontSize: "11px",
                                  color: "#94a3b8",
                                  fontWeight: "600",
                                  textTransform: "uppercase",
                                }}
                              >
                                Inquiry Number
                              </p>
                              <p
                                style={{
                                  margin: "0",
                                  fontSize: "14px",
                                  color: "#1a365d",
                                  fontWeight: "600",
                                }}
                              >
                                {previewItem.number}
                              </p>
                            </div>
                          </div>

                          {/* Recipient */}
                          <div style={{ marginBottom: "32px" }}>
                            <p
                              style={{
                                margin: "0 0 12px 0",
                                fontSize: "12px",
                                color: "#64748b",
                                fontWeight: "600",
                              }}
                            >
                              To:
                            </p>
                            <p
                              style={{
                                margin: "0 0 4px 0",
                                fontSize: "14px",
                                fontWeight: "600",
                                color: "#1a365d",
                              }}
                            >
                              {previewItem.recipientName || "Valued Supplier"}
                            </p>
                            {previewItem.recipientCompany && (
                              <p
                                style={{
                                  margin: "0",
                                  fontSize: "12px",
                                  color: "#64748b",
                                }}
                              >
                                {previewItem.recipientCompany}
                              </p>
                            )}
                            {previewItem.recipientEmail && (
                              <p
                                style={{
                                  margin: "0",
                                  fontSize: "12px",
                                  color: "#64748b",
                                }}
                              >
                                {previewItem.recipientEmail}
                              </p>
                            )}
                          </div>

                          {/* Salutation */}
                          <div style={{ marginBottom: "24px" }}>
                            <p
                              style={{
                                margin: "0 0 12px 0",
                                fontSize: "14px",
                                color: "#1a365d",
                              }}
                            >
                              Dear{" "}
                              {previewItem.recipientName
                                ? previewItem.recipientName.split(" ")[0]
                                : "Sir/Madam"}
                              ,
                            </p>
                          </div>

                          {/* Body */}
                          <div style={{ marginBottom: "32px" }}>
                            <p
                              style={{
                                margin: "0 0 16px 0",
                                fontSize: "14px",
                                lineHeight: "1.6",
                                color: "#475569",
                              }}
                            >
                              {previewItem.inquiryBody ||
                                "We hope this inquiry finds you well. We are interested in the following products and would like to request further information regarding availability and pricing."}
                            </p>
                          </div>

                          {/* Items Table */}
                          <div
                            style={{ marginBottom: "32px", overflowX: "auto" }}
                          >
                            <table
                              style={{
                                width: "100%",
                                borderCollapse: "collapse",
                                pageBreakInside: "avoid" as any,
                              }}
                            >
                              <thead>
                                <tr
                                  style={{
                                    background: "#f8fafc",
                                    borderBottom: "2px solid #e2e8f0",
                                    pageBreakInside: "avoid" as any,
                                  }}
                                >
                                  <th
                                    style={{
                                      padding: "12px",
                                      textAlign: "left",
                                      fontSize: "12px",
                                      fontWeight: "700",
                                      color: "#1a365d",
                                      textTransform: "uppercase",
                                    }}
                                  >
                                    Product Name
                                  </th>
                                  <th
                                    style={{
                                      padding: "12px",
                                      textAlign: "center",
                                      fontSize: "12px",
                                      fontWeight: "700",
                                      color: "#1a365d",
                                      textTransform: "uppercase",
                                    }}
                                  >
                                    Part Number
                                  </th>
                                  <th
                                    style={{
                                      padding: "12px",
                                      textAlign: "center",
                                      fontSize: "12px",
                                      fontWeight: "700",
                                      color: "#1a365d",
                                      textTransform: "uppercase",
                                    }}
                                  >
                                    Qty Required
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {previewItem.items &&
                                  previewItem.items.map(
                                    (item: any, index: number) => (
                                      <tr
                                        key={index}
                                        style={{
                                          borderBottom: "1px solid #e2e8f0",
                                          backgroundColor:
                                            index % 2 === 0
                                              ? "#ffffff"
                                              : "#f9fafb",
                                          pageBreakInside: "avoid" as any,
                                        }}
                                      >
                                        <td
                                          style={{
                                            padding: "12px",
                                            textAlign: "left",
                                            fontSize: "13px",
                                          }}
                                        >
                                          {item.name}
                                        </td>
                                        <td
                                          style={{
                                            padding: "12px",
                                            textAlign: "center",
                                            fontSize: "13px",
                                          }}
                                        >
                                          {item.partNumber}
                                        </td>
                                        <td
                                          style={{
                                            padding: "12px",
                                            textAlign: "center",
                                            fontSize: "13px",
                                          }}
                                        >
                                          {item.qty}
                                        </td>
                                      </tr>
                                    ),
                                  )}
                              </tbody>
                            </table>
                          </div>

                          {/* Close Preview Button */}
                          <button
                            onClick={() => setPreviewId(null)}
                            style={{
                              padding: "10px 20px",
                              background: "#e2e8f0",
                              color: "#1a365d",
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontSize: "13px",
                              fontWeight: "600",
                            }}
                          >
                            Close Preview
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* Vendor Selection Modal */}
            {showVendorSelectionModal && inquiryForResend && (
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
                  zIndex: 9999,
                }}
                onClick={() => {
                  if (!isResendingInquiry) {
                    setShowVendorSelectionModal(false);
                    setInquiryForResend(null);
                  }
                }}
              >
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    background: "white",
                    borderRadius: "12px",
                    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
                    maxWidth: "500px",
                    width: "90%",
                    maxHeight: "80vh",
                    overflow: "auto",
                  }}
                >
                  {/* Modal Header */}
                  <div
                    style={{
                      padding: "24px",
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
                      Send "
                      <span style={{ color: "#5b7c99" }}>
                        {inquiryForResend.number}
                      </span>
                      " to Vendors
                    </h2>
                    <button
                      onClick={() => {
                        if (!isResendingInquiry) {
                          setShowVendorSelectionModal(false);
                          setInquiryForResend(null);
                        }
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        fontSize: "24px",
                        cursor: "pointer",
                        color: "#94a3b8",
                      }}
                    >
                      ×
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div style={{ padding: "24px" }}>
                    {vendors && vendors.length > 0 ? (
                      <div>
                        {/* Header */}
                        <p
                          style={{
                            margin: "0 0 16px 0",
                            fontSize: "14px",
                            color: "#64748b",
                            fontWeight: "600",
                          }}
                        >
                          📋 Your Vendor Connections
                        </p>

                        {/* Accepted Vendors - Selectable */}
                        {(() => {
                          const acceptedVendors = vendors.filter(
                            (v) => v.status === "accepted",
                          );
                          if (acceptedVendors.length > 0) {
                            return (
                              <div style={{ marginBottom: "24px" }}>
                                <p
                                  style={{
                                    margin: "0 0 12px 0",
                                    fontSize: "12px",
                                    fontWeight: "600",
                                    color: "#16a34a",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px",
                                  }}
                                >
                                  ✓ Connected Vendors ({acceptedVendors.length})
                                  - SELECT BELOW TO SEND
                                </p>
                                <div style={{ marginBottom: "12px" }}>
                                  {acceptedVendors.map((vendor) => (
                                    <label
                                      key={vendor.id}
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        padding: "12px",
                                        marginBottom: "8px",
                                        border: "2px solid #bbf7d0",
                                        borderRadius: "6px",
                                        cursor: "pointer",
                                        background: selectedVendorIds.has(
                                          vendor.id,
                                        )
                                          ? "#f0fdf4"
                                          : "#ffffff",
                                        transition: "all 0.2s ease",
                                        boxShadow: selectedVendorIds.has(
                                          vendor.id,
                                        )
                                          ? "0 4px 8px rgba(22, 163, 74, 0.1)"
                                          : "none",
                                      }}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={selectedVendorIds.has(
                                          vendor.id,
                                        )}
                                        onChange={(e) => {
                                          const newSelectedIds = new Set(
                                            selectedVendorIds,
                                          );
                                          if (e.target.checked) {
                                            newSelectedIds.add(vendor.id);
                                          } else {
                                            newSelectedIds.delete(vendor.id);
                                          }
                                          setSelectedVendorIds(newSelectedIds);
                                        }}
                                        style={{
                                          marginRight: "12px",
                                          cursor: "pointer",
                                          width: "18px",
                                          height: "18px",
                                          accentColor: "#16a34a",
                                        }}
                                      />
                                      <div style={{ flex: 1 }}>
                                        <p
                                          style={{
                                            margin: 0,
                                            fontSize: "14px",
                                            fontWeight: "600",
                                            color: "#1a365d",
                                          }}
                                        >
                                          {vendor.name}
                                        </p>
                                        <p
                                          style={{
                                            margin: "4px 0 0 0",
                                            fontSize: "12px",
                                            color: "#64748b",
                                          }}
                                        >
                                          {vendor.email}
                                        </p>
                                      </div>
                                      <span
                                        style={{
                                          marginLeft: "12px",
                                          fontSize: "11px",
                                          fontWeight: "700",
                                          color: "#ffffff",
                                          background: "#16a34a",
                                          padding: "4px 10px",
                                          borderRadius: "4px",
                                          whiteSpace: "nowrap",
                                        }}
                                      >
                                        ✓ Connected
                                      </span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })()}

                        {/* Pending Vendors - Read Only Reference */}
                        {(() => {
                          const pendingVendors = vendors.filter(
                            (v) => v.status === "pending",
                          );
                          if (pendingVendors.length > 0) {
                            return (
                              <div>
                                <p
                                  style={{
                                    margin: "0 0 12px 0",
                                    fontSize: "12px",
                                    fontWeight: "600",
                                    color: "#f97316",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px",
                                  }}
                                >
                                  ⏳ Pending Connections (
                                  {pendingVendors.length}) - AWAITING ACCEPTANCE
                                </p>
                                <div>
                                  {pendingVendors.map((vendor) => (
                                    <div
                                      key={vendor.id}
                                      style={{
                                        padding: "12px",
                                        marginBottom: "8px",
                                        border: "1px solid #fed7aa",
                                        borderRadius: "6px",
                                        background: "#fffbeb",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                      }}
                                    >
                                      <div style={{ flex: 1 }}>
                                        <p
                                          style={{
                                            margin: 0,
                                            fontSize: "13px",
                                            fontWeight: "600",
                                            color: "#92400e",
                                          }}
                                        >
                                          {vendor.name}
                                        </p>
                                        <p
                                          style={{
                                            margin: "4px 0 0 0",
                                            fontSize: "11px",
                                            color: "#b45309",
                                          }}
                                        >
                                          {vendor.email}
                                        </p>
                                      </div>
                                      <span
                                        style={{
                                          marginLeft: "12px",
                                          fontSize: "10px",
                                          fontWeight: "700",
                                          color: "#f97316",
                                          background: "#fed7aa",
                                          padding: "4px 10px",
                                          borderRadius: "4px",
                                          whiteSpace: "nowrap",
                                        }}
                                      >
                                        ⏳ Pending
                                      </span>
                                    </div>
                                  ))}
                                </div>
                                <p
                                  style={{
                                    margin: "12px 0 0 0",
                                    fontSize: "11px",
                                    color: "#94a3b8",
                                    fontStyle: "italic",
                                  }}
                                >
                                  💡 Once these vendors accept your connection
                                  request, they'll appear in the connected list
                                  above.
                                </p>
                              </div>
                            );
                          }
                          return null;
                        })()}

                        {/* Selection Summary */}
                        {selectedVendorIds.size > 0 && (
                          <div
                            style={{
                              padding: "12px",
                              backgroundColor: "#f0fdf4",
                              border: "2px solid #86efac",
                              borderRadius: "6px",
                              marginTop: "16px",
                              color: "#166534",
                              fontSize: "13px",
                              fontWeight: "600",
                            }}
                          >
                            ✓ {selectedVendorIds.size} vendor
                            {selectedVendorIds.size !== 1 ? "s" : ""} selected
                            for sending
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ textAlign: "center", padding: "32px 0" }}>
                        <p
                          style={{
                            margin: "0 0 12px 0",
                            fontSize: "32px",
                          }}
                        >
                          📭
                        </p>
                        <p
                          style={{
                            margin: "0 0 8px 0",
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#1a365d",
                          }}
                        >
                          No vendors yet
                        </p>
                        <p
                          style={{
                            margin: "0 0 16px 0",
                            fontSize: "12px",
                            color: "#94a3b8",
                          }}
                        >
                          Add vendors in the Vendors section to send inquiries
                        </p>
                        <button
                          onClick={() => {
                            setShowVendorSelectionModal(false);
                            setInquiryForResend(null);
                            if (onNavigateToVendors) {
                              onNavigateToVendors();
                            }
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
                          }}
                        >
                          Go to Vendors
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Modal Footer */}
                  {vendors &&
                    vendors.length > 0 &&
                    vendors.some((v) => v.status === "accepted") && (
                      <div
                        style={{
                          padding: "16px 24px",
                          borderTop: "1px solid #e2e8f0",
                          display: "flex",
                          gap: "12px",
                          justifyContent: "flex-end",
                        }}
                      >
                        <button
                          onClick={() => {
                            if (!isResendingInquiry) {
                              setShowVendorSelectionModal(false);
                              setInquiryForResend(null);
                              setSelectedVendorIds(new Set());
                            }
                          }}
                          disabled={isResendingInquiry}
                          style={{
                            padding: "10px 20px",
                            background: "#e2e8f0",
                            color: "#1a365d",
                            border: "none",
                            borderRadius: "6px",
                            cursor: isResendingInquiry
                              ? "not-allowed"
                              : "pointer",
                            fontSize: "13px",
                            fontWeight: "600",
                            opacity: isResendingInquiry ? 0.6 : 1,
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={async () => {
                            if (selectedVendorIds.size === 0) {
                              alert("Please select at least one vendor");
                              return;
                            }

                            try {
                              setIsResendingInquiry(true);

                              const acceptedVendors =
                                vendors?.filter(
                                  (v) => v.status === "accepted",
                                ) || [];
                              const selectedVendorsArray =
                                acceptedVendors.filter((v) =>
                                  selectedVendorIds.has(v.id),
                                );

                              if (onResendToVendors) {
                                console.log(
                                  `📤 RESEND: Preparing to send inquiry`,
                                  {
                                    inquiryNumber: inquiryForResend?.number,
                                    inquiryId: inquiryForResend?.id,
                                    hasBody: !!inquiryForResend?.inquiryBody,
                                    bodyLength:
                                      inquiryForResend?.inquiryBody?.length ||
                                      0,
                                    itemsCount:
                                      inquiryForResend?.items?.length || 0,
                                    vendorCount: selectedVendorsArray.length,
                                    inquiryKeys: Object.keys(
                                      inquiryForResend || {},
                                    ),
                                  },
                                );

                                const result = await onResendToVendors(
                                  inquiryForResend,
                                  selectedVendorsArray as any,
                                );

                                if (result.success.length > 0) {
                                  alert(
                                    `✅ Inquiry sent to ${result.success.length} vendor(s): ${result.success.join(", ")}${
                                      result.failed.length > 0
                                        ? `\n⚠️ Failed for: ${result.failed.map((f: any) => f.vendor).join(", ")}`
                                        : ""
                                    }`,
                                  );
                                } else if (result.failed.length > 0) {
                                  alert(
                                    `❌ Failed to send inquiry. Errors:\n${result.failed.map((f: any) => `${f.vendor}: ${f.error}`).join("\n")}`,
                                  );
                                }
                              }

                              setShowVendorSelectionModal(false);
                              setInquiryForResend(null);
                              setSelectedVendorIds(new Set());
                            } catch (error) {
                              alert(
                                `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`,
                              );
                            } finally {
                              setIsResendingInquiry(false);
                            }
                          }}
                          disabled={
                            selectedVendorIds.size === 0 || isResendingInquiry
                          }
                          style={{
                            padding: "10px 20px",
                            background:
                              selectedVendorIds.size === 0 || isResendingInquiry
                                ? "#cbd5e1"
                                : "#16a34a",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor:
                              selectedVendorIds.size === 0 || isResendingInquiry
                                ? "not-allowed"
                                : "pointer",
                            fontSize: "13px",
                            fontWeight: "600",
                          }}
                        >
                          {isResendingInquiry
                            ? "Sending..."
                            : `Send to ${selectedVendorIds.size} Vendor${selectedVendorIds.size !== 1 ? "s" : ""}`}
                        </button>
                      </div>
                    )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
