# Quick Diagnostic Checklist

## First, Check Your User Profile

**In Firebase Console:**
1. Go to Firestore Database
2. Go to "users" collection
3. Find your user document
4. Look for these fields:

```json
{
  "email": "your@email.com",
  "role": "???",              ← Should be: manager, director, or admin
  "branch": "???",            ← Should have a branch ID
  "tenantId": "???",          ← Should have tenant ID
  "branchId": "???"           ← Or this instead of branch
}
```

**What to check:**
- [ ] Do you have `role: manager/director/admin`?
- [ ] Do you have `branch` or `branchId` field?
- [ ] Do you have `tenantId` field?

---

## Second, Check Firestore Collections

**In Firebase Console → Firestore:**

1. **Check warehouse_inventory collection**
   - [ ] Does it exist?
   - [ ] Does it have any documents?
   - [ ] What data is in it?

2. **Check tenants collection**
   - [ ] Does it exist?
   - [ ] Does your tenantId exist?
   - [ ] Does it have products subcollection?
   - [ ] Does it have warehouse_inventory subcollection?
   - [ ] Does it have branch_inventory subcollection?

3. **Check products**
   - [ ] Are inventory items in `tenants/{id}/products`?
   - [ ] How many products are there?

---

## Third, Check Browser Console

**Steps:**
1. Open your app in browser
2. Press F12 (Open Developer Tools)
3. Click "Console" tab
4. Look for red error messages
5. Take screenshot and share errors

**What to look for:**
- Authentication errors
- Firestore permission errors
- Collection not found errors
- Tenant ID undefined errors

---

## Fourth, Try These Links

**Click these and report what happens:**

1. [ ] Dashboard works → `/dashboard`
   - Can you see home page?

2. [ ] Inventory works → `/inventory/products`
   - Can you see product list?

3. [ ] Warehouse Analytics → `/warehouse-analytics`
   - Blank page? Error? Redirected?

4. [ ] My Branch Stock → `/branch-stock`
   - Blank page? Error? Redirected?

---

## What the Issues Are

### Issue 1: Different Collections ❌

```
Inventory uses:    tenants/{id}/products
Warehouse uses:    warehouse_inventory (GLOBAL)

They don't talk to each other!
```

### Issue 2: Role Check ❌

```
Warehouse Analytics page checks:
if user.role is NOT in ['manager', 'director', 'admin']
  → REDIRECT TO DASHBOARD
```

### Issue 3: Branch Check ❌

```
Branch Stock page checks:
if user.branch is MISSING
  → No data shows up
```

---

## Solutions Available

**Quick Fix (15 minutes):**
- Update user role in Firebase to 'manager'
- Add branch field to user profile

**Code Fix (1 hour):**
- Make warehouse_inventory tenant-specific
- Add warehouse sync to inventory watcher

**Full Fix (2 hours):**
- Restructure collections for consistency
- Update all components
- Test everything

---

## Report These Findings

When you run the diagnostics above, please share:

1. Your user's role, branch, and tenantId
2. What collections exist in Firestore
3. Screenshot of browser console errors
4. Which pages work vs don't work

Then I can give you exact code fixes!

---

**Quick Fix Priority:**
1. Check your user role (might just need to be 'manager')
2. Check Firestore collections structure
3. Share errors from browser console
