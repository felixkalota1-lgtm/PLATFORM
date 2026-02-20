#!/usr/bin/env python3
"""
Clean up orphaned code from disabled functions
"""
import re

with open("src/App.tsx", "r", encoding="utf-8", errors="replace") as f:
    lines = f.readlines()

# Mark lines to keep/remove based on function context
output_lines = []
skip_until_next_function = False
current_func = None
brace_depth = 0
in_disabled_func = False

for i, line in enumerate(lines, 1):
    # Check if we're starting a function that should be disabled
    func_match = re.search(r'const\s+(\w+)\s*=\s*async\s*\(', line)
    if func_match:
        func_name = func_match.group(1)
        if func_name in ['loadMarketplaceItems', 'loadOutgoingOrders', 'loadIncomingOrders', 
                         'deleteLetterhead', 'saveTemplate', 'saveInquiryToHistory',
                         'loadQuotationHistory', 'loadInquiryHistory', 'resendInquiryToVendors']:
            in_disabled_func = True
            current_func = func_name
            brace_depth = 0
    
    # Track braces to find function end
    if in_disabled_func:
        open_braces = line.count('{')
        close_braces = line.count('}')
        brace_depth += open_braces - close_braces
        
        # If we have a return statement and brace_depth is back to function level, we can stop
        if '// DISABLED' in line or 'return' in line:
            output_lines.append(line)
            # Add closing braces based on how many we opened
            if brace_depth <= (open_braces - close_braces):  # Closing the function
                output_lines.append('  };\n')
                in_disabled_func = False
                current_func = None
                skip_until_next_function = brace_depth > 0
        elif skip_until_next_function and brace_depth <= 0:
            skip_until_next_function = False
            in_disabled_func = False
            # Don't add this line, we're exiting the disabled function
            continue
        elif not skip_until_next_function or (in_disabled_func and brace_depth > 0 and 'const' not in line):
            # Skip orphaned code within disabled functions
            if not in_disabled_func or (current_func and 'const' not in line):
                continue
    
    output_lines.append(line)

with open("src/App.tsx", "w", encoding="utf-8", errors="replace") as f:
    f.writelines(output_lines)

print("✅ Cleaned up orphaned code")
