import { createClient } from '@libsql/client';

const TURSO_URL = "libsql://matrix-hub-felixkalota1.aws-ap-south-1.turso.io";
const TURSO_AUTH_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzE1NjQxMzMsImlkIjoiMzM0OTdmOTAtMmJmZS00YWM1LWJhZTMtOTM4MmVkNmRhMGU3IiwicmlkIjoiMzgzNzg3MzAtMjU2OS00MDVjLWJiNTctZTNiZGQ5OTg4ZTExIn0.rsKU_0tysE-n-uzjuT5nvzS46i5y7oEW1wbofqhwjSDmwyFWvoWDpsxC55pgPv_FatlhElTmtihB-G-bKQnhCA";

const client = createClient({
  url: TURSO_URL,
  authToken: TURSO_AUTH_TOKEN,
});

async function main() {
  try {
    console.log('\n🔍 TURSO DATABASE OVERVIEW\n');
    
    // Check userProfiles
    console.log('📋 userProfiles table:');
    const users = await client.execute('SELECT COUNT(*) as count FROM userProfiles');
    console.log(`   Total rows: ${users.rows[0].count}`);
    
    if (users.rows[0].count > 0) {
      const allUsers = await client.execute('SELECT uid, username, email, created_at FROM userProfiles');
      allUsers.rows.forEach((u, i) => {
        console.log(`   ${i + 1}. ${u.username} - ${u.email}`);
      });
    } else {
      console.log('   (No users yet)');
    }
    
    // Check userSettings
    console.log('\n⚙️  userSettings table:');
    const settings = await client.execute('SELECT COUNT(*) as count FROM userSettings');
    console.log(`   Total rows: ${settings.rows[0].count}`);
    
    // Check emailTemplates
    console.log('\n✉️  emailTemplates table:');
    const templates = await client.execute('SELECT COUNT(*) as count FROM emailTemplates');
    console.log(`   Total rows: ${templates.rows[0].count}`);
    
    console.log('\n✅ Database is accessible and initialized!\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

main();
