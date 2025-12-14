# Firebase Services Setup - Complete Checklist

## 📋 Current Status
- **Project**: platform-sale-and-procurement
- **Status**: Ready for service configuration
- **Region**: us-central1 (default)

---

## ✅ Services to Enable in Firebase Console

### 1. **Authentication** (PRIORITY: HIGH)
**Status**: ⏳ Need to enable

**Setup Steps:**
```
1. Go to Firebase Console > Authentication
2. Click "Get Started"
3. Enable "Email/Password" provider
4. Enable "Anonymous" (optional, for testing)
5. Configure custom claims for roles
```

**Why needed:**
- User login/registration
- Session management
- Role-based access control

---

### 2. **Firestore Database** (PRIORITY: HIGH)
**Status**: ⏳ Need to create

**Setup Steps:**
```
1. Go to Firebase Console > Firestore Database
2. Click "Create Database"
3. Choose region: us-central1
4. Start in "Test mode" (development only!)
5. Click "Enable"
6. Create these collections:
   - users
   - companies
   - products
   - orders
   - inquiries
   - quotes
   - employees
   - shipments
   - invoices
   - notifications
```

**Security Rules (for production):**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Company data visible to company members
    match /companies/{companyId} {
      allow read: if request.auth.token.company == companyId;
      allow write: if request.auth.token.role == 'admin';
    }
    
    // Products visible to all
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth.token.company == resource.data.companyId;
    }
    
    // Add similar rules for other collections
  }
}
```

---

### 3. **Cloud Storage** (PRIORITY: HIGH)
**Status**: ⏳ Need to create

**Setup Steps:**
```
1. Go to Firebase Console > Storage
2. Click "Get Started"
3. Choose region: us-central1
4. Start in "Test mode"
5. Create folder structure:
   /products/images/
   /products/bulk-uploads/
   /invoices/
   /contracts/
   /employee-docs/
   /warehouse-maps/
```

**Security Rules:**
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Products folder - public read, user write
    match /products/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // User uploads - private
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

---

### 4. **Cloud Functions** (PRIORITY: MEDIUM)
**Status**: ⏳ Not yet deployed

**What to create:**
```
Functions needed:
├── processProductBulkUpload()
│   └── Read Excel → Generate images → Add to Firestore
│
├── generateProductImages()
│   └── Use Gemini API to create product images
│
├── processInquiry()
│   └── Notify seller → Create notification
│
├── processOrder()
│   └── Validate → Update inventory → Send notifications
│
├── checkDocumentExpiry()
│   └── Daily cron → Notify expiring documents
│
├── checkContractExpiry()
│   └── Daily cron → Notify expiring contracts
│
├── generateAnalytics()
│   └── Daily cron → Calculate metrics
│
└── notificationHandler()
    └── Publish to Pub/Sub → Send to users
```

**Deploy command:**
```bash
npm install -g firebase-tools
firebase init functions
firebase deploy --only functions
```

---

### 5. **Pub/Sub** (PRIORITY: MEDIUM)
**Status**: ⏳ Not yet configured

**Topics to create:**
```
1. order-notifications
2. quotation-updates
3. inventory-alerts
4. document-expiry
5. contract-expiry
6. inquiry-received
7. payment-received
8. shipment-updates
```

**Setup:**
```
1. Go to Google Cloud Console
2. Search "Cloud Pub/Sub"
3. Create topic for each above
4. Subscribe Cloud Functions to topics
```

---

### 6. **Cloud Scheduler** (PRIORITY: MEDIUM)
**Status**: ⏳ Not yet configured

**Cron Jobs needed:**
```
1. Check document expiry
   Schedule: 0 8 * * * (daily at 8 AM)
   Function: checkDocumentExpiry()

2. Check contract expiry
   Schedule: 0 8 * * * (daily at 8 AM)
   Function: checkContractExpiry()

3. Generate daily analytics
   Schedule: 0 23 * * * (daily at 11 PM)
   Function: generateAnalytics()

4. Cleanup old notifications
   Schedule: 0 2 * * 0 (weekly at 2 AM)
   Function: cleanupOldNotifications()
```

---

### 7. **Extensions** (PRIORITY: LOW - Optional)

Useful Firebase Extensions:
```
1. Firestore Add Picture
   - Auto-generate thumbnails
   - Resize images

2. Stripe Payments
   - Process payments
   - Manage subscriptions

3. Sendgrid Email
   - Send transactional emails
   - Mass email campaigns
