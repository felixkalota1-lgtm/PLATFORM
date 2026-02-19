# Email System Testing Workflow - 5x Comprehensive Testing Protocol

## System Status: ✅ READY FOR TESTING
- **Dev Server**: Running on http://127.0.0.1:5174
- **Component Status**: All email UI components implemented ✅
- **Cloud Functions**: Compiled and Ready for Deployment
- **Testing Environment**: Fully functional

---

## Quick Start

1. **Access the Application**: http://127.0.0.1:5174
2. **Login**: Use your Firebase credentials
3. **Navigate to Settings** → **Email Accounts Tab** to start OAuth flow
4. **Follow testing paths below** → Complete all 5x iterations

---

## TEST PATH 1: Gmail OAuth Account Connection (5x Testing)

### Objective
Verify that users can successfully connect their Gmail account via OAuth 2.0 and see the account in the email accounts list.

### Prerequisites
- Web browser with Google account access
- Application running at http://127.0.0.1:5174
- User logged into Platform Sales & Procurement

### Test Steps (Repeat 5 Times)

#### **Iteration 1 of 5: First Gmail Connection**
**Goal**: Connect first Gmail account and verify it appears in the accounts list

1. Click **Settings** in main navigation sidebar
2. Click **Email Accounts** tab
3. Click **"Connect Gmail Account"** button
4. **Expected**: OAuth popup window opens with Google login
5. Sign in with your Google account (or select existing account)
6. **Expected**: Google permission consent screen appears asking for Gmail access
7. Click **"Allow"** to grant permissions
8. **Expected**: Popup closes automatically, account appears in the accounts list
9. **Verify**:
   - ✅ Account email displayed in list
   - ✅ Connection date shown
   - ✅ Radio button to set as "Default" appears
   - ✅ Account is immediately usable in Send Email dialogs

**Result**: ☐ PASS | ☐ FAIL  
**Notes**: _________________________

---

#### **Iteration 2 of 5: Connect Second Gmail Account**
**Goal**: Verify system supports multiple email accounts

1. Click **"Connect Gmail Account"** button again
2. **Expected**: OAuth popup opens again
3. Sign in with a **different** Google account (if available) or same account
4. Grant permissions again
5. **Expected**: Second account appears in list below first account
6. **Verify**:
   - ✅ Both accounts visible in list
   - ✅ Can toggle default account radio buttons
   - ✅ Each account can be disconnected independently

**Result**: ☐ PASS | ☐ FAIL  
**Notes**: _________________________

---

#### **Iteration 3 of 5: Set Different Default Account**
**Goal**: Verify default account selection works

1. In accounts list, select radio button for second account
2. **Expected**: Second account radio becomes selected
3. Refresh page (Ctrl+R)
4. **Expected**: Second account still marked as default
5. **Verify**:
   - ✅ Default selection persists across page refresh
   - ✅ Send Email dialogs use this account by default

**Result**: ☐ PASS | ☐ FAIL  
**Notes**: _________________________

---

#### **Iteration 4 of 5: Disconnect and Reconnect Account**
**Goal**: Verify account management (disconnect/reconnect)

1. Click **"Disconnect"** button on one of the accounts
2. **Expected**: Confirmation dialog appears asking to confirm disconnect
3. Click **"Confirm Disconnect"**
4. **Expected**: Account is removed from list
5. Click **"Connect Gmail Account"** button
6. Complete OAuth flow again with same account
7. **Expected**: Account reappears in list

**Result**: ☐ PASS | ☐ FAIL  
**Notes**: _________________________

---

#### **Iteration 5 of 5: Multiple Accounts with Last Sync Info**
**Goal**: Verify account metadata display

1. Ensure at least 2 accounts are connected
2. **Verify for each account**:
   - ✅ Email address displayed
   - ✅ Connection date shown (format: YYYY-MM-DD)
   - ✅ Last sync time shown (if synced)
   - ✅ Default account indicator displayed

3. Open any Send Email dialog:
   - Click quotation "📧 Send Email" button
4. **Verify**:
   - ✅ All connected accounts appear in "From Account" dropdown
   - ✅ Default account is pre-selected
   - ✅ Can switch between accounts

**Result**: ☐ PASS | ☐ FAIL  
**Notes**: _________________________

---

## TEST PATH 2: Send Email via Quotation (5x Testing)

### Objective
Verify that users can send quotations via email with proper formatting.

