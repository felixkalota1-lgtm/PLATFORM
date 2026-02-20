import { createClient } from '@libsql/client';

const TURSO_URL = "libsql://matrix-hub-felixkalota1.aws-ap-south-1.turso.io";
const TURSO_AUTH_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzE1NjQxMzMsImlkIjoiMzM0OTdmOTAtMmJmZS00YWM1LWJhZTMtOTM4MmVkNmRhMGU3IiwicmlkIjoiMzgzNzg3MzAtMjU2OS00MDVjLWJiNTctZTNiZGQ5OTg4ZTExIn0.rsKU_0tysE-n-uzjuT5nvzS46i5y7oEW1wbofqhwjSDmwyFWvoWDpsxC55pgPv_FatlhElTmtihB-G-bKQnhCA";

const client = createClient({
  url: TURSO_URL,
  authToken: TURSO_AUTH_TOKEN,
});

async function initializeSchema() {
  try {
    console.log('\n🔧 Initializing Turso database schema...\n');
    
    // Create user_profiles table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS userProfiles (
        uid TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        usernameSearchable TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        passwordHash TEXT,
        gmailEmail TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created userProfiles table');
    
    // Create settings table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS userSettings (
        uid TEXT PRIMARY KEY,
        companyName TEXT,
        country TEXT,
        accountType TEXT,
        notificationEmail TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (uid) REFERENCES userProfiles(uid)
      )
    `);
    console.log('✅ Created userSettings table');
    
    // Create email templates table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS emailTemplates (
        id TEXT PRIMARY KEY,
        uid TEXT NOT NULL,
        name TEXT NOT NULL,
        subject TEXT,
        body TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (uid) REFERENCES userProfiles(uid)
      )
    `);
    console.log('✅ Created emailTemplates table');
    
    console.log('\n✅ Database schema initialized successfully!\n');
    
  } catch (error) {
    console.error('❌ Error initializing schema:', error.message);
    process.exit(1);
  }
}

initializeSchema();
