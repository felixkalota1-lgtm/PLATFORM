# Warehouse File Watcher Setup Guide

## ❌ Current Status: Watcher NOT Running

**Issue**: The warehouse file watcher service is not active, so stock uploads are not being synced to Firestore.

**Location**: `services/warehouse-file-watcher/`

---

## Quick Fix (3 Steps)

### Step 1: Get Firebase Service Account Credentials

1. Go to **Firebase Console**: https://console.firebase.google.com
2. Select your project: **platform-sale-and-procurement**
3. Go to **Project Settings** (gear icon) → **Service Accounts** tab
4. Click **"Generate New Private Key"** button
5. A JSON file will download - **DO NOT SHARE THIS FILE**

The file looks like:
```json
{
  "type": "service_account",
  "project_id": "platform-sale-and-procurement",
  "private_key_id": "xxx",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMII...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@platform-sale-and-procurement.iam.gserviceaccount.com",
  ...
}
```

### Step 2: Update Warehouse Watcher .env File

File: `services/warehouse-file-watcher/.env`

Replace the placeholders with values from the JSON:

```env
FIREBASE_PRIVATE_KEY="[COPY_private_key_VALUE_HERE]"
FIREBASE_CLIENT_EMAIL=[COPY_client_email_VALUE_HERE]
```

**Important**: 
- The private key already has `\n` in it - just copy as-is
- Keep the quotes around the private key
- Don't include quotes around the email

### Step 3: Start the Watcher

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

---

## Testing the Watcher

Once running, follow these steps:

### Test 1: Upload Sample Warehouse File

1. Place a CSV or Excel file in: `warehouse-imports/`
   - Example file already exists: `sample-warehouse-stock.csv`
2. The watcher should detect it within 2 seconds
3. You should see console output like:
   ```
   ✅ Processing file: sample-warehouse-stock.csv
   📊 Parsing CSV file...
   ✅ Sync Result: 5 items synced
   ```

### Test 2: Check Firestore

1. Go to **Firebase Console** → **Firestore Database**
2. Look for collection: `tenants/{your-tenant-id}/products`
3. Verify that items from your CSV appear there with correct quantities

### Test 3: Verify in App

1. Open the app: http://localhost:5173
2. Navigate to **Warehouse Management**
3. Check **Warehouse Stock View** - you should see the items!

---

## Expected Firestore Structure

After watcher syncs a file, you should see:

```
warehouse_inventory (Global - Primary Stock)
  ├── SKU1 {productName, quantity, category, ...}
  ├── SKU2 {productName, quantity, category, ...}
  └── SKU3 {...}

tenants/default/products (Tenant-Specific - Allocated Stock)
  ├── SKU1 {productName, quantity, unitCost, ...}
  ├── SKU2 {...}
  └── SKU3 {...}
```

---

## Troubleshooting

### Problem: "Module not found" error

**Solution**: Install dependencies first
```bash
cd services/warehouse-file-watcher
npm install
node index.js
```

### Problem: "Missing Firebase credentials"

**Solution**: 
1. Check `.env` file exists in `services/warehouse-file-watcher/`
2. Verify values are filled (not placeholder text)
3. Private key must have quotes around it: `"-----BEGIN PRIVATE KEY-----..."`

### Problem: "Permission denied" error

**Solution**: Firebase service account doesn't have permissions
1. Go to Firebase Console → Firestore Database → Rules
2. Ensure your service account can write to Firestore
3. Basic rule:
   ```
   match /databases/{database}/documents {
     match /{document=**} {
       allow read, write: if request.auth != null;
     }
   }
   ```

### Problem: File not being detected

**Solution**:
1. File must be in `warehouse-imports/` folder
2. File must be CSV or Excel (.csv, .xlsx, .xls)
3. Save the file to trigger the watcher
4. Check watcher console for messages

### Problem: "File Timeout" error

**Solution**: File might be locked by Excel
1. Close the file in Excel
2. Wait 5 seconds
3. The watcher will retry automatically

---

## File Watcher Features

✅ **Real-time Monitoring** - Detects file changes instantly  
✅ **Multiple Formats** - Supports CSV and Excel  
✅ **Validation** - Checks required fields (SKU, productName, quantity)  
✅ **Duplicate Detection** - Prevents duplicate uploads  
✅ **Batch Sync** - Efficient Firestore writes  
✅ **Auto-Retry** - Handles locked files automatically  
✅ **Error Logging** - Detailed console output for debugging  

---

## CSV File Format Expected

For warehouse CSV uploads:

```csv
SKU,ProductName,Quantity,UnitCost,Category,Location
PROD001,Widget A,100,25.50,Electronics,Shelf-A1
PROD002,Widget B,50,30.00,Electronics,Shelf-A2
PROD003,Gadget C,200,15.75,Accessories,Shelf-B1
```

Required columns: `SKU`, `ProductName`, `Quantity`  
Optional: `UnitCost`, `Category`, `Location`

---

## Excel File Format Expected

Create an Excel file with columns:
- SKU
- ProductName
- Quantity
- UnitCost (optional)
- Category (optional)
- Location (optional)

Save as `.xlsx` and place in `warehouse-imports/` folder

---

## Keep Running in Background

To keep the watcher running continuously:

### Option 1: Command Prompt (Simple)
```bash
cd services\warehouse-file-watcher
npm install
node index.js
```
Leave the window open.

### Option 2: Windows Task Scheduler (Advanced)
Create a scheduled task to start the watcher at system startup:
1. Open Task Scheduler
2. Create Basic Task
3. Trigger: At startup
4. Action: Start program
5. Program: `node.exe`
6. Arguments: `C:\Users\Administrator\Platform Sales & Procurement\services\warehouse-file-watcher\index.js`

### Option 3: PM2 (Recommended for Production)
```bash
npm install -g pm2
pm2 start services/warehouse-file-watcher/index.js --name "warehouse-watcher"
pm2 startup
pm2 save
```

---

## Verify Setup

After setup, run this to verify everything works:

1. **Check Node version**
   ```bash
   node --version  # Should be v14 or higher
   ```

2. **Check dependencies installed**
   ```bash
   cd services/warehouse-file-watcher
   npm list
   ```

3. **Test Firebase connection**
   ```bash
   node index.js
   ```
   Should see: `✅ Firebase Admin SDK initialized`

4. **Place test file**
   - Copy a sample CSV to `warehouse-imports/`
   - Watcher should process it automatically

---

## Support

If you encounter issues:

1. **Check console output** - Detailed error messages are logged
2. **Verify .env values** - Must match exactly from Firebase
3. **Ensure Firebase permissions** - Service account needs Firestore write access
4. **Check file format** - CSV/Excel must have required columns

---

## Next Steps

1. ✅ Get Firebase service account credentials
2. ✅ Update `.env` file in warehouse-file-watcher
3. ✅ Run: `node services/warehouse-file-watcher/index.js`
4. ✅ Place CSV/Excel file in `warehouse-imports/`
5. ✅ Check Firestore console to verify data
6. ✅ Open app and verify warehouse stock displays

**Once this is done, your warehouse stock will be visible in the app!**

