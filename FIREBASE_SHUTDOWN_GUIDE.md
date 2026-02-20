# FIREBASE SHUTDOWN - SYSTEMATIC MIGRATION GUIDE

## 📋 COMPLETE REPLACEMENT MAPPING

### **FILE: src/App.tsx**

#### **1. LINE ~875: Update user searchable fields**
```typescript
// CURRENT (Firebase):
await updateDoc(userDocRef, updateData);

// REPLACE WITH (Turso):
// This is now handled in Turso during insertUserProfile
// No change needed - data is already searchable in Turso
```

#### **2. LINE ~906-907: Load all users (vendor migration)**
```typescript
// CURRENT (Firebase):
const usersRef = collection(db, "userSettings");
const allUsersDocs = await getDocs(usersRef);

// REPLACE WITH (Turso):
import { getAllUsers } from "./utils/tursoConfig";
const allUsersDocs = await getAllUsers(); // Returns array directly
```

#### **3. LINE ~941: Save vendor directory entry**
```typescript
// CURRENT (Firebase):
await setDoc(vendorDocRef, vendorData);

// REPLACE WITH (Turso):
import { insertVendorDirectory } from "./utils/tursoConfig";
await insertVendorDirectory(vendorData);
```

#### **4. LINE ~1100: Save active tab preference**
```typescript
// CURRENT (Firebase):
await setDoc(docRef, {
  username: username,
  activeTab: tab,
  lastUpdated: new Date().toISOString(),
});

// REPLACE WITH (Turso):
import { saveUserSettings } from "./utils/tursoConfig";
await saveUserSettings({
  uid: currentUserUid,
  username: username,
  activeTab: tab,
  lastUpdated: new Date().toISOString(),
});
```

#### **5. LINE ~1115: Delete product**
```typescript
// CURRENT (Firebase):
await deleteDoc(doc(db, "products", `${username}_${productId}`));

// REPLACE WITH (Turso):
import { deleteProduct } from "./utils/tursoConfig";
await deleteProduct(`${username}_${productId}`);
```

#### **6. LINE ~1190: Update user lastLogin**
```typescript
// CURRENT (Firebase):
await updateDoc(doc(db, "userProfiles", firebaseUser.uid), {
  lastLogin: new Date().toISOString(),
});

// REPLACE WITH (Turso):
import { updateUserLastLogin } from "./utils/tursoConfig";
await updateUserLastLogin(firebaseUser.uid);
```

#### **7. LINES ~1489-1504: Find email/username in settings**
```typescript
// CURRENT (Firebase):
const emailQ = query(
  collection(db, "userSettings"),
  where("email", "==", email),
);
const emailSnapshot = await getDocs(emailQ);

// REPLACE WITH (Turso):
import { findUserByEmailOrUsername } from "./utils/tursoConfig";
const user = await findUserByEmailOrUsername(email);
const emailSnapshot = user ? [{ data: () => user }] : [];
```

#### **8. LINES ~1545-1549: Same replacement**
```typescript
// CURRENT (Firebase):
const emailQ = query(
  collection(db, "userSettings"),
  where("email", "==", emailOrUsername),
);
const emailSnapshot = await getDocs(emailQ);

// REPLACE WITH (Turso):
const user = await findUserByEmailOrUsername(emailOrUsername);
```

---

### **FILE: src/pages/Vendors.tsx**

#### **1. LINES ~85-123: Load vendor connections**
```typescript
// CURRENT (Firebase):
const connectionsRef = collection(db, "vendorConnections");
const initiatedByMeQuery = query(
  connectionsRef,
  where("initiatedByUser", "==", currentUser),
);
const initiatedByMeDocs = await getDocs(initiatedByMeQuery);

// REPLACE WITH (Turso):
import { getVendorConnections } from "./utils/tursoConfig";
const connections = await getVendorConnections(currentUser);
const initiatedByMeDocs = connections.filter(c => c.initiatedByUser === currentUser);
```

#### **2. LINES ~102-235: Search vendor directory**
```typescript
// CURRENT (Firebase):
const vendorDirectoryRef = collection(db, "vendorDirectory");
const companyQuery = query(
  vendorDirectoryRef,
  where("companyNameSearchable", ">=", searchLower),
  where("companyNameSearchable", "<=", searchLower + "\uf8ff"),
);
const companyDocs = await getDocs(companyQuery);

// REPLACE WITH (Turso):
import { searchVendors } from "./utils/tursoConfig";
const companyDocs = await searchVendors(searchTerm, "companyName");
```