### Prerequisites
- At least 1 Gmail account connected (from Test Path 1)
- Quotations exist in the system
- User has access to Quotations module

### Test Steps (Repeat 5 Times)

#### **Iteration 1 of 5: Send Basic Quotation Email**
**Goal**: Verify basic quotation email sending works

1. Navigate to **Quotations** → **Outgoing** tab
2. **Verify**: Quotations list displayed with documents
3. Locate a quotation row with **"📧 Send Email"** button
4. Click **"📧 Send Email"** button
5. **Expected**: SendEmailDialog opens with:
   - Title: "Quotation [number]"
   - "From Account" dropdown populated with connected accounts
   - Empty "Recipient Email" field
   - Default subject line pre-filled

6. Enter recipient email: `test@example.com`
7. Enter recipient name (optional): `John Doe`
8. Click **"Send Email"** button
9. **Expected**: 
   - ✅ Loading spinner appears (3-5 seconds)
   - ✅ Success message: "Email sent successfully!"
   - ✅ Dialog closes after 2 seconds

10. **Verify**:
    - ✅ No errors in browser console
    - ✅ Page remains responsive
    - ✅ Can send another email immediately

**Result**: ☐ PASS | ☐ FAIL  
**Notes**: _________________________

---

#### **Iteration 2 of 5: Send with Custom Message**
**Goal**: Verify custom messages can be added to quotations

1. Click **"📧 Send Email"** on a different quotation
2. Fill in:
   - Recipient Email: `customrecipient@example.com`
   - Recipient Name: `Jane Smith`
   - Subject: Custom subject
   - Message: `Please see the attached quotation. Looking forward to your feedback!`

3. Click **"Send Email"**
4. **Expected**:
   - ✅ Sends successfully with custom message
   - ✅ Custom message included in email body
   - ✅ Quotation document attached/embedded

**Result**: ☐ PASS | ☐ FAIL  
**Notes**: _________________________

---

#### **Iteration 3 of 5: Switch Email Account Mid-Send**
**Goal**: Verify account switching works before sending

1. Click **"📧 Send Email"** on another quotation
2. In "From Account" dropdown, select a different account
3. Fill recipient email and click **"Send Email"**
4. **Expected**:
   - ✅ Email sent from selected account
   - ✅ No errors when switching accounts
   - ✅ Can verify in email history which account sent it

**Result**: ☐ PASS | ☐ FAIL  
**Notes**: _________________________

---

#### **Iteration 4 of 5: Email Validation**
**Goal**: Verify email input validation

1. Click **"📧 Send Email"** on a quotation
2. Try sending with **invalid emails**:
   - Enter: `notanemail`
   - Click "Send Email"
   - **Expected**: Error message: "Invalid recipient email address"
   - **Verify**: Send button is disabled

3. Try with **empty recipient**:
   - Leave recipient email empty
   - **Expected**: Send button remains disabled

4. Enter **valid email**, send succeeds
5. **Result**: ☐ PASS | ☐ FAIL  
**Notes**: _________________________

---

#### **Iteration 5 of 5: Bundle Multiple Sends**
**Goal**: Verify rapid sequential sends work

1. Select 3 different quotations
2. Send email from each one in sequence:
   - First quotation: Send to `recipient1@example.com`
   - Second quotation: Send to `recipient2@example.com`
   - Third quotation: Send to `recipient3@example.com`

3. **Verify**:
   - ✅ All three succeed without errors
   - ✅ Dialog closes and reopens successfully each time
   - ✅ No data loss or corruption

**Result**: ☐ PASS | ☐ FAIL  
**Notes**: _________________________

---

## TEST PATH 3: Send Email via Order (Incoming) (5x Testing)

### Objective
Verify that sellers can send email confirmations for incoming orders from buyers.

### Prerequisites
- At least 1 Gmail account connected
- Incoming orders exist in the system
- Orders have "📧 Email" button visible

### Test Steps (Repeat 5 Times)

#### **Iteration 1 of 5: Send Basic Order Confirmation**
**Goal**: Verify incoming order email sending

1. Navigate to **Orders** → **Incoming** tab
2. Locate an incoming order row
3. Click **"📧 Email"** button in the order row
4. **Expected**:
   - SendEmailDialog opens
   - Title shows: "Order [ID]"
   - Document type: "order"

