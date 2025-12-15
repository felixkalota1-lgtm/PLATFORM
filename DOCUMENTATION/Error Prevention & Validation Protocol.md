Error Prevention & Validation Protocol
For every code change you make:

✅ Make the edit
✅ Immediately run get_errors() to check for compilation errors
✅ Fix any errors found before proceeding to the next task
❌ NEVER submit broken code
For complex multi-file conversions:

Use a sub-agent with built-in validation that:
Makes code changes
Immediately checks for errors after each change
Fixes errors before returning results
Provides a final verification report