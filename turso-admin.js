#!/usr/bin/env node

import { createClient } from '@libsql/client';
import readline from 'readline';

const TURSO_URL = "libsql://matrix-hub-felixkalota1.aws-ap-south-1.turso.io";
const TURSO_AUTH_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzE1NjQxMzMsImlkIjoiMzM0OTdmOTAtMmJmZS00YWM1LWJhZTMtOTM4MmVkNmRhMGU3IiwicmlkIjoiMzgzNzg3MzAtMjU2OS00MDVjLWJiNTctZTNiZGQ5OTg4ZTExIn0.rsKU_0tysE-n-uzjuT5nvzS46i5y7oEW1wbofqhwjSDmwyFWvoWDpsxC55pgPv_FatlhElTmtihB-G-bKQnhCA";

const client = createClient({
  url: TURSO_URL,
  authToken: TURSO_AUTH_TOKEN,
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function showMenu() {
  console.log('\n========== TURSO DATABASE ADMIN ==========');
  console.log('1. View all users');
  console.log('2. View user by email');
  console.log('3. Update user username');
  console.log('4. Delete user');
  console.log('5. Run SQL query');
  console.log('6. Exit');
  console.log('=========================================\n');
}

async function getAllUsers() {
  try {
    const result = await client.execute(
      'SELECT uid, username, email, created_at FROM userProfiles ORDER BY created_at DESC LIMIT 50'
    );
    if (result.rows.length === 0) {
      console.log('\n❌ No users found');
      return;
    }
    console.log('\n✅ Users in database:');
    console.log('┌─────────────────────────────────────────────────────────────────┐');
    result.rows.forEach((row, idx) => {
      console.log(`${idx + 1}. ${row.username} (${row.email})`);
      console.log(`   UID: ${row.uid}`);
      console.log(`   Created: ${row.created_at}`);
    });
    console.log('└─────────────────────────────────────────────────────────────────┘');
  } catch (error) {
    console.error('❌ Error fetching users:', error.message);
  }
}

async function findUserByEmail(email) {
  try {
    const result = await client.execute('SELECT * FROM userProfiles WHERE email = ?', [email]);
    if (result.rows.length === 0) {
      console.log(`\n❌ No user found with email: ${email}`);
      return;
    }
    console.log('\n✅ User found:');
    console.log(JSON.stringify(result.rows[0], null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function updateUsername(email, newUsername) {
  try {
    const result = await client.execute(
      'UPDATE userProfiles SET username = ? WHERE email = ? RETURNING *',
      [newUsername, email]
    );
    if (result.rows.length === 0) {
      console.log(`\n❌ User not found with email: ${email}`);
      return;
    }
    console.log(`\n✅ Username updated successfully!`);
    console.log(JSON.stringify(result.rows[0], null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function deleteUser(email) {
  try {
    rl.question(`⚠️  Are you sure you want to delete user ${email}? (yes/no): `, async (answer) => {
      if (answer.toLowerCase() === 'yes') {
        await client.execute('DELETE FROM userProfiles WHERE email = ?', [email]);
        console.log(`\n✅ User ${email} deleted successfully!`);
      } else {
        console.log('\n❌ Delete cancelled');
      }
      promptUser();
    });
    return;
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  promptUser();
}

async function runCustomSQL(query) {
  try {
    const result = await client.execute(query);
    console.log('\n✅ Query result:');
    console.log(JSON.stringify(result.rows, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function promptUser() {
  showMenu();
  rl.question('Choose option (1-6): ', async (choice) => {
    switch (choice) {
      case '1':
        await getAllUsers();
        promptUser();
        break;
      case '2':
        rl.question('Enter email: ', async (email) => {
          await findUserByEmail(email);
          promptUser();
        });
        break;
      case '3':
        rl.question('Enter email: ', (email) => {
          rl.question('Enter new username: ', async (newUsername) => {
            await updateUsername(email, newUsername);
            promptUser();
          });
        });
        break;
      case '4':
        rl.question('Enter email to delete: ', async (email) => {
          await deleteUser(email);
        });
        break;
      case '5':
        rl.question('Enter SQL query: ', async (query) => {
          await runCustomSQL(query);
          promptUser();
        });
        break;
      case '6':
        console.log('\n👋 Goodbye!');
        rl.close();
        process.exit(0);
        break;
      default:
        console.log('❌ Invalid option');
        promptUser();
    }
  });
}

// Start the admin tool
console.log('\n🚀 Turso Database Admin Tool');
console.log('Database: matrix-hub-felixkalota1');
promptUser();
