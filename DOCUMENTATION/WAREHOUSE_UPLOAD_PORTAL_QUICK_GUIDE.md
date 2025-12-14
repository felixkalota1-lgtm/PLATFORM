# ⚡ WAREHOUSE UPLOAD PORTAL - QUICK START GUIDE

**Status:** Ready to Use  
**Access:** Sidebar → Warehouse & Logistics → Warehouse Upload Portal  
**URL:** http://localhost:5173/warehouse/upload-portal  

---

## 🎯 QUICK NAVIGATION

### From Sidebar
```
Warehouse & Logistics (expanded)
├─ ⭐ Warehouse Upload Portal ← START HERE
├─ Warehouse Map
├─ Locations
├─ Manage Warehouses
├─ Send Goods
└─ Fleet Management
```

---

## 📤 UPLOAD OPTIONS

### Option 1: Bulk Upload (Excel/CSV)
**When to use:** Upload 10+ products at once  
**Steps:**
1. Click "Upload Excel File" button
2. Select your Excel file
3. System shows: Total products, New products, Duplicates found
4. Choose action: Skip Duplicates or Merge
5. Watch progress bar
6. Done! All products in warehouse_inventory

**Excel Format:**
| Name | Description | Price | SKU | Category | Stock | Supplier |
|------|---|---|---|---|---|---|
| Monitor | 27-inch monitor | 199.99 | SKU001 | Electronics | 100 | Dell |

### Option 2: Single Product (Manual)
**When to use:** Add one product with detailed info  
**Steps:**
1. Click "Add Product" button
2. Fill in product name & description
3. Add price, SKU, quantity (optional)
4. Upload product image (optional)
5. Click "Add to Warehouse"
6. Done! Product in warehouse immediately

---

## 📊 WHAT HAPPENS DURING UPLOAD

```
File Selected
    ↓
✅ Parse Excel
    ↓
🔍 Detect Duplicates
    ↓
📋 Validate Data
    ↓
🎨 Generate Images (AI)
    ↓
🏷️ Auto-Categorize (AI)
    ↓
✔️ Validate with Ollama (AI)
    ↓
💾 Upload to warehouse_inventory
    ↓
📊 Log to upload_history
    ↓
✅ Complete!
```

---

## 🧠 AI FEATURES INCLUDED

| Feature | What It Does | When Used |
|---------|-------------|-----------|
| **Duplicate Detection** | Finds similar products you already have | During upload |
| **Image Generation** | Creates professional images automatically | During bulk upload |
| **Auto-Categorization** | Suggests categories automatically | During upload |
| **Data Validation** | Checks for data quality issues | During upload |

---

## 📈 TABS EXPLAINED

### 1️⃣ **Overview**
- Welcome message
- Quick stats summary
- Key features explained
- Duplicate detection info
- AI features info

### 2️⃣ **Upload Products**
- "Upload Excel File" button
- "Add Product" button
- Excel format guide
- Column definitions

### 3️⃣ **Upload History**
- List of all past uploads
- Click to expand details
- See metrics for each upload
- Total products, duplicates, images generated

### 4️⃣ **Analytics**
- Total products uploaded (all-time)
- Success rate percentage
- Duplicates handled (total)
- Images generated (total)
- Last upload timestamp

---

## ✨ KEY FEATURES

### Real-Time Feedback
- Status messages during upload
- Progress bar with percentage
- Error/warning display
- Success confirmation

### Duplicate Detection
- Compares against existing warehouse stock
- Shows similarity percentage
- Option to skip duplicates
- Option to merge similar items

### AI Processing
- **Images:** Hugging Face generates professional product images
- **Categories:** Ollama LLM suggests best category
- **Validation:** Data quality checks
- **Metadata:** Smart extraction of product info

### Upload Tracking
- Every upload logged with timestamp
- Metrics captured:
  - File name
  - Total products
  - New vs. duplicates
  - AI features applied
  - Status (success/error)

---

## 🔍 EXCEL FILE FORMAT

### Required Columns
```
Column A: Product Name (required)
Column B: Description (required)
```

### Optional Columns
```
Column C: Price (decimal, e.g., 199.99)
Column D: SKU (alphanumeric, e.g., SKU001)
Column E: Alternate SKUs (comma-separated, e.g., ALT001,ALT002)
Column F: Category (e.g., Electronics)
Column G: Stock Quantity (integer)
Column H: Supplier (e.g., Dell, HP)
Column I: Tags (comma-separated, e.g., NEW,SALE,CLEARANCE)
```

