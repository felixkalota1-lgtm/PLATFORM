import { createClient } from "@libsql/client";

const TURSO_URL = "libsql://matrix-hub-felixkalota1.aws-ap-south-1.turso.io";
const TURSO_AUTH_TOKEN =
  "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzE1NjQxMzMsImlkIjoiMzM0OTdmOTAtMmJmZS00YWM1LWJhZTMtOTM4MmVkNmRhMGU3IiwicmlkIjoiMzgzNzg3MzAtMjU2OS00MDVjLWJiNTctZTNiZGQ5OTg4ZTExIn0.rsKU_0tysE-n-uzjuT5nvzS46i5y7oEW1wbofqhwjSDmwyFWvoWDpsxC55pgPv_FatlhElTmtihB-G-bKQnhCA";

async function test() {
  try {
    console.log("🔗 Connecting to Turso...");
    const client = createClient({
      url: TURSO_URL,
      authToken: TURSO_AUTH_TOKEN,
    });

    console.log("🔗 Testing schema...");
    const result = await client.execute(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
    );

    console.log("✅ Tables in database:");
    result.rows.forEach((row) => {
      console.log(`   - ${row.name}`);
    });

    console.log("\n🔗 Checking userProfiles table structure...");
    const structureResult = await client.execute(
      "PRAGMA table_info(userProfiles);"
    );
    console.log("✅ userProfiles columns:");
    structureResult.rows.forEach((row) => {
      console.log(`   - ${row.name}: ${row.type}`);
    });

    console.log("\n🔗 Checking if any users exist...");
    const usersResult = await client.execute(
      "SELECT COUNT(*) as count FROM userProfiles;"
    );
    console.log("✅ User count:", usersResult.rows[0].count);

    console.log("\n✅ All tests passed!");
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

test();
