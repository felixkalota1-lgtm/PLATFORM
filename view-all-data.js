import { createClient } from '@libsql/client';

const TURSO_URL = "libsql://matrix-hub-felixkalota1.aws-ap-south-1.turso.io";
const TURSO_AUTH_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzE1NjQxMzMsImlkIjoiMzM0OTdmOTAtMmJmZS00YWM1LWJhZTMtOTM4MmVkNmRhMGU3IiwicmlkIjoiMzgzNzg3MzAtMjU2OS00MDVjLWJiNTctZTNiZGQ5OTg4ZTExIn0.rsKU_0tysE-n-uzjuT5nvzS46i5y7oEW1wbofqhwjSDmwyFWvoWDpsxC55pgPv_FatlhElTmtihB-G-bKQnhCA";

const client = createClient({
  url: TURSO_URL,
  authToken: TURSO_AUTH_TOKEN,
});

async function viewAllData() {
  try {
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('🗄️  TURSO DATABASE - ALL DATA');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    // Get all tables
    const tablesResult = await client.execute(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    );
    
    const tables = tablesResult.rows.map(r => r.name);
    console.log(`📊 Tables Found: ${tables.length}`);
    console.log(`   ${tables.join(', ')}\n`);
    
    // View each table
    for (const table of tables) {
      try {
        const result = await client.execute(`SELECT * FROM ${table}`);
        
        console.log(`\n📋 TABLE: ${table.toUpperCase()}`);
        console.log('─'.repeat(60));
        
        if (result.rows.length === 0) {
          console.log('   (empty)');
        } else {
          console.log(`   Rows: ${result.rows.length}`);
          result.rows.forEach((row, idx) => {
            console.log(`\n   Row ${idx + 1}:`);
            Object.entries(row).forEach(([key, value]) => {
              console.log(`      ${key}: ${value}`);
            });
          });
        }
      } catch (error) {
        console.log(`   ❌ Error reading table: ${error.message}`);
      }
    }
    
    console.log('\n═══════════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

viewAllData();