### Example Row
```
Monitor 27-inch | Professional display monitor | 199.99 | SKU001 | ALT001,ALT002 | Electronics | 100 | Dell | NEW,FEATURE
```

---

## ⚠️ ERROR HANDLING

### Common Issues

**"Product already exists"**
- ✅ Solution: Choose "Skip Duplicates" when prompted

**"Invalid Excel format"**
- ✅ Solution: Check column headers and data types

**"No image generated"**
- ✅ Solution: Hugging Face API may be rate-limited, try again later

**"File too large"**
- ✅ Solution: Split into smaller batches (100 products per file)

---

## 🎨 WAREHOUSE UPLOAD STATS

Card displays:
- **Total Products** - All products uploaded (blue card)
- **Success Rate** - Upload accuracy percentage (green card)
- **Duplicates Handled** - Products flagged as similar (purple card)
- **Images Generated** - AI-created product images (orange card)

---

## 📱 RESPONSIVE DESIGN

- ✅ **Mobile:** Stack layout, touch-friendly buttons
- ✅ **Tablet:** Two-column cards
- ✅ **Desktop:** Full width with all features
- ✅ **Dark Mode:** All styles support dark theme

---

## 🔐 PERMISSIONS

**Who can access:**
- ✅ Directors (full access)
- ✅ Managers (upload + view only)
- ✅ Warehouse Staff (view only, can't upload)
- ❌ Branch Employees (no access - they see branch stock instead)

---

## 📞 TROUBLESHOOTING

### Server not running?
```bash
cd "c:\Users\Administrator\Platform Sales & Procurement"
npx vite
# Open http://localhost:5173
```

### Can't find Warehouse Upload Portal?
1. Make sure you're logged in
2. Click "Warehouse & Logistics" in sidebar to expand
3. Click "Warehouse Upload Portal" (first item)
4. Or visit: `/warehouse/upload-portal`

### File not uploading?
1. Verify Excel format (columns A & B required)
2. Check file size (max 10MB recommended)
3. Ensure valid Excel file (.xlsx or .xls)
4. Try uploading smaller batch

### Images not generating?
1. Check internet connection
2. Hugging Face API may be busy - try again later
3. Uncheck "Generate Images" if it's blocking uploads

---

## 💡 BEST PRACTICES

1. **Consistent Naming**
   - Use clear, professional product names
   - Include key specifications
   - Avoid special characters

2. **Complete Descriptions**
   - 1-2 sentence summary
   - Key features/specs
   - Help AI generate better images

3. **SKU Organization**
   - Use consistent SKU format
   - Include brand/supplier info
   - Add alternate SKUs for variants

4. **Category Assignment**
   - Let AI suggest, review before confirming
   - Use consistent category names
   - Help with searching/filtering

5. **Batch Sizes**
   - Start with 50-100 products
   - Larger batches processed at night
   - Monitor history for patterns

---

## 🚀 WORKFLOW EXAMPLE

### Scenario: Upload 50 new monitors

**Step 1: Prepare Excel**
```
Product Name | Description | Price | SKU | Category | Stock | Supplier
Monitor 24" | Full HD LED Monitor | 149.99 | MON001 | Electronics | 50 | Dell
Monitor 27" | 4K UHD Monitor | 299.99 | MON002 | Electronics | 30 | LG
Monitor 32" | Curved Gaming Monitor | 499.99 | MON003 | Electronics | 20 | ASUS
```

**Step 2: Upload**
1. Open Warehouse Upload Portal
2. Click "Upload Excel File"
3. Select file
4. System detects 3 products, 0 duplicates
5. Click "Confirm All"
6. Watch progress bar: 33%, 66%, 100%
7. See success message

**Step 3: Verify**
1. Go to "Upload History" tab
2. See upload entry: "monitors.xlsx"
3. Click to expand: 3 products, 3 new, 0 duplicates, 3 images generated
4. Check "Analytics" tab: Total updated to 3 new products

**Step 4: Distribute to Branches**
- Coming in Phase 2: Stock Transfer Manager
- Directors will assign products to branch locations

---

## ✅ PHASE 1 COMPLETE

The Warehouse Upload Portal is fully operational.  
All AI features are enabled and ready to use.  
Products upload to `warehouse_inventory` collection.  

**Ready to proceed to Phase 2 (Stock Transfer Manager)?**  
Let's build the distribution workflow!

---

**Last Updated:** December 14, 2025  
**Version:** 1.0 (Phase 1)
