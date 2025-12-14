# Integration Testing Plan - Collection Swap Verification

## Test Execution Status: IN PROGRESS

### Test Environment
- Dev Server: http://localhost:5175 ✅
- Dependencies: Installed ✅
- Code Changes: Committed ✅

---

## Test 1: Inventory Module Display

### Objective
Verify that the Inventory (ProductsList) module reads from `warehouse_inventory` collection (PRIMARY warehouse stock)

### Prerequisites
- User logged in with manager/director role
- Firebase connected
- At least 1 item in warehouse_inventory collection

### Test Steps
1. Navigate to Inventory module (AI Inventory)
2. Check if products display correctly
3. Verify products match warehouse_inventory collection items
4. Check that quantities are correct

### Expected Result
- ✅ Inventory page loads without errors
- ✅ Products are displayed from warehouse_inventory
- ✅ Quantities match warehouse stock

### Actual Result
- 🔄 PENDING EXECUTION

### Notes
- ProductsList component modified to read from `warehouse_inventory`
- Should see warehouse stock directly in inventory module

---

## Test 2: Warehouse Module Display

### Objective
Verify that the Warehouse module reads from `tenants/{id}/products` collection (TENANT-SPECIFIC products)

### Prerequisites
- User logged in with manager/director role
- At least 1 item in tenants/{id}/products collection

### Test Steps
1. Navigate to Warehouse module (Warehouse Management)
2. Check WarehouseStockView component
3. Verify products display from tenant-specific collection
4. Check quantities against tenants/{id}/products

### Expected Result
- ✅ Warehouse page loads without errors
- ✅ Products are displayed from tenants/{id}/products
- ✅ Quantities are tenant-specific

### Actual Result
- 🔄 PENDING EXECUTION

### Notes
- WarehouseStockView modified to read from tenant products
- Should see isolated warehouse stock per tenant

---

## Test 3: Stock Transfer Flow

### Objective
Verify complete transfer workflow: warehouse → inventory → branch

### Prerequisites
- Items in warehouse_inventory (primary)
- Transfer form accessible
- At least 1 branch configured

### Test Steps
1. Go to Stock Transfer Manager
2. Select a product from inventory/warehouse
3. Select target branch
4. Enter quantity to transfer
5. Submit transfer request
6. Verify warehouse inventory updated in tenants/{id}/products
7. Check transfer appears in history

### Expected Result
- ✅ Transfer form loads and displays items
- ✅ Can select items from warehouse_inventory
- ✅ Transfer created successfully
- ✅ Warehouse inventory decremented in tenants/{id}/products

### Actual Result
- 🔄 PENDING EXECUTION

### Notes
- TransferForm fixed to capture document IDs
- Batch update should decrement warehouse stock
- Transfer should update tenant-specific products

---

## Test 4: File Watcher Integration

### Objective
Verify Excel/CSV watchers sync to correct collections

### Test 4a: Inventory Excel Watcher
**Objective**: Verify inventory Excel file syncs to `warehouse_inventory`

**Test Steps**
1. Create sample Excel file with inventory items:
   - SKU: TEST001
   - ProductName: Test Product
   - Quantity: 100
2. Place file in inventory watcher directory
3. Check Firestore `warehouse_inventory` collection
4. Verify item appears with correct data

**Expected Result**
- ✅ File processed without errors
- ✅ Item appears in warehouse_inventory
- ✅ Quantity is 100

### Test 4b: Warehouse CSV Watcher
**Objective**: Verify warehouse CSV file syncs to `tenants/{id}/products`

**Test Steps**
1. Create sample CSV file with warehouse items:
   - SKU: WAREHOUSE001
   - ProductName: Warehouse Product
   - Quantity: 50
2. Place file in warehouse watcher directory
3. Check Firestore `tenants/{tenantId}/products`
4. Verify item appears with correct data

**Expected Result**
- ✅ File processed without errors
- ✅ Item appears in tenants/{id}/products
- ✅ Quantity is 50
- ✅ Proper tenant isolation

### Actual Result (Both Tests)
- 🔄 PENDING EXECUTION

### Notes
- excel-file-watcher syncs to warehouse_inventory
- warehouse-file-watcher syncs to tenants/{id}/products
- Both have duplicate detection and validation

---

## Test 5: Manual Product Addition

### Objective
Verify ManualProductModal correctly targets warehouse vs inventory

### Prerequisites
- Manual product modal accessible
- User has appropriate permissions

### Test Steps
1. Open Manual Product Modal
2. Add product with:
   - Target: 'warehouse'
   - SKU: MANUAL001
   - Name: Manual Test Product
   - Quantity: 25
3. Verify product appears in tenants/{id}/products (NOT warehouse_inventory)
4. Add another product with:
   - Target: 'inventory'
   - SKU: MANUAL002
   - Name: Manual Inventory Product
   - Quantity: 30
