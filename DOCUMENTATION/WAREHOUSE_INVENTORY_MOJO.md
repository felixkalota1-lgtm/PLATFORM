# 🏭 WAREHOUSE & INVENTORY MANAGEMENT SYSTEM - MOJO

**Last Updated:** December 13, 2025
**Status:** Architecture Design Document
**System Type:** Multi-location supply chain management

---

## 🎯 Executive Vision

**The Problem We're Solving:**
Company has **ONE central warehouse** (main stock storage) and **MULTIPLE branch locations** (sell points). Stock flows from warehouse → branches. Branches need inventory management. Different sectors operate independently: **Storage (Warehouse) ≠ Logistics (Movement)**.

---

## 📊 System Architecture

### The Three-Tier Model

```
TIER 1: CENTRAL WAREHOUSE
┌─────────────────────────────────────┐
│ Main Warehouse (Nebraska)           │
│ - Central stock storage             │
│ - Physical 3D locations (bins/aisles)│
│ - Quality control (Foul Water)      │
│ - Source of truth                   │
└─────────────────────────────────────┘
           ↓ (Ship Goods)
           ↓
TIER 2: BRANCH INVENTORIES
┌─────────────────────────┐  ┌─────────────────────────┐
│ Branch A (Arizona)      │  │ Branch B (California)   │
│ - Sell point inventory  │  │ - Sell point inventory  │
│ - Local stock           │  │ - Local stock           │
│ - Branch mgmt           │  │ - Branch mgmt           │
└─────────────────────────┘  └─────────────────────────┘
           ↓ (Sell)                    ↓ (Sell)
           ↓                           ↓
TIER 3: CUSTOMER SALES
```

---

## 🗄️ Firestore Schema

### Collection: `warehouses` (Physical Locations)

```json
{
  "warehouseId": "warehouse_main_nebraska",
  "type": "warehouse",  // "warehouse" | "branch"
  "name": "Main Warehouse - Nebraska",
  "location": {
    "city": "Omaha",
    "state": "Nebraska",
    "country": "USA",
    "coordinates": { "lat": 41.2619, "lng": -95.9018 }
  },
  "capacity": {
    "maxItems": 10000,
    "maxWeight": 50000  // kg
  },
  "isMainWarehouse": true,
  "linkedBranches": ["warehouse_branch_arizona", "warehouse_branch_california"],
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-12-13T10:30:00Z"
}
```

### Collection: `warehouse_inventory` (Main Warehouse Stock)

```json
{
  "itemId": "warehouse_main_nebraska_SKU001",
  "warehouseId": "warehouse_main_nebraska",
  "sku": "SKU001",
  "productName": "Monitor 27-inch",
  "category": "Electronics",
  "quantity": 500,
  "reservedQuantity": 50,  // Reserved for branches
  "availableQuantity": 450, // Available for new orders
  "location": {
    "bin": "A1",
    "aisle": 1,
    "shelf": 3,
    "position": "A1-1-3"  // 3D visual coordinate
  },
  "foulWater": {
    "defectiveCount": 5,
    "expiredCount": 0,
    "damageCount": 2,
    "returnedCount": 3,
    "totalWaste": 10  // Sum of all waste
  },
  "lastRestocked": "2025-12-01T00:00:00Z",
  "lastUpdated": "2025-12-13T10:30:00Z"
}
```

### Collection: `branch_inventory` (Branch Stock)

```json
{
  "itemId": "branch_arizona_SKU001",
  "branchId": "warehouse_branch_arizona",
  "branchName": "Arizona Branch",
  "sku": "SKU001",
  "productName": "Monitor 27-inch",
  "quantity": 45,
  "soldCount": 120,  // Lifetime sold from this branch
  "lastRestockDate": "2025-12-05T00:00:00Z",
  "lastRestockQuantity": 50,
  "sourceWarehouse": "warehouse_main_nebraska",
  "foulWater": {
    "defectiveCount": 2,
    "returnedCount": 1,
    "totalWaste": 3
  },
  "lastUpdated": "2025-12-13T10:30:00Z"
}
```

### Collection: `stock_movements` (Transaction Log)

```json
{
  "movementId": "move_20251213_001",
  "type": "warehouse_to_branch",  // "warehouse_to_branch" | "sale" | "return" | "disposal"
  "sourceLocation": {
    "type": "warehouse",
    "id": "warehouse_main_nebraska",
    "name": "Main Warehouse"
  },
  "destinationLocation": {
    "type": "branch",
    "id": "warehouse_branch_arizona",
    "name": "Arizona Branch"
  },
  "sku": "SKU001",
  "quantity": 50,
  "timestamp": "2025-12-13T10:30:00Z",
  "status": "completed",  // "pending" | "in_transit" | "completed" | "cancelled"
  "estimatedDelivery": "2025-12-15T00:00:00Z",
  "actualDelivery": "2025-12-14T00:00:00Z",
  "createdBy": "admin@company.com",
  "notes": "Restocking Arizona Branch"
}
```

### Collection: `warehouse_locations` (3D Bin Mapping)

