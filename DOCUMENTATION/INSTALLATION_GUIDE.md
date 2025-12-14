# 📦 COMPLETE INSTALLATION & SETUP GUIDE

**For:** Platform Sales & Procurement Marketplace - Enterprise Edition  
**Date:** December 12, 2025

---

## 🚀 QUICK START - INSTALL ALL REQUIRED PACKAGES

### **Step 1: Run These Commands in Order**

```bash
# Navigate to project
cd "c:\Users\Administrator\Platform Sales & Procurement"

# Install all packages at once
npm install openai anthropic ai @google-cloud/vision konva react-konva leaflet react-leaflet socket.io-client firebase-messaging jsPDF html2canvas react-pdf react-dropzone react-big-calendar decimal.js currency.js twilio winston react-chat-ui emoji-picker-react geolocation-utils great-circle-distance

# Or install in groups if you prefer:

# Group 1: AI & LLM Services
npm install openai anthropic ai @google-cloud/vision

# Group 2: 2D Mapping & GPS
npm install konva react-konva leaflet react-leaflet geolocation-utils great-circle-distance

# Group 3: Real-time & Notifications
npm install socket.io-client firebase-messaging twilio

# Group 4: Documents & Finance
npm install jsPDF html2canvas react-pdf react-dropzone decimal.js currency.js

# Group 5: UI Components
npm install react-big-calendar react-chat-ui emoji-picker-react

# Group 6: Logging & Monitoring
npm install winston
```

### **Step 2: Verify Installation**

```bash
npm list | grep -E "openai|anthropic|konva|leaflet|socket"
```

---

## 🔑 API KEYS YOU'LL NEED

### **1. OpenAI API Key** (For image generation & validation)
- Sign up: https://platform.openai.com/signup
- Create API key: https://platform.openai.com/api-keys
- Cost: ~$0.02-0.10 per image
- Models: GPT-4 Vision, DALL-E 3

### **2. Anthropic API Key** (For Claude - Alternative)
- Sign up: https://www.anthropic.com/
- Get API key: https://console.anthropic.com/
- Better for: Data validation, structured output

### **3. Google Cloud Vision** (Optional - Image recognition)
- Setup: https://cloud.google.com/vision/docs/setup
- Cost: ~$1.50 per 1000 images

### **4. Twilio** (For SMS/WhatsApp notifications)
- Sign up: https://www.twilio.com/
- Get credentials from: https://console.twilio.com/
- Cost: ~$0.0075 per SMS

---

## 📁 CREATE .ENV.LOCAL FILE

Create file: `c:\Users\Administrator\Platform Sales & Procurement\.env.local`

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# AI Services
VITE_OPENAI_API_KEY=sk-...
VITE_ANTHROPIC_API_KEY=sk-ant-...
VITE_GOOGLE_VISION_API_KEY=...

# Twilio (SMS/WhatsApp)
VITE_TWILIO_ACCOUNT_SID=AC...
VITE_TWILIO_AUTH_TOKEN=...
VITE_TWILIO_PHONE_NUMBER=+1...

# App Configuration
VITE_APP_URL=http://localhost:5173
VITE_API_BASE_URL=http://localhost:5173/api
```

---

## 🔧 FIREBASE CONFIGURATION CHECKLIST

### **In Firebase Console (https://console.firebase.google.com):**

#### **1. Create Firestore Database**
- [ ] Project Settings → Create Firestore
- [ ] Start in "Test Mode" (for development)
- [ ] Location: "nam5" (multi-region)

#### **2. Enable Cloud Storage**
- [ ] Storage → "Get Started"
- [ ] Location: "us-central1"
- [ ] Test Mode initially

#### **3. Set Up Cloud Functions**
- [ ] Functions → "Get Started"
- [ ] Create function for:
  - [ ] Process Excel uploads
  - [ ] Generate product images
  - [ ] Send email notifications
  - [ ] Calculate analytics

#### **4. Enable Cloud Messaging**
- [ ] Project Settings → Cloud Messaging
- [ ] Copy Server API Key
- [ ] Generate private key JSON

#### **5. Create Security Rules**

**Firestore Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Companies collection - multi-tenant
    match /companies/{companyId} {
      allow create: if request.auth != null;
      allow read, update, delete: if request.auth.token.companyId == companyId
        || request.auth.token.role == 'admin';
    }
    
    match /companies/{companyId}/{document=**} {
      allow read, write: if request.auth.token.companyId == companyId;
    }
    
    // Public marketplace products
    match /marketplace_products/{productId} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.role == 'seller' 
        && request.auth.token.companyId == resource.data.companyId;
    }
    
    // Communications - cross-company
    match /communications/{docId} {
      allow read, write: if request.auth.uid in resource.data.participants;
    }
  }
}
```

