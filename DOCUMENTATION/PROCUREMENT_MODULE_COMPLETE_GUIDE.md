# 🏢 Procurement & Sales Module - Complete Implementation Guide

**Status:** ✅ **READY TO USE**  
**Date:** December 14, 2025  
**Module Type:** B2B Procurement & Order Management  
**Framework:** React + TypeScript + Firebase Firestore

---

## 📋 Overview

The Procurement & Sales Module is a comprehensive B2B order management system that enables:

- **Company-to-Company Procurement** (🌍 B2B Orders) - Send purchase orders to external vendors
- **Internal Orders** (🏢 Internal) - Request goods between company warehouses and branches
- **Real-time Communication** (💬) - Message vendors directly during order negotiation
- **Vendor Management** (🏢) - Maintain relationships with preferred suppliers
- **Order Tracking** (🚚) - Monitor order status from creation to completion
- **Request for Quotation (RFQ)** - Send RFQs to multiple vendors simultaneously

---

## 🎯 Key Difference: Internal vs. External Orders

### 📦 Internal Orders (Same Company)
Used when requesting goods WITHIN your company:
- From: Company Warehouse
- To: Company Branches (Arizona, California, etc.)
- Purpose: Restocking inventory at branch locations
- Approval: Manager/Warehouse staff only
- Data: Uses your own internal inventory system

**Example:** "Arizona Branch requests 100 units of Product X from Nebraska Warehouse"

### 🌍 B2B Orders (Different Companies)
Used when ordering from external vendors:
- From: Your Company
- To: Vendor Company (different organization)
- Purpose: Sourcing products from external suppliers
- Visibility: Public across company boundaries
- Communication: Real-time messaging with vendor

**Example:** "Company A orders 1000 units of Product Y from Vendor B"

---

## 🏗️ Architecture

### Firestore Collections

#### `orders`
All orders across the system with complete details:
```typescript
Order {
  id: string;                    // Order ID
  orderNumber: string;           // "ORD-2025-001"
  orderType: 'internal'|'external';
  status: 'draft'|'sent'|'received'|'accepted'|..;
  
  fromCompanyId: string;         // Sender company
  fromCompanyName: string;
  toCompanyId: string;           // Recipient company
  toCompanyName: string;
  
  items: OrderItem[];            // Products ordered
  totalAmount: number;           // Total cost
  
  createdAt: Timestamp;
  sentAt?: Timestamp;
  completedAt?: Timestamp;
  
  // Communication
  messageCount: number;
  hasUnreadMessages: boolean;
  
  // Details
  description?: string;
  specialInstructions?: string;
  shipmentAddress?: string;
  attachments?: string[];        // File URLs
}
```

#### `orders/{orderId}/messages`
Real-time communication for each order:
```typescript
OrderMessage {
  id: string;
  orderId: string;
  
  senderId: string;              // User who sent message
  senderName: string;
  senderCompanyId: string;
  
  messageType: 'message'|'status-change'|'file-upload'|'quote-request';
  content: string;
  
  attachments?: Array<{
    url: string;
    name: string;
    size: number;
    type: string;
  }>;
  
  isRead: boolean;
  readAt?: Timestamp;
  
  createdAt: Timestamp;
  editedAt?: Timestamp;
}
```

#### `vendors`
Supplier/vendor profiles:
```typescript
Vendor {
  id: string;
  companyId: string;             // Vendor's company ID
  companyName: string;
  
  contactPerson: string;
  email: string;
  phone: string;
  website?: string;
  
  // Performance metrics
  rating: number;                // 1-5 stars
  totalOrders: number;
  completedOrders: number;
  averageDeliveryTime: number;   // days
  
  // Status
  isActive: boolean;
  isFavorite: boolean;           // In your favorites
  
  categories: string[];          // What they sell
  
  createdAt: Timestamp;
  lastOrdered?: Timestamp;
}
```