```json
{
  "locationId": "warehouse_main_nebraska_A1_1_3",
  "warehouseId": "warehouse_main_nebraska",
  "bin": "A1",
  "aisle": 1,
  "shelf": 3,
  "position": "A1-1-3",
  "capacity": 100,
  "occupied": 0,
  "currentItems": [],  // SKUs stored here
  "isActive": true,
  "createdAt": "2025-01-01T00:00:00Z"
}
```

---

## 🔄 Data Flow

### Scenario 1: CSV/Excel Import to Warehouse

```
User uploads warehouse_stock.csv/xlsx
         ↓
FileWatcher detects file
         ↓
csvParser.js or excelParser.js processes
         ↓
Validates required fields:
  - sku, productName, quantity
  - bin, aisle, shelf (location)
  - category
         ↓
Creates/Updates warehouse_inventory docs
         ↓
Updates warehouse_locations for 3D mapping
         ↓
Real-time updates in UI
```

### Scenario 2: Move from Warehouse to Branch

```
User clicks "Move to Branch" in Warehouse UI
         ↓
Selects:
  - SKU
  - Quantity
  - Destination Branch
         ↓
System validates:
  - Stock available (not reserved)
  - Branch location exists
  - Quantity ≤ available
         ↓
Creates stock_movements doc (pending)
         ↓
Updates warehouse_inventory:
  - Decreases quantity
  - Increases reservedQuantity
         ↓
Branch receives notification
         ↓
Admin confirms receipt
         ↓
Updates branch_inventory
         ↓
Marks movement as completed
```

### Scenario 3: Branch Sells Item

```
Branch sells item (POS system)
         ↓
Updates branch_inventory:
  - Decreases quantity
  - Increases soldCount
         ↓
Creates stock_movements doc (type: sale)
         ↓
Real-time dashboard updates
         ↓
If stock low:
  - Branch gets alert
  - Auto-suggests restocking
```

### Scenario 4: Foul Water Tracking

```
Item found defective/expired/damaged
         ↓
Staff marks in "Foul Water" UI
         ↓
Select issue type:
  - Defective
  - Expired
  - Damaged
  - Returned
         ↓
Updates foulWater counters:
  - warehouse_inventory.foulWater
  - branch_inventory.foulWater
         ↓
Updates total waste statistics
         ↓
Decreases quantity accordingly
         ↓
Reports generated for review
```

---

## 🎯 Key Differences: Warehouse vs Inventory

| Aspect | Warehouse | Inventory |
|--------|-----------|-----------|
| **Purpose** | Central stock storage | Branch sell point |
| **Location** | One main location | Multiple branches |
| **Users** | Warehouse managers | Branch managers/staff |
| **Operations** | Receive, store, organize | Sell, manage, restock |
| **Quantity** | Large volumes | Smaller volumes |
| **3D Mapping** | Yes (bins/aisles/shelves) | No (simpler layout) |
| **Foul Water** | Track all waste types | Track waste from sales |
| **File Import** | CSV/Excel bulk uploads | Manual entry mostly |
| **Movement** | To branches | To customers |
| **Reporting** | Storage optimization | Sales analytics |

---

## 🚚 Logistics Module (Future Tier)

**Separate from Warehouse & Inventory**

```
Logistics handles:
- Route planning (warehouse → branches)
- Delivery tracking
- Moving equipment (trucks, forklifts)
- Driver assignments
- Delivery confirmations
- Cost calculations
```

**Integration point:**
- Warehouse: "Move to Branch" → Logistics: Creates delivery job
- Logistics: Delivery confirmed → Warehouse: Updates movement status

---

## 📁 File Format Support

### CSV Format (Warehouse)
```csv
sku,productName,category,quantity,bin,aisle,shelf
SKU001,Monitor 27-inch,Electronics,500,A1,1,3
SKU002,Keyboard,Electronics,300,A2,1,4
SKU003,Mouse,Electronics,400,B1,2,1
```

### Excel Format (Warehouse)
```
Sheet: "Inventory"
Columns: SKU | Product Name | Category | Quantity | Bin | Aisle | Shelf | Unit Cost | Reorder Level

Sheet: "Locations"
Columns: Bin | Aisle | Shelf | Capacity | Active

Sheet: "Foul Water"
Columns: SKU | Defective | Expired | Damaged | Returned | Notes
```

---

## 💾 Database Operations

### Service: `warehouseService.ts` (React App)

```typescript
// Warehouse Operations
getAllWarehouseInventory()
getWarehouseByLocation(bin, aisle, shelf)
subscribeToWarehouse(callback)
subscribeToLocation(location, callback)

// Branch Operations
getAllBranches()
getBranchInventory(branchId)
subscribeToBranchInventory(branchId, callback)

// Movement Operations
moveStockToBranch(sku, quantity, destinationBranchId)
confirmBranchReceipt(movementId)
recordSale(branchId, sku, quantity)
recordFoulWater(location, type, sku, quantity)

// Reporting
getWarehouseStats()
getBranchStats(branchId)
getStockMovementHistory(sku)
getFoulWaterReport(dateRange)
```

