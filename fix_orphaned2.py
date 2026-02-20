#!/usr/bin/env python3
"""
Fix all disabled functions with orphaned code
"""
import re

with open("src/App.tsx", "r", encoding="utf-8", errors="replace") as f:
    content = f.read()

# Find all functions that start with a return or DISABLED comment and clean them up
# Pattern: const funcName = ... => { ... // DISABLED ... return ...

# Find the lines that need fixing
lines = content.split('\n')
output_lines = []
i = 0

while i < len(lines):
    line = lines[i]
    
    # Check if this is a function with "// DISABLED" right after opening brace
    if ('return' in line and 'as any' in line) or ('// DISAB' in line and i < len(lines) - 1 and 'return' in lines[i+1]):
        # This might be a disabled function
        # Add this line and the return, then skip to the next function declaration
        output_lines.append(line)
        i += 1
        
        # Add the  return/disabled comment lines
        while i < len(lines) and not (lines[i].strip().startswith('const ') and ' = ' in lines[i]):
            output_lines.append(lines[i])
            if '};' in lines[i]:
                # Function is properly closed
                i +=1
                break
            i += 1
        continue
    
    output_lines.append(line)
    i += 1

content = '\n'.join(output_lines)

# Now find remaining orphaned code after "return" statements
# Pattern: return ... as any; ... try { ... } catch
# Should become: return ... as any;

# Replace all try blocks that come after a return statement
content = re.sub(
    r'(return\s+[^;]+\s+as\s+any;)\s*\n\s*try\s*\{[^}]*?\}\s*catch[^}]*?\}',
    r'\1',
    content,
    flags=re.DOTALL | re.MULTILINE
)

with open("src/App.tsx", "w", encoding="utf-8", errors="replace") as f:
    f.write(content)

print("✅ Fixed orphaned code")