5. Enter recipient email and click **"Send Email"**
6. **Expected**:
   - ✅ Email sends successfully
   - ✅ Success message displays
   - ✅ Dialog closes

7. **Verify**:
   - ✅ Order details included in email
   - ✅ Buyer information visible in email
   - ✅ Order date and items listed

**Result**: ☐ PASS | ☐ FAIL  
**Notes**: _________________________

---

#### **Iteration 2 of 5: Send with Order Details**
**Goal**: Verify complete order information in email

1. Click **"📧 Email"** on different incoming order
2. View dialog preview - verify:
   - ✅ Order ID displayed
   - ✅ Buyer name shown
   - ✅ Order total price visible
   - ✅ Current order status shown

3. Add custom message: `Your order has been received and is being processed. We'll ship within 24 hours.`
4. Send email
5. **Verify**: Custom message included along with order details

**Result**: ☐ PASS | ☐ FAIL  
**Notes**: _________________________

---

#### **Iteration 3 of 5: Multiple Incoming Orders**
**Goal**: Verify can send from multiple incoming orders

1. Send emails from 3 different incoming orders:
   - Order 1: Send to buyer's email from system
   - Order 2: Send to custom email address
   - Order 3: Send with custom message

2. **Verify**:
   - ✅ All three send successfully
   - ✅ Each email has unique order information
   - ✅ No cross-contamination of data

**Result**: ☐ PASS | ☐ FAIL  
**Notes**: _________________________

---

#### **Iteration 4 of 5: Order Status Preservation**
**Goal**: Verify sending email doesn't change order status

1. Note an order's current status before sending
2. Send email for that order
3. Verify order status hasn't changed
4. **Expected**:
   - ✅ Order remains in same status (e.g., "pending")
   - ✅ No automatic status update
   - ✅ Email history logged separately

**Result**: ☐ PASS | ☐ FAIL  
**Notes**: _________________________

---

#### **Iteration 5 of 5: Rapid Order Email Sends**
**Goal**: Verify system handles multiple rapid sends

1. Select 5 different incoming orders
2. Send emails from each in rapid succession (no waiting between sends)
3. **Verify**:
   - ✅ All emails send successfully
   - ✅ No timeout errors
   - ✅ No duplicate sends
   - ✅ System remains responsive

**Result**: ☐ PASS | ☐ FAIL  
**Notes**: _________________________

---

## TEST PATH 4: Send Email via Order (Outgoing) (5x Testing)

### Objective
Verify that buyers can send emails with their outgoing orders to sellers.

### Prerequisites
- Same prerequisites as Test Path 3
- Outgoing orders exist in system
- Orders visible in "Outgoing" tab

### Test Steps (Repeat 5 Times)

#### **Iteration 1 of 5: Send Purchase Order to Seller**
**Goal**: Verify outgoing order email functionality

1. Navigate to **Orders** → **Outgoing** tab
2. Locate an outgoing order row
3. Click **"📧 Email"** button
4. **Expected**:
   - SendEmailDialog opens
   - Title: "Order [ID]"
   - From account: connected Gmail account

5. Enter seller email address
6. Click **"Send Email"**
7. **Expected**:
   - ✅ Email sends successfully
   - ✅ Seller receives purchase order

**Result**: ☐ PASS | ☐ FAIL  
**Notes**: _________________________

---

#### **Iteration 2 of 5: Include Purchase Order Details**
**Goal**: Verify all order information included

1. Click **"📧 Email"** on outgoing order
2. View preview - **Verify**:
   - ✅ Order ID clearly displayed
   - ✅ Seller name/company shown
   - ✅ Items and quantities listed
   - ✅ Total price shown
   - ✅ Delivery address if applicable

3. Add message: `Please confirm receipt of this purchase order. Let us know if you have any questions about quantities or specifications.`
4. Send
5. **Verify**: Message included in seller email

**Result**: ☐ PASS | ☐ FAIL  
**Notes**: _________________________

---

#### **Iteration 3 of 5: Multiple Outgoing Orders**
**Goal**: Verify multiple vendor communications

1. Send emails from 3 different outgoing orders to different sellers/vendors
2. **Verify**:
   - ✅ Each email goes to correct seller
   - ✅ Seller information correctly displayed
   - ✅ No data mixing between orders

**Result**: ☐ PASS | ☐ FAIL  
**Notes**: _________________________

---