```

**Install:** Firebase Console > Extensions > Browse > Search > Install

---

## 🤖 AI Services Setup

### Google Gemini API (Recommended)
**For**: Auto-generating product descriptions

```
1. Go to makersuite.google.com/app/apikey
2. Click "Get API Key"
3. Copy key
4. Add to .env.local:
   VITE_GEMINI_API_KEY=sk-...
```

**Usage in code:**
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(
  import.meta.env.VITE_GEMINI_API_KEY
);

const model = genAI.getGenerativeModel({ model: "gemini-pro" });

const result = await model.generateContent(
  "Generate product description for: " + productName
);
```

### Google Cloud Vision API
**For**: Product image analysis

```
1. Enable in Google Cloud Console
2. Create service account
3. Download JSON key
4. Store securely in Cloud Storage
5. Reference in Cloud Functions
```

### Vertex AI (Optional)
**For**: Advanced image generation

```
1. Enable in Google Cloud Console
2. Use from Cloud Functions
3. Costs apply after free tier
```

---

## 📊 Data Structure Ready

Your Firestore will have these collections:

```
users/
├── User ID
│   ├── email: string
│   ├── company_id: string (reference)
│   ├── role: 'admin' | 'manager' | 'staff' | 'vendor' | 'buyer'
│   ├── permissions: array
│   └── created_at: timestamp

companies/
├── Company ID
│   ├── name: string
│   ├── registration_number: string
│   ├── industry: string
│   ├── address: string
│   ├── bank_details: object
│   └── logo_url: string

products/
├── Product ID
│   ├── name: string
│   ├── description: string
│   ├── ai_generated_description: string
│   ├── sku: string
│   ├── category: string
│   ├── price: number
│   ├── cost: number
│   ├── quantity: number
│   ├── reorder_level: number
│   ├── images: array
│   ├── ai_generated_images: array
│   ├── vendor_id: string (reference)
│   ├── company_id: string (reference)
│   ├── is_published: boolean
│   └── updated_at: timestamp

orders/
├── Order ID
│   ├── quote_id: string (reference)
│   ├── buyer_id: string (reference)
│   ├── seller_id: string (reference)
│   ├── items: array
│   ├── total_price: number
│   ├── status: string
│   ├── tracking_id: string
│   ├── shipping_address: string
│   └── timestamps: object

employees/
├── Employee ID
│   ├── company_id: string (reference)
│   ├── first_name: string
│   ├── last_name: string
│   ├── email: string
│   ├── department: string
│   ├── salary: number
│   ├── contract_start: timestamp
│   ├── contract_end: timestamp
│   ├── status: string
│   └── documents: array (with expiry_date)
```

---

## 🔒 Security Checklist

Before going to production:

- [ ] Update all Firestore security rules
- [ ] Update Cloud Storage security rules
- [ ] Enable authentication required for API access
- [ ] Implement rate limiting
- [ ] Enable Cloud Audit Logging
- [ ] Setup backup strategy
- [ ] Configure CORS properly
- [ ] Use environment variables for secrets
- [ ] Enable 2FA for admin accounts
- [ ] Regular security review

---

## 💰 Cost Optimization

**Free tier includes:**
- Authentication: Up to 1,000 users
- Firestore: 1 GB storage, 50K reads/day
- Cloud Storage: 5 GB storage
- Cloud Functions: 2 million invocations/month
- Cloud Pub/Sub: 10 GB/month

**To stay in free tier:**
- Optimize queries (composite indexes)
- Use caching layer (Redis)
- Batch operations
- Delete old data regularly
- Monitor usage in Firebase Console

---

## 📈 Scaling Considerations

As you grow:

1. **Database**: Partition collections by company_id
2. **Storage**: Use CDN for image delivery
3. **Functions**: Use different regions
4. **Caching**: Implement Redis layer
5. **Analytics**: Use BigQuery for large datasets

---

## 🚀 Quick Setup Order

**Phase 1 (Day 1):**
1. ✅ Enable Authentication
2. ✅ Create Firestore Database
3. ✅ Setup Cloud Storage

**Phase 2 (Day 2-3):**
4. Get Gemini API key
5. Deploy initial Cloud Functions

**Phase 3 (Day 4+):**
6. Setup Pub/Sub topics
7. Configure Cloud Scheduler
8. Optimize security rules

---

## ❓ Help

- Firebase Docs: https://firebase.google.com/docs
- Google Cloud Console: https://console.cloud.google.com
- Gemini API: https://makersuite.google.com
- Cloud Functions: https://firebase.google.com/docs/functions

---

**Next Action**: Go to https://console.firebase.google.com and start enabling services!
