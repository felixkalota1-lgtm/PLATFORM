# FIREBASE COMPLETE SHUTDOWN - EXECUTION PLAN

## ✅ COMPLETED SETUP
- [x] Extended Turso schema with 10 new tables
- [x] Created 40+ Turso helper functions in tursoConfig.ts
- [x] Build verified (no TypeScript errors)
- [x] Migration guide created (FIREBASE_SHUTDOWN_GUIDE.md)

---

## 🎯 EXECUTION STRATEGY: Phase-by-Phase

### **PHASE 1: Auth Migration (CRITICAL - FIRST)**

✅ **ALREADY DONE** - These use Turso:
- `signUpWithEmailAndPassword()` in firebaseAuth.ts
- `handleSignup()` in App.tsx
- `handleLogin()` in App.tsx
- `handleGmailLogin()` in App.tsx
- `handleCompleteGmailSignup()` in App.tsx

**Verify login works:** Test email/password signup and login via UI

---

### **PHASE 2: User Settings & Preferences (2-3 hours)**

**File: src/App.tsx**

| Line | Current Firebase | Turso Replacement | Status |
|------|------------------|-------------------|--------|
| ~1100 | `setDoc(docRef, {...})` | `saveUserSettings({...})` | TODO |
| ~875 | `updateDoc(userDocRef, updateData)` | Remove (already searchable in Turso) | TODO |

**Action:**
1. Find line ~1100 (saveUserActiveTab function)
2. Replace `setDoc()` call with `saveUserSettings()`
3. Find line ~875 (migration function) - already handled, can remove Firebase call
4. **Test:** Switch between tabs and verify they save/restore on reload

---

### **PHASE 3: Vendor Directory & Search (3-4 hours)**

**Files: App.tsx + Vendors.tsx**

#### **App.tsx:**

| Line | Current Firebase | Turso Replacement | Status |
|------|------------------|-------------------|--------|
| ~906-920 | `collection(db, "userSettings") + getDocs()` | `getAllUsers()` | TODO |
| ~941 | `setDoc(vendorDocRef, vendorData)` | `insertVendorDirectory(vendorData)` | TODO |

#### **Vendors.tsx:**

| Line | Current Firebase | Turso Replacement | Status |
|------|------------------|-------------------|--------|
| ~102-235 | Multiple `query()` + `getDocs()` for search | `searchVendors(term, field)` | TODO |
| ~273-277 | `getDocs(collection(db, "userSettings"))` | `getAllUsers()` | TODO |
| ~85-123 | `collection()` + `where()` for connections | `getVendorConnections()` | TODO |

**Action:**
1. **App.tsx line ~906:** Replace `getDocs(collection(db, "userSettings"))` with `const allUsersDocs = await getAllUsers()`
2. **App.tsx line ~941:** Replace `setDoc(vendorDocRef, {...})` with `await insertVendorDirectory({...})`
3. **Vendors.tsx line ~314-316:** Replace all vendor search queries with `searchVendors(searchTerm)`
4. **Vendors.tsx line ~85-123:** Replace connection queries with `getVendorConnections(uid)`
5.  **Test:** Search vendors, vendor discovery, vendor connections

---

### **PHASE 4: Products, Quotations, Orders (2-3 hours)**

**File: App.tsx**

| Line | Current Firebase | Turso Replacement | Status |
|------|------------------|-------------------|--------|
| ~1100+ | `setDoc(docRef, product)` | `saveProduct({...})` | TODO |
| ~1115 | `deleteDoc(...)` | `deleteProduct(productId)` | TODO |
| Quotations | `setDoc(...)` | `saveQuotation({...})` | TODO |
| Orders | `setDoc(...)` | `saveOrder({...})` | TODO |

**Action:**
1. Find all product save operations → use `saveProduct()`
2. Find all product delete operations → use `deleteProduct()`
3. Find all quotation saves → use `saveQuotation()`
4. Find all order saves → use `saveOrder()`
5. **Test:** Create product, create quotation, send order

---

### **PHASE 5: Email Accounts & History (2-3 hours)**

**File: src/services/GmailOAuthService.ts**

