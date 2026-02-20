import { createClient } from "@libsql/client";

const TURSO_URL = "libsql://matrix-hub-felixkalota1.aws-ap-south-1.turso.io";
const TURSO_AUTH_TOKEN =
  "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzE1NjQxMzMsImlkIjoiMzM0OTdmOTAtMmJmZS00YWM1LWJhZTMtOTM4MmVkNmRhMGU3IiwicmlkIjoiMzgzNzg3MzAtMjU2OS00MDVjLWJiNTctZTNiZGQ5OTg4ZTExIn0.rsKU_0tysE-n-uzjuT5nvzS46i5y7oEW1wbofqhwjSDmwyFWvoWDpsxC55pgPv_FatlhElTmtihB-G-bKQnhCA";

async function extendSchema() {
  const client = createClient({
    url: TURSO_URL,
    authToken: TURSO_AUTH_TOKEN,
  });

  try {
    console.log("🔄 Extending Turso schema with complete database structure...\n");

    // Email Accounts (Gmail OAuth connections)
    await client.execute(`
      CREATE TABLE IF NOT EXISTS emailAccounts (
        accountId TEXT PRIMARY KEY,
        uid TEXT NOT NULL,
        email TEXT NOT NULL,
        provider TEXT NOT NULL DEFAULT 'gmail',
        accessToken TEXT NOT NULL,
        refreshToken TEXT,
        isDefault INTEGER DEFAULT 0,
        connectedAt TEXT,
        lastSyncedAt TEXT,
        FOREIGN KEY (uid) REFERENCES userProfiles(uid)
      )
    `);
    console.log("✅ Created emailAccounts table");

    // Email History (sent emails log)
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
    console.log("✅ Created emailHistory table");

    // Inbox Metadata (unread count, sync info)
    await client.execute(`
      CREATE TABLE IF NOT EXISTS inboxMetadata (
        uid TEXT PRIMARY KEY,
        unreadCount INTEGER DEFAULT 0,
        lastFetch TEXT,
        lastSyncedAt TEXT,
        FOREIGN KEY (uid) REFERENCES userProfiles(uid)
      )
    `);
    console.log("✅ Created inboxMetadata table");

    // Products (user product listings)
    await client.execute(`
      CREATE TABLE IF NOT EXISTS products (
        productId TEXT PRIMARY KEY,
        uid TEXT NOT NULL,
        username TEXT NOT NULL,
        usernameSearchable TEXT,
        productName TEXT NOT NULL,
        category TEXT,
        description TEXT,
        price REAL,
        unit TEXT,
        moqValue INTEGER,
        moqUnit TEXT,
        minOrderValue REAL,
        imageUrl TEXT,
        createdAt TEXT,
        updatedAt TEXT,
        FOREIGN KEY (uid) REFERENCES userProfiles(uid)
      )
    `);
    console.log("✅ Created products table");

    // Quotations (quote documents/requests)
    await client.execute(`
      CREATE TABLE IF NOT EXISTS quotations (
        quotationId TEXT PRIMARY KEY,
        uid TEXT NOT NULL,
        username TEXT NOT NULL,
        senderEmail TEXT,
        recipientEmail TEXT,
        recipientName TEXT,
        recipientCompany TEXT,
        subject TEXT,
        body TEXT,
        items TEXT,
        createdAt TEXT,
        updatedAt TEXT,
        status TEXT DEFAULT 'draft',
        FOREIGN KEY (uid) REFERENCES userProfiles(uid)
      )
    `);
    console.log("✅ Created quotations table");

    // Inquiries (inquiry requests)
    await client.execute(`
      CREATE TABLE IF NOT EXISTS inquiries (
        inquiryId TEXT PRIMARY KEY,
        uid TEXT NOT NULL,
        username TEXT NOT NULL,
        senderEmail TEXT,
        recipientEmail TEXT,
        recipientName TEXT,
        recipientCompany TEXT,
        subject TEXT,
        body TEXT,
        items TEXT,
        createdAt TEXT,
        updatedAt TEXT,
        status TEXT DEFAULT 'new',
        FOREIGN KEY (uid) REFERENCES userProfiles(uid)
      )
    `);
    console.log("✅ Created inquiries table");

    // Orders (purchase orders)
    await client.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        orderId TEXT PRIMARY KEY,
        uid TEXT NOT NULL,
        username TEXT NOT NULL,
        vendorEmail TEXT,
        vendorName TEXT,
        vendorCompany TEXT,
        items TEXT,
        totalAmount REAL,
        currency TEXT DEFAULT 'USD',
        createdAt TEXT,
        updatedAt TEXT,
        status TEXT DEFAULT 'pending',
        FOREIGN KEY (uid) REFERENCES userProfiles(uid)
      )
    `);
    console.log("✅ Created orders table");

    // Invoices (invoice documents)
    await client.execute(`
      CREATE TABLE IF NOT EXISTS invoices (
        invoiceId TEXT PRIMARY KEY,
        uid TEXT NOT NULL,
        username TEXT NOT NULL,
        vendorEmail TEXT,
        vendorName TEXT,
        customerName TEXT,
        customerEmail TEXT,
        items TEXT,
        totalAmount REAL,
        currency TEXT DEFAULT 'USD',
        createdAt TEXT,
        updatedAt TEXT,
        status TEXT DEFAULT 'draft',
        FOREIGN KEY (uid) REFERENCES userProfiles(uid)
      )
    `);
    console.log("✅ Created invoices table");

    // PDF Templates (letterheads and templates)
    await client.execute(`
      CREATE TABLE IF NOT EXISTS pdfTemplates (
        templateId TEXT PRIMARY KEY,
        uid TEXT NOT NULL,
        username TEXT NOT NULL,
        templateName TEXT NOT NULL,
        templateType TEXT DEFAULT 'letterhead',
        htmlContent TEXT,
        logoUrl TEXT,
        companyName TEXT,
        companyAddress TEXT,
        companyPhone TEXT,
        companyEmail TEXT,
        companyWebsite TEXT,
        createdAt TEXT,
        updatedAt TEXT,
        FOREIGN KEY (uid) REFERENCES userProfiles(uid)
      )
    `);
    console.log("✅ Created pdfTemplates table");

    // Vendor Connections (connection requests/network)
    await client.execute(`
      CREATE TABLE IF NOT EXISTS vendorConnections (
        connectionId TEXT PRIMARY KEY,
        initiatedByUser TEXT NOT NULL,
        targetUser TEXT NOT NULL,
        initiatedByEmail TEXT,
        targetUserEmail TEXT,
        status TEXT DEFAULT 'pending',
        createdAt TEXT,
        updatedAt TEXT,
        FOREIGN KEY (initiatedByUser) REFERENCES userProfiles(uid),
        FOREIGN KEY (targetUser) REFERENCES userProfiles(uid)
      )
    `);
    console.log("✅ Created vendorConnections table");

    // Verify all tables created
    console.log("\n📋 Verifying all tables...");
    const tables = await client.execute(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
    );
    console.log("\n✅ All tables in database:");
    tables.rows.forEach((row) => {
      console.log(`   - ${row.name}`);
    });

    console.log("\n✅ Schema extension complete!");
  } catch (error) {
    console.error("❌ Schema extension failed:", error.message);
    throw error;
  }
}

extendSchema();
