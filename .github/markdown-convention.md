# 📝 Markdown File Convention

## 🎯 Golden Rule
**ALL markdown (.md) files MUST go to the `DOCUMENTATION/` folder**

This keeps the root directory clean and all documentation organized in one place.

---

## 📂 Folder Structure

```
Platform Sales & Procurement/
├── DOCUMENTATION/          ← ALL .md files go here
│   ├── 00-FILE-TRACKING-START-HERE.md
│   ├── 01-INVESTOR-PITCH.md
│   ├── SETUP-INSTALLATION.md
│   ├── AI_EMAIL_ASSISTANT_*.md
│   ├── COLLECTION_SWAP_*.md
│   └── ... (all other .md files)
│
├── src/                    ← Code files only
├── services/               ← Service code
├── package.json            ← No .md files in root!
├── README.md               ← EXCEPTION: Can be in root for project overview
└── .github/                ← Config files, not .md storage
```

---

## ✅ What Goes in DOCUMENTATION/

- ✅ Implementation guides
- ✅ Technical documentation
- ✅ Feature explanations
- ✅ Setup instructions
- ✅ Testing checklists
- ✅ Deployment guides
- ✅ API documentation
- ✅ Architecture diagrams (in text form)
- ✅ Decision documents
- ✅ Completion summaries

**File naming pattern**: `FEATURE_NAME_DOCUMENT_TYPE.md`

Examples:
- `AI_EMAIL_ASSISTANT_IMPLEMENTATION.md`
- `COLLECTION_SWAP_TESTING_PLAN.md`
- `WORKLOAD_THEME_QUICK_REFERENCE.md`

---

## ❌ What Does NOT Go in DOCUMENTATION/

- ❌ Code files (.ts, .tsx, .js, .jsx)
- ❌ Config files (package.json, tsconfig.json, etc.)
- ❌ Image files unless specifically documented
- ❌ Data files (.csv, .json, etc.) - these go in `/data` folder

---

## 🚀 Automatic Redirect Prompt

**When creating new documentation, use this prompt:**

```
I'm about to create markdown documentation for [FEATURE].

Important: This markdown file must be created in the DOCUMENTATION folder:
📁 c:\Users\Administrator\Platform Sales & Procurement\DOCUMENTATION\

File path: DOCUMENTATION/[FEATURE]_[TYPE].md

Examples of correct paths:
- DOCUMENTATION/EMAIL_ASSISTANT_QUICK_GUIDE.md
- DOCUMENTATION/INVENTORY_SYNC_IMPLEMENTATION.md
- DOCUMENTATION/PAYMENT_GATEWAY_SETUP.md
```

---

## 🔄 Current State Check

To verify all markdown files are in the right place:

```powershell
# Check root directory for .md files (should be empty except README.md)
Get-ChildItem -Path "c:\Users\Administrator\Platform Sales & Procurement" -Filter "*.md" | Select-Object Name

# Count .md files in DOCUMENTATION folder (should have many)
@(Get-ChildItem -Path "c:\Users\Administrator\Platform Sales & Procurement\DOCUMENTATION" -Filter "*.md" | Measure-Object).Count
```

---

## 📋 Checklist for Creating New Documentation

Before creating any .md file, verify:

- [ ] Is this file markdown (.md)?
- [ ] Is it documentation/explanation content?
- [ ] Am I creating it in `DOCUMENTATION/` folder?
- [ ] Did I use proper naming: `FEATURE_TYPE.md`?
- [ ] Does my filePath include `DOCUMENTATION/` in the path?

✅ If all checked, you're good to go!

---

## 🎓 Common Scenarios

### Scenario 1: Creating Feature Implementation Guide
```
Feature: Payment Gateway Integration
Type: Implementation Guide

❌ WRONG: src/PAYMENT_GATEWAY_GUIDE.md
❌ WRONG: PAYMENT_GATEWAY_GUIDE.md (in root)
✅ RIGHT: DOCUMENTATION/PAYMENT_GATEWAY_IMPLEMENTATION.md
```

### Scenario 2: Creating Quick Reference
```
Feature: New API Integration
Type: Quick Reference

❌ WRONG: Quick_Reference.md
✅ RIGHT: DOCUMENTATION/API_INTEGRATION_QUICK_REFERENCE.md
```

### Scenario 3: Creating Testing Plan
```
Feature: Bulk Order System
Type: Testing Plan

❌ WRONG: TEST_PLAN.md
✅ RIGHT: DOCUMENTATION/BULK_ORDER_SYSTEM_TESTING_PLAN.md
```

### Scenario 4: Creating Setup Guide
```
Feature: Email Integration
Type: Setup Guide

❌ WRONG: /SETUP.md
✅ RIGHT: DOCUMENTATION/EMAIL_INTEGRATION_SETUP.md
```

---

## 🔗 File Paths to Use

**Always use this pattern in create_file tool:**

```
filePath: c:\Users\Administrator\Platform Sales & Procurement\DOCUMENTATION\FEATURE_NAME_DOCUMENT_TYPE.md
```

**NOT** these:
```
filePath: c:\Users\Administrator\Platform Sales & Procurement\FEATURE_NAME_DOCUMENT_TYPE.md
filePath: FEATURE_NAME.md
filePath: ./FEATURE_NAME.md
```

---

## 📌 Implementation Details for Assistant

When creating markdown files, the assistant should:

1. **Always check** if this is a documentation file
2. **Always use** the DOCUMENTATION folder
3. **Always follow** the naming convention
4. **Always include** the full path with DOCUMENTATION/
5. **Never create** .md files in the root directory (except README.md)

---

## 🎯 Benefits of This System

✅ **Organization** - All docs in one place
✅ **Cleanliness** - Root directory stays clean
✅ **Findability** - Easy to locate documentation
✅ **Structure** - Consistent naming and location
✅ **Scalability** - Works as project grows
✅ **Navigation** - Clear folder structure

---

## 📞 Quick Reference

| Task | Path |
|------|------|
| **Create Feature Guide** | `DOCUMENTATION/FEATURE_GUIDE.md` |
| **Create Setup Instructions** | `DOCUMENTATION/FEATURE_SETUP.md` |
| **Create Quick Reference** | `DOCUMENTATION/FEATURE_QUICK_REFERENCE.md` |
| **Create Testing Plan** | `DOCUMENTATION/FEATURE_TESTING.md` |
| **Create Implementation** | `DOCUMENTATION/FEATURE_IMPLEMENTATION.md` |
| **Create API Docs** | `DOCUMENTATION/FEATURE_API.md` |
| **Create Troubleshooting** | `DOCUMENTATION/FEATURE_TROUBLESHOOTING.md` |

---

## ✨ Remember

> **📁 When in doubt, put it in DOCUMENTATION/ folder!**

This simple rule keeps everything organized and easy to find.

---

**Last Updated**: December 14, 2025
**Status**: Active Convention
**Applies To**: All markdown files moving forward