| Line | Current Firebase Realtime DB | Turso Replacement | Status |
|------|-----|--|---|
| ~140-144 | `set(accountRef, {...})` | `saveEmailAccount({...})` | TODO |
| ~170-184 | `get(accountsRef)` | `getEmailAccounts(uid)` | TODO |
| ~206-244 | `update(accountRef, {...})` | `updateEmailAccountToken()` | TODO |
| ~268-273 | `set(historyRef, {...})` | `saveEmailHistory({...})` | TODO |
| ~301-315 | `get(historyRef)` | `getEmailHistory(uid)` | TODO |

**Action:**
1. Replace all Firebase Realtime DB `ref()` + `set()` with Turso `saveEmailAccount()` or `saveEmailHistory()`
2. Replace all Firebase Realtime DB `get()` with Turso `getEmailAccounts()` or `getEmailHistory()`
3. Replace `update()` with `updateEmailAccountToken()`
4. **Test:** Connect Gmail account, send email, view email history

---

## 📋 DETAILED REPLACEMENT EXAMPLES

### **Example 1: User Settings Save (Line ~1100 in App.tsx)**

**BEFORE:**
```typescript
const saveUserActiveTab = async (username: string, tab: string) => {
  try {
    if (!db) {
      localStorage.setItem(`cache_tab_${username}`, tab);
      return;
    }
    const docRef = doc(db, "userSettings", username);
    await setDoc(docRef, {
      username: username,
      activeTab: tab,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error saving active tab:", error);
    localStorage.setItem(`cache_tab_${username}`, tab);
  }
};
```

**AFTER:**
```typescript
const saveUserActiveTab = async (username: string, tab: string, uid: string) => {
  try {
    const { saveUserSettings } = await import("./utils/tursoConfig");
    await saveUserSettings({
      uid: uid,
      username: username,
      activeTab: tab,
    });
  } catch (error) {
    console.error("Error saving active tab:", error);
    localStorage.setItem(`cache_tab_${username}`, tab);
  }
};
```

### **Example 2: Vendor Search (Line ~314 in Vendors.tsx)**

**BEFORE:**
```typescript
const vendorSearchRef = collection(db, "vendorDirectory");
const companyQuery = query(
  vendorSearchRef,
  where("companyNameSearchable", ">=", searchLower),
  where("companyNameSearchable", "<=", searchLower + "\uf8ff"),
);
const companyDocs = await getDocs(companyQuery);
```

**AFTER:**
```typescript
import { searchVendors } from "../../utils/tursoConfig";
const companyDocs = await searchVendors(searchTerm, "companyName");
// Returns array of vendors directly
```

### **Example 3: Email Account Save (Line ~140 in GmailOAuthService.ts)**

**BEFORE:**
```typescript
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
```

**AFTER:**
```typescript
import { saveEmailAccount } from "../utils/tursoConfig";
await saveEmailAccount({
  accountId: emailAccount.id,
  uid: this.currentUser.uid,
  email: emailAccount.email,
  provider: emailAccount.provider || 'gmail',
  accessToken: emailAccount.accessToken,
  refreshToken: emailAccount.refreshToken,
  isDefault: emailAccount.isDefault,
  connectedAt: emailAccount.connectedAt,
});
```

---

## 🚨 CRITICAL IMPORTS TO ADD

### **At top of src/App.tsx, add:**
```typescript
import {
  getAllUsers,
  insertVendorDirectory,
  saveUserSettings,
  updateUserLastLogin,
  searchVendors,
  getVendorByUsername,
  saveProduct,
  deleteProduct,
  saveQuotation,
  getQuotationHistory,
  saveInquiry,
  getInquiryHistory,
  getIncomingInquiries,
  saveOrder,
  getOrderHistory,
  saveInvoice,
  savePDFTemplate,
  getPDFTemplate,
} from "./utils/tursoConfig";
```

### **At top of src/pages/Vendors.tsx, add:**
```typescript
import {
  searchVendors,
  getAllUsers,
  getVendorByUsername,
  getVendorConnections,
  updateVendorConnectionStatus,
} from "../utils/tursoConfig";
```

