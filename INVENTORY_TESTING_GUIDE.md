# 🧪 AI Features & Excel Upload Testing Guide

## ✅ System Status

**Vite Server:** Running on http://localhost:5173/
**Sample Excel File:** `sample_products.xlsx` in project root
**AI Services:** Ready for testing
**Modules:** Inventory module fully integrated

---

## 🚀 Quick Start Testing

### **Step 1: Login to Application**
1. Open http://localhost:5173/ in your browser
2. You'll see the login page
3. Enter any email (e.g., `test@example.com`)
4. Enter any password
5. Enter company name (e.g., `Test Corp`)
6. Click "Sign In"

### **Step 2: Navigate to Inventory Module**
1. After login, you'll see the Dashboard
2. Look at the left sidebar, find "Inventory" 
3. Click "Inventory" → This opens the Inventory Management page
4. You should see the "Bulk Import" button in the top right

### **Step 3: Test Excel Upload**
1. Click the "📊 Bulk Import" button
2. A modal will open with drag-and-drop area
3. You have 2 options:
   - **Drag & Drop:** Drag `sample_products.xlsx` file onto the drop zone
   - **Click to Browse:** Click the area and select `sample_products.xlsx` from your file picker

### **Step 4: Validation & Processing**
Once you select the file, the system will:

```
✓ Parse Excel file (name, description, price, sku, category, stock)
✓ Validate data structure
✓ Detect duplicate products (>70% text similarity)
✓ Auto-categorize products using AI
✓ Extract product metadata
✓ Show validation results before upload
```

### **Step 5: AI Features in Action**
Before uploading, you'll see:
- ✅ Validation Status (passed/failed)
- ✅ Any detected duplicates (with similarity percentage)
- ✅ Warnings or errors (if any)
- ✅ Option to generate product images (checkbox)

### **Step 6: Complete Upload**
1. Review the validation results
2. If you want AI-generated product images, check the box (optional)
3. Click "Upload to Database"
4. Watch the progress as products are imported

### **Step 7: View Imported Products**
1. After successful upload, the modal closes
2. Click the "Products" tab to see all imported products
3. You should see:
   - Product names from Excel
   - Descriptions
   - Prices
   - SKU codes
   - Stock levels
   - Auto-generated categories

---

## 📊 Available Inventory Tabs

### **Overview Tab** ℹ️
- Getting started guide
- Excel template format reference
- AI features information

### **Products Tab** 📦
- List of all imported products
- Search by product name
- Filter by category
- Edit/view individual products
- Delete products

### **Stock Management Tab** 📊
- Low stock alerts
- Warehouse distribution
- Stock movement history
- Coming soon: Real-time stock tracking

### **Analytics Tab** 📈
- Total stock value
- Inventory turnover rate
- Current SKU count
- Average lead time
- Charts showing stock vs sales
- ABC analysis (Pareto method)

---

## 🧠 AI Features Explained

### **1. Duplicate Detection**
- Analyzes product names and descriptions
- Flags products with >70% text similarity
- Prevents duplicate entries in database
- Shows similarity score (0-100%)

### **2. Auto-Categorization**
- Analyzes product descriptions
- Automatically assigns appropriate categories
- Uses ML to understand product type
- Improves searchability

### **3. Metadata Extraction**
- Extracts key information from descriptions:
  - Materials (e.g., "aluminum", "plastic")
  - Colors (e.g., "red", "blue")
  - Sizes (e.g., "L", "XL")
  - Special features (e.g., "wireless", "rechargeable")

### **4. Image Generation** (Optional)
- Generates professional product images from descriptions
- Uses Hugging Face Stable Diffusion
- One image per product
- Optional during upload (checkbox)
- Cost: ~$0.02-0.10 per image

### **5. Data Validation**
- Checks Excel format is correct
- Validates required fields (name, description)
- Identifies missing data
- Suggests corrections

---

## 📋 Sample Excel Format

The `sample_products.xlsx` file contains 5 test products:

