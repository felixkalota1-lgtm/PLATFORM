// Accounting Service with TypeScript Interfaces and Mock Data

export interface Account {
  id: string;
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  balance: number;
  currency: string;
  status: 'active' | 'inactive';
  description: string;
  lastModified: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  amountPaid: number;
  tax: number;
  status: 'draft' | 'sent' | 'overdue' | 'paid' | 'cancelled';
  items: InvoiceItem[];
  notes: string;
  terms: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Bill {
  id: string;
  billNumber: string;
  vendorName: string;
  vendorEmail: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  amountPaid: number;
  tax: number;
  status: 'draft' | 'received' | 'approved' | 'overdue' | 'paid' | 'cancelled';
  items: BillItem[];
  notes: string;
  purchaseOrder?: string;
}

export interface BillItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Expense {
  id: string;
  expenseNumber: string;
  category: string;
  amount: number;
  date: string;
  description: string;
  paymentMethod: 'cash' | 'credit card' | 'check' | 'bank transfer' | 'other';
  status: 'pending' | 'approved' | 'paid' | 'reimbursed';
  attachmentCount: number;
  submittedBy: string;
  approvedBy?: string;
  notes: string;
}

export interface FinancialReport {
  id: string;
  type: 'balance sheet' | 'income statement' | 'cash flow' | 'trial balance';
  period: string;
  startDate: string;
  endDate: string;
  generatedDate: string;
  totalAssets?: number;
  totalLiabilities?: number;
  totalEquity?: number;
  totalRevenue?: number;
  totalExpenses?: number;
  netIncome?: number;
  status: 'draft' | 'finalized';
}

export interface BankTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  balance: number;
  reconciled: boolean;
  reference: string;
  accountName: string;
}

// Mock Data - REMOVED: Use actual backend/Firestore integration
// All mock arrays have been removed for production use

// Service Methods
// TODO: Connect to actual Firestore database or backend API
class AccountingService {
  async getAccounts(): Promise<Account[]> {
    return Promise.resolve([]);
  }

  async getInvoices(): Promise<Invoice[]> {
    return Promise.resolve([]);
  }

  async getBills(): Promise<Bill[]> {
    return Promise.resolve([]);
  }

  async getExpenses(): Promise<Expense[]> {
    return Promise.resolve([]);
  }

  async getFinancialReports(): Promise<FinancialReport[]> {
    return Promise.resolve([]);
  }

  async getBankTransactions(): Promise<BankTransaction[]> {
    return Promise.resolve([]);
  }

  async searchInvoices(query: string): Promise<Invoice[]> {
    return Promise.resolve([]);
  }

  async searchBills(query: string): Promise<Bill[]> {
    return Promise.resolve([]);
  }

  async getAccountsTotal(): Promise<number> {
    return Promise.resolve(0);
  }
}

export default new AccountingService();
