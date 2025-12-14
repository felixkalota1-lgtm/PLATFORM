# 🤖 AI Assistant System Prompt - Markdown File Convention

## Core Instruction

**WHEN CREATING ANY MARKDOWN (.md) FILE:**
Always place it in the `DOCUMENTATION/` folder with proper naming convention.

---

## Automatic Redirect Rules

### Rule 1: Check File Type
```
If creating a file with extension: .md
Then: MUST go to DOCUMENTATION/ folder
```

### Rule 2: Path Format
```
Required format:
filePath: c:\Users\Administrator\Platform Sales & Procurement\DOCUMENTATION\[FILENAME].md

Not allowed:
filePath: c:\Users\Administrator\Platform Sales & Procurement\[FILENAME].md
filePath: [FILENAME].md
```

### Rule 3: Naming Convention
```
Pattern: FEATURE_NAME_DOCUMENT_TYPE.md

Examples:
✅ AI_EMAIL_ASSISTANT_IMPLEMENTATION.md
✅ WORKLOAD_THEME_QUICK_GUIDE.md
✅ COLLECTION_SWAP_TESTING_PLAN.md
✅ PAYMENT_GATEWAY_SETUP.md

❌ guide.md
❌ README.md (except in root as exception)
❌ setup.md
```

---

## Pre-Creation Checklist

Before calling `create_file` with a .md file:

1. **Verify it's documentation**: Is it explaining/documenting something?
   - YES → Goes in DOCUMENTATION/
   - NO → Reconsider creating it

2. **Check the path**: Does it start with `c:\Users\Administrator\Platform Sales & Procurement\DOCUMENTATION\`?
   - YES → Proceed
   - NO → Correct the path

3. **Verify naming**: Does it follow `FEATURE_TYPE.md` pattern?
   - YES → Proceed
   - NO → Rename before creating

4. **Confirm with user**: If uncertain, ask user for confirmation

---

## Examples by Document Type

### Implementation Guide
```
Creating: Technical guide for new feature
Filename: FEATURE_NAME_IMPLEMENTATION.md
Full Path: c:\Users\Administrator\Platform Sales & Procurement\DOCUMENTATION\FEATURE_NAME_IMPLEMENTATION.md

Example:
✅ DOCUMENTATION/EMAIL_INTEGRATION_IMPLEMENTATION.md
```

### Quick Reference
```
Creating: Quick start or cheat sheet
Filename: FEATURE_NAME_QUICK_REFERENCE.md
Full Path: c:\Users\Administrator\Platform Sales & Procurement\DOCUMENTATION\FEATURE_NAME_QUICK_REFERENCE.md

Example:
✅ DOCUMENTATION/BULK_ORDER_QUICK_REFERENCE.md
```

### Setup Guide
```
Creating: Installation or setup instructions
Filename: FEATURE_NAME_SETUP.md
Full Path: c:\Users\Administrator\Platform Sales & Procurement\DOCUMENTATION\FEATURE_NAME_SETUP.md

Example:
✅ DOCUMENTATION/PAYMENT_GATEWAY_SETUP.md
```

### Testing Plan
```
Creating: Testing checklist or test plan
Filename: FEATURE_NAME_TESTING.md
Full Path: c:\Users\Administrator\Platform Sales & Procurement\DOCUMENTATION\FEATURE_NAME_TESTING.md

Example:
✅ DOCUMENTATION/INVENTORY_SYNC_TESTING.md
```

### API Documentation
```
Creating: API reference or endpoint docs
Filename: FEATURE_NAME_API.md
Full Path: c:\Users\Administrator\Platform Sales & Procurement\DOCUMENTATION\FEATURE_NAME_API.md

Example:
✅ DOCUMENTATION/REST_API_REFERENCE.md
```

### Troubleshooting Guide
```
Creating: Common issues and solutions
Filename: FEATURE_NAME_TROUBLESHOOTING.md
Full Path: c:\Users\Administrator\Platform Sales & Procurement\DOCUMENTATION\FEATURE_NAME_TROUBLESHOOTING.md

