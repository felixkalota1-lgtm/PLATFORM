#!/usr/bin/env python3
"""
Replace problematic Firestore functions with safe stubs for Turso migration
"""
import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

#  Simple replacements: wrap function bodies with early returns
replacements = [
    # resendInquiryToVendors - wrap the entire body
    (r'(const resendInquiryToVendors = async \([^{]*\) => \{)',
     r'\1\n    console.log("Turso: resendInquiryToVendors disabled"); return { success: [], failed: [] };'),
    
    # loadAcceptedVendorConnections
    (r'(const loadAcceptedVendorConnections = async \([^{]*\) => \{)',
     r'\1\n    console.log("Turso: loadAcceptedVendorConnections disabled"); return;'),
    
    # saveInquiryToHistory
    (r'(const saveInquiryToHistory = async \([^{]*\) => \{)',
     r'\1\n    console.log("Turso: saveInquiryToHistory disabled"); return;'),
    
    # loadMarketplaceItems
    (r'(const loadMarketplaceItems = async \([^{]*\) => \{)',
     r'\1\n    console.log("Turso: loadMarketplaceItems disabled"); return [];'),
    
    # loadOutgoingOrders
    (r'(const loadOutgoingOrders = async \([^{]*\) => \{)',
     r'\1\n    console.log("Turso: loadOutgoingOrders disabled"); return [];'),
    
    # loadIncomingOrders
    (r'(const loadIncomingOrders = async \([^{]*\) => \{)',
     r'\1\n    console.log("Turso: loadIncomingOrders disabled"); return [];'),
     
    # deleteLetterhead
    (r'(const deleteLetterhead = async \([^{]*\) => \{)',
     r'\1\n    console.log("Turso: deleteLetterhead disabled"); return;'),
    
    # saveTemplate
    (r'(const saveTemplate = async \([^{]*\) => \{)',
     r'\1\n    console.log("Turso: saveTemplate disabled"); return;'),
     
    # loadQuotationHistory - but this one returns data, so handle differently
    (r'(const loadQuotationHistory = async \([^{]*\): Promise<any\[\]> => \{)',
     r'\1\n    console.log("Turso: loadQuotationHistory disabled"); return [];'),
     
    # loadInquiryHistory
    (r'(const loadInquiryHistory = async \([^{]*\): Promise<any\[\]> => \{)',
     r'\1\n    console.log("Turso: loadInquiryHistory disabled"); return [];'),
]

count = 0
for pattern, replacement in replacements:
    if re.search(pattern, content):
        content = re.sub(pattern, replacement, content, count=1)
        count += 1
        print(f"✅ Wrapped function (pattern {count})")

print(f"\n📊 Wrapped {count} functions")

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ File updated")
