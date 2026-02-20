import React from "react";
// Firebase imports temporarily disabled during Turso migration
// import {
//   collection,
//   query,
//   where,
//   getDocs,
//   doc,
//   setDoc,
//   updateDoc,
//   serverTimestamp,
//   or,
//   Firestore,
// } from "firebase/firestore";

interface Company {
  id: string;
  name: string;
  username: string;
  email: string;
  phone?: string;
  address?: string;
  website?: string;
  addedAt: string;
  relevanceScore?: number;
}

interface VendorConnection {
  id: string;
  companyId: string;
  company: Company;
  status: "pending" | "accepted" | "rejected";
  initiatedBy: "you" | "them";
  createdAt: string;
  respondedAt?: string;
}

interface VendorsProps {
  currentUser: string;
  onSendInquiry?: (company: Company) => void;
  onSendQuotation?: (company: Company) => void;
  onSendOrder?: (company: Company) => void;
  onSendInvoice?: (company: Company) => void;
  currentUserEmail?: string;
  currentUserCompany?: string;
}

export default function Vendors({
  currentUser,
  onSendInquiry,
  onSendQuotation,
  onSendOrder,
  onSendInvoice,
  currentUserEmail,
  currentUserCompany,
}: VendorsProps) {
  const [activeTab, setActiveTab] = React.useState<
    "connected" | "pending" | "search"
  >("connected");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [showAddCompany, setShowAddCompany] = React.useState(false);
  const [connections, setConnections] = React.useState<VendorConnection[]>([]);
  const [searchResults, setSearchResults] = React.useState<Company[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [newCompanyData, setNewCompanyData] = React.useState({
    name: "",
    email: "",
    phone: "",
    website: "",
    address: "",
  });

  // Load connections on mount
  React.useEffect(() => {
    loadConnections();
    // Run diagnostic to see what's in Firestore
    diagnosticCheckUserExists();
  }, []);

  const loadConnections = async () => {
    // DISABLED - Firebase migration to Turso in progress
    console.log(
      "⏭️  Vendor connections loading disabled during Turso migration",
    );
    setConnections([]);
    setIsLoading(false);
    return;
  };

  // IndexedDB cache utilities for vendors (OPTIMIZATION: ~90% fewer Firestore reads)
  const cacheVendors = async (vendors: Company[]) => {
    try {
      const request = indexedDB.open("pspm_db", 1);
      request.onsuccess = (event: any) => {
        const db = event.target.result;
        const transaction = db.transaction("vendors", "readwrite");
        const store = transaction.objectStore("vendors");
        store.clear();
        vendors.forEach((vendor) => {
          store.add({ ...vendor, cachedAt: Date.now() });
        });
        console.log(`Cached ${vendors.length} vendors in IndexedDB`);
      };
      request.onerror = () => console.error("IndexedDB cache error");
    } catch (error) {
      console.warn("IndexedDB not available:", error);
    }
  };

  const getCachedVendors = async (): Promise<Company[]> => {
    return new Promise((resolve) => {
      try {
        const request = indexedDB.open("pspm_db", 1);
        request.onsuccess = (event: any) => {
          const db = event.target.result;
          // Create object store if it doesn't exist
          if (!db.objectStoreNames.contains("vendors")) {
            resolve([]);
            return;
          }
          const transaction = db.transaction("vendors", "readonly");
          const store = transaction.objectStore("vendors");
          const allRequest = store.getAll();
          allRequest.onsuccess = () => {
            resolve(
              allRequest.result.map((item: any) => ({
                id: item.id,
                name: item.name,
                email: item.email,
                phone: item.phone,
                address: item.address,
                website: item.website,
                addedAt: item.addedAt,
              })),
            );
          };
        };
        request.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    });
  };

  // Diagnostic: Check what's actually in Firestore
  const diagnosticCheckUserExists = async () => {
    // DISABLED - Firebase migration to Turso in progress
    console.log("⏭️  Diagnostic check disabled during Turso migration");
    return;
  };

  const handleSearch = async (searchTerm: string) => {
    setSearchQuery(searchTerm);
    if (searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }
    // DISABLED - Firebase migration to Turso in progress
    console.log("⏭️  Vendor search disabled during Turso migration");
    setSearchResults([]);
    return;
  };

  const handleAddCompanyClick = async (company: Company) => {
    // DISABLED - Firebase migration to Turso in progress
    console.log("⏭️  Add company disabled during Turso migration");
    return;
  };

  const handleCreateNewCompany = async () => {
    // DISABLED - Firebase migration to Turso in progress
    console.log("⏭️  Create company disabled during Turso migration");
    return;
  };

  const handleAcceptConnection = async (connectionId: string) => {
    // DISABLED - Firebase migration to Turso in progress
    console.log("⏭️  Accept connection disabled during Turso migration");
    return;
  };

  const handleRejectConnection = async (connectionId: string) => {
    // DISABLED - Firebase migration to Turso in progress
    console.log("⏭️  Reject connection disabled during Turso migration");
    return;
  };

  const handleSendInquiry = (company: Company) => {
    if (onSendInquiry) {
      onSendInquiry(company);
    }
  };

  const handleSendQuotation = (company: Company) => {
    if (onSendQuotation) {
      onSendQuotation(company);
    }
  };

  const handleSendOrder = (company: Company) => {
    if (onSendOrder) {
      onSendOrder(company);
    }
  };

  const handleSendInvoice = (company: Company) => {
    if (onSendInvoice) {
      onSendInvoice(company);
    }
  };

  // Helper function to determine connection status with a vendor
  const getConnectionStatus = (
    vendorUsername: string,
  ): "no-connection" | "user-pending" | "vendor-pending" | "accepted" => {
    const connection = connections.find(
      (c) => c.company.username === vendorUsername,
    );

    if (!connection) return "no-connection";

    if (connection.status === "accepted") return "accepted";

    // If connection is pending, check who initiated it
    if (connection.status === "pending") {
      return connection.initiatedBy === "you"
        ? "user-pending"
        : "vendor-pending";
    }

    return "no-connection";
  };

  const connectedCompanies = connections.filter((c) => c.status === "accepted");
  const pendingRequests = connections.filter((c) => c.status === "pending");

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div
        style={{
          padding: "24px 32px",
          borderBottom: "1px solid #e2e8f0",
          background: "#ffffff",
        }}
      >
        <h2
          style={{
            margin: "0 0 8px 0",
            fontSize: "24px",
            fontWeight: "800",
            color: "#0f172a",
            letterSpacing: "-0.5px",
          }}
        >
          Vendors
        </h2>
        <p
          style={{
            margin: "0",
            fontSize: "13px",
            color: "#64748b",
          }}
        >
          Manage vendor connections and send inquiries
        </p>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid #e2e8f0",
          background: "#ffffff",
          paddingLeft: "32px",
        }}
      >
        {(["connected", "pending", "search"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "16px 20px",
              border: "none",
              background: activeTab === tab ? "#ffffff" : "transparent",
              borderBottom:
                activeTab === tab
                  ? "2px solid #0284c7"
                  : "2px solid transparent",
              color: activeTab === tab ? "#0284c7" : "#64748b",
              fontSize: "14px",
              fontWeight: activeTab === tab ? "700" : "500",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            {tab === "connected"
              ? `Connected (${connectedCompanies.length})`
              : tab === "pending"
                ? `Pending (${pendingRequests.length})`
                : "Search Vendors"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px 32px",
        }}
      >
        {/* Connected Companies Tab */}
        {activeTab === "connected" && (
          <div>
            {/* Refresh Button */}
            <div style={{ marginBottom: "20px" }}>
              <button
                onClick={() => {
                  console.log("🔄 Manual refresh triggered");
                  loadConnections();
                }}
                style={{
                  padding: "10px 20px",
                  background: "#0284c7",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
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
                Refresh
              </button>
            </div>
            <h3
              style={{
                margin: "0 0 20px 0",
                fontSize: "16px",
                fontWeight: "700",
                color: "#1a365d",
              }}
            >
              Connected Vendors
            </h3>
            {connectedCompanies.length === 0 ? (
              <div
                style={{
                  padding: "32px",
                  textAlign: "center",
                  background: "#f8fafc",
                  borderRadius: "8px",
                  color: "#64748b",
                }}
              >
                <p style={{ margin: "0 0 12px 0", fontSize: "14px" }}>
                  No connected vendors yet
                </p>
                <p style={{ margin: "0", fontSize: "12px" }}>
                  Search for vendors or add new ones to get started
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                  gap: "16px",
                }}
              >
                {connectedCompanies.map((connection) => (
                  <div
                    key={connection.id}
                    style={{
                      padding: "16px",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      background: "#ffffff",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <h4
                        style={{
                          margin: "0 0 8px 0",
                          fontSize: "14px",
                          fontWeight: "700",
                          color: "#1a365d",
                        }}
                      >
                        {connection.company.name}
                      </h4>
                      <p
                        style={{
                          margin: "0 0 2px 0",
                          fontSize: "11px",
                          color: "#94a3b8",
                          fontWeight: "500",
                        }}
                      >
                        Name: {connection.company.username}
                      </p>
                      <p
                        style={{
                          margin: "0 0 4px 0",
                          fontSize: "12px",
                          color: "#64748b",
                        }}
                      >
                        <strong>Email:</strong> {connection.company.email}
                      </p>
                      {connection.company.phone && (
                        <p
                          style={{
                            margin: "0 0 4px 0",
                            fontSize: "12px",
                            color: "#64748b",
                          }}
                        >
                          <strong>Phone:</strong> {connection.company.phone}
                        </p>
                      )}
                      {connection.company.website && (
                        <p
                          style={{
                            margin: "0",
                            fontSize: "12px",
                            color: "#64748b",
                          }}
                        >
                          <strong>Website:</strong> {connection.company.website}
                        </p>
                      )}
                    </div>
                    <div
                      style={{
                        marginTop: "12px",
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 1fr)",
                        gap: "8px",
                      }}
                    >
                      <button
                        onClick={() => handleSendInquiry(connection.company)}
                        style={{
                          padding: "10px 12px",
                          background: "#f3f4f6",
                          color: "#000000",
                          border: "1px solid #bfdbfe",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "12px",
                          fontWeight: "600",
                          transition: "all 0.25s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#e5e7eb";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#f3f4f6";
                        }}
                      >
                        Inquiry
                      </button>
                      <button
                        onClick={() => handleSendQuotation(connection.company)}
                        style={{
                          padding: "10px 12px",
                          background: "#f3f4f6",
                          color: "#000000",
                          border: "1px solid #bfdbfe",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "12px",
                          fontWeight: "600",
                          transition: "all 0.25s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#e5e7eb";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#f3f4f6";
                        }}
                      >
                        Quotation
                      </button>
                      <button
                        onClick={() => handleSendOrder(connection.company)}
                        style={{
                          padding: "10px 12px",
                          background: "#f3f4f6",
                          color: "#000000",
                          border: "1px solid #bfdbfe",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "12px",
                          fontWeight: "600",
                          transition: "all 0.25s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#e5e7eb";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#f3f4f6";
                        }}
                      >
                        Order
                      </button>
                      <button
                        onClick={() => handleSendInvoice(connection.company)}
                        style={{
                          padding: "10px 12px",
                          background: "#f3f4f6",
                          color: "#000000",
                          border: "1px solid #bfdbfe",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "12px",
                          fontWeight: "600",
                          transition: "all 0.25s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#e5e7eb";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#f3f4f6";
                        }}
                      >
                        Invoice
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pending Requests Tab */}
        {activeTab === "pending" && (
          <div>
            {/* Refresh Button */}
            <div style={{ marginBottom: "20px" }}>
              <button
                onClick={() => {
                  console.log("🔄 Manual refresh triggered");
                  loadConnections();
                }}
                style={{
                  padding: "10px 20px",
                  background: "#0284c7",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
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
                Refresh
              </button>
            </div>
            <h3
              style={{
                margin: "0 0 20px 0",
                fontSize: "16px",
                fontWeight: "700",
                color: "#1a365d",
              }}
            >
              Pending Connection Requests
            </h3>
            {pendingRequests.length === 0 ? (
              <div
                style={{
                  padding: "32px",
                  textAlign: "center",
                  background: "#f8fafc",
                  borderRadius: "8px",
                  color: "#64748b",
                }}
              >
                <p style={{ margin: "0", fontSize: "14px" }}>
                  No pending connection requests
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                  gap: "16px",
                }}
              >
                {pendingRequests.map((connection) => (
                  <div
                    key={connection.id}
                    style={{
                      padding: "16px",
                      border: "1px solid #fbbf24",
                      borderRadius: "8px",
                      background: "#fffbeb",
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
                        <h4
                          style={{
                            margin: "0 0 4px 0",
                            fontSize: "14px",
                            fontWeight: "700",
                            color: "#1a365d",
                          }}
                        >
                          {connection.company.name}
                        </h4>
                        <p
                          style={{
                            margin: "0",
                            fontSize: "11px",
                            color: "#b45309",
                          }}
                        >
                          {connection.initiatedBy === "you"
                            ? "Waiting for acceptance"
                            : "Pending your response"}
                        </p>
                      </div>
                    </div>
                    <p
                      style={{
                        margin: "0 0 8px 0",
                        fontSize: "12px",
                        color: "#64748b",
                      }}
                    >
                      {connection.company.email}
                    </p>
                    {connection.initiatedBy === "them" && (
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          marginTop: "12px",
                        }}
                      >
                        <button
                          onClick={() => handleAcceptConnection(connection.id)}
                          style={{
                            flex: 1,
                            padding: "8px 12px",
                            background: "#10b981",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "12px",
                            fontWeight: "600",
                            transition: "all 0.2s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#059669";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#10b981";
                          }}
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRejectConnection(connection.id)}
                          style={{
                            flex: 1,
                            padding: "8px 12px",
                            background: "#ef4444",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "12px",
                            fontWeight: "600",
                            transition: "all 0.2s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#dc2626";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#ef4444";
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Search Tab */}
        {activeTab === "search" && (
          <div>
            <div
              style={{
                marginBottom: "24px",
              }}
            >
              <input
                type="text"
                placeholder="Search vendors by name or email..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  marginBottom: "16px",
                }}
              />
              <button
                onClick={() => setShowAddCompany(!showAddCompany)}
                style={{
                  padding: "12px 24px",
                  background: "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
                  transition: "all 0.25s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#059669";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#10b981";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {showAddCompany ? "Cancel" : "Add New Vendor"}
              </button>
            </div>

            {/* Add New Company Form */}
            {showAddCompany && (
              <div
                style={{
                  padding: "20px",
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: "8px",
                  marginBottom: "24px",
                }}
              >
                <h4
                  style={{
                    margin: "0 0 16px 0",
                    fontSize: "14px",
                    fontWeight: "700",
                    color: "#1a365d",
                  }}
                >
                  Add New Vendor
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                    marginBottom: "16px",
                  }}
                >
                  <input
                    type="text"
                    placeholder="Company Name *"
                    value={newCompanyData.name}
                    onChange={(e) =>
                      setNewCompanyData({
                        ...newCompanyData,
                        name: e.target.value,
                      })
                    }
                    style={{
                      padding: "10px 12px",
                      border: "1px solid #22c55e",
                      borderRadius: "6px",
                      fontSize: "13px",
                      boxSizing: "border-box",
                    }}
                  />
                  <input
                    type="email"
                    placeholder="Email *"
                    value={newCompanyData.email}
                    onChange={(e) =>
                      setNewCompanyData({
                        ...newCompanyData,
                        email: e.target.value,
                      })
                    }
                    style={{
                      padding: "10px 12px",
                      border: "1px solid #22c55e",
                      borderRadius: "6px",
                      fontSize: "13px",
                      boxSizing: "border-box",
                    }}
                  />
                  <input
                    type="tel"
                    placeholder="Phone (optional)"
                    value={newCompanyData.phone}
                    onChange={(e) =>
                      setNewCompanyData({
                        ...newCompanyData,
                        phone: e.target.value,
                      })
                    }
                    style={{
                      padding: "10px 12px",
                      border: "1px solid #e2e8f0",
                      borderRadius: "6px",
                      fontSize: "13px",
                      boxSizing: "border-box",
                    }}
                  />
                  <input
                    type="url"
                    placeholder="Website (optional)"
                    value={newCompanyData.website}
                    onChange={(e) =>
                      setNewCompanyData({
                        ...newCompanyData,
                        website: e.target.value,
                      })
                    }
                    style={{
                      padding: "10px 12px",
                      border: "1px solid #e2e8f0",
                      borderRadius: "6px",
                      fontSize: "13px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <input
                  type="text"
                  placeholder="Address (optional)"
                  value={newCompanyData.address}
                  onChange={(e) =>
                    setNewCompanyData({
                      ...newCompanyData,
                      address: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "13px",
                    boxSizing: "border-box",
                    marginBottom: "12px",
                  }}
                />
                <button
                  onClick={handleCreateNewCompany}
                  style={{
                    padding: "10px 20px",
                    background: "#16a34a",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: "600",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#15803d";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#16a34a";
                  }}
                >
                  Add Vendor
                </button>
              </div>
            )}

            {/* Search Results */}
            <div>
              <h3
                style={{
                  margin: "0 0 16px 0",
                  fontSize: "14px",
                  fontWeight: "700",
                  color: "#1a365d",
                }}
              >
                {searchQuery ? "Search Results" : "All Available Vendors"}
              </h3>
              {isLoading ? (
                <div style={{ textAlign: "center", color: "#64748b" }}>
                  Loading...
                </div>
              ) : searchResults.length === 0 ? (
                <div
                  style={{
                    padding: "32px",
                    textAlign: "center",
                    background: "#f8fafc",
                    borderRadius: "8px",
                    color: "#64748b",
                  }}
                >
                  <p style={{ margin: "0", fontSize: "14px" }}>
                    {searchQuery ? "No vendors found" : "No vendors available"}
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(300px, 1fr))",
                    gap: "16px",
                  }}
                >
                  {searchResults.map((company) => {
                    // Determine which field matched the search
                    const searchLower = searchQuery.toLowerCase();
                    const nameMatches =
                      company.name &&
                      company.name.toLowerCase().includes(searchLower);
                    const emailMatches =
                      company.email &&
                      company.email.toLowerCase().includes(searchLower);
                    const usernameMatches =
                      company.id &&
                      company.id.toLowerCase().includes(searchLower);
                    const matchedField = nameMatches
                      ? "Company"
                      : emailMatches
                        ? "Email"
                        : usernameMatches
                          ? "Username"
                          : "Match";

                    return (
                      <div
                        key={company.id}
                        style={{
                          padding: "16px",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          background: "#ffffff",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              marginBottom: "8px",
                            }}
                          >
                            <h4
                              style={{
                                margin: "0",
                                fontSize: "14px",
                                fontWeight: "700",
                                color: "#1a365d",
                                flex: 1,
                              }}
                            >
                              {company.name || "(No Company Name)"}
                            </h4>
                            <span
                              style={{
                                marginLeft: "8px",
                                fontSize: "11px",
                                padding: "2px 8px",
                                background:
                                  matchedField === "Company"
                                    ? "#d4e9f7"
                                    : matchedField === "Username"
                                      ? "#fef3c7"
                                      : "#f0f0f0",
                                color:
                                  matchedField === "Company"
                                    ? "#0369a1"
                                    : matchedField === "Username"
                                      ? "#b45309"
                                      : "#64748b",
                                borderRadius: "3px",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {matchedField}
                            </span>
                          </div>
                          <p
                            style={{
                              margin: "0 0 2px 0",
                              fontSize: "11px",
                              color: "#94a3b8",
                              fontWeight: "500",
                            }}
                          >
                            Name: {company.username}
                          </p>
                          <p
                            style={{
                              margin: "0 0 4px 0",
                              fontSize: "12px",
                              color: "#64748b",
                            }}
                          >
                            {company.email || "(Email not provided)"}
                          </p>
                          {company.phone && (
                            <p
                              style={{
                                margin: "0 0 4px 0",
                                fontSize: "12px",
                                color: "#64748b",
                              }}
                            >
                              {company.phone}
                            </p>
                          )}
                          {company.website && (
                            <p
                              style={{
                                margin: "0",
                                fontSize: "12px",
                                color: "#64748b",
                              }}
                            >
                              {company.website}
                            </p>
                          )}
                        </div>
                        {(() => {
                          const status = getConnectionStatus(company.username);

                          // Case 1: Already connected - show as text
                          if (status === "accepted") {
                            return (
                              <div
                                style={{
                                  marginTop: "12px",
                                  padding: "10px 16px",
                                  background: "#ecfdf5",
                                  color: "#059669",
                                  border: "1px solid #d1fae5",
                                  borderRadius: "6px",
                                  fontSize: "13px",
                                  fontWeight: "600",
                                  textAlign: "center",
                                }}
                              >
                                ✓ Already Connected
                              </div>
                            );
                          }

                          // Case 2: Vendor sent pending request - show Accept button
                          if (status === "vendor-pending") {
                            return (
                              <button
                                onClick={() => {
                                  const conn = connections.find(
                                    (c) =>
                                      c.company.username === company.username,
                                  );
                                  if (conn) {
                                    handleAcceptConnection(conn.id);
                                  }
                                }}
                                style={{
                                  marginTop: "12px",
                                  padding: "10px 16px",
                                  background: "#10b981",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "6px",
                                  cursor: "pointer",
                                  fontSize: "13px",
                                  fontWeight: "600",
                                  transition: "all 0.25s ease",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = "#059669";
                                  e.currentTarget.style.transform =
                                    "translateY(-2px)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = "#10b981";
                                  e.currentTarget.style.transform =
                                    "translateY(0)";
                                }}
                              >
                                Accept Request
                              </button>
                            );
                          }

                          // Case 3: User sent pending request - show as text
                          if (status === "user-pending") {
                            return (
                              <div
                                style={{
                                  marginTop: "12px",
                                  padding: "10px 16px",
                                  background: "#fef3c7",
                                  color: "#b45309",
                                  border: "1px solid #fcd34d",
                                  borderRadius: "6px",
                                  fontSize: "13px",
                                  fontWeight: "600",
                                  textAlign: "center",
                                }}
                              >
                                ⏳ Request Pending
                              </div>
                            );
                          }

                          // Case 4: No connection - show Connect button
                          return (
                            <button
                              onClick={() => handleAddCompanyClick(company)}
                              style={{
                                marginTop: "12px",
                                padding: "10px 16px",
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
                                e.currentTarget.style.transform =
                                  "translateY(-2px)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "#0284c7";
                                e.currentTarget.style.transform =
                                  "translateY(0)";
                              }}
                            >
                              Connect
                            </button>
                          );
                        })()}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
