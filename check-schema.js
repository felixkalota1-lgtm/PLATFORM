import { createClient } from "@libsql/client";

const client = createClient({
  url: "libsql://matrix-hub-felixkalota1.aws-ap-south-1.turso.io",
  authToken:
    "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzE1NjQxMzMsImlkIjoiMzM0OTdmOTAtMmJmZS00YWM1LWJhZTMtOTM4MmVkNmRhMGU3IiwicmlkIjoiMzgzNzg3MzAtMjU2OS00MDVjLWJiNTctZTNiZGQ5OTg4ZTExIn0.rsKU_0tysE-n-uzjuT5nvzS46i5y7oEW1wbofqhwjSDmwyFWvoWDpsxC55pgPv_FatlhElTmtihB-G-bKQnhCA",
});

async function test() {
  try {
    const result = await client.execute("PRAGMA table_info(userProfiles);");
    console.log("userProfiles full structure:");
    result.rows.forEach((r) => {
      console.log(`  ${r.cid}: ${r.name} (${r.type}) - notnull=${r.notnull}, pk=${r.pk}`);
    });

    const tables = await client.execute(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
    );
    console.log("\nAll tables in database:");
    tables.rows.forEach((r) => console.log(`  - ${r.name}`));

    // Show vendorDirectory structure
    console.log("\nvendorDirectory table structure:");
    const vendorStructure = await client.execute("PRAGMA table_info(vendorDirectory);");
    vendorStructure.rows.forEach((r) => {
      console.log(`  ${r.cid}: ${r.name} (${r.type})`);
    });
  } catch (error) {
    console.error("Error:", error.message);
  }
}

test();