### Service: `warehouseFileWatcher.js` (Node Backend)

```javascript
// Watches warehouse-imports/ for CSV/Excel files
// Parses and syncs to warehouse_inventory
// Supports:
// - New items
// - Updated quantities
// - Foul water adjustments
// - Location updates
```

---

## 🎨 UI Components to Build

### Warehouse Module
- **3D Warehouse Viewer** - Interactive bin/aisle/shelf visualization
- **Stock Detail** - Item info, foul water tracking
- **Upload Interface** - CSV/Excel drag-drop
- **Move to Branch** - Transfer goods dialog
- **Warehouse Reports** - Storage optimization, foul water analysis

### Inventory Module (Branches)
- **Branch Dashboard** - Current stock levels, sold items
- **Stock Detail** - Item info, local foul water
- **Restock Request** - Request goods from warehouse
- **Receive Shipment** - Confirm warehouse delivery
- **Sales Tracker** - Sold items, revenue

### Stock Movement
- **Movement History** - Timeline of all transfers
- **In Transit** - Currently moving stock
- **Pending Confirmations** - Awaiting branch receipt
- **Delivery Tracking** - ETA and status

### Reports & Analytics
- **Foul Water Report** - Waste analysis
- **Stock Health** - Inventory by location
- **Branch Performance** - Sales vs stock
- **Movement Analytics** - Flow efficiency

---

## 🔐 User Roles & Permissions

| Role | Warehouse | Inventory | Movements |
|------|-----------|-----------|-----------|
| **Warehouse Manager** | Full access | Read-only | Create |
| **Branch Manager** | Read-only | Full access | Request |
| **Branch Staff** | None | Read/Update | Record sales |
| **Admin** | Full access | Full access | Full access |
| **Logistics** | Read movements | Read movements | Update status |

---

## 📈 Metrics & KPIs

**Warehouse Metrics:**
- Storage utilization (%)
- Stock turnover rate
- Foul water percentage
- Days to restock branches

**Branch Metrics:**
- Inventory levels
- Sales velocity
- Stock-out frequency
- Local foul water rate

**Movement Metrics:**
- Transfer time (warehouse → branch)
- Delivery accuracy
- In-transit cost
- Movement efficiency

---

## 🔄 Integration Points

```
┌──────────────────┐
│ File System      │
│ (CSV/Excel)      │
└────────┬─────────┘
         │ FileWatcher
         ↓
┌──────────────────────────────────────┐
│ Warehouse File Watcher (Node.js)     │
│ - csvParser.js                       │
│ - excelParser.js (NEW)               │
│ - warehouseFirestore.js              │
└────────┬─────────────────────────────┘
         │
         ↓
┌──────────────────────────────────────┐
│ Firestore                            │
│ - warehouse_inventory                │
│ - branch_inventory                   │
│ - stock_movements                    │
│ - warehouses                         │
└────────┬─────────────────────────────┘
         │
         ↓
┌──────────────────────────────────────┐
│ React App (Browser)                  │
│ - warehouseService.ts                │
│ - UI Components                      │
│ - Real-time subscriptions            │
└──────────────────────────────────────┘
```

---

## 🚀 Implementation Phases

### Phase 1: Foundation (Week 1)
- ✅ Firestore schema setup
- ✅ File watcher with Excel support
- ✅ CSV/Excel parsers
- ✅ Data sync to warehouse_inventory

### Phase 2: Warehouse UI (Week 2)
- 🔄 3D warehouse visualization
- 🔄 Stock management interface
- 🔄 Upload dashboard
- 🔄 Foul water tracking

### Phase 3: Branch Integration (Week 3)
- ⭕ Multiple branch support
- ⭕ Move to Branch functionality
- ⭕ Branch inventory management
- ⭕ Stock movement history

### Phase 4: Logistics (Week 4)
- ⭕ Delivery tracking
- ⭕ Route optimization
- ⭕ Cost calculations
- ⭕ Driver assignments

### Phase 5: Advanced (Week 5+)
- ⭕ Mobile app
- ⭕ Barcode scanning
- ⭕ AI-driven forecasting
- ⭕ Automated reordering

---

## 📝 Notes

**Separation of Concerns:**
- Warehouse = Storage (physical location, 3D mapping, foul water)
- Inventory = Selling (branch stock, sales tracking)
- Logistics = Movement (route planning, delivery, vehicles)

**Foul Water Tracking:**
- Inventory defects, expired stock, damage, returns
- Tracked separately in warehouse and branches
- Reported as waste metrics
- Linked to quality control

**Multi-Account System:**
- Each branch can have sub-accounts
- All linked to main account
- Hierarchical permissions
- Consolidated reporting

**Real-time Updates:**
- Firestore onSnapshot for live UI
- Automatic calculations
- No manual refreshes needed
- Instant notifications

---

**Document Status:** ✅ READY FOR IMPLEMENTATION
**Next Step:** Build warehouse UI components and branch inventory system