### **At top of src/services/GmailOAuthService.ts, add:**
```typescript
import {
  saveEmailAccount,
  getEmailAccounts,
  updateEmailAccountToken,
  deleteEmailAccount,
  saveEmailHistory,
  getEmailHistory,
  updateInboxMetadata,
  getInboxMetadata,
} from "../utils/tursoConfig";
```

### **REMOVE these imports:**
```typescript
// DELETE FROM App.tsx:
import { db } from "./firebase";
import {
  collection,
  query,
  where,
  getDocs,
  setDoc,
  doc,
  deleteDoc,
  getDoc,
  updateDoc,
} from "firebase/firestore";

// DELETE FROM Vendors.tsx:
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc,
} from "firebase/firestore";

// DELETE FROM GmailOAuthService.ts:
import { ref, get, set, update, remove } from "firebase/database";
```

---

## 🧪 TESTING CHECKLIST

After each phase, test:

**Phase 1 (Auth):** ✅ Already verified
- [x] Email signup
- [x] Email login
- [x] Gmail OAuth login
- [x] Gmail OAuth signup

**Phase 2 (Settings):**
- [ ] Switch between tabs (All Products → Upload Portal → Inquiries, etc.)
- [ ] Verify tab selection persists on reload
- [ ] Check localStorage doesn't override Turso

**Phase 3 (Vendor Directory):**
- [ ] Search vendors by company name
- [ ] Search vendors by username
- [ ] Search vendors by email
- [ ] Vendor discovery shows all users
- [ ] Send/receive vendor connections

**Phase 4 (Products & Orders):**
- [ ] Create product
- [ ] Upload product image
- [ ] Delete product
- [ ] Create quotation
- [ ] Send quotation to vendor
- [ ] Place order

**Phase 5 (Email):**
- [ ] Connect Gmail account
- [ ] Send email through app
- [ ] View email history
- [ ] Verify tokens refresh

---

## ⚠️ GOTCHAS & EDGE CASES

1. **Result Format Difference:**
   - Firebase `getDocs()` returns: `docs.map(d => d.data())`
   - Turso functions return: Array of objects directly
   - **Fix:** Adjust code that expects `.docs[]`

2. **Async Operations:**
   - All Turso functions are async (like Firebase)
   - Use `await` on all calls
   - **Good:** `await searchVendors(...)`
   - **Bad:** `searchVendors(...)` without await

3. **Null Handling:**
   - Firebase: `.exists()` check
   - Turso: Check length or null directly
   - **Fix:** `if (user) { ... }` instead of `if (user.exists()) { ... }`

4. **Timestamps:**
   - Firebase: Can use `serverTimestamp()`
   - Turso: Must provide `new Date().toISOString()`
   - **Fix:** Already handled in helper functions

5. **Searchable Fields:**
   - Turso requires lowercase `.toLowerCase().trim()`
   - Already implemented in all functions
   - **Good:** `searchVendors()` handles this automatically

---

## 📊 PROGRESS TRACKING

```
PHASE 1 (Auth):            ████████████████████ COMPLETE ✅
PHASE 2 (Settings):        ░░░░░░░░░░░░░░░░░░░░ READY
PHASE 3 (Vendor):          ░░░░░░░░░░░░░░░░░░░░ READY
PHASE 4 (Products):        ░░░░░░░░░░░░░░░░░░░░ READY
PHASE 5 (Email):           ░░░░░░░░░░░░░░░░░░░░ READY
CLEANUP (Remove Firebase): ░░░░░░░░░░░░░░░░░░░░ PENDING

TOTAL TIME ESTIMATE: 10-12 hours for complete migration
CURRENT STATUS: Schema & functions ready, awaiting systematic code replacement
```

---

## 🎬 START NOW

1. **Open src/App.tsx**
2. **Find line ~1100** (saveUserActiveTab function)
3. **Replace Firebase setDoc() with saveUserSettings()**
4. **Save and test**
5. **Move to next replacement**

**This is a methodical, low-risk process.** Each replacement is a simple swap of function calls that follow identical patterns.

---

**Would you like me to start making the systematic replacements?** I can proceed function by function, showing the exact changes and verifying each build step.
