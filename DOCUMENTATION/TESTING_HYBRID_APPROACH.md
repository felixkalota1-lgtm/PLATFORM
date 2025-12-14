# Hybrid Product Management - Testing Guide

## 🎯 What to Test

This guide walks you through testing the complete product management workflow.

## Prerequisites

✅ Development server running (`npm run dev`)
✅ Firebase configured with `.env.local`
✅ User logged in
✅ Already have some products in inventory (from previous uploads)

## Test Flow 1: Edit a Product

### Step 1: Find a Product
1. Go to **Inventory Management** → **Products** tab
2. See the table with your existing products
3. Locate any product in the table

### Step 2: Click Edit Button
1. Find the **pencil icon (✏️)** in the Actions column
2. Click it
3. **Expected:** ProductEditorModal opens with product data pre-filled

### Step 3: Modify Product
1. Change the **Price** (e.g., from 89.99 to 99.99)
2. Change the **Stock** quantity
3. Or modify description
4. **Expected:** Form shows your changes

### Step 4: Save Changes
1. Click **"Save Product"** button
2. **Expected:** Modal closes, product disappears from table briefly, then re-appears with updated values
3. Check **Browser Console:**
   - Should see: `✅ Product updated: [productId]`

### Step 5: Verify Changes
1. The ProductsList updates automatically (real-time listener)
2. New price/stock should be visible in the table
3. **Expected:** Changes persist even after refresh

---

## Test Flow 2: Delete a Product

### Step 1: Click Delete Button
1. Find the **trash icon (🗑️)** in the Actions column
2. Click it
3. **Expected:** Delete confirmation dialog appears
4. Dialog shows: "Are you sure you want to delete this product?"

### Step 2: Confirm Deletion
1. Click **"Delete"** button in the dialog
2. **Expected:** Dialog closes, product is removed from table
3. Check **Browser Console:**
   - Should see: `✅ Product deleted: [productId]`

### Step 3: Verify Deletion
1. Product should be gone from the list
2. Refresh page (Ctrl+R)
3. **Expected:** Product still gone (deleted from Firestore)

### Step 4: Test Cancel
1. Click trash icon on another product
2. Dialog appears
3. Click **"Cancel"** button
4. **Expected:** Dialog closes, product stays in table (not deleted)

---

## Test Flow 3: Upload Excel & View New Products

### Step 1: Prepare Excel File
1. Create test file with columns:
   ```
   Name | Description | Category | Price | SKU | Stock | Supplier
   ```
2. Add 3 products:
   ```
   New Product 1 | Test description | Electronics | 49.99 | TEST-001 | 10 | Supplier A
   New Product 2 | Another test | Office | 29.99 | TEST-002 | 20 | Supplier B
   New Product 3 | Third product | Electronics | 199.99 | TEST-003 | 5 | Supplier C
   ```

### Step 2: Upload File
1. Click **"📊 Bulk Import"** button
2. Select your test Excel file
3. **Expected:** ProductUploadModal shows:
   - File being parsed
   - Products detected (3)
   - Any duplicates

### Step 3: Handle Duplicates
1. DuplicateDetectionModal appears
2. Shows: "3 new products, 0 duplicates"
3. Click **"Add 3 New Products"**
4. **Expected:** 
   - Modal closes
   - Products added to Firestore
   - Console shows: `✅ Batch committed to Firestore`

### Step 4: View New Products
1. ProductsList updates automatically
2. Your 3 new products appear in table
3. **Expected:** All 3 products visible with correct details

---

## Test Flow 4: Edit Excel-Uploaded Products

### Step 1: Find Your Excel Product
1. Scroll ProductsList table
2. Find "New Product 1" (from Excel upload)
3. Click **pencil icon (✏️)**

### Step 2: Edit Details
1. ProductEditorModal opens
2. Change Stock from 10 to 50
3. Change Price from 49.99 to 59.99
4. Click **"Save Product"**
5. **Expected:**
   - Modal closes
   - Table updates automatically
   - Console shows: `✅ Product updated: [productId]`

### Step 3: Verify Changes
1. Check ProductsList table
2. Stock should be 50
3. Price should be 59.99
4. Changes persist on refresh

---

## Test Flow 5: Delete Uploaded Products

### Step 1: Delete New Product 2
1. Find "New Product 2" in table
2. Click **trash icon (🗑️)**
3. Confirmation dialog appears

### Step 2: Confirm Delete
1. Click **"Delete"** button
2. **Expected:** Product removed from table
3. Console shows: `✅ Product deleted: [productId]`

### Step 3: Verify Gone
1. "New Product 2" should not appear in list
2. Refresh page
3. **Expected:** Still not in list (confirmed deleted)

---

## Test Flow 6: Add Product Manually

### Step 1: Click Add Product
1. In Inventory header, click **"➕ Add Product"**
2. **Expected:** ManualProductModal opens (empty form)

### Step 2: Fill Form
1. Product Name: "Manual Test Product"
2. Description: "Created via manual form"
3. Price: 79.99
4. Stock: 15
5. SKU: MAN-001
6. Category: Testing
7. Supplier: Test Supplier

### Step 3: Submit
1. Click **"Create Product"**
2. **Expected:**
   - Modal closes
   - Product appears in ProductsList table
   - Real-time listener shows new product

### Step 4: Edit Manual Product
1. Find "Manual Test Product" in table
2. Click **pencil icon (✏️)**
3. Change price to 89.99
4. Click **"Save Product"**
5. **Expected:** Changes appear immediately

