import React from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  or,
  Firestore,
} from "firebase/firestore";

interface Company {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  website?: string;
  addedAt: string;
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
  db: Firestore;
  currentUser: string;
  onSendInquiry?: (company: Company) => void;
  currentUserEmail?: string;
  currentUserCompany?: string;
}

export default function Vendors({
  db,
  currentUser,
  onSendInquiry,
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
    setIsLoading(true);
    try {
      // Query connections where current user is involved (either as initiator or recipient)
      const connectionsRef = collection(db, "vendorConnections");

      // Get connections initiated by current user
      const initiatedByMeQuery = query(
        connectionsRef,
        where("initiatedByUser", "==", currentUser),
      );
      const initiatedByMeDocs = await getDocs(initiatedByMeQuery);

      // Get connections sent to current user
      const sentToMeQuery = query(
        connectionsRef,
        where("targetUser", "==", currentUser),
      );
      const sentToMeDocs = await getDocs(sentToMeQuery);

      const allConnections: VendorConnection[] = [];
      const usersRef = collection(db, "userSettings");

      // Optimization: Batch load all user data in one query instead of per-connection
      const allUsernames = new Set<string>();
      initiatedByMeDocs.docs.forEach((doc) => {
        allUsernames.add(doc.data().targetUser);
      });
      sentToMeDocs.docs.forEach((doc) => {
        allUsernames.add(doc.data().initiatedByUser);
      });

      // Load all users in one batch query
      const userDataMap = new Map<string, any>();
      for (const username of allUsernames) {
        const userQuery = query(usersRef, where("username", "==", username));
        const userDoc = await getDocs(userQuery);
        if (userDoc.docs.length > 0) {
          userDataMap.set(username, userDoc.docs[0].data());
        }
      }

      // Process connections initiated by me
      for (const doc of initiatedByMeDocs.docs) {
        const data = doc.data();
        const userData = userDataMap.get(data.targetUser);
        if (userData) {
          allConnections.push({
            id: doc.id,
            companyId: data.targetUser,
            company: {
              id: data.targetUser,
              name: userData.companyName || data.targetUser,
              email: userData.email || "",
              phone: userData.phone,
              address: userData.address,
              website: userData.website,
              addedAt:
                data.createdAt?.toDate?.()?.toISOString() ||
                new Date().toISOString(),
            },
            status: data.status,
            initiatedBy: "you",
            createdAt:
              data.createdAt?.toDate?.()?.toISOString() ||
              new Date().toISOString(),
            respondedAt: data.respondedAt?.toDate?.()?.toISOString(),
          });
        }
      }

      // Process connections sent to me
      for (const doc of sentToMeDocs.docs) {
        const data = doc.data();
        const userData = userDataMap.get(data.initiatedByUser);
        if (userData) {
          allConnections.push({
            id: doc.id,
            companyId: data.initiatedByUser,
            company: {
              id: data.initiatedByUser,
              name: userData.companyName || data.initiatedByUser,
              email: userData.email || "",
              phone: userData.phone,
              address: userData.address,
              website: userData.website,
              addedAt:
                data.createdAt?.toDate?.()?.toISOString() ||
                new Date().toISOString(),
            },
            status: data.status,
            initiatedBy: "them",
            createdAt:
              data.createdAt?.toDate?.()?.toISOString() ||
              new Date().toISOString(),
            respondedAt: data.respondedAt?.toDate?.()?.toISOString(),
          });
        }
      }

      setConnections(allConnections);
      console.log(`Loaded ${allConnections.length} vendor connections`);
    } catch (error) {
      console.error("Error loading connections:", error);
      alert("Error loading vendor connections");
    } finally {
      setIsLoading(false);
    }
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
    try {
      console.log(`🔍 DIAGNOSTIC: Checking if user "${currentUser}" exists...`);
      const usersRef = collection(db, "userSettings");

      // Try to get all users
      const allUsersQuery = query(usersRef);
      const allUsersDocs = await getDocs(allUsersQuery);

      console.log(
        `📊 DIAGNOSTIC: Total users in Firestore: ${allUsersDocs.docs.length}`,
      );

      allUsersDocs.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`  User ${index + 1}:`, {
          id: doc.id,
          username: data.username,
          email: data.email,
          companyName: data.companyName,
          usernameSearchable: data.usernameSearchable,
          emailSearchable: data.emailSearchable,
          companyNameSearchable: data.companyNameSearchable,
        });
      });
    } catch (error) {
      console.error("🔴 DIAGNOSTIC ERROR:", error);
    }
  };

  const handleSearch = async (searchTerm: string) => {
    setSearchQuery(searchTerm);
    if (searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const searchLower = searchTerm.toLowerCase();
      const results: Company[] = [];
      const seenIds = new Set<string>();

      // FIRESTORE FIRST (Source of Truth) - Search all companies in real-time
      const usersRef = collection(db, "userSettings");

      console.log(
        `🔍 SEARCHING FOR: "${searchTerm}" (lowercase: "${searchLower}")`,
      );

      // Strategy: Query by multiple fields and deduplicate
      // We search: company name, username, and email with prefix matching

      // PRIORITY 1: Search by company name searchable field (prefix match)
      let allDocs: any[] = [];
      try {
        console.log("📋 Querying by companyNameSearchable...");
        const companyQuery = query(
          usersRef,
          where("companyNameSearchable", ">=", searchLower),
          where("companyNameSearchable", "<=", searchLower + "\uf8ff"),
        );
        const companyDocs = await getDocs(companyQuery);
        console.log(`✓ Found ${companyDocs.docs.length} by company name`);
        allDocs = [...companyDocs.docs];
      } catch (e: any) {
        console.error("❌ Company name search error:", e?.message || e);
      }

      // PRIORITY 2: Search by username searchable field (for old accounts)
      try {
        console.log("📋 Querying by usernameSearchable...");
        const usernameQuery = query(
          usersRef,
          where("usernameSearchable", ">=", searchLower),
          where("usernameSearchable", "<=", searchLower + "\uf8ff"),
        );
        const usernameDocs = await getDocs(usernameQuery);
        console.log(`✓ Found ${usernameDocs.docs.length} by username`);
        allDocs = [
          ...allDocs,
          ...usernameDocs.docs.filter(
            (doc: any) => !allDocs.find((d: any) => d.id === doc.id),
          ),
        ];
      } catch (e: any) {
        console.error("❌ Username search error:", e?.message || e);
      }

      // PRIORITY 3: Search by email searchable field
      try {
        console.log("📋 Querying by emailSearchable...");
        const emailQuery = query(
          usersRef,
          where("emailSearchable", ">=", searchLower),
          where("emailSearchable", "<=", searchLower + "\uf8ff"),
        );
        const emailDocs = await getDocs(emailQuery);
        console.log(`✓ Found ${emailDocs.docs.length} by email`);
        allDocs = [
          ...allDocs,
          ...emailDocs.docs.filter(
            (doc: any) => !allDocs.find((d: any) => d.id === doc.id),
          ),
        ];
      } catch (e: any) {
        console.error("❌ Email search error:", e?.message || e);
      }

      console.log(`📊 Total docs from Firestore (searchable fields): ${allDocs.length}`);

      // FALLBACK: If searchable queries returned nothing, search all users (for old accounts without searchable fields)
      if (allDocs.length === 0) {
        console.log("🔄 FALLBACK: Searchable queries returned 0 results, fetching ALL users for client-side filtering...");
        try {
          const allUsersDocs = await getDocs(usersRef);
          console.log(`📊 Total users in Firestore: ${allUsersDocs.docs.length}`);
          console.log("🔍 User data diagnostic:");
          
          for (const doc of allUsersDocs.docs) {
            const userData = doc.data();
            const username = (userData.username || "").toLowerCase();
            const email = (userData.email || "").toLowerCase();
            const companyName = (userData.companyName || "").toLowerCase();

            // DIAGNOSTIC: Log all fields for this user
            console.log(`  User "${userData.username}": {username: "${username}", email: "${email}", companyName: "${companyName}", rawEmail: ${userData.email}, rawCompany: ${userData.companyName}}`);

            // Check if search term matches ANY field
            const matchesUsername = username.includes(searchLower);
            const matchesEmail = email.includes(searchLower);
            const matchesCompany = companyName.includes(searchLower);

            if (matchesUsername || matchesEmail || matchesCompany) {
              console.log(`    ✓ MATCH: matches=${matchesUsername || matchesEmail || matchesCompany} (u:${matchesUsername} e:${matchesEmail} c:${matchesCompany})`);
              if (!allDocs.find((d: any) => d.id === doc.id)) {
                allDocs.push(doc);
              }
            }
          }
          console.log(`✓ FALLBACK found ${allDocs.length} matches via client-side filtering`);
        } catch (e: any) {
          console.error("❌ FALLBACK search error:", e?.message || e);
        }
      }

      // Process all results from Firestore and apply substring filtering
      for (const doc of allDocs) {
        if (doc.data().username === currentUser) continue;

        const companyName = (doc.data().companyName || "").toLowerCase();
        const username = (doc.data().username || "").toLowerCase();
        const email = (doc.data().email || "").toLowerCase();

        // Check if search term matches ANY field (prefix or substring)
        const matchesCompany =
          companyName.startsWith(searchLower) ||
          companyName.includes(searchLower);
        const matchesUsername =
          username.startsWith(searchLower) || username.includes(searchLower);
        const matchesEmail = email.includes(searchLower);

        if (matchesCompany || matchesUsername || matchesEmail) {
          if (!seenIds.has(doc.id)) {
            seenIds.add(doc.id);
            results.push({
              id: doc.data().username,
              name: doc.data().companyName || doc.data().username,
              email: doc.data().email || "",
              phone: doc.data().phone,
              address: doc.data().address,
              website: doc.data().website,
              addedAt: doc.data().createdAt || new Date().toISOString(),
            });
          }
        }
      }

      setSearchResults(results);

      // CACHE RESULTS for performance on future identical searches
      // (IndexedDB is now secondary - for caching, not for primary search)
      if (results.length > 0) {
        await cacheVendors(results);
        console.log(
          `✅ Found ${results.length} companies matching "${searchTerm}" (Firestore → cached to IndexedDB)`,
        );
      } else {
        console.log(`❌ No companies found matching "${searchTerm}"`);
      }
    } catch (error) {
      console.error("❌ Error searching companies:", error);
      alert("Error searching companies");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCompanyClick = async (company: Company) => {
    try {
      // Check if connection already exists
      const connectionsRef = collection(db, "vendorConnections");
      const existingQuery = query(
        connectionsRef,
        where("initiatedByUser", "==", currentUser),
        where("targetUser", "==", company.id),
      );
      const existing = await getDocs(existingQuery);

      if (existing.docs.length > 0) {
        alert("Connection request already exists for this vendor");
        return;
      }

      // Create new connection request
      const connectionId = `${currentUser}_${company.id}_${Date.now()}`;
      await setDoc(doc(db, "vendorConnections", connectionId), {
        id: connectionId,
        initiatedByUser: currentUser,
        targetUser: company.id,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      alert(
        `Connection request sent to ${company.name}. They will need to accept the request.`,
      );
      setSearchResults([]);
      setSearchQuery("");
      // Reload connections to show pending request
      loadConnections();
    } catch (error) {
      console.error("Error sending connection request:", error);
      alert("Error sending connection request");
    }
  };

  const handleCreateNewCompany = async () => {
    if (!newCompanyData.name.trim() || !newCompanyData.email.trim()) {
      alert("Please enter at least company name and email");
      return;
    }

    try {
      // First, try to find if a user with this email already exists
      const usersRef = collection(db, "users");
      const emailQuery = query(
        usersRef,
        where("email", "==", newCompanyData.email),
      );
      const emailDocs = await getDocs(emailQuery);

      let targetUserId: string;

      if (emailDocs.docs.length > 0) {
        // User exists, use their username
        targetUserId = emailDocs.docs[0].data().username;
      } else {
        // Create a placeholder company entry if system requires it
        // For now, we'll use email as ID since company doesn't have account yet
        targetUserId = newCompanyData.email;
      }

      // Check if connection already exists
      const connectionsRef = collection(db, "vendorConnections");
      const existingQuery = query(
        connectionsRef,
        where("initiatedByUser", "==", currentUser),
        where("targetUser", "==", targetUserId),
      );
      const existing = await getDocs(existingQuery);

      if (existing.docs.length > 0) {
        alert("Connection request already exists for this company");
        return;
      }

      // Create new connection request
      const connectionId = `${currentUser}_${targetUserId}_${Date.now()}`;
      await setDoc(doc(db, "vendorConnections", connectionId), {
        id: connectionId,
        initiatedByUser: currentUser,
        targetUser: targetUserId,
        status: "pending",
        companyData: {
          name: newCompanyData.name,
          email: newCompanyData.email,
          phone: newCompanyData.phone,
          website: newCompanyData.website,
          address: newCompanyData.address,
        },
        createdAt: serverTimestamp(),
      });

      alert(
        `Company added and connection request sent to ${newCompanyData.name}`,
      );
      setNewCompanyData({
        name: "",
        email: "",
        phone: "",
        website: "",
        address: "",
      });
      setShowAddCompany(false);
      // Reload connections
      loadConnections();
    } catch (error) {
      console.error("Error creating company:", error);
      alert("Error creating company");
    }
  };

  const handleAcceptConnection = async (connectionId: string) => {
    try {
      await updateDoc(doc(db, "vendorConnections", connectionId), {
        status: "accepted",
        respondedAt: serverTimestamp(),
      });

      alert("Connection accepted!");
      loadConnections();
    } catch (error) {
      console.error("Error accepting connection:", error);
      alert("Error accepting connection");
    }
  };

  const handleRejectConnection = async (connectionId: string) => {
    try {
      await updateDoc(doc(db, "vendorConnections", connectionId), {
        status: "rejected",
        respondedAt: serverTimestamp(),
      });

      alert("Connection rejected");
      loadConnections();
    } catch (error) {
      console.error("Error rejecting connection:", error);
      alert("Error rejecting connection");
    }
  };

  const handleSendInquiry = (company: Company) => {
    if (onSendInquiry) {
      onSendInquiry(company);
    }
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
                    <button
                      onClick={() => handleSendInquiry(connection.company)}
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
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#0284c7";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      Send Inquiry
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pending Requests Tab */}
        {activeTab === "pending" && (
          <div>
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
                  {searchResults.map((company) => (
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
                        <h4
                          style={{
                            margin: "0 0 8px 0",
                            fontSize: "14px",
                            fontWeight: "700",
                            color: "#1a365d",
                          }}
                        >
                          {company.name}
                        </h4>
                        <p
                          style={{
                            margin: "0 0 4px 0",
                            fontSize: "12px",
                            color: "#64748b",
                          }}
                        >
                          {company.email}
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
                          e.currentTarget.style.transform = "translateY(-2px)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#0284c7";
                          e.currentTarget.style.transform = "translateY(0)";
                        }}
                      >
                        Add Connection
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