#### **3. LINES ~273-277:Get all users**
```typescript
// CURRENT (Firebase):
const usersRef = collection(db, "userSettings");
const allUsersQuery = query(usersRef);
const allUsersDocs = await getDocs(allUsersQuery);

// REPLACE WITH (Turso):
const allUsersDocs = await getAllUsers();
```

#### **4. LINES ~314-316: Same vendor/user search**
```typescript
// CURRENT (Firebase):
const vendorSearchRef = collection(db, "vendorDirectory");
const usersRef = collection(db, "userSettings");

// REPLACE WITH (Turso):
import { searchVendors } from "./utils/tursoConfig";
// Use searchVendors function instead
```

---

### **FILE: src/services/GmailOAuthService.ts**

#### **1. LINES ~140-144: Save email account**
```typescript
// CURRENT (Firebase Realtime DB):
const accountRef = ref(
  this.database,
  `users/${this.currentUser.uid}/emailAccounts/${emailAccount.id}`,
);
await set(accountRef, {
  email: emailAccount.email,
  provider: emailAccount.provider,
  accessToken: emailAccount.accessToken,
  refreshToken: emailAccount.refreshToken,
  connectedAt: emailAccount.connectedAt,
  isDefault: emailAccount.isDefault,
  lastSyncedAt: emailAccount.lastSyncedAt,
});

// REPLACE WITH (Turso):
import { saveEmailAccount } from "./utils/tursoConfig";
await saveEmailAccount({
  accountId: emailAccount.id,
  uid: this.currentUser.uid,
  email: emailAccount.email,
  provider: emailAccount.provider,
  accessToken: emailAccount.accessToken,
  refreshToken: emailAccount.refreshToken,
  isDefault: emailAccount.isDefault,
  connectedAt: emailAccount.connectedAt,
});
```

#### **2. LINES ~170-184: Get all email accounts**
```typescript
// CURRENT (Firebase):
const accountsRef = ref(
  this.database,
  `users/${this.currentUser.uid}/emailAccounts`,
);
const snapshot = await get(accountsRef);

// REPLACE WITH (Turso):
import { getEmailAccounts } from "./utils/tursoConfig";
const accounts = await getEmailAccounts(this.currentUser.uid);
```

#### **3. LINES ~206-244: Update email account tokens**
```typescript
// CURRENT (Firebase):
const accountRef = ref(
  this.database,
  `users/${this.currentUser.uid}/emailAccounts/${accountId}`,
);
await update(accountRef, {
  accessToken: newAccessToken,
  refreshToken: newRefreshToken,
  lastSyncedAt: Date.now(),
});

// REPLACE WITH (Turso):
import { updateEmailAccountToken } from "./utils/tursoConfig";
await updateEmailAccountToken(accountId, newAccessToken, newRefreshToken);
```

#### **4. LINES ~268-273: Save email history**
```typescript
// CURRENT (Firebase):
const historyRef = ref(
  this.database,
  `users/${this.currentUser.uid}/emailHistory/${emailId}`,
);
await set(historyRef, {
  fromEmail: email,
  toEmail: to,
  subject: subject,
  body: body,
  timestamp: Date.now(),
});

// REPLACE WITH (Turso):
import { saveEmailHistory } from "./utils/tursoConfig";
await saveEmailHistory({
  emailId: emailId,
  uid: this.currentUser.uid,
  fromEmail: email,
  toEmail: to,
  subject: subject,
  body: body,
  timestamp: new Date().toISOString(),
});
```

#### **5. LINES ~301-315: Get email history**
```typescript
// CURRENT (Firebase):
const historyRef = ref(
  this.database,
  `users/${this.currentUser.uid}/emailHistory`,
);
const snapshot = await get(historyRef);

// REPLACE WITH (Turso):
import { getEmailHistory } from "./utils/tursoConfig";
const history = await getEmailHistory(this.currentUser.uid);
```

---

### **FILE: src/utils/firebaseRealtimeConfig.ts**

**This entire file can be DEPRECATED.** Replace all calls with Turso equivalents:

```typescript
// REMOVE: writeToDatabase()
// REPLACE: Use saveEmailAccount(), saveEmailHistory(), updateInboxMetadata()

// REMOVE: readFromDatabase()
// REPLACE: Use getEmailAccounts(), getEmailHistory(), getInboxMetadata()

// REMOVE: updateDatabase()  
// REPLACE: Use updateEmailAccountToken(), updateInboxMetadata()

// REMOVE: deleteFromDatabase()
// REPLACE: Use deleteEmailAccount()
```

---

## 🔄 ADDITIONAL TURSO FUNCTIONS TO ADD

