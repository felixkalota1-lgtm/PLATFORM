import { createClient } from '@libsql/client';

const TURSO_URL = "libsql://matrix-hub-felixkalota1.aws-ap-south-1.turso.io";
const TURSO_AUTH_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzE1NjQxMzMsImlkIjoiMzM0OTdmOTAtMmJmZS00YWM1LWJhZTMtOTM4MmVkNmRhMGU3IiwicmlkIjoiMzgzNzg3MzAtMjU2OS00MDVjLWJiNTctZTNiZGQ5OTg4ZTExIn0.rsKU_0tysE-n-uzjuT5nvzS46i5y7oEW1wbofqhwjSDmwyFWvoWDpsxC55pgPv_FatlhElTmtihB-G-bKQnhCA";

const client = createClient({
  url: TURSO_URL,
  authToken: TURSO_AUTH_TOKEN,
});

async function main() {
  try {
    console.log('\n🔗 Connecting to Turso database...\n');
    
    const result = await client.execute(
      'SELECT uid, username, email, createdAt FROM userProfiles ORDER BY createdAt DESC'
    );
    
    if (result.rows.length === 0) {
      console.log('❌ No users found in database');
      process.exit(0);
    }
    
    console.log(`✅ Found ${result.rows.length} user(s) in database:\n`);
    console.log('═'.repeat(80));
    
    result.rows.forEach((row, idx) => {
      console.log(`\n${idx + 1}. Username: ${row.username}`);
      console.log(`   Email:    ${row.email}`);
      console.log(`   UID:      ${row.uid}`);
      console.log(`   Created:  ${row.createdAt}`);
    });
    
    console.log('\n' + '═'.repeat(80));
    console.log(`\nTotal Users: ${result.rows.length}\n`);
    
  } catch (error) {
    console.error('❌ Error connecting or querying:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

main();
