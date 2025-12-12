// Procurement Types

export interface ProcurementRequest {
  id: string
  requestNumber: string
  title: string
  description: string
  requester: {
    id: string
    name: string
    department: string
    email: string
  }
  lineItems: ProcurementLineItem[]
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'ordered' | 'received' | 'cancelled'
  budget: number
  estimatedCost: number
  approvalLevel: number
  approvalHistory: ApprovalStep[]
  createdAt: Date
  updatedAt: Date
  dueDate?: Date
  priority: 'low' | 'medium' | 'high' | 'urgent'
}

export interface ProcurementLineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
  category: string
  specification?: string
  deliveryDate?: Date
}

export interface ApprovalStep {
  stepNumber: number
  approverRole: string
  approverName: string
  status: 'pending' | 'approved' | 'rejected'
  comments?: string
  approvedAt?: Date
}

export interface RFQ {
  id: string
  rfqNumber: string
  procurementRequestId: string
  vendors: RFQVendor[]
  lineItems: ProcurementLineItem[]
  issueDate: Date
  dueDate: Date
  status: 'draft' | 'sent' | 'received' | 'evaluated' | 'closed'
  evaluationCriteria: EvaluationCriteria[]
  selectedVendor?: string
}

export interface RFQVendor {
  vendorId: string
  vendorName: string
  email: string
  responseDate?: Date
  responseStatus: 'pending' | 'submitted' | 'accepted' | 'rejected'
  quotedPrice?: number
  leadTime?: number
  paymentTerms?: string
}

export interface EvaluationCriteria {
  id: string
  name: string
  weight: number // 0-100
  description: string
}

export interface PurchaseOrder {
  id: string
  poNumber: string
  procurementRequestId: string
  rfqId: string
  vendorId: string
  vendorName: string
  lineItems: ProcurementLineItem[]
  subtotal: number
  tax: number
  total: number
  shippingAddress: Address
  paymentTerms: string
  deliveryDate: Date
  status: 'draft' | 'confirmed' | 'shipped' | 'received' | 'invoiced' | 'paid'
  createdAt: Date
  updatedAt: Date
}

export interface Address {
  street: string
  city: string
  state: string
  zipCode: string
  country: string
}

export interface ProcurementAnalytics {
  totalRequests: number
  averageProcessingTime: number
  totalSpent: number
  pendingApprovals: number
  topCategories: { category: string; count: number }[]
  vendorPerformance: {
    vendorId: string
    vendorName: string
    orderCount: number
    onTimeDelivery: number
    qualityRating: number
  }[]
}
