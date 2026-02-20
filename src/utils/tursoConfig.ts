import { createClient, Client } from "@libsql/client";

// Turso Database Configuration
const TURSO_URL = "libsql://matrix-hub-felixkalota1.aws-ap-south-1.turso.io";
const TURSO_AUTH_TOKEN =
  "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzE1NjQxMzMsImlkIjoiMzM0OTdmOTAtMmJmZS00YWM1LWJhZTMtOTM4MmVkNmRhMGU3IiwicmlkIjoiMzgzNzg3MzAtMjU2OS00MDVjLWJiNTctZTNiZGQ5OTg4ZTExIn0.rsKU_0tysE-n-uzjuT5nvzS46i5y7oEW1wbofqhwjSDmwyFWvoWDpsxC55pgPv_FatlhElTmtihB-G-bKQnhCA";

let tursoClient: Client | null = null;

// Initialize Turso client
export const initTurso = async (): Promise<Client> => {
  if (tursoClient) return tursoClient;

  try {
    tursoClient = createClient({
      url: TURSO_URL,
      authToken: TURSO_AUTH_TOKEN,
    });

    console.log("✅ Turso database connected successfully");

    // Initialize schema if not exists
    await initializeSchema();

    return tursoClient;
  } catch (error) {
    console.error("❌ Failed to connect to Turso:", error);
    throw error;
  }
};

// Get Turso client
export const getTursoClient = (): Client => {
  if (!tursoClient) {
    throw new Error("Turso client not initialized. Call initTurso first.");
  }
  return tursoClient;
};

// Initialize database schema
const initializeSchema = async () => {
  const client = getTursoClient();

  try {
    // Create tables if they don't exist
    await client.execute(`
      CREATE TABLE IF NOT EXISTS userProfiles (
        uid TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        usernameSearchable TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        emailSearchable TEXT NOT NULL,
        companyName TEXT,
        companyNameSearchable TEXT,
        emailVerified INTEGER DEFAULT 0,
        authMethod TEXT DEFAULT 'email',
        createdAt TEXT,
        lastLogin TEXT,
        active INTEGER DEFAULT 1
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS vendorDirectory (
        uid TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        usernameSearchable TEXT,
        email TEXT NOT NULL,
        emailSearchable TEXT,
        companyName TEXT,
        companyNameSearchable TEXT,
        phone TEXT,
        address TEXT,
        website TEXT,
        authMethod TEXT,
        createdAt TEXT,
        active INTEGER DEFAULT 1
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS userSettings (
        uid TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        activeTab TEXT DEFAULT 'products',
        stockThreshold INTEGER DEFAULT 10,
        currencyPreference TEXT DEFAULT 'USD',
        emailPreferences TEXT,
        displayFlags TEXT,
        uiState TEXT,
        lastUpdated TEXT
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS emailAccounts (
        accountId TEXT PRIMARY KEY,
        uid TEXT NOT NULL,
        email TEXT NOT NULL,
        accessToken TEXT NOT NULL,
        refreshToken TEXT,
        isDefault INTEGER DEFAULT 0,
        connectedAt TEXT,
        lastSycnedAt TEXT,
        FOREIGN KEY (uid) REFERENCES userProfiles(uid)
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS emailHistory (
        emailId TEXT PRIMARY KEY,
        uid TEXT NOT NULL,
        fromEmail TEXT,
        toEmail TEXT,
        subject TEXT,
        body TEXT,
        timestamp TEXT,
        status TEXT DEFAULT 'sent',
        FOREIGN KEY (uid) REFERENCES userProfiles(uid)
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS quotations (
        quotationId TEXT PRIMARY KEY,
        uid TEXT NOT NULL,
        items TEXT NOT NULL,
        metadata TEXT,
        status TEXT DEFAULT 'draft',
        createdAt TEXT,
        updatedAt TEXT,
        FOREIGN KEY (uid) REFERENCES userProfiles(uid)
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS inquiries (
        inquiryId TEXT PRIMARY KEY,
        uid TEXT NOT NULL,
        items TEXT NOT NULL,
        metadata TEXT,
        status TEXT DEFAULT 'draft',
        createdAt TEXT,
        updatedAt TEXT,
        FOREIGN KEY (uid) REFERENCES userProfiles(uid)
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        orderId TEXT PRIMARY KEY,
        buyerUid TEXT NOT NULL,
        sellerUid TEXT NOT NULL,
        items TEXT NOT NULL,
        totalPrice REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        createdAt TEXT,
        updatedAt TEXT,
        buyerNotes TEXT,
        FOREIGN KEY (buyerUid) REFERENCES userProfiles(uid),
        FOREIGN KEY (sellerUid) REFERENCES userProfiles(uid)
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS marketplaceListings (
        productId TEXT PRIMARY KEY,
        uid TEXT NOT NULL,
        name TEXT NOT NULL,
        partNumber TEXT,
        price REAL,
        qty INTEGER,
        currency TEXT DEFAULT 'USD',
        image TEXT,
        stock TEXT,
        createdAt TEXT,
        updatedAt TEXT,
        FOREIGN KEY (uid) REFERENCES userProfiles(uid)
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS pdfTemplates (
        templateId TEXT PRIMARY KEY,
        uid TEXT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        htmlContent TEXT,
        companyName TEXT,
        companyLogo TEXT,
        isDefault INTEGER DEFAULT 0,
        createdAt TEXT
      )
    `);

    console.log("✅ Database schema initialized successfully");
  } catch (error) {
    console.error("❌ Error initializing schema:", error);
    // Schema might already exist, continue anyway
  }
};