#### **Iteration 4 of 5: Custom Seller Email**
**Goal**: Verify can send to custom seller emails

1. Click **"📧 Email"** on outgoing order
2. In recipient email, enter a seller's email that's different from system default
3. Send email
4. **Verify**:
   - ✅ Email received at custom address
   - ✅ No validation errors
   - ✅ Full order details sent

**Result**: ☐ PASS | ☐ FAIL  
**Notes**: _________________________

---

#### **Iteration 5 of 5: Batch Outgoing Order Emails**
**Goal**: Verify sending to multiple sellers at once (sequential)

1. Send purchase order emails to 4 different sellers:
   - Order to Seller A with standard message
   - Order to Seller B with custom message
   - Order to Seller C with standard message
   - Order to Seller D with custom message

2. **Verify**:
   - ✅ All 4 arrive successfully
   - ✅ Each has correct order details
   - ✅ Custom messages applied correctly
   - ✅ System doesn't crash or slow down

**Result**: ☐ PASS | ☐ FAIL  
**Notes**: _________________________

---

## TEST PATH 5: Email Template Selection (5x Testing)

### Objective
Verify that all 4 email templates work correctly and can be selected.

### Prerequisites
- At least 1 Gmail account connected
- Access to send email dialog (from any document type)
- EmailTemplates component loaded

### Test Steps (Repeat 5 Times)

#### **Iteration 1 of 5: Professional Template**
**Goal**: Verify professional template works

