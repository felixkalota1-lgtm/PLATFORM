import { createClient } from "@libsql/client";

const TURSO_URL = "libsql://matrix-hub-felixkalota1.aws-ap-south-1.turso.io";
const TURSO_AUTH_TOKEN =
  "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzE1NjQxMzMsImlkIjoiMzM0OTdmOTAtMmJmZS00YWM1LWJhZTMtOTM4MmVkNmRhMGU3IiwicmlkIjoiMzgzNzg3MzAtMjU2OS00MDVjLWJiNTctZTNiZGQ5OTg4ZTExIn0.rsKU_0tysE-n-uzjuT5nvzS46i5y7oEW1wbofqhwjSDmwyFWvoWDpsxC55pgPv_FatlhElTmtihB-G-bKQnhCA";

async function testSignupSimulation() {
  const client = createClient({
    url: TURSO_URL,
    authToken: TURSO_AUTH_TOKEN,
  });

  try {
    console.log("🔐 Testing signup simulation...\n");

    const uid = "test-user-123";
    const username = "testuser";
    const email = "test@example.com";
    const companyName = "Test Company";
    const authMethod = "email";

    console.log("1️⃣ Checking if username exists...");
    const existenceCheckResult = await client.execute(
      "SELECT COUNT(*) as count FROM userProfiles WHERE usernameSearchable = ?",
      [username.toLowerCase().trim()]
    );
    const usernameExists = existenceCheckResult.rows[0].count > 0;
    console.log(`   Username exists: ${usernameExists}`);

    if (usernameExists) {
      console.log("   ❌ Username is taken!");
      return;
    }

    console.log("\n2️⃣ Inserting user profile into Turso...");
    const insertResult = await client.execute(
      `INSERT INTO userProfiles 
       (uid, username, usernameSearchable, email, emailSearchable, companyName, companyNameSearchable, authMethod, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        uid,
        username,
        username.toLowerCase().trim(),
        email,
        email.toLowerCase().trim(),
        companyName,
        companyName.toLowerCase().trim(),
        authMethod,
        new Date().toISOString(),
      ]
    );
    console.log("   ✅ User profile inserted successfully");

    console.log("\n3️⃣ Verifying user was inserted...");
    const verifyResult = await client.execute(
      "SELECT * FROM userProfiles WHERE uid = ?",
      [uid]
    );

    if (verifyResult.rows.length > 0) {
      const user = verifyResult.rows[0];
      console.log("   ✅ User found in database:");
      console.log(`      - Username: ${user.username}`);
      console.log(`      - Email: ${user.email}`);
      console.log(`      - Company: ${user.companyName}`);
      console.log(`      - Auth Method: ${user.authMethod}`);
      console.log(`      - Created At: ${user.createdAt}`);
    } else {
      console.log("   ❌ User not found!");
    }

    console.log("\n4️⃣ Listing all users in database...");
    const allUsers = await client.execute("SELECT uid, username, email FROM userProfiles");
    console.log(`   ✅ Found ${allUsers.rows.length} user(s)`);
    allUsers.rows.forEach((u) => {
      console.log(`      - ${u.username} (${u.email})`);
    });

    console.log("\n✅ Signup simulation successful!");
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

testSignupSimulation();
