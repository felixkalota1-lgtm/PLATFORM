export interface SalesQuotation {
  id: string;
  tenantId: string;
  quotationNumber: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  productId?: string;
  productName: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  discount?: number;
  discountType?: 'percentage' | 'fixed';
  finalAmount: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  validUntil?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
