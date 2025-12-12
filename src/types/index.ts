// Type definitions for the entire application

export interface User {
  id: string;
  email: string;
  companyId: string;
  role: 'admin' | 'manager' | 'staff' | 'vendor' | 'buyer';
  department?: 'sales' | 'procurement' | 'hr' | 'accounting' | 'warehouse' | 'logistics';
  permissions: string[];
  createdAt: Date;
}

export interface Company {
  id: string;
  name: string;
  registrationNumber: string;
  industry: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  logo?: string;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  sku: string;
  category: string;
  price: number;
  cost: number;
  quantity: number;
  reorderLevel: number;
  images: string[];
  aiGeneratedDescription?: string;
  aiGeneratedImages?: string[];
  vendorId: string;
  companyId: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  vendorId: string;
}

export interface Inquiry {
  id: string;
  buyerId: string;
  sellerId: string;
  productIds: string[];
  message: string;
  status: 'pending' | 'responded' | 'ordered' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface Quote {
  id: string;
  inquiryId: string;
  sellerId: string;
  items: { productId: string; quantity: number; price: number }[];
  totalPrice: number;
  validUntil: Date;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
}

export interface Order {
  id: string;
  quoteId: string;
  buyerId: string;
  sellerId: string;
  items: { productId: string; quantity: number; price: number }[];
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: string;
  trackingId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WarehouseLocation {
  id: string;
  companyId: string;
  warehouseId: string;
  zone: string;
  aisle: string;
  shelf: string;
  bin: string;
  productId: string;
  quantity: number;
}

export interface Vehicle {
  id: string;
  companyId: string;
  make: string;
  model: string;
  licensePlate: string;
  status: 'available' | 'in-transit' | 'maintenance';
  location?: { lat: number; lng: number };
  lastServiceDate: Date;
  spareParts: SparePart[];
}

export interface SparePart {
  id: string;
  vehicleId: string;
  name: string;
  replacementInterval: { distance?: number; time?: number };
  lastReplaced: Date;
  nextDue: Date;
}

export interface Employee {
  id: string;
  companyId: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  position: string;
  salary: number;
  joinDate: Date;
  contractStart: Date;
  contractEnd: Date;
  status: 'active' | 'inactive' | 'on-leave';
}

export interface Attendance {
  id: string;
  employeeId: string;
  date: Date;
  checkIn: Date;
  checkOut?: Date;
  hoursWorked: number;
}

export interface CompanyDocument {
  id: string;
  companyId: string;
  title: string;
  type: string;
  expiryDate: Date;
  fileUrl: string;
  status: 'valid' | 'expiring-soon' | 'expired';
  createdAt: Date;
}

export interface JobPosting {
  id: string;
  companyId: string;
  title: string;
  description: string;
  department: string;
  experience: string;
  salary?: { min: number; max: number };
  benefits: string[];
  status: 'open' | 'closed';
  createdAt: Date;
  expiryDate: Date;
}

export interface Invoice {
  id: string;
  companyId: string;
  orderId: string;
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  items: { description: string; quantity: number; unitPrice: number }[];
}

export interface Message {
  id: string;
  senderId: string;
  recipientId?: string;
  teamId?: string;
  content: string;
  attachments?: string[];
  createdAt: Date;
  readAt?: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'inquiry' | 'quote' | 'order' | 'document-expiry' | 'contract-expiry' | 'message' | 'system';
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: Date;
}

export interface AnalyticsData {
  id: string;
  companyId: string;
  date: Date;
  totalSales: number;
  totalOrders: number;
  topProducts: { productId: string; quantity: number; revenue: number }[];
  totalInventoryValue: number;
  activeInquiries: number;
  pendingQuotes: number;
}