**Storage Rules:**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Company documents
    match /companies/{companyId}/{allPaths=**} {
      allow read, write: if request.auth.token.companyId == companyId;
    }
    
    // Public product images
    match /products/{productId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth.token.role == 'seller';
    }
  }
}
```

---

## 🎯 MODIFIED FILES & NEW SERVICES TO CREATE

### **New Files to Create:**

#### **1. src/services/aiService.ts** (AI Integration)
```typescript
import { OpenAI } from 'openai';
import { Anthropic } from '@anthropic-ai/sdk';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
});

export const aiService = {
  // Generate product images
  generateProductImage: async (description: string) => {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: `Professional product image: ${description}`,
      n: 1,
      size: '1024x1024',
    });
    return response.data[0].url;
  },

  // Validate Excel data with Claude
  validateExcelData: async (data: any) => {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Validate this product data and suggest corrections:\n${JSON.stringify(data)}`,
        },
      ],
    });
    return message.content;
  },

  // Smart product categorization
  categorizeProduct: async (name: string, description: string) => {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: `Categorize this product:\nName: ${name}\nDescription: ${description}\nReturn only category name.`,
        },
      ],
    });
    return message.content[0].type === 'text' ? message.content[0].text : 'General';
  },
};
```

#### **2. src/services/warehouseService.ts** (2D Mapping)
```typescript
export interface Warehouse {
  id: string;
  name: string;
  width: number;
  height: number;
  aisles: Aisle[];
  bins: Bin[];
  locations: WarehouseLocation[];
}

export interface Aisle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  shelves: Shelf[];
}

export interface Shelf {
  id: string;
  aisleId: string;
  level: number;
  bins: string[];
}

export interface Bin {
  id: string;
  x: number;
  y: number;
  productId?: string;
  quantity: number;
}

export interface WarehouseLocation {
  binId: string;
  productId: string;
  sku: string;
  quantity: number;
  lastUpdated: Date;
}

export const warehouseService = {
  createWarehouse: (data: Warehouse) => {
    // Store in Firestore
  },
  
  updateBinLocation: (binId: string, productId: string, quantity: number) => {
    // Update Firestore
  },
  
  getProductLocation: (productId: string) => {
    // Query Firestore for location
  },
};
```

#### **3. src/services/notificationService.ts** (Real-time Notifications)
```typescript
import * as messaging from 'firebase/messaging';
import { initializeApp } from 'firebase/app';

export const notificationService = {
  // Request notification permission
  requestPermission: async () => {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  },

  // Send push notification
  sendPushNotification: (title: string, options: any) => {
    if ('Notification' in window) {
      new Notification(title, options);
    }
  },

  // Subscribe to real-time updates
  subscribeToInquiries: (companyId: string, callback: (data: any) => void) => {
    // Use Socket.io or Firebase Realtime
  },

  // Send email via Twilio or Firebase Functions
  sendEmail: async (to: string, subject: string, body: string) => {
    // Firebase Function call
  },
};
```

#### **4. src/services/gpsService.ts** (Logistics Tracking)
```typescript
export interface Vehicle {
  id: string;
  name: string;
  licensePlate: string;
  currentLocation: {
    latitude: number;
    longitude: number;
    lastUpdated: Date;
  };
  route: RoutePoint[];
  maintenanceHistory: Maintenance[];
}

export interface Maintenance {
  id: string;
  component: string;
  replacedDate: Date;
  nextDueDate: Date;
  dueDistance?: number;
}

export const gpsService = {
  trackVehicle: (vehicleId: string) => {
    // Real-time GPS tracking
  },

  calculateETA: (from: LatLng, to: LatLng) => {
    // Calculate delivery ETA
  },

  checkMaintenanceDue: (vehicle: Vehicle) => {
    // Check if maintenance is overdue
  },

  optimizeRoute: (vehicles: Vehicle[], stops: LatLng[]) => {
    // Calculate optimal delivery route
  },
};
```

#### **5. src/services/documentService.ts** (Document Management)
```typescript
export interface CompanyDocument {
  id: string;
  name: string;
  type: 'contract' | 'license' | 'insurance' | 'policy';
  uploadDate: Date;
  expiryDate: Date;
  fileUrl: string;
  status: 'active' | 'expiring_soon' | 'expired';
  assignedTo: string[];
}

export const documentService = {
  uploadDocument: (file: File, expiryDate: Date) => {
    // Upload to Cloud Storage
  },

  checkExpiringDocuments: (companyId: string, daysWarning: number = 30) => {
    // Query documents expiring soon
  },

  sendRenewalReminder: (document: CompanyDocument) => {
    // Send email to assigned users
  },

  archiveExpiredDocuments: (companyId: string) => {
    // Move expired docs to archive
  },
};
```

---

## 📊 UPDATED PACKAGE.JSON

Add these to your package.json dependencies section:

```json
{
  "dependencies": {
    "openai": "^4.32.0",
    "anthropic": "^0.16.0",
    "ai": "^2.0.0",
    "@google-cloud/vision": "^4.5.0",
    "konva": "^9.2.0",
    "react-konva": "^18.2.10",
    "leaflet": "^1.9.4",
    "react-leaflet": "^4.2.3",
    "socket.io-client": "^4.7.2",
    "firebase-messaging": "^0.13.0",
    "jsPDF": "^2.5.1",
    "html2canvas": "^1.4.1",
    "react-pdf": "^7.7.0",
    "react-dropzone": "^14.2.3",
    "react-big-calendar": "^1.8.5",
    "decimal.js": "^10.4.3",
    "currency.js": "^2.0.4",
    "twilio": "^4.10.0",
    "winston": "^3.11.0",
    "react-chat-ui": "^1.0.5",
    "emoji-picker-react": "^4.5.16",
    "geolocation-utils": "^2.0.0",
    "great-circle-distance": "^1.0.0"
  }
}
```

---

## ✅ VERIFICATION CHECKLIST

After installation, verify:

- [ ] `npm list` shows all packages installed
- [ ] No peer dependency warnings
- [ ] `.env.local` file created with API keys
- [ ] Firebase console has all services enabled
- [ ] Security rules deployed to Firestore & Storage
- [ ] Cloud Functions created (or ready to deploy)
- [ ] App still builds: `npm run build`
- [ ] App still runs: `npm run dev`

---

## 🚀 READY TO PROCEED?

Once you confirm all packages are installed, I will:

1. ✅ Create complete AI integration layer
2. ✅ Build bulk Excel upload with validation
3. ✅ Implement 2D warehouse mapping UI
4. ✅ Set up real-time communication
5. ✅ Build GPS tracking for logistics
6. ✅ Create document management system
7. ✅ Implement HR/Payroll workflows
8. ✅ Build accounting/invoice module
9. ✅ Add compliance tracking
10. ✅ Complete all 9 business modules

**Estimated total development time:** 40-60 hours

**Ready to install packages and proceed?** 🚀