Example:
✅ DOCUMENTATION/EMAIL_SYNC_TROUBLESHOOTING.md
```

### System Overview
```
Creating: High-level system explanation
Filename: FEATURE_NAME_SYSTEM_OVERVIEW.md
Full Path: c:\Users\Administrator\Platform Sales & Procurement\DOCUMENTATION\FEATURE_NAME_SYSTEM_OVERVIEW.md

Example:
✅ DOCUMENTATION/ANALYTICS_SYSTEM_OVERVIEW.md
```

---

## Decision Tree

```
Creating a file?
│
├─ Is it a .md file?
│  ├─ NO → Create wherever appropriate (code dirs, etc.)
│  └─ YES → Continue...
│
├─ Is it documentation/explanation content?
│  ├─ NO → Shouldn't be .md file, use appropriate format
│  └─ YES → Continue...
│
├─ Go to DOCUMENTATION/ folder
│  └─ Create with proper naming: FEATURE_TYPE.md
│     └─ ✅ DONE!
```

---

## Exceptions

The ONLY exception to "all .md files in DOCUMENTATION/" is:

1. **README.md** (in root) - Project overview for repository
2. **.github/** files (in .github folder) - Configuration documents
3. **Hidden files** like `.github/copilot-instructions.md` - Framework files

All other documentation must go to DOCUMENTATION/ folder.

---

## Validation Commands

To verify compliance, user can run:

```powershell
# Check for .md files in root (should only show README.md)
Get-ChildItem -Path "." -MaxDepth 1 -Filter "*.md"

# Count files in DOCUMENTATION
@(Get-ChildItem -Path "DOCUMENTATION" -Filter "*.md" | Measure-Object).Count

# List all .md files in DOCUMENTATION
Get-ChildItem -Path "DOCUMENTATION" -Filter "*.md" | Select-Object Name
```

---

## Prompting Strategy

When user asks to create documentation, respond with:

1. **Confirm understanding**: "I'll create a [TYPE] document for [FEATURE]"
2. **Verify path**: "This will be created at: DOCUMENTATION/[FILENAME].md"
3. **Show filename**: "Filename: [FILENAME].md"
4. **Proceed**: Create with full correct path

---

## Visual Reminder

```
┌─────────────────────────────────────────┐
│  📝 MARKDOWN FILE REDIRECT RULE         │
├─────────────────────────────────────────┤
│                                         │
│  .md file created?                      │
│         ↓                               │
│  → DOCUMENTATION/ folder                │
│         ↓                               │
│  Naming: FEATURE_TYPE.md                │
│         ↓                               │
│  ✅ Organized!                          │
│                                         │
│  All documentation in one place!        │
│  Root directory stays clean!            │
│                                         │
└─────────────────────────────────────────┘
```

---

## Quick Syntax for Future Reference

When creating markdown, always use:

```typescript
create_file({
  filePath: "c:\\Users\\Administrator\\Platform Sales & Procurement\\DOCUMENTATION\\FEATURE_TYPE.md",
  content: "..."
})
```

**Pattern**: `DOCUMENTATION/FEATURE_TYPE.md`

---

## Summary

| What | Where | Pattern |
|------|-------|---------|
| **All Documentation** | `DOCUMENTATION/` | `FEATURE_TYPE.md` |
| **Code Files** | `src/`, `services/`, etc. | `.ts`, `.tsx`, `.js` |
| **Config Files** | Root or `.vscode/`, `.github/` | `.json`, `.js` |
| **Data Files** | `data/` | `.json`, `.csv`, `.tsv` |

---

**Purpose**: Ensure all markdown documentation is automatically organized
**Status**: Active - Apply to all future .md creation
**Last Updated**: December 14, 2025
**Applies To**: AI Assistant creating files for this project