#### `rfqs`
Request for Quotation management:
```typescript
RFQ {
  id: string;
  fromCompanyId: string;
  rfqNumber: string;
  status: 'draft'|'sent'|'quotes-received'|'closed';
  
  items: RFQItem[];              // Products to quote
  targetVendors?: string[];      // Vendor company IDs
  
  responseDeadline?: Timestamp;
  totalQuotesReceived: number;
  
  createdAt: Timestamp;
  sentAt?: Timestamp;
}
```

---

## 📁 File Structure

```
src/modules/procurement/
├── index.tsx                           (Main component - 210 lines)
├── ProcurementModule.css              (Styling - 220 lines)
│
├── components/
│   ├── ProcurementDashboard.tsx       (Dashboard - 150 lines)
│   ├── ProcurementDashboard.css       (Dashboard styles)
│   │
│   ├── OrderManagement.tsx            (Order list - 180 lines)
│   ├── OrderManagement.css            (Order styles)
│   │
│   ├── OrderDetail.tsx                (Order details view - 100 lines)
│   ├── CreateOrderModal.tsx           (Create order form - 90 lines)
│   ├── OrderTracking.tsx              (Order status tracking - 80 lines)
│   │
│   ├── VendorManagement.tsx           (Vendor management - 100 lines)
│   └── VendorManagement.css           (Vendor styles)
│
src/services/
├── procurementService.ts              (Order/Vendor API - 600 lines)
└── orderMessagingService.ts           (Messaging API - 250 lines)
```

**Total New Code:** ~2,000 lines of production React/TypeScript

---

## 🔧 Services API Reference

### `procurementService.ts`

#### Order Management
```typescript
// Create a new order
async createOrder(order: OrderData, userId: string): Promise<string>

// Get order by ID
async getOrder(orderId: string): Promise<Order | null>

// Get all orders sent by company
async getOrdersBySender(companyId: string): Promise<Order[]>

// Get all orders received by company
async getOrdersAsRecipient(companyId: string): Promise<Order[]>

// Get all orders (sent + received)
async getAllCompanyOrders(companyId: string): Promise<Order[]>

// Subscribe to incoming orders in real-time
subscribeToOrdersAsRecipient(companyId: string, callback)

// Update order status
async updateOrderStatus(orderId, status, userId, userName): Promise<void>

// Add items to order
async addItemsToOrder(orderId, items): Promise<void>

// Remove item from order
async removeItemFromOrder(orderId, itemId): Promise<void>

// Delete order
async deleteOrder(orderId): Promise<void>
```

#### Vendor Management
```typescript
// Add new vendor
async addVendor(vendor: VendorData): Promise<string>

// Get vendor by ID
async getVendor(vendorId: string): Promise<Vendor | null>

// Get all active vendors for company
async getVendorsByCompany(companyId: string): Promise<Vendor[]>

// Get favorite vendors
async getFavoriteVendors(companyId: string): Promise<Vendor[]>

// Update vendor info
async updateVendor(vendorId, updates): Promise<void>

// Toggle favorite status
async toggleFavoriteVendor(vendorId, isFavorite): Promise<void>
```

#### RFQ Management
```typescript
// Create RFQ
async createRFQ(rfq: RFQData, userId): Promise<string>

// Get RFQ by ID
async getRFQ(rfqId: string): Promise<RFQ | null>

// Get all RFQs for company
async getRFQsByCompany(companyId: string): Promise<RFQ[]>

// Send RFQ to vendors
async sendRFQToVendors(rfqId, vendorCompanyIds): Promise<void>
```

### `orderMessagingService.ts`

