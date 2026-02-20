#!/usr/bin/env python3
"""
Disable Firestore-heavy functions by adding early returns
"""
import re

# Read the file
with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# List of functions to disable (add early return after opening brace)
functions_to_disable = [
    'resendInquiryToVendors',
    'loadAcceptedVendorConnections',
    'loadMarketplaceItems',
    'deleteLetterhead',
    'loadMarketplaceItemsForBuyer',
    'loadOutgoingOrders',
    'loadIncomingOrders',
    'loadQuotationHistory',
    'loadInquiryHistory',
]

disabled_count = 0

for func_name in functions_to_disable:
    # Pattern: const funcName = async (...) => {
    pattern = rf'(const {func_name} = async \([^{{]*\) => \{{)'
    
    # Check if function uses Firestore (db, collection, getDocs, etc.)
    # If it does, add an early return with console.log
    def replacer(match):
        global disabled_count
        opening = match.group(1)
        # Look ahead to see if this function uses Firestore
        # We'll add a simple disable message at the start
        disabled_count += 1
        return f'{opening}\n    // DISABLED FOR TURSO MIGRATION\n    console.log("⏭️  {func_name}: Disabled - Turso migration in progress");\n    return undefined as any;'
    
    # Try replacing
    new_content = re.sub(pattern, replacer, content)
    
    if new_content != content:
        print(f"✅ Disabled: {func_name}")
        content = new_content
    else:
        print(f"⚠️  Could not find: {func_name}")

print(f"\n📊 Total functions disabled: {disabled_count}")

# Write back
with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ File updated")