// Generic query execution
export const executeSql = async (sql: string, params?: any[]): Promise<any> => {
  try {
    const client = getTursoClient();
    const result = await client.execute({
      sql,
      args: params || [],
    });
    return result;
  } catch (error) {
    console.error("❌ SQL Error:", error);
    throw error;
  }
};

// Helper: Insert user profile
export const insertUserProfile = async (userData: {
  uid: string;
  username: string;
  email: string;
  password: string;
  companyName: string;
  authMethod: string;
}) => {
  const sql = `
    INSERT INTO userProfiles 
    (uid, username, usernameSearchable, email, emailSearchable, companyName, companyNameSearchable, authMethod, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  return executeSql(sql, [
    userData.uid,
    userData.username,
    userData.username.toLowerCase().trim(),
    userData.email,
    userData.email.toLowerCase().trim(),
    userData.companyName,
    userData.companyName.toLowerCase().trim(),
    userData.authMethod,
    new Date().toISOString(),
  ]);
};

// Helper: Find user by email or username
export const findUserByEmailOrUsername = async (
  emailOrUsername: string,
): Promise<any | null> => {
  const searchTerm = emailOrUsername.toLowerCase().trim();

  const sql = `
    SELECT * FROM userProfiles 
    WHERE emailSearchable = ? OR usernameSearchable = ?
    LIMIT 1
  `;

  const result = await executeSql(sql, [searchTerm, searchTerm]);
  return result.rows && result.rows.length > 0 ? result.rows[0] : null;
};

// Helper: Check if username exists
export const checkUsernameExists = async (
  username: string,
): Promise<boolean> => {
  const sql = `
    SELECT COUNT(*) as count FROM userProfiles 
    WHERE usernameSearchable = ?
  `;

  const result = await executeSql(sql, [username.toLowerCase().trim()]);
  return result.rows && result.rows[0]?.count > 0;
};

// Helper: Check if email exists
export const checkEmailExists = async (email: string): Promise<boolean> => {
  const sql = `
    SELECT COUNT(*) as count FROM userProfiles 
    WHERE emailSearchable = ?
  `;

  const result = await executeSql(sql, [email.toLowerCase().trim()]);
  return result.rows && result.rows[0]?.count > 0;
};

// Helper: Update user settings
export const updateUserSettings = async (
  uid: string,
  settings: Record<string, any>,
) => {
  const setClauses = Object.keys(settings)
    .map((key) => `${key} = ?`)
    .join(", ");

  const values = Object.values(settings);
  values.push(uid);

  const sql = `UPDATE userSettings SET ${setClauses} WHERE uid = ?`;

  return executeSql(sql, values);
};

// Helper: Get user settings
export const getUserSettings = async (uid: string): Promise<any | null> => {
  const sql = `SELECT * FROM userSettings WHERE uid = ? LIMIT 1`;

  const result = await executeSql(sql, [uid]);
  return result.rows && result.rows.length > 0 ? result.rows[0] : null;
};

// Helper: Get user profile
export const getUserProfile = async (uid: string): Promise<any | null> => {
  const sql = `SELECT * FROM userProfiles WHERE uid = ? LIMIT 1`;

  const result = await executeSql(sql, [uid]);
  return result.rows && result.rows.length > 0 ? result.rows[0] : null;
};

// Helper: Update user profile
export const updateUserProfile = async (
  uid: string,
  updates: Record<string, any>,
) => {
  const setClauses: string[] = [];
  const values: any[] = [];

  for (const [key, value] of Object.entries(updates)) {
    setClauses.push(`${key} = ?`);
    values.push(value);
  }

  if (setClauses.length === 0) {
    return; // Nothing to update
  }

  values.push(uid);
  const sql = `UPDATE userProfiles SET ${setClauses.join(", ")} WHERE uid = ?`;
  return executeSql(sql, values);
};

// Helper: Find user by UID (alias for getUserProfile)
export const findUserByUID = async (uid: string): Promise<any | null> => {
  return getUserProfile(uid);
};

// Helper: Get user profile by email
export const getUserProfileByEmail = async (
  email: string,
): Promise<any | null> => {
  const searchTerm = email.toLowerCase().trim();
  const sql = `SELECT * FROM userProfiles WHERE emailSearchable = ? LIMIT 1`;
  const result = await executeSql(sql, [searchTerm]);
  return result.rows && result.rows.length > 0 ? result.rows[0] : null;
};

// Password hashing (simple approach - using browser/node compatible method)
// In production, you'd use bcryptjs for better security
export const hashPassword = (password: string): string => {
  // Simple hash function using string-based approach
  // This is NOT cryptographically secure, use bcryptjs in production
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Return a hexadecimal string
  return Math.abs(hash).toString(16).padStart(32, "0");
};

export const verifyPassword = (
  plainPassword: string,
  hashedPassword: string,
): boolean => {
  return hashPassword(plainPassword) === hashedPassword;
};

// Helper: Verify user credentials
export const verifyUserCredentials = async (
  emailOrUsername: string,
  password: string,
): Promise<{ success: boolean; user: any | null; error?: string }> => {
  try {
    // Find user by email or username
    const searchTerm = emailOrUsername.toLowerCase().trim();
    const sql = `
      SELECT * FROM userProfiles 
      WHERE emailSearchable = ? OR usernameSearchable = ?
      LIMIT 1
    `;

    const result = await executeSql(sql, [searchTerm, searchTerm]);

    if (!result.rows || result.rows.length === 0) {
      return { success: false, user: null, error: "User not found" };
    }

    const user = result.rows[0];

    // Verify password
    const passwordMatch = verifyPassword(password, user.password);

    if (!passwordMatch) {
      return { success: false, user: null, error: "Incorrect password" };
    }

    return { success: true, user, error: undefined };
  } catch (error) {
    console.error("Error verifying credentials:", error);
    return {
      success: false,
      user: null,
      error: "Error during login process",
    };
  }
};

// ============================================================================
// REPLACEMENT FUNCTIONS FOR ALL FIREBASE FIRESTORE OPERATIONS
// ============================================================================

// PRODUCTS - Save/Delete user products
export const saveProduct = async (productData: {
  productId: string;
  uid: string;
  username: string;
  productName: string;
  category?: string;
  description?: string;
  price?: number;
  unit?: string;
  moqValue?: number;
  moqUnit?: string;
  minOrderValue?: number;
  imageUrl?: string;
}) => {
  const sql = `
    INSERT OR REPLACE INTO products 
    (productId, uid, username, usernameSearchable, productName, category, description, price, unit, moqValue, moqUnit, minOrderValue, imageUrl, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  return executeSql(sql, [
    productData.productId,
    productData.uid,
    productData.username,
    productData.username.toLowerCase().trim(),
    productData.productName,
    productData.category || null,
    productData.description || null,
    productData.price || null,
    productData.unit || null,
    productData.moqValue || null,
    productData.moqUnit || null,
    productData.minOrderValue || null,
    productData.imageUrl || null,
    new Date().toISOString(),
    new Date().toISOString(),
  ]);
};

export const deleteProduct = async (productId: string) => {
  return executeSql("DELETE FROM products WHERE productId = ?", [productId]);
};

export const getUserProducts = async (uid: string) => {
  const result = await executeSql(
    "SELECT * FROM products WHERE uid = ? ORDER BY createdAt DESC",
    [uid],
  );
  return result || [];
};

// MARKETPLACE - Save marketplace items
export const saveMarketplaceItem = async (itemData: {
  productId: string;
  uid: string;
  name: string;
  partNumber?: string;
  price?: number;
  qty?: number;
  currency?: string;
  image?: string;
  stock?: string;
}) => {
  const sql = `
    INSERT OR REPLACE INTO marketplaceListings
    (productId, uid, name, partNumber, price, qty, currency, image, stock, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  return executeSql(sql, [
    itemData.productId,
    itemData.uid,
    itemData.name,
    itemData.partNumber || null,
    itemData.price || null,
    itemData.qty || null,
    itemData.currency || "USD",
    itemData.image || null,
    itemData.stock || null,
    new Date().toISOString(),
    new Date().toISOString(),
  ]);
};

// QUOTATIONS - Save quotations
export const saveQuotation = async (quotationData: {
  quotationId: string;
  uid: string;
  username: string;
  senderEmail?: string;
  recipientEmail?: string;
  recipientName?: string;
  recipientCompany?: string;
  subject?: string;
  body?: string;
  items?: any;
}) => {
  const sql = `
    INSERT OR REPLACE INTO quotations
    (quotationId, uid, username, senderEmail, recipientEmail, recipientName, recipientCompany, subject, body, items, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  return executeSql(sql, [
    quotationData.quotationId,
    quotationData.uid,
    quotationData.username,
    quotationData.senderEmail || null,
    quotationData.recipientEmail || null,
    quotationData.recipientName || null,
    quotationData.recipientCompany || null,
    quotationData.subject || null,
    quotationData.body || null,
    quotationData.items ? JSON.stringify(quotationData.items) : null,
    new Date().toISOString(),
    new Date().toISOString(),
  ]);
};

export const getQuotationHistory = async (uid: string) => {
  const result = await executeSql(
    "SELECT * FROM quotations WHERE uid = ? ORDER BY createdAt DESC",
    [uid],
  );
  return result || [];
};

// INQUIRIES - Save and retrieve inquiries
export const saveInquiry = async (inquiryData: {
  inquiryId: string;
  uid: string;
  username: string;
  senderEmail?: string;
  recipientEmail?: string;
  recipientName?: string;
  recipientCompany?: string;
  subject?: string;
  body?: string;
  items?: any;
}) => {
  const sql = `
    INSERT OR REPLACE INTO inquiries
    (inquiryId, uid, username, senderEmail, recipientEmail, recipientName, recipientCompany, subject, body, items, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  return executeSql(sql, [
    inquiryData.inquiryId,
    inquiryData.uid,
    inquiryData.username,
    inquiryData.senderEmail || null,
    inquiryData.recipientEmail || null,
    inquiryData.recipientName || null,
    inquiryData.recipientCompany || null,
    inquiryData.subject || null,
    inquiryData.body || null,
    inquiryData.items ? JSON.stringify(inquiryData.items) : null,
    new Date().toISOString(),
    new Date().toISOString(),
  ]);
};

export const getInquiryHistory = async (uid: string) => {
  const result = await executeSql(
    "SELECT * FROM inquiries WHERE uid = ? AND status != 'incoming' ORDER BY createdAt DESC",
    [uid],
  );
  return result || [];
};

export const getIncomingInquiries = async (userEmail: string) => {
  const emailSearchable = userEmail.toLowerCase().trim();
  const result = await executeSql(
    `SELECT * FROM inquiries 
     WHERE LOWER(recipientEmail) = ? AND status = 'incoming' 
     ORDER BY createdAt DESC`,
    [emailSearchable],
  );
  return result || [];
};

// ORDERS - Save and retrieve orders
export const saveOrder = async (orderData: {
  orderId: string;
  uid: string;
  username: string;
  vendorEmail?: string;
  vendorName?: string;
  vendorCompany?: string;
  items?: any;
  totalAmount?: number;
  currency?: string;
}) => {
  const sql = `
    INSERT OR REPLACE INTO orders
    (orderId, uid, username, vendorEmail, vendorName, vendorCompany, items, totalAmount, currency, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  return executeSql(sql, [
    orderData.orderId,
    orderData.uid,
    orderData.username,
    orderData.vendorEmail || null,
    orderData.vendorName || null,
    orderData.vendorCompany || null,
    orderData.items ? JSON.stringify(orderData.items) : null,
    orderData.totalAmount || null,
    orderData.currency || "USD",
    new Date().toISOString(),
    new Date().toISOString(),
  ]);
};

// Update order status
export const updateOrderStatus = async (
  orderId: string,
  newStatus: string,
): Promise<void> => {
  const sql = `UPDATE orders SET status = ?, updatedAt = ? WHERE orderId = ?`;
  await executeSql(sql, [newStatus, new Date().toISOString(), orderId]);
};

// Delete order
export const deleteOrder = async (orderId: string): Promise<void> => {
  const sql = `DELETE FROM orders WHERE orderId = ?`;
  await executeSql(sql, [orderId]);
};

// Delete quotation
export const deleteQuotation = async (quotationId: string): Promise<void> => {
  const sql = `DELETE FROM quotations WHERE quotationId = ?`;
  await executeSql(sql, [quotationId]);
};

// Delete inquiry
export const deleteInquiry = async (inquiryId: string): Promise<void> => {
  const sql = `DELETE FROM inquiries WHERE inquiryId = ?`;
  await executeSql(sql, [inquiryId]);
};

export const getOrderHistory = async (uid: string) => {
  const result = await executeSql(
    "SELECT * FROM orders WHERE uid = ? ORDER BY createdAt DESC",
    [uid],
  );
  return result || [];
};

// INVOICES - Save and retrieve invoices
export const saveInvoice = async (invoiceData: {
  invoiceId: string;
  uid: string;
  username: string;
  vendorEmail?: string;
  vendorName?: string;
  customerName?: string;
  customerEmail?: string;
  items?: any;
  totalAmount?: number;
  currency?: string;
}) => {
  const sql = `
    INSERT OR REPLACE INTO invoices
    (invoiceId, uid, username, vendorEmail, vendorName, customerName, customerEmail, items, totalAmount, currency, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  return executeSql(sql, [
    invoiceData.invoiceId,
    invoiceData.uid,
    invoiceData.username,
    invoiceData.vendorEmail || null,
    invoiceData.vendorName || null,
    invoiceData.customerName || null,
    invoiceData.customerEmail || null,
    invoiceData.items ? JSON.stringify(invoiceData.items) : null,
    invoiceData.totalAmount || null,
    invoiceData.currency || "USD",
    new Date().toISOString(),
    new Date().toISOString(),
  ]);
};

// PDF TEMPLATES - Letterheads and document templates
export const savePDFTemplate = async (templateData: {
  templateId: string;
  uid: string;
  username: string;
  templateName: string;
  templateType?: string;
  htmlContent?: string;
  logoUrl?: string;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyWebsite?: string;
}) => {
  const sql = `
    INSERT OR REPLACE INTO pdfTemplates
    (templateId, uid, username, templateName, templateType, htmlContent, logoUrl, companyName, companyAddress, companyPhone, companyEmail, companyWebsite, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  return executeSql(sql, [
    templateData.templateId,
    templateData.uid,
    templateData.username,
    templateData.templateName,
    templateData.templateType || "letterhead",
    templateData.htmlContent || null,
    templateData.logoUrl || null,
    templateData.companyName || null,
    templateData.companyAddress || null,
    templateData.companyPhone || null,
    templateData.companyEmail || null,
    templateData.companyWebsite || null,
    new Date().toISOString(),
    new Date().toISOString(),
  ]);
};

export const getPDFTemplate = async (uid: string, templateId?: string) => {
  if (templateId) {
    const result = await executeSql(
      "SELECT * FROM pdfTemplates WHERE uid = ? AND templateId = ?",
      [uid, templateId],
    );
    return result ? result[0] : null;
  }
  // Get default/most recent template
  const result = await executeSql(
    "SELECT * FROM pdfTemplates WHERE uid = ? ORDER BY updatedAt DESC LIMIT 1",
    [uid],
  );
  return result ? result[0] : null;
};

// ============================================================================
// REPLACEMENT FUNCTIONS FOR FIREBASE REALTIME DATABASE OPERATIONS
// ============================================================================

// EMAIL ACCOUNTS - Gmail OAuth connections
export const saveEmailAccount = async (accountData: {
  accountId: string;
  uid: string;
  email: string;
  provider?: string;
  accessToken: string;
  refreshToken?: string;
  isDefault?: boolean;
  connectedAt?: string;
}) => {
  const sql = `
    INSERT OR REPLACE INTO emailAccounts
    (accountId, uid, email, provider, accessToken, refreshToken, isDefault, connectedAt, lastSyncedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  return executeSql(sql, [
    accountData.accountId,
    accountData.uid,
    accountData.email,
    accountData.provider || "gmail",
    accountData.accessToken,
    accountData.refreshToken || null,
    accountData.isDefault ? 1 : 0,
    accountData.connectedAt || new Date().toISOString(),
    new Date().toISOString(),
  ]);
};

export const getEmailAccounts = async (uid: string) => {
  const result = await executeSql(
    "SELECT * FROM emailAccounts WHERE uid = ? ORDER BY isDefault DESC, connectedAt DESC",
    [uid],
  );
  return result || [];
};

export const deleteEmailAccount = async (accountId: string) => {
  return executeSql("DELETE FROM emailAccounts WHERE accountId = ?", [
    accountId,
  ]);
};

export const updateEmailAccountToken = async (
  accountId: string,
  accessToken: string,
  refreshToken?: string,
  isDefault?: boolean,
) => {
  let updates: any[] = [];
  let sql = "";

  if (isDefault !== undefined) {
    if (refreshToken) {
      updates = [
        accessToken,
        refreshToken,
        new Date().toISOString(),
        isDefault,
        accountId,
      ];
      sql =
        "UPDATE emailAccounts SET accessToken = ?, refreshToken = ?, lastSyncedAt = ?, isDefault = ? WHERE accountId = ?";
    } else {
      updates = [accessToken, new Date().toISOString(), isDefault, accountId];
      sql =
        "UPDATE emailAccounts SET accessToken = ?, lastSyncedAt = ?, isDefault = ? WHERE accountId = ?";
    }
  } else {
    if (refreshToken) {
      updates = [
        accessToken,
        refreshToken,
        new Date().toISOString(),
        accountId,
      ];
      sql =
        "UPDATE emailAccounts SET accessToken = ?, refreshToken = ?, lastSyncedAt = ? WHERE accountId = ?";
    } else {
      updates = [accessToken, new Date().toISOString(), accountId];
      sql =
        "UPDATE emailAccounts SET accessToken = ?, lastSyncedAt = ? WHERE accountId = ?";
    }
  }

  return executeSql(sql, updates);
};

// EMAIL HISTORY - Sent emails log
export const saveEmailHistory = async (historyData: {
  emailId: string;
  uid: string;
  fromEmail?: string;
  toEmail?: string;
  subject?: string;
  body?: string;
  timestamp?: string;
  status?: string;
}) => {
  const sql = `
    INSERT OR REPLACE INTO emailHistory
    (emailId, uid, fromEmail, toEmail, subject, body, timestamp, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  return executeSql(sql, [
    historyData.emailId,
    historyData.uid,
    historyData.fromEmail || null,
    historyData.toEmail || null,
    historyData.subject || null,
    historyData.body || null,
    historyData.timestamp || new Date().toISOString(),
    historyData.status || "sent",
  ]);
};

export const getEmailHistory = async (uid: string, limit: number = 100) => {
  const result = await executeSql(
    "SELECT * FROM emailHistory WHERE uid = ? ORDER BY timestamp DESC LIMIT ?",
    [uid, limit],
  );
  return result || [];
};

// INBOX METADATA - Unread count, sync info
export const updateInboxMetadata = async (
  uid: string,
  metadata: {
    unreadCount?: number;
    lastFetch?: string;
    lastSyncedAt?: string;
  },
) => {
  const currentMetadata = await executeSql(
    "SELECT * FROM inboxMetadata WHERE uid = ?",
    [uid],
  );

  if (!currentMetadata || currentMetadata.length === 0) {
    // Insert new
    const sql = `
      INSERT INTO inboxMetadata (uid, unreadCount, lastFetch, lastSyncedAt)
      VALUES (?, ?, ?, ?)
    `;
    return executeSql(sql, [
      uid,
      metadata.unreadCount || 0,
      metadata.lastFetch || new Date().toISOString(),
      metadata.lastSyncedAt || new Date().toISOString(),
    ]);
  } else {
    // Update existing
    const updates = [];
    const setClauses = [];

    if (metadata.unreadCount !== undefined) {
      setClauses.push("unreadCount = ?");
      updates.push(metadata.unreadCount);
    }
    if (metadata.lastFetch !== undefined) {
      setClauses.push("lastFetch = ?");
      updates.push(metadata.lastFetch);
    }
    if (metadata.lastSyncedAt !== undefined) {
      setClauses.push("lastSyncedAt = ?");
      updates.push(metadata.lastSyncedAt);
    }

    updates.push(uid);
    const sql = `UPDATE inboxMetadata SET ${setClauses.join(", ")} WHERE uid = ?`;
    return executeSql(sql, updates);
  }
};

export const getInboxMetadata = async (uid: string) => {
  const result = await executeSql("SELECT * FROM inboxMetadata WHERE uid = ?", [
    uid,
  ]);
  return result ? result[0] : null;
};

// VENDOR CONNECTIONS -  Connection requests network
export const createVendorConnection = async (connectionData: {
  connectionId: string;
  initiatedByUser: string;
  targetUser: string;
  initiatedByEmail?: string;
  targetUserEmail?: string;
  status?: string;
}) => {
  const sql = `
    INSERT INTO vendorConnections
    (connectionId, initiatedByUser, targetUser, initiatedByEmail, targetUserEmail, status, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  return executeSql(sql, [
    connectionData.connectionId,
    connectionData.initiatedByUser,
    connectionData.targetUser,
    connectionData.initiatedByEmail || null,
    connectionData.targetUserEmail || null,
    connectionData.status || "pending",
    new Date().toISOString(),
    new Date().toISOString(),
  ]);
};

export const getVendorConnections = async (uid: string) => {
  const result = await executeSql(
    `SELECT * FROM vendorConnections 
     WHERE (initiatedByUser = ? OR targetUser = ?)
     ORDER BY updatedAt DESC`,
    [uid, uid],
  );
  return result || [];
};

export const updateVendorConnectionStatus = async (
  connectionId: string,
  status: string,
) => {
  return executeSql(
    "UPDATE vendorConnections SET status = ?, updatedAt = ? WHERE connectionId = ?",
    [status, new Date().toISOString(), connectionId],
  );
};

// ============================================================================
// ADDITIONAL HELPER FUNCTIONS FOR APP.TSX & VENDORS.TSX
// ============================================================================

// Get ALL users (for vendor migration and directory listing)
export const getAllUsers = async () => {
  const result = await executeSql(
    "SELECT uid, username, usernameSearchable, email, emailSearchable, companyName, companyNameSearchable, createdAt FROM userProfiles ORDER BY createdAt DESC",
    [],
  );
  return result || [];
};

// Insert user into vendor directory
export const insertVendorDirectory = async (vendorData: {
  uid?: string;
  username: string;
  email?: string;
  companyName?: string;
  phone?: string;
  address?: string;
  website?: string;
  authMethod?: string;
}) => {
  const sql = `
    INSERT OR REPLACE INTO vendorDirectory
    (uid, username, usernameSearchable, email, emailSearchable, companyName, companyNameSearchable, phone, address, website, authMethod, createdAt, active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  return executeSql(sql, [
    vendorData.uid || vendorData.username,
    vendorData.username,
    vendorData.username.toLowerCase().trim(),
    vendorData.email || null,
    vendorData.email ? vendorData.email.toLowerCase().trim() : null,
    vendorData.companyName || null,
    vendorData.companyName ? vendorData.companyName.toLowerCase().trim() : null,
    vendorData.phone || null,
    vendorData.address || null,
    vendorData.website || null,
    vendorData.authMethod || "email",
    new Date().toISOString(),
    1,
  ]);
};

// Save/update user settings (preferences like activeTab)
export const saveUserSettings = async (settingsData: {
  uid: string;
  username: string;
  activeTab?: string;
  stockThreshold?: number;
  currencyPreference?: string;
  displayFlags?: any;
  uiState?: any;
}) => {
  const existingSettings = await executeSql(
    "SELECT * FROM userSettings WHERE uid = ?",
    [settingsData.uid],
  );

  if (!existingSettings || existingSettings.length === 0) {
    const sql = `
      INSERT INTO userSettings
      (uid, username, activeTab, stockThreshold, currencyPreference, lastUpdated)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    return executeSql(sql, [
      settingsData.uid,
      settingsData.username,
      settingsData.activeTab || "products",
      settingsData.stockThreshold || 10,
      settingsData.currencyPreference || "USD",
      new Date().toISOString(),
    ]);
  } else {
    const sql = `
      UPDATE userSettings 
      SET activeTab = ?, stockThreshold = ?, currencyPreference = ?, lastUpdated = ?
      WHERE uid = ?
    `;
    return executeSql(sql, [
      settingsData.activeTab || "products",
      settingsData.stockThreshold || 10,
      settingsData.currencyPreference || "USD",
      new Date().toISOString(),
      settingsData.uid,
    ]);
  }
};

// Update user's lastLogin timestamp
export const updateUserLastLogin = async (uid: string) => {
  return executeSql("UPDATE userProfiles SET lastLogin = ? WHERE uid = ?", [
    new Date().toISOString(),
    uid,
  ]);
};

// Search vendor directory by field (company name, username, email)
export const searchVendors = async (
  searchTerm: string,
  searchBy: "companyName" | "username" | "email" = "companyName",
) => {
  const searchLower = searchTerm.toLowerCase().trim();
  const searchField = `${searchBy}Searchable`;

  const sql = `
    SELECT * FROM vendorDirectory 
    WHERE ${searchField} >= ? AND ${searchField} <= ?
    AND active = 1
    ORDER BY createdAt DESC
  `;
  const result = await executeSql(sql, [searchLower, searchLower + "\uf8ff"]);
  return result || [];
};

// Get vendor directory entry by username
export const getVendorByUsername = async (username: string) => {
  const result = await executeSql(
    "SELECT * FROM vendorDirectory WHERE username = ? AND active = 1",
    [username],
  );
  return result ? result[0] : null;
};

// Update vendor directory entry
export const updateVendorDirectory = async (
  uid: string,
  vendorData: Partial<{
    email: string;
    companyName: string;
    phone: string;
    address: string;
    website: string;
  }>,
) => {
  const setClauses = [];
  const values = [];

  if (vendorData.email !== undefined) {
    setClauses.push("email = ?, emailSearchable = ?");
    values.push(vendorData.email, vendorData.email.toLowerCase().trim());
  }
  if (vendorData.companyName !== undefined) {
    setClauses.push("companyName = ?, companyNameSearchable = ?");
    values.push(
      vendorData.companyName,
      vendorData.companyName.toLowerCase().trim(),
    );
  }
  if (vendorData.phone !== undefined) {
    setClauses.push("phone = ?");
    values.push(vendorData.phone);
  }
  if (vendorData.address !== undefined) {
    setClauses.push("address = ?");
    values.push(vendorData.address);
  }
  if (vendorData.website !== undefined) {
    setClauses.push("website = ?");
    values.push(vendorData.website);
  }

  values.push(uid);

  const sql = `UPDATE vendorDirectory SET ${setClauses.join(", ")} WHERE uid = ?`;
  return executeSql(sql, values);
};

export default getTursoClient;
