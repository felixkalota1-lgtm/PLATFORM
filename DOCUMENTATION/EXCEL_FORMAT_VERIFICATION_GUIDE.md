# 🔍 Excel Format Verification Guide

## ✅ Correct Excel File Format

### **Sheet 1: "Inventory" (REQUIRED)**

The first sheet MUST be named exactly **"Inventory"** (case-sensitive).

#### **Required Columns:**
| Column Name | Expected Type | Example | Notes |
|-------------|----------------|---------|-------|
| **SKU** | Text | PROD001 | Product code (will be UPPERCASE) |
| **Product Name** | Text | Widget A | Full product name |
| **Quantity** | Number | 100 | Must be a number, not text |
| **Bin** | Text | BIN-A1 | Storage bin location (will be UPPERCASE) |
| **Aisle** | Number | 1 | Must be a number (0-9+) |
| **Shelf** | Number | 3 | Must be a number (0-9+) |

#### **Optional Columns:**
| Column Name | Expected Type | Example | Default |
|-------------|----------------|---------|---------|
| Category | Text | Electronics | "Uncategorized" |
| Unit Cost | Number | 25.50 | 0 |
| Reorder Level | Number | 50 | 50 |

#### **Sample Correct Format:**
```
SKU        | Product Name | Quantity | Bin      | Aisle | Shelf | Category     | Unit Cost | Reorder Level
-----------|--------------|----------|----------|-------|-------|--------------|-----------|---------------
PROD001    | Widget A     | 100      | BIN-A1   | 1     | 3     | Electronics  | 25.50     | 50
PROD002    | Widget B     | 250      | BIN-A2   | 1     | 4     | Hardware     | 15.75     | 75
PROD003    | Gadget X     | 50       | BIN-B1   | 2     | 2     | Electronics  | 45.00     | 30
```

---

### **Sheet 2: "Locations" (OPTIONAL)**

If you want to define warehouse locations, create a second sheet named **"Locations"**.

#### **Required Columns:**
| Column Name | Expected Type | Example | Notes |
|-------------|----------------|---------|-------|
| **Bin** | Text | BIN-A1 | Bin location |
| **Aisle** | Number | 1 | Aisle number |
| **Shelf** | Number | 3 | Shelf number |

#### **Optional Columns:**
| Column Name | Expected Type | Example | Default |
|-------------|----------------|---------|---------|
| Capacity | Number | 100 | 100 |
| Active | Text | true/false | true |

---

### **Sheet 3: "Foul Water" (OPTIONAL)**

For tracking damaged/waste inventory.

#### **Required Columns:**
| Column Name | Expected Type | Example | Notes |
|-------------|----------------|---------|-------|
| **SKU** | Text | PROD001 | Must match SKU from Inventory |

#### **Optional Columns:**
| Column Name | Expected Type | Example | Default |
|-------------|----------------|---------|---------|
| Defective | Number | 5 | 0 |
| Expired | Number | 2 | 0 |
| Damaged | Number | 3 | 0 |
| Returned | Number | 1 | 0 |
| Notes | Text | Water damage | Empty |

---

## ❌ Common Format Errors

### **Error 1: Sheet Not Named "Inventory"**
```
❌ Wrong: "Sheet1", "Data", "Warehouse"
✅ Correct: "Inventory"
```

### **Error 2: Quantity Not a Number**
```
❌ Wrong: "100 units", "One hundred", "100.5" (if stored as text)
✅ Correct: 100 (actual number cell format)
```

### **Error 3: Aisle/Shelf Not Numbers**
```
❌ Wrong: "Aisle 1", "Shelf B", "1A" (text)
✅ Correct: 1, 3 (actual number cell format)
```

### **Error 4: Missing Required Columns**
```
❌ Wrong: Missing "Bin" or "Aisle" or "Shelf"
✅ Correct: All 6 required columns present
```

### **Error 5: Empty Cells in Required Columns**
```
❌ Wrong:
SKU | Product Name | Quantity | Bin | Aisle | Shelf
----|--------------|----------|-----|-------|------
    | Widget       | 100      |     | 1     | 3       (SKU and Bin empty)

✅ Correct:
SKU | Product Name | Quantity | Bin | Aisle | Shelf
----|--------------|----------|-----|-------|------
P1  | Widget       | 100      | A1  | 1     | 3
```

### **Error 6: Text in Number Fields**
```
❌ Wrong: Quantity = "ONE HUNDRED"
✅ Correct: Quantity = 100 (formatted as Number)
```