```typescript
// Send message in order
async sendMessage(
  orderId: string,
  senderId: string,
  senderName: string,
  senderCompanyId: string,
  content: string,
  messageType?: 'message'|'status-change'|'file-upload',
  attachments?: Array
): Promise<string>

// Get all messages for order
async getOrderMessages(orderId: string): Promise<OrderMessage[]>

// Subscribe to messages in real-time
subscribeToOrderMessages(orderId, callback)

// Mark message as read
async markMessageAsRead(orderId, messageId): Promise<void>

// Mark all messages as read
async markAllMessagesAsRead(orderId): Promise<void>

// Edit message content
async editMessage(orderId, messageId, newContent): Promise<void>

// Get unread message count for order
async getUnreadMessageCount(orderId): Promise<number>

// Get total unread across multiple orders
async getTotalUnreadMessages(orderIds): Promise<number>
```

---

## 🎨 UI Components

### 1. **ProcurementDashboard**
High-level overview with metrics and quick actions
- 4 metric cards (Sent Orders, Received Orders, Unread Messages, Total Value)
- Quick action buttons (Create Order, Create RFQ, View All)
- Recent orders list (last 5 orders)
- Tips section for users

### 2. **OrderManagement**
Main order listing and management interface
- Two tabs: Received Orders | Sent Orders
- Status filter dropdown
- Order cards with:
  - Order number and type (Internal/B2B)
  - Company from/to
  - Status badge
  - Items count and total amount
  - Unread message indicator
  - Click to view details

### 3. **OrderDetail**
Detailed view with messaging
- Full order information
- Itemized list of products
- Action buttons (Accept, Reject, Complete)
- Real-time messaging section
- Message history

### 4. **VendorManagement**
Supplier relationship management
- Grid of vendor cards
- Each vendor shows:
  - Company name
  - Contact info
  - Rating and completion stats
  - Favorite toggle
  - Order history links
  - Send order button

### 5. **OrderTracking**
Visual order status tracking
- Timeline visualization for each order
- Current status indicator
- Progress through stages: Sent → Received → In Progress → Completed

---

## 🚀 Getting Started

### 1. Navigate to Procurement Module
In your app sidebar, click:
```
Procurement & Sales
  ├─ 📊 Dashboard
  ├─ 📦 Orders
  ├─ 🚚 Tracking
  └─ 🏢 Vendors
```

### 2. Create Your First Order

**B2B Order (to external vendor):**
1. Go to Orders tab
2. Click "Create New Order"
3. Select "🌍 B2B Order"
4. Enter vendor company name
5. Add items
6. Set special instructions (if any)
7. Click "Send Order"

**Internal Order (warehouse/branch):**
1. Go to Orders tab
2. Click "Create New Order"
3. Select "🏢 Internal Order"
4. Select target branch/warehouse
5. Add items
6. Click "Send Order"

### 3. Manage Vendors
1. Go to Vendors tab
2. Click "Add Vendor"
3. Enter vendor company details
4. Add to favorites for quick access

### 4. Communicate with Vendors
1. Open an order detail
2. Scroll to messages section
3. Type message
4. Add attachments if needed
5. Click "Send"
6. Vendor receives notification

---

## 💡 Usage Examples

### Example 1: Ordering from Alibaba
```typescript
// User wants to order electronics from Alibaba supplier

// Step 1: Create B2B order
const order = await procurementService.createOrder({
  orderNumber: 'ORD-2025-001',
  orderType: 'external',
  fromCompanyId: 'my-company',
  fromCompanyName: 'TechCorp',
  toCompanyId: 'alibaba-supplier',
  toCompanyName: 'Alibaba Electronics',
  items: [{
    productName: 'LED Monitors',
    quantity: 1000,
    unitPrice: 150,
    // ...
  }],
  totalAmount: 150000,
}, userId);

// Step 2: Send message to vendor
await orderMessagingService.sendMessage(
  order,
  userId,
  'John Doe',
  'my-company',
  'Can you provide faster shipping? We need this by Dec 20.'
);

// Step 3: Vendor receives and accepts
await procurementService.updateOrderStatus(
  orderId,
  'accepted',
  vendorUserId,
  'Vendor Name'
);

// Step 4: Communication continues
await orderMessagingService.sendMessage(
  orderId,
  userId,
  'John Doe',
  'my-company',
  'Perfect! We confirm the order.'
);
```