| name | description | price | sku | category | stock |
|------|-------------|-------|-----|----------|-------|
| LED Desk Lamp | Bright LED lamp with adjustable brightness and color temperature | 89.99 | LAMP-001 | Office | 45 |
| Wireless Mouse | Ergonomic wireless mouse with 2.4GHz connection and 18-month battery | 29.99 | MOUSE-001 | Electronics | 120 |
| Mechanical Keyboard | RGB mechanical keyboard with Cherry MX switches and aluminum frame | 149.99 | KEY-001 | Electronics | 60 |
| USB-C Hub | 7-in-1 USB-C hub with HDMI, USB 3.0, and SD card reader | 49.99 | HUB-001 | Accessories | 85 |
| Monitor Stand | Adjustable monitor stand with storage drawer for desk organization | 39.99 | STAND-001 | Office | 40 |

---

## 🐛 Troubleshooting

### **Issue: Modal doesn't open**
- **Solution:** Make sure you're logged in and in the Inventory module
- Check browser console for errors (F12 → Console)

### **Issue: Excel file won't upload**
- **Solution:** Make sure it's in `.xlsx` format (not `.xls` or `.csv`)
- File must have columns: name, description, price, sku, category, stock

### **Issue: Products show but no data appears**
- **Solution:** The test products in "Products" tab are mock data
- Imported products from Excel will appear after successful upload

### **Issue: AI features show errors**
- **Solution:** 
  - Check if API keys are configured (for Hugging Face image generation)
  - Network must be accessible for AI calls
  - AI features may require backend setup

### **Issue: Duplicate detection not working**
- **Solution:** This requires local NLP processing
- Make sure text similarity calculations are enabled
- Add 2-3 very similar products to test

---

## 🔧 Configuration & Setup

### **For Full AI Features, You May Need:**

**1. Hugging Face API Key** (for image generation)
```
Set VITE_HF_TOKEN environment variable
OR
Update src/services/aiService.ts
```

**2. Ollama Local LLM** (for data validation)
```bash
# Install Ollama from https://ollama.ai
# Run: ollama run llama2
# This enables local AI without API costs
```

**3. TensorFlow.js** (for ML features)
```
Already installed: @tensorflow/tfjs 4.18.0
Used for demand forecasting and categorization
```

---

## 📊 Next Steps After Testing

1. **Test Product Search** - Search for products by name
2. **Test Category Filtering** - Filter products by category
3. **Test Stock Management** - Check low stock items
4. **View Analytics** - See inventory charts and trends
5. **Create More Products** - Upload multiple batches
6. **Test Marketplace Integration** - Products will be available in marketplace

---

## 💡 Advanced Testing

### **Test Duplicate Detection:**
Create Excel with these 2 rows:
```
name: "High Quality Office Lamp"
name: "Quality Office Lamp for Desk"
```
These will be flagged as duplicates (>70% similar)

### **Test Categorization:**
Use varied descriptions:
- "Wireless Bluetooth speaker with amazing sound" → Should categorize as Electronics
- "Leather office chair with lumbar support" → Should categorize as Furniture
- "Fast USB-C charging cable" → Should categorize as Accessories

### **Test Data Validation:**
Create Excel with missing fields to see validation errors

### **Test Large Batch:**
Add 50+ products to Excel and upload to test performance

---

## ✅ Success Checklist

After complete testing, verify:
- [ ] Can login successfully
- [ ] Can navigate to Inventory module
- [ ] Can open Excel upload modal
- [ ] Can select and upload sample file
- [ ] Validation runs without errors
- [ ] Products appear in Products tab
- [ ] Can search products
- [ ] Can filter by category
- [ ] Analytics show correct counts
- [ ] Stock levels display correctly
- [ ] Stock management tab loads
- [ ] No console errors (F12)

---

## 📞 Support

For issues or questions:
1. Check browser console (F12 → Console)
2. Check Vite terminal for errors
3. Verify all files are created correctly
4. Ensure you're logged in before testing

**Ready to test?** Login and navigate to the Inventory module! 🚀
