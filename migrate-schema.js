import { createClient } from "@libsql/client";

const TURSO_URL = "libsql://matrix-hub-felixkalota1.aws-ap-south-1.turso.io";
const TURSO_AUTH_TOKEN =
  "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzE1NjQxMzMsImlkIjoiMzM0OTdmOTAtMmJmZS00YWM1LWJhZTMtOTM4MmVkNmRhMGU3IiwicmlkIjoiMzgzNzg3MzAtMjU2OS00MDVjLWJiNTctZTNiZGQ5OTg4ZTExIn0.rsKU_0tysE-n-uzjuT5nvzS46i5y7oEW1wbofqhwjSDmwyFWvoWDpsxC55pgPv_FatlhElTmtihB-G-bKQnhCA";

async function migrate() {
  const client = createClient({
    url: TURSO_URL,
    authToken: TURSO_AUTH_TOKEN,
  });

  try {
    console.log("🔄 Dropping existing tables...");
    
    await client.execute("DROP TABLE IF EXISTS userProfiles");
    console.log("✅ Dropped userProfiles");
    
    await client.execute("DROP TABLE IF EXISTS vendorDirectory");
    console.log("✅ Dropped vendorDirectory");
    
    await client.execute("DROP TABLE IF EXISTS userSettings");
    console.log("✅ Dropped userSettings");
    
    await client.execute("DROP TABLE IF EXISTS emailTemplates");
    console.log("✅ Dropped emailTemplates");

    console.log("\n🔄 Creating new schema...");

    // Create userProfiles with proper schema
    await client.execute(`
      CREATE TABLE userProfiles (
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
    console.log("✅ Created userProfiles");

    // Create userSettings
    await client.execute(`
      CREATE TABLE userSettings (
        uid TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        activeTab TEXT DEFAULT 'products',
        stockThreshold INTEGER DEFAULT 10,
        currencyPreference TEXT DEFAULT 'USD',
        emailPreferences TEXT,
        displayFlags TEXT,
        uiState TEXT,
        lastUpdated TEXT,
        FOREIGN KEY (uid) REFERENCES userProfiles(uid)
      )
    `);
    console.log("✅ Created userSettings");

    // Create emailTemplates
    await client.execute(`
      CREATE TABLE emailTemplates (
        templateId TEXT PRIMARY KEY,
        uid TEXT NOT NULL,
        templateName TEXT NOT NULL,
        subject TEXT,
        body TEXT,
        createdAt TEXT,
        updatedAt TEXT,
        FOREIGN KEY (uid) REFERENCES userProfiles(uid)
      )
    `);
    console.log("✅ Created emailTemplates");

    // Create vendorDirectory
    await client.execute(`
      CREATE TABLE vendorDirectory (
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
        active INTEGER DEFAULT 1,
        FOREIGN KEY (uid) REFERENCES userProfiles(uid)
      )
    `);
    console.log("✅ Created vendorDirectory");

    console.log("\n✅ Migration complete!");
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    throw error;
  }
}

migrate();