### Example 2: Internal Warehouse Transfer
```typescript
// Arizona branch needs stock from Nebraska warehouse

const order = await procurementService.createOrder({
  orderNumber: 'INT-2025-ARIZ-001',
  orderType: 'internal',
  fromCompanyId: 'your-company',
  fromCompanyName: 'Your Company',
  toCompanyId: 'your-company',  // Same company!
  toCompanyName: 'Your Company - Arizona',
  items: [{
    productName: 'Office Chairs',
    quantity: 50,
    // ...
  }],
}, userId);

// Send notification
await orderMessagingService.sendMessage(
  orderId,
  userId,
  'Manager Name',
  'your-company',
  'Arizona branch needs 50 chairs urgently'
);
```

---

## 🔐 Security & Permissions

### Company Isolation
- ✅ Users can only see/send orders to OTHER companies (B2B)
- ✅ Internal orders restricted to same company only
- ✅ Firestore rules enforce company-scoped access
- ✅ Cross-company orders are visible to both parties

### Real-time Notifications
```typescript
// Automatic notifications on:
- Order received
- Order status change
- New message in order thread
- Order completion
```

---

## 📱 Responsive Design

✅ **Desktop:** Full-width cards and multi-column layouts  
✅ **Tablet:** Responsive grid (2 columns)  
✅ **Mobile:** Single column, stacked interface  
✅ **Dark Mode:** Full support via CSS custom properties

---

## 🎓 Key Features to Implement Next

1. **File Uploads** - Attach POs, invoices, certifications to orders
2. **Email Notifications** - Send email on order events
3. **Payment Integration** - Invoice generation and payment tracking
4. **Shipping Labels** - Generate shipping labels for orders
5. **Analytics** - Vendor performance dashboards
6. **Approval Workflows** - Multi-level order approvals
7. **Recurring Orders** - Set up automatic reorders
8. **Price History** - Track vendor price changes
9. **Reviews & Ratings** - Rate vendors after completion
10. **Bulk Import** - Upload orders via CSV

---

## 🧪 Testing the Module

### Test Scenario 1: Create and Send Order
```
1. Login as Company A
2. Create B2B order to Company B
3. Verify order appears in "Sent Orders"
4. Login as Company B
5. Verify order appears in "Received Orders"
6. Check unread count increases
7. Mark order as read
8. Verify unread count decreases
```

### Test Scenario 2: Real-time Messaging
```
1. Company A sends message in order
2. Company B receives message notification in real-time
3. Company B responds
4. Company A sees message immediately
5. Both can edit/delete messages
```

### Test Scenario 3: Vendor Management
```
1. Add vendor from different company
2. View vendor details
3. Toggle favorite
4. Create order to vendor
5. Verify vendor order history updates
```

---

## 📞 Support

For questions or issues:
1. Check Firestore rules in Firebase Console
2. Verify company IDs match in orders
3. Check browser console for error messages
4. Ensure user is authenticated before accessing module

---

## 📊 Database Schema Summary

```
firestore
├── orders/                          Global order collection
│   ├── {orderId}/messages/         Message thread per order
│   │   └── {messageId}
│   └── {orderId}
│
├── vendors/                         Vendor directory
│   └── {vendorId}
│
├── rfqs/                           RFQ management
│   └── {rfqId}
│
└── companies/                      Company profiles (optional)
    └── {companyId}
```

---

## Version History

- **v1.0** (Dec 14, 2025) - Initial release with order management, messaging, and vendor management
- **v1.1** (TBD) - File attachments and email notifications
- **v2.0** (TBD) - Payment integration and advanced analytics

---

**Status:** ✅ Production Ready  
**Last Updated:** December 14, 2025