### **Error 7: Column Name Variations**
```
❌ Wrong: "product_name", "Product_Name", "PRODUCTNAME"
✅ Correct: "Product Name" (spaces, any case - will be normalized)

Note: Parser auto-normalizes, but "sku", "SKU", "Sku" all work
```

---

## 🔧 How to Verify Your Excel File

### **Step 1: Check Sheet Names**
In Excel:
- Right-click sheet tab → "Rename" to change name
- First sheet should be named exactly: **"Inventory"**

### **Step 2: Check Column Headers**
Your headers should match (case-insensitive, spaces OK):
```
SKU, Product Name, Quantity, Bin, Aisle, Shelf
```

Variations that work:
- "sku" or "SKU" or "Sku" ✅
- "Product Name" or "product name" or "ProductName" ✅
- "Quantity" or "quantity" or "qty" or "Qty" ✅
- "Bin" or "bin" ✅
- "Aisle" or "aisle" ✅
- "Shelf" or "shelf" ✅

### **Step 3: Check Data Types**

**In Excel**, set these cell formats:
```
Column A (SKU):        Text
Column B (Product):    Text
Column C (Quantity):   Number (no decimals)
Column D (Bin):        Text
Column E (Aisle):      Number
Column F (Shelf):      Number
```

To set cell format in Excel:
1. Select column
2. Right-click → "Format Cells"
3. Choose appropriate type

### **Step 4: Check for Empty Rows**
- Remove any empty rows between data
- Start data in Row 2 (Row 1 = headers)

### **Step 5: Check for Spaces**
- No leading/trailing spaces in cells
- SKU example: "PROD001" not " PROD001 "

---

## 📋 Quick Checklist

Before uploading Excel file:

- [ ] First sheet named "Inventory"
- [ ] Headers: SKU, Product Name, Quantity, Bin, Aisle, Shelf
- [ ] At least 1 data row (besides header)
- [ ] No empty rows in data
- [ ] Quantity column = Numbers (not text)
- [ ] Aisle & Shelf = Numbers
- [ ] SKU column = Text (no spaces)
- [ ] Product Name = Text (can have spaces)
- [ ] Bin = Text (uppercase recommended)
- [ ] No special characters in required fields

---

## 🔍 Debugging Your File

### **Method 1: Look at Error Messages**

When you place your Excel file in `warehouse-imports/`, check the terminal output:

```
❌ Excel file must contain "Inventory" sheet
   → Rename first sheet to "Inventory"

❌ Row 2 missing required fields: Quantity, Aisle
   → Add missing column headers

❌ Row 3 has invalid quantity: "fifty"
   → Change to number: 50

❌ Row 4 has invalid aisle/shelf numbers
   → Make sure Aisle/Shelf are actual numbers, not text
```

### **Method 2: Test with Sample File**

Use the included sample to verify format:
```
Location: warehouse-imports/sample-warehouse-stock.csv
or
Location: services/warehouse-file-watcher/sample_warehouse.csv
```

### **Method 3: Conversion from CSV to Excel**

If starting from CSV:
1. Open CSV in Excel
2. Rename sheet to "Inventory"
3. Ensure columns are correct types
4. Save as `.xlsx` format

---

## ✨ Working Excel Example

**Save this as `warehouse-data.xlsx`:**

```
Sheet: "Inventory"

| SKU      | Product Name      | Quantity | Bin    | Aisle | Shelf | Category     | Unit Cost |
|----------|-------------------|----------|--------|-------|-------|--------------|-----------|
| PROD001  | Premium Widget    | 100      | BIN-A1 | 1     | 1     | Electronics  | 25.50     |
| PROD002  | Standard Widget   | 250      | BIN-A2 | 1     | 2     | Hardware     | 15.75     |
| PROD003  | Deluxe Gadget     | 50       | BIN-B1 | 2     | 1     | Electronics  | 45.00     |
| PROD004  | Basic Component   | 500      | BIN-B2 | 2     | 2     | Components   | 5.25      |
| PROD005  | Heavy Equipment   | 10       | BIN-C1 | 3     | 1     | Machinery    | 299.99    |
```

---

## 🚀 Next Steps

1. **Fix your Excel file** using the checklist above
2. **Place it in**: `warehouse-imports/` folder
3. **Run watcher**: `npm run warehouse-watcher`
4. **Watch terminal** for success/error messages
5. **Check Firestore** to verify data synced

---

## 📞 Need Help?

If still getting errors:

1. Check exact error message in terminal
2. Verify column headers match exactly
3. Make sure data types are correct (Numbers vs Text)
4. Remove any special characters
5. Try the sample CSV format first
6. Ensure no empty rows in data

---

**Last Updated**: December 14, 2025  
**Status**: ✅ **Format Guide Complete**
