#!/usr/bin/env python3
"""
Simple and careful Firestore function disabling for Turso migration
"""
import re

with open('src/App.tsx', 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

# ONLY replace the function signatures with early returns
# Don't try to remove the entire body

simple_functions = {
    'resendInquiryToVendors': '{ success: [], failed: [] }',
    'loadAcceptedVendorConnections': 'undefined',
    'loadMarketplaceItems': '[]',
    'loadMarketplaceItemsForBuyer': '[]',
    'loadOutgoingOrders': '[]',
    'loadIncomingOrders': '[]',
    'deleteLetterhead': 'undefined',
    'saveTemplate': 'undefined',
    'saveInquiryToHistory': 'undefined',
    'loadQuotationHistory': '[]',
    'loadInquiryHistory': '[]',
    'loadIncomingInquiries': '[]',
}

count = 0
for func_name, return_val in simple_functions.items():
    # Match: const funcName = async ( ... ) => { 
    # And insert return statement after opening brace
    pattern = rf'(const {re.escape(func_name)}\s*=\s*async\s*\([^{{]*?\)\s*(?::\s*Promise<[^>]+>)?\s*=>\s*\{{)'
    
    replacement = rf'\1\n    // DISABLED - Turso migration\n    return {return_val} as any;'
    
    if re.search(pattern, content):
        content = re.sub(pattern, replacement, content, count=1)
        count += 1
        print(f"✅ Disabled {func_name}")
    else:
        print(f"⚠️  Could not find {func_name}")

print(f"\n📊 Total: {count} functions disabled")

# Also fix the auth function - add early return check for db
content = re.sub(
    r'(const loadUserDataOnLogin = async[^{]*\{)',
    r'\1\n    // DISABLED - Using localStorage for session restore\n    return {products: [], activeTab: "products", quotationHistory: [], inquiryHistory: [], incomingInquiries: []};',
    content,
    count=1
)

with open('src/App.tsx', 'w', encoding='utf-8', errors='replace') as f:
    f.write(content)

print("✅ Updated file")
