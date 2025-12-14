# 📌 Markdown File Convention - Quick Reference Card

## 🎯 The One Rule

```
📝 All .md files → DOCUMENTATION/ folder
```

---

## ✅ Correct Pattern

```
✅ filePath: c:\Users\Administrator\Platform Sales & Procurement\DOCUMENTATION\FEATURE_TYPE.md
```

## ❌ Wrong Patterns

```
❌ filePath: c:\Users\Administrator\Platform Sales & Procurement\FEATURE_TYPE.md
❌ filePath: FEATURE_TYPE.md
❌ filePath: ./FEATURE_TYPE.md
❌ filePath: src/FEATURE_TYPE.md
```

---

## 📋 Naming Convention

```
Format: FEATURE_NAME_DOCUMENT_TYPE.md

Types:
├─ _IMPLEMENTATION.md    (How it works technically)
├─ _QUICK_GUIDE.md       (Quick start guide)
├─ _SETUP.md             (Installation/setup)
├─ _TESTING.md           (Test plan/checklist)
├─ _QUICK_REFERENCE.md   (Cheat sheet)
├─ _API.md               (API documentation)
├─ _TROUBLESHOOTING.md   (Common issues)
├─ _SYSTEM_OVERVIEW.md   (High-level explanation)
└─ _DEPLOYMENT.md        (Deployment guide)
```

---

## 🚀 Before Creating Any .md File

Ask yourself:

1. **Is this markdown?** (.md extension)
   - YES → Continue
   - NO → Use different format

2. **Is this documentation?** (Explaining/teaching something)
   - YES → Goes in DOCUMENTATION/
   - NO → Reconsider creating

3. **Do I have the full path?** (Includes DOCUMENTATION/)
   - YES → Create it
   - NO → Add DOCUMENTATION/ to path

---

## 📂 Folder Structure

```
Platform Sales & Procurement/
│
├── DOCUMENTATION/              ← ✅ PUT ALL .md FILES HERE
│   ├── AI_EMAIL_ASSISTANT_*.md
│   ├── WORKLOAD_THEME_*.md
│   ├── COLLECTION_SWAP_*.md
│   └── ... (all other .md files)
│
├── src/                        ← Code only
├── services/                   ← Code only
├── .github/                    ← Config + special prompts
├── package.json
└── README.md                   ← Exception: Root project overview
```

---

## 🎯 Examples

### Creating AI Feature Documentation

```
Task: Document new AI feature
Filename: AI_NEW_FEATURE_IMPLEMENTATION.md
Full Path: 
  c:\Users\Administrator\Platform Sales & Procurement\DOCUMENTATION\AI_NEW_FEATURE_IMPLEMENTATION.md

✅ CORRECT
❌ Create in root directory
❌ Create in src/ folder
```

### Creating Setup Guide

```
Task: Create setup instructions
Filename: PAYMENT_GATEWAY_SETUP.md
Full Path:
  c:\Users\Administrator\Platform Sales & Procurement\DOCUMENTATION\PAYMENT_GATEWAY_SETUP.md

✅ CORRECT
❌ Create in root
❌ Name it SETUP.md without feature name
```

### Creating Quick Reference

```
Task: Make quick reference card
Filename: DATABASE_QUERIES_QUICK_REFERENCE.md
Full Path:
  c:\Users\Administrator\Platform Sales & Procurement\DOCUMENTATION\DATABASE_QUERIES_QUICK_REFERENCE.md

✅ CORRECT
❌ Name it REFERENCE.md
❌ Put in code folders
```

---

## 🔧 One-Liner for Create File

```
filePath: c:\Users\Administrator\Platform Sales & Procurement\DOCUMENTATION\FEATURE_NAME_TYPE.md
```

**Template to copy:**
```
c:\Users\Administrator\Platform Sales & Procurement\DOCUMENTATION\[REPLACE_WITH_NAME].md
```

---

## 📊 At a Glance

| When You Want To... | File Name Pattern | Location |
|-------------------|------------------|----------|
| **Document a feature** | `FEATURE_IMPLEMENTATION.md` | `DOCUMENTATION/` |
| **Create a quick guide** | `FEATURE_QUICK_GUIDE.md` | `DOCUMENTATION/` |
| **Write setup steps** | `FEATURE_SETUP.md` | `DOCUMENTATION/` |
| **Make a test plan** | `FEATURE_TESTING.md` | `DOCUMENTATION/` |
| **Write API docs** | `FEATURE_API.md` | `DOCUMENTATION/` |
| **Explain system** | `FEATURE_SYSTEM_OVERVIEW.md` | `DOCUMENTATION/` |
| **Fix common issues** | `FEATURE_TROUBLESHOOTING.md` | `DOCUMENTATION/` |

---

## 🎓 Remember This

```
┌─────────────────────────────────────┐
│                                     │
│  When in doubt:                     │
│                                     │
│  📁 → DOCUMENTATION/                │
│  📝 → FEATURE_TYPE.md               │
│                                     │
│  Always. Every time. No exceptions. │
│                                     │
└─────────────────────────────────────┘
```

---

## ⚡ Quick Check

Before hitting "create file":

- [ ] Extension is `.md`? 
- [ ] Path includes `DOCUMENTATION/`?
- [ ] Name follows `FEATURE_TYPE.md` pattern?
- [ ] It's documentation content?

✅ All checked? **CREATE IT!**

---

**Last Updated**: December 14, 2025
**Status**: Active Convention
**Keep This Handy**: Yes!
