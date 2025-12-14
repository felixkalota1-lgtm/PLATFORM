# Warehouse Stock Visibility - Diagnostic Report

**Date**: December 14, 2025  
**Issue**: Cannot see stock in warehouse  
**Root Cause**: Warehouse file watcher service not running  

---

## 🔴 Current Status

| Component | Status | Issue |
|-----------|--------|-------|
| Dev Server | ✅ Running (http://localhost:5173) | None |
| App UI | ✅ Loading | None |
| Collection Architecture | ✅ Fixed | Warehouse/Inventory swapped |
| **Warehouse Watcher** | ❌ NOT RUNNING | Missing .env configuration |
| Inventory Watcher | ⚠️ Unknown | Not verified |
| Firestore Connection | ⚠️ Unknown | Depends on watcher .env |
| Firestore Data | ❌ Empty or not syncing | Watchers not uploading data |

---

## Why No Stock Is Visible

The warehouse file watcher monitors the `warehouse-imports/` folder for CSV/Excel files. When you place a file there, the watcher should:

1. Detect the file change
2. Parse the CSV/Excel data
3. Validate the data
4. Sync to Firestore `tenants/{id}/products` collection
5. App reads from that collection

**Current Problem**: The watcher process is NOT running, so:
- Files in `warehouse-imports/` are being ignored
- No data is synced to Firestore
- App has nothing to display
- You see empty warehouse stock

---

## How to Fix (Quick Start)

### 1. Get Firebase Service Account

1. Go to: https://console.firebase.google.com
2. Select project: **platform-sale-and-procurement**
3. Settings (⚙️) → **Service Accounts** tab
4. Click **"Generate New Private Key"**
5. JSON file downloads with credentials

### 2. Configure Warehouse Watcher

File: `services/warehouse-file-watcher/.env`

Copy these values from the JSON file:
```env
FIREBASE_PRIVATE_KEY="[private_key from JSON]"
FIREBASE_CLIENT_EMAIL=[client_email from JSON]
```

**Important Notes**:
- Private key is multi-line - copy the entire value between BEGIN and END
- It already has `\n` in it - keep as-is
- Wrap private key in quotes
- No quotes around email

### 3. Start Watcher

```bash
cd services/warehouse-file-watcher
npm install
node index.js
```

You should see:
```
✅ Firebase Admin SDK initialized
📁 Watching folder: ./warehouse-imports
👁️ Watcher ready! Monitoring for file changes...
```

### 4. Test with Sample File

Sample files already exist in `warehouse-imports/`:
- `sample-warehouse-stock.csv`
- `test-warehouse.xlsx`

Just make sure one of these is there, and the watcher should process it.

### 5. Verify in App

Go to http://localhost:5173 and check:
- Warehouse Management → Warehouse Stock View

You should now see the items!

---

## File Structure

```
warehouse-imports/
├── sample-warehouse-stock.csv     ← Watcher monitors this folder
├── test-warehouse.xlsx            ← Place your CSV/Excel files here
└── [other files you upload]
```

---

## What Happens When Watcher Runs

### File Processing Flow
```
You save: warehouse-inventory.csv
            ↓
Watcher detects file change (within 2 seconds)
            ↓
Reads and parses CSV
            ↓
Validates:
  - SKU required
  - ProductName required
  - Quantity required
  - UnitCost (optional)
  - Category (optional)
            ↓
Detects duplicates within file
            ↓
Batches items for Firestore
            ↓
Syncs to: tenants/{tenantId}/products
            ↓
App reads from Firestore in real-time
            ↓
You see stock in Warehouse Management
```

---

## CSV Format Expected

```csv
SKU,ProductName,Quantity,UnitCost,Category
WIDGET-001,Widget A,100,25.50,Electronics
WIDGET-002,Widget B,50,30.00,Electronics
GADGET-001,Gadget X,200,15.75,Accessories
```

Save as `.csv` and place in `warehouse-imports/` folder.

---

## Excel Format Expected

Create Excel file with columns:
- Column A: SKU
- Column B: ProductName
- Column C: Quantity
- Column D: UnitCost (optional)
- Column E: Category (optional)

Save as `.xlsx` and place in `warehouse-imports/` folder.

---

## Firestore Collections After Setup

### warehouse_inventory (Global - Primary Stock)
```
SKU-001: {
  productName: "Widget A",
  quantity: 100,
  unitCost: 25.50,
  category: "Electronics"
}
```

### tenants/default/products (Tenant Stock)
```
SKU-001: {
  sku: "SKU-001",
  productName: "Widget A",
  quantity: 100,
  unitCost: 25.50,
  lastUpdated: timestamp
}
```

---

## Troubleshooting

### "Module not found" when starting watcher
```bash
cd services/warehouse-file-watcher
npm install
node index.js
```

### "Missing Firebase credentials"
- Check `.env` file exists
- Verify it's not the `.env.example` file
- Ensure FIREBASE_PRIVATE_KEY has actual key (not placeholder)
- Ensure FIREBASE_CLIENT_EMAIL is filled in

### "Permission denied" from Firebase
- Go to Firebase Console → Firestore Database → Rules
- Ensure service account can write to Firestore
- Basic rule allows all authenticated writes:
```
match /databases/{database}/documents {
  match /{document=**} {
    allow read, write: if request.auth != null;
  }
}
```

### File not being processed
1. File must have correct extension (.csv or .xlsx)
2. File must have required columns (SKU, ProductName, Quantity)
3. Ensure watcher console shows the file being watched
4. Check file isn't locked by Excel (close it first)

---

## Where Each Component Lives

| Component | Location | Status |
|-----------|----------|--------|
| Main App | `src/` | ✅ Running |
| Inventory Watcher | `services/excel-file-watcher/` | ⚠️ Check status |
| Warehouse Watcher | `services/warehouse-file-watcher/` | ❌ Needs config |
| Sample Files | `warehouse-imports/` | ✅ Ready |
| Firebase Config | Root `.env.local` | ✅ Configured |
| Watcher Config | `services/warehouse-file-watcher/.env` | ❌ Needs credentials |

---

## Next Actions

**Priority Order:**

1. **Get Firebase Credentials** (5 minutes)
   - Go to Firebase Console → Service Accounts
   - Generate new private key
   - Download JSON file

2. **Update Watcher .env** (2 minutes)
   - Open `services/warehouse-file-watcher/.env`
   - Fill in FIREBASE_PRIVATE_KEY
   - Fill in FIREBASE_CLIENT_EMAIL
   - Save file

3. **Start Watcher** (1 minute)
   ```bash
   cd services/warehouse-file-watcher
   npm install
   node index.js
   ```

4. **Test** (2 minutes)
   - Watcher should process sample files automatically
   - Check Firestore console for data
   - Check app - warehouse stock should now be visible

5. **Keep Running** (Ongoing)
   - Leave watcher running in a terminal
   - Or use Task Scheduler/PM2 for background startup

---

## Summary

**The Issue**: Warehouse watcher not running → no data synced → no stock visible  
**The Fix**: Configure .env with Firebase credentials → start watcher → data syncs → stock visible  
**Time to Fix**: ~10 minutes  
**Documentation**: See `WAREHOUSE_WATCHER_SETUP.md` for detailed guide  

**You're 95% there** - just need to connect the watcher to Firebase and start it!

