#!/usr/bin/env python3
"""
Simplify function bodies that still have errors
"""
import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find and completely eliminate problematic function bodies
# Strategy: Replace everything from after the console.log return up to the closing }

# For loadAcceptedVendorConnections
pattern = r'(const loadAcceptedVendorConnections = async \(\) => \{\s*console\.log\("Turso: loadAcceptedVendorConnections disabled"\); return;)\s*[\s\S]*?^  \};'
replacement = r'\1\n  };'

content = re.sub(pattern, replacement, content, flags=re.MULTILINE | re.IGNORECASE, count=1)

# Find remaining problematic lines and comment them out
lines = content.split('\n')
new_lines = []

for i, line in enumerate(lines):
    # Check if this line has Object.keys on a potentially undefined object
    if 'Object.keys(connection)' in line and 'allKeys' in line:
        # Comment it out
        new_lines.append('    // ' + line.strip() + ' // DISABLED FOR TURSO')
    else:
        new_lines.append(line)

content = '\n'.join(new_lines)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Cleaned up function bodies")