### Step 5: Delete Manual Product
1. Find "Manual Test Product"
2. Click **trash icon (🗑️)**
3. Click **"Delete"** in confirmation
4. **Expected:** Product removed

---

## Test Flow 7: Re-sync Excel (Update Existing)

### Step 1: Create Updated Excel
1. Create new Excel with:
   ```
   New Product 1 | Updated desc | Electronics | 59.99 | TEST-001 | 100 | New Supplier
   New Product 4 | Brand new | Office | 39.99 | TEST-004 | 8 | Supplier D
   ```

### Step 2: Upload Again
1. Click **"📊 Bulk Import"**
2. Select updated Excel
3. **Expected:**
   - New Product 1 = DUPLICATE (already in Firestore)
   - New Product 4 = NEW (add this)
   - Modal shows: "1 new product, 1 duplicate"

### Step 3: Upload
1. Click **"Add 1 New Product"**
2. **Expected:**
   - Only "New Product 4" added
   - "New Product 1" NOT overwritten (duplicate skip)

### Step 4: Verify
1. Check ProductsList
2. "New Product 1" still shows old stock (100) and price (59.99)
3. "New Product 4" appears with correct details

---

## Test Flow 8: Real-time Sync Verification

### Step 1: Open Two Browser Tabs
1. Tab A: Inventory page with ProductsList
2. Tab B: Same Inventory page

### Step 2: Edit in Tab B
1. Click pencil on "New Product 1" in Tab B
2. Change Price to 111.11
3. Click "Save Product"
4. **Expected:** Change persists in Tab B

### Step 3: Check Tab A
1. Switch to Tab A
2. Look at "New Product 1" in table
3. **Expected:** Price automatically updated to 111.11
4. No page refresh needed

### Step 4: Edit in Tab A
1. Click pencil on another product in Tab A
2. Change Stock to 999
3. Click "Save Product"
4. **Expected:** Change appears in Tab B automatically

---

## 🔍 What to Check in Browser Console

### Successful Product Edit
```
✅ Product updated: abc123def456
🔄 Setting up real-time listener for products: [tenantId]
📦 Products snapshot received: 5 products
📄 Product: {name: "New Product 1", price: 59.99...}
✅ Updated products list: 5 products
```

### Successful Product Delete
```
✅ Product deleted: xyz789
🔄 Setting up real-time listener for products: [tenantId]
📦 Products snapshot received: 4 products
✅ Updated products list: 4 products
```

### Successful Excel Upload
```
✅ Batch committed to Firestore: 3 new products
🔄 Setting up real-time listener for products: [tenantId]
📦 Products snapshot received: 8 products
✅ Updated products list: 8 products
```

---

## ⚠️ Common Issues & Solutions

### Issue: Edit Modal Doesn't Open
**Solution:**
1. Check console for errors
2. Verify ProductEditorModal is imported in ProductsList
3. Check that `showEditor` state is working

### Issue: Changes Don't Save
**Solution:**
1. Look for error messages in the modal
2. Check browser console for Firebase errors
3. Verify `.env.local` Firebase credentials are correct
4. Ensure tenantId is available in user context

### Issue: Delete Doesn't Work
**Solution:**
1. Check console for deleteDoc errors
2. Verify Firebase delete rule allows it
3. Ensure product ID is valid

### Issue: Real-time Updates Don't Show
**Solution:**
1. Refresh page (Ctrl+R)
2. Check console for listener setup logs
3. Verify Firestore rules allow read access
4. Check that product has `active: true`

### Issue: Form Shows Validation Error
**Solution:**
1. All fields might not be required (only name & description)
2. Check error message displayed in modal
3. Try filling all fields

---

## ✅ Success Criteria

All tests pass when:

- ✅ Can edit product and see changes immediately
- ✅ Can delete product with confirmation
- ✅ Upload Excel adds new products
- ✅ Manual product creation works
- ✅ Real-time sync between tabs (no refresh needed)
- ✅ Console shows correct logging
- ✅ No errors in browser console
- ✅ Changes persist after page refresh
- ✅ Duplicate detection works correctly
- ✅ Can re-upload Excel without overwriting

---

## 📊 Expected Behavior Summary

| Action | Expected Result |
|--------|-----------------|
| Click Edit | Editor modal opens with data |
| Change field | Value updates in form |
| Save | Firebase updates, table refreshes, console logs success |
| Click Delete | Confirmation dialog appears |
| Confirm Delete | Product removed, console logs success |
| Upload Excel | File parsed, duplicates detected, batch written |
| Manual Add | Product appears instantly |
| Re-upload Excel | Only new products added (no overwrites) |
| Edit in Tab A | Appears in Tab B automatically |
| Refresh Page | All changes persist from Firestore |

---

## 🚀 Performance Notes

- Product list loads from real-time listener
- Updates appear <1 second after save
- Batch uploads are fast (for 100+ products)
- No page refresh needed for updates
- Filtering/search works on loaded products
- Edit/delete operations are instant

---

## 📝 Notes for Testing

1. **First Time:** Allow 2-3 seconds for initial real-time listener setup
2. **File Format:** Excel should have headers in row 1
3. **Empty Fields:** Some fields like imageUrl are optional
4. **Duplicates:** Same product name = duplicate (case-sensitive)
5. **Network:** Good internet connection needed for real-time sync
6. **Firebase:** Ensure Firestore is accessible from your location

---

## When You're Done Testing

If everything works:
1. ✅ All test flows completed
2. ✅ No console errors
3. ✅ Real-time sync working
4. ✅ Ready for production use

The hybrid product management system is complete and ready! 🎉
