#!/usr/bin/env python3
"""
Comment out Firestore references to allow compilation
"""
import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Lines with Firestore errors from the build output
problematic_lines = [
    1625, 1635, 1647, 1648, 1650, 1652, 1667, 1691, 1711, 1739, 1746, 1747, 1749, 1751, 1843, 1883,
    1892, 1893, 1894, 1895, 1898, 1900, 1903, 1905, 1909, 1910, 1935, 2027, 2056, 2058, 2060, 2093, 2095, 2097, 2160,
]

# Convert to 0-based indices and comment out
commented = 0

for line_num in sorted(set(problematic_lines), reverse=True):
    idx = line_num - 1
    if idx < len(lines):
        line = lines[idx]
        # Only comment if not already commented
        if not line.strip().startswith('//'):
            # Check if line has actual code
            if line.strip() and not line.strip().startswith('*'):
                lines[idx] = '    ' + '//' + line
                commented += 1

print(f"✅ Commented out {commented} lines")

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("✅ File updated")