5. Verify product appears in warehouse_inventory (NOT tenants/{id}/products)

### Expected Result
- ✅ Warehouse-target product in tenants/{id}/products
- ✅ Inventory-target product in warehouse_inventory
- ✅ Correct quantities in each collection

### Actual Result
- 🔄 PENDING EXECUTION

### Notes
- ManualProductModal logic was inverted to match new schema
- Type changed from 'products' | 'warehouse_inventory' to 'warehouse' | 'inventory'

---

## Test 6: Manager AI Assistant

### Objective
Verify ManagerAIAssistant reads from correct warehouse data source

### Prerequisites
- User logged in as manager/director/admin
- Widget should be visible
- Items in tenants/{id}/products collection

### Test Steps
1. Look for Manager AI Assistant widget (bottom right)
2. Click to open recommendations panel
3. Check that recommendations are based on warehouse data
4. Verify it reads from tenants/{id}/products (NOT warehouse_inventory)

### Expected Result
- ✅ Widget opens without errors
- ✅ Recommendations load
- ✅ Recommendations based on tenant warehouse stock

### Actual Result
- 🔄 PENDING EXECUTION

### Notes
- ManagerAIAssistant fixed to extract tenantId from user object
- Warehouse query updated to read from tenants/{id}/products

---

## Test 7: Analytics Dashboard

### Objective
Verify AnalyticsDashboard correctly swaps inventory and warehouse reads

### Prerequisites
- Analytics page accessible
- Data in both warehouse_inventory and tenants/{id}/products

### Test Steps
1. Navigate to Analytics Dashboard
2. Check "Inventory" section (should show warehouse_inventory data)
3. Check "Warehouse" section (should show tenants/{id}/products data)
4. Verify numbers don't match between sections (different sources)

### Expected Result
- ✅ Inventory stats from warehouse_inventory
- ✅ Warehouse stats from tenants/{id}/products
- ✅ Numbers reflect correct data sources

### Actual Result
- 🔄 PENDING EXECUTION

### Notes
- AnalyticsDashboard reads were swapped in this update

---

## Test 8: Warehouse Analytics Dashboard

### Objective
Verify WarehouseAnalyticsDashboard reads tenant-specific warehouse data

### Prerequisites
- Warehouse Analytics page accessible
- Manager/director/admin role
- Data in tenants/{id}/products

### Test Steps
1. Navigate to Warehouse Analytics
2. Check all metrics displayed
3. Verify data comes from tenants/{id}/products
4. Check that data is properly isolated per tenant

### Expected Result
- ✅ Page loads without errors
- ✅ All metrics display correctly
- ✅ Data from tenants/{id}/products
- ✅ Proper tenant isolation

### Actual Result
- 🔄 PENDING EXECUTION

### Notes
- WarehouseAnalyticsDashboard query updated to read from tenant products

---

## Test 9: Data Consistency Check

### Objective
Verify no data loss or corruption during collection swap

### Test Steps
1. Count total items in warehouse_inventory
2. Count total items in tenants/{id}/products
3. Verify no duplicates within collections
4. Check all item fields are populated correctly
5. Verify no null/undefined values

### Expected Result
- ✅ No data loss
- ✅ No duplicates
- ✅ All fields populated
- ✅ Data integrity maintained

### Actual Result
- 🔄 PENDING EXECUTION

---

## Test 10: Error Handling

### Objective
Verify graceful error handling with new collection schema

### Test Steps
1. Try to access collections without authentication
2. Try to access non-existent items
3. Try to transfer non-existent stock
4. Try invalid data format
5. Check console for errors

### Expected Result
- ✅ Auth errors caught and handled
- ✅ Invalid operations rejected gracefully
- ✅ User-friendly error messages
- ✅ No unhandled promise rejections

### Actual Result
- 🔄 PENDING EXECUTION

---

## Summary

### Total Tests: 10
### Passed: 0
### Failed: 0
### Skipped: 0
### In Progress: 10

---

## Key Success Criteria

✅ **Must Pass:**
- Test 1: Inventory reads from warehouse_inventory
- Test 2: Warehouse reads from tenants/{id}/products
- Test 3: Stock transfers work end-to-end
- Test 4: File watchers sync to correct collections

⚠️ **Should Pass:**
- Test 5: Manual product modal targets correct collection
- Test 6: Manager AI reads warehouse data
- Test 7: Analytics swapped correctly
- Test 8: Warehouse Analytics works

🔒 **Must Not Fail:**
- Test 9: Data consistency intact
- Test 10: Error handling functional

---

## Execution Notes

- Start time: 2025-12-14 02:16:00 UTC
- Dev server: http://localhost:5175
- All code changes committed to git
- Ready for manual testing in browser