1. Open Send Email dialog (any document)
2. Click on **"Professional"** template (if shown in dialog)
3. **Expected**:
   - ✅ Purple gradient header (#667eea → #764ba2)
   - ✅ "Document Submission" title
   - ✅ Formal greeting "Dear {recipientName}"
   - ✅ Bordered info box with document details
   - ✅ Professional closing

4. Send email with this template
5. **Verify**:
   - ✅ Template renders correctly in HTML
   - ✅ Variables substituted: {recipientName}, {senderName}, {currentDate}
   - ✅ Email sends without formatting errors

**Result**: ☐ PASS | ☐ FAIL  
**Notes**: _________________________

---

#### **Iteration 2 of 5: Casual Template**
**Goal**: Verify casual/friendly template

1. Open new Send Email dialog
2. Select **"Casual"** template
3. **Expected**:
   - ✅ Pink/red gradient header (#f093fb → #f5576c)
   - ✅ Emoji usage (👋, 📎, 💙)
   - ✅ Friendly greeting "Hey there!"
   - ✅ Yellow info box instead of gray
   - ✅ Casual tone in message

4. Send email
5. **Verify**:
   - ✅ Emojis render correctly
   - ✅ Casual formatting preserved in email client
   - ✅ Colors display correctly

**Result**: ☐ PASS | ☐ FAIL  
**Notes**: _________________________

---

#### **Iteration 3 of 5: Formal Template**
**Goal**: Verify formal/legal template

1. Open Send Email dialog (different document)
2. Select **"Formal"** template
3. **Expected**:
   - ✅ Dark blue corporate header
   - ✅ "OFFICIAL SUBMISSION" text
   - ✅ Traditional serif fonts
   - ✅ Structured table with document metadata
   - ✅ "Respectfully submitted" closing
   - ✅ Confidentiality notice in footer

4. Complete email send
5. **Verify**:
   - ✅ Legal/formal tone preserved
   - ✅ All required legal language present
   - ✅ Footer displays correctly

**Result**: ☐ PASS | ☐ FAIL  
**Notes**: _________________________

---

#### **Iteration 4 of 5: Personalized Template**
**Goal**: Verify personalized/relationship template

1. Open Send Email dialog (another document)
2. Select **"Personalized"** template
3. **Expected**:
   - ✅ Colorful gradient header
   - ✅ ✨ Sparkle emoji "Shared with You"
   - ✅ Warm personal greeting with 👋 emoji
   - ✅ "What's inside" 📄 section
   - ✅ "Need more info?" suggestion box
   - ✅ 💙 heart emoji in closing

4. Send email
5. **Verify**:
   - ✅ Personalized tone comes through
   - ✅ Colorful design renders properly
   - ✅ Relationship-building language present

**Result**: ☐ PASS | ☐ FAIL  
**Notes**: _________________________

---

#### **Iteration 5 of 5: Template Switching**
**Goal**: Verify can switch between all templates

1. Open Send Email dialog
2. **Switch through each template in sequence**:
   - Professional → Preview
   - Click Casual → Preview updates
   - Click Formal → Preview updates
   - Click Personalized → Preview updates
   - Back to Professional → Preview updates

3. **Verify**:
   - ✅ Template preview updates instantly
   - ✅ No loading delays
   - ✅ Can switch back and forth freely
   - ✅ Selection is not "sticky"

4. Select Professional template and send
5. **Verify**:
   - ✅ Email sent with correct template format
   - ✅ All variables properly substituted
   - ✅ Formatting matches template design

**Result**: ☐ PASS | ☐ FAIL  
**Notes**: _________________________

---

## TEST PATH 6: Email Template Variable Substitution

### Objective (Bonus: Not part of 5x but recommended)
Verify that email template variables are correctly substituted.

**Variables to Verify**:
- {recipientName} → Actual recipient name from form
- {senderName} → Connected email account owner name
- {currentDate} → Today's date in correct format
- {documentType} → quotation/order/invoice
- {documentTitle} → Document number/title

### Quick Check
1. Open any Send Email dialog with a template
2. Fill in form:
   - Recipient Email: `test@example.com`
   - Recipient Name: `Sarah Johnson`
   - Subject: Test subject
3. Send
4. **Verify in received email**:
   - All variables replaced with actual values
   - Date formatted correctly (YYYY-MM-DD or MM/DD/YYYY)
   - No remaining {variable} placeholders

---

## TEST PATH 7: Integration Tests (Bonus)

### Combined Workflow Test
1. **Connect Gmail Account** (Test Path 1, Iteration 1)
2. **Send Quotation Email** (Test Path 2, Iteration 1)
3. **Send Incoming Order Email** (Test Path 3, Iteration 1)
4. **Send Outgoing Order Email** (Test Path 4, Iteration 1)
5. **Use Different Template for Each** (Test Path 5)

**Expected**: 
- ✅ All 4 emails send successfully
- ✅ Gmail inbox receives all 4 emails
- ✅ System remains stable throughout

**Result**: ☐ PASS | ☐ FAIL

---

## Summary & Results

### Overall Test Status
- **Total Paths Tested**: 5 main paths + 1 bonus
- **Total Iterations**: 25+ test iterations
- **Pass Rate Target**: 100% (all tests pass)
- **Critical Failures**: ☐ 0 | Acceptable Failures: ☐ 0

### Test Execution Status
Mark as you complete:

- [ ] **Path 1**: OAuth Connection (5/5 complete) - Status: ☐ PASS | ☐ FAIL
- [ ] **Path 2**: Quotation Emails (5/5 complete) - Status: ☐ PASS | ☐ FAIL
- [ ] **Path 3**: Incoming Order Emails (5/5 complete) - Status: ☐ PASS | ☐ FAIL
- [ ] **Path 4**: Outgoing Order Emails (5/5 complete) - Status: ☐ PASS | ☐ FAIL
- [ ] **Path 5**: Template Selection (5/5 complete) - Status: ☐ PASS | ☐ FAIL
- [ ] **Path 6**: Variable Substitution - Status: ☐ PASS | ☐ FAIL
- [ ] **Path 7**: Integration Test - Status: ☐ PASS | ☐ FAIL

### Bugs Found
Enter any bugs discovered during testing:
1. 
2.
3.
4.
5.

### Performance Notes
- Slowest operation: __________________ (milliseconds)
- Fastest operation: __________________ (milliseconds)
- Any timeouts? ☐ Yes | ☐ No

### Recommendations
- Use Professional template for B2B communications
- Use Casual template for partnership/friendly communications
- Use Formal template for government/legal submissions
- Use Personalized template for relationship building

---

## Deployment Next Steps

Once all tests pass (100% success rate):

1. ✅ **Deploy to Firebase**: `firebase deploy --only functions`
2. ✅ **Test on Production Domain**: https://platform-sale-and-procurement.firebaseapp.com
3. ✅ **Enable in Production Settings**: Activate email feature for all users
4. ✅ **Monitor Email Logs**: Check Firestore `emailHistory` collection
5. ✅ **Setup Email Notifications**: Configure auto-responses if needed

---

**Testing Date**: _______________  
**Tester Name**: _______________  
**Test Environment**: localhost:5174  
**Browser**: _______ v._______  
**Status**: ☐ Development | ☐ Staging | ☐ Production