I've already added these helper functions to `src/utils/tursoConfig.ts`. Here's what's available:

### **Product Management:**
- `saveProduct()` - Save user product
- `deleteProduct()` - Delete product
- `getUserProducts()` - Get all user products

### **Quotations:**
- `saveQuotation()` - Save quotation
- `getQuotationHistory()` - Get user quotations

### **Inquiries:**
- `saveInquiry()` - Save inquiry
- `getInquiryHistory()` - Get sent inquiries
- `getIncomingInquiries()` - Get received inquiries

### **Orders:**
- `saveOrder()` - Save order
- `getOrderHistory()` - Get user orders

### **Invoices:**
- `saveInvoice()` - Save invoice
- `getInvoice()` - Get invoice

### **PDF Templates:**
- `savePDFTemplate()` - Save letterhead
- `getPDFTemplate()` - Get letterhead

### **Email Management (Firebase Realtime DB Replacements):**
- `saveEmailAccount()` - Gmail OAuth connection
- `getEmailAccounts()` - List email accounts  
- `updateEmailAccountToken()` - Refresh token
- `deleteEmailAccount()` - Remove email account

### **Email History:**
- `saveEmailHistory()` - Log sent email
- `getEmailHistory()` - Get email logs

### **Inbox Metadata:**
- `updateInboxMetadata()` - Update unread count
- `getInboxMetadata()` - Get inbox stats

### **Vendor Connections:**
- `createVendorConnection()` - Send connection request
- `getVendorConnections()` - Get connections
- `updateVendorConnectionStatus()` - Accept/reject req

---

## 📊 MIGRATION CHECKLIST

| File | Lines | Status | Action |
|------|-------|--------|--------|
| App.tsx | ~875 | TODO | Replace updateDoc with Turso |
| App.tsx | ~906-907 | TODO | Replace getDocs with getAllUsers |
| App.tsx | ~941 | TODO | Replace setDoc with insertVendorDirectory |
| App.tsx | ~1100 | TODO | Replace setDoc with saveUserSettings |
| App.tsx | ~1115 | TODO | Replace deleteDoc with deleteProduct |
| App.tsx | ~1190 | TODO | Replace updateDoc with updateUserLastLogin |
| App.tsx | ~1489-1504 | TODO | Replace getDocs with findUserByEmailOrUsername |
| App.tsx | ~1545-1549 | TODO | Replace getDocs with findUserByEmailOrUsername |
| Vendors.tsx | ~85-123 | TODO | Replace collection+getDocs with getVendorConnections |
| Vendors.tsx | ~102-235 | TODO | Replace collection+getDocs with searchVendors |
| Vendors.tsx | ~273-277 | TODO | Replace getDocs with getAllUsers |
| Vendors.tsx | ~314-316 | TODO | Replace collection+query with searchVendors |
| GmailOAuthService.ts | ~140-144 | TODO | Replace Firebase Realtime DB set with saveEmailAccount |
| GmailOAuthService.ts | ~170-184 | TODO | Replace Firebase Realtime DB get with getEmailAccounts |
| GmailOAuthService.ts | ~206-244 | TODO | Replace Firebase Realtime DB update with updateEmailAccountToken |
| GmailOAuthService.ts | ~268-273 | TODO | Replace Firebase Realtime DB set with saveEmailHistory |
| GmailOAuthService.ts | ~301-315 | TODO | Replace Firebase Realtime DB get with getEmailHistory |
| firebaseRealtimeConfig.ts | - | TODO | DEPRECATE - move all to Turso |

---

## ⚠️ CRITICAL: Missing Turso Helper Functions

You need to ADD these to tursoConfig.ts (I'll provide code):

1. `getAllUsers()` - Get all users from userProfiles
2. `insertVendorDirectory()` - Insert into vendorDirectory
3. `saveUserSettings()` - Save user preferences
4. `updateUserLastLogin()` - Update lastLogin timestamp
5. `searchVendors()` - Search vendor directory by field

Let me create these functions next.

---

## 🚀 NEXT STEPS

1. **Add missing Turso functions** to tursoConfig.ts
2. **Systematically replace each Firebase call** using this guide
3. **Test each file** as you go
4. **Remove Firebase imports** from files that no longer need them
5. **Delete firebaseRealtimeConfig.ts** when complete
6. **Test full application flow** (signup, login, create products, search vendors)

---

**Timeline:** ~2-3 hours for complete migration
**Risk Level:** Low (Turso functions follow same patterns as Firebase)
**Testing:** Test each major feature as you migrate
