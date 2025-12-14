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

// Mock Data
const mockAccounts: Account[] = [
  {
    id: '1',
    code: '1000',
    name: 'Cash',
    type: 'asset',
    balance: 125000,
    currency: 'USD',
    status: 'active',
    description: 'Operating cash account',
    lastModified: '2025-12-14',
  },
  {
    id: '2',
    code: '1100',
    name: 'Accounts Receivable',
    type: 'asset',
    balance: 85000,
    currency: 'USD',
    status: 'active',
    description: 'Amounts due from customers',
    lastModified: '2025-12-14',
  },
  {
    id: '3',
    code: '1500',
    name: 'Equipment',
    type: 'asset',
    balance: 250000,
    currency: 'USD',
    status: 'active',
    description: 'Office and production equipment',
    lastModified: '2025-12-10',
  },
  {
    id: '4',
    code: '2000',
    name: 'Accounts Payable',
    type: 'liability',
    balance: 45000,
    currency: 'USD',
    status: 'active',
    description: 'Amounts owed to vendors',
    lastModified: '2025-12-14',
  },
  {
    id: '5',
    code: '3000',
    name: 'Owner Equity',
    type: 'equity',
    balance: 400000,
    currency: 'USD',
    status: 'active',
    description: 'Owner capital contribution',
    lastModified: '2025-12-01',
  },
  {
    id: '6',
    code: '4000',
    name: 'Sales Revenue',
    type: 'revenue',
    balance: 250000,
    currency: 'USD',
    status: 'active',
    description: 'Product and service sales',
    lastModified: '2025-12-14',
  },
  {
    id: '7',
    code: '5000',
    name: 'Cost of Goods Sold',
    type: 'expense',
    balance: 100000,
    currency: 'USD',
    status: 'active',
    description: 'Direct product costs',
    lastModified: '2025-12-14',
  },
  {
    id: '8',
    code: '5500',
    name: 'Operating Expenses',
    type: 'expense',
    balance: 75000,
    currency: 'USD',
    status: 'active',
    description: 'General business operations',
    lastModified: '2025-12-13',
  },
];

const mockInvoices: Invoice[] = [
  {
    id: '1',
    invoiceNumber: 'INV-2025-001',
    clientName: 'Tech Solutions Inc',
    clientEmail: 'billing@techsolutions.com',
    issueDate: '2025-12-01',
    dueDate: '2025-12-31',
    amount: 15000,
    amountPaid: 15000,
    tax: 1500,
    status: 'paid',
    items: [
      {
        id: '1',
        description: 'Procurement System Development',
        quantity: 1,
        unitPrice: 15000,
        total: 15000,
      },
    ],
    notes: 'Professional services - Development',
    terms: 'Net 30',
  },
  {
    id: '2',
    invoiceNumber: 'INV-2025-002',
    clientName: 'Global Industries',
    clientEmail: 'ap@globalindustries.com',
    issueDate: '2025-12-05',
    dueDate: '2026-01-05',
    amount: 22500,
    amountPaid: 0,
    tax: 2250,
    status: 'sent',
    items: [
      {
        id: '1',
        description: 'Inventory Management Module',
        quantity: 1,
        unitPrice: 22500,
        total: 22500,
      },
    ],
    notes: 'Software licensing and support',
    terms: 'Net 30',
  },
  {
    id: '3',
    invoiceNumber: 'INV-2025-003',
    clientName: 'Enterprise Corp',
    clientEmail: 'finance@enterprisecorp.com',
    issueDate: '2025-11-15',
    dueDate: '2025-12-15',
    amount: 8500,
    amountPaid: 0,
    tax: 850,
    status: 'overdue',
    items: [
      {
        id: '1',
        description: 'Consulting Services - 20 hours',
        quantity: 20,
        unitPrice: 425,
        total: 8500,
      },
    ],
    notes: 'Business process consulting',
    terms: 'Net 30',
  },
  {
    id: '4',
    invoiceNumber: 'INV-2025-004',
    clientName: 'Digital Ventures',
    clientEmail: 'billing@digitalventures.com',
    issueDate: '2025-12-10',
    dueDate: '2026-01-10',
    amount: 12000,
    amountPaid: 5000,
    tax: 1200,
    status: 'sent',
    items: [
      {
        id: '1',
        description: 'HR Management System',
        quantity: 1,
        unitPrice: 12000,
        total: 12000,
      },
    ],
    notes: 'Full HR module implementation',
    terms: 'Net 30',
  },
];

const mockBills: Bill[] = [
  {
    id: '1',
    billNumber: 'BILL-2025-001',
    vendorName: 'Cloud Services Provider',
    vendorEmail: 'billing@cloudservices.com',
    issueDate: '2025-12-01',
    dueDate: '2025-12-31',
    amount: 3000,
    amountPaid: 3000,
    tax: 300,
    status: 'paid',
    items: [
      {
        id: '1',
        description: 'Cloud Hosting - December 2025',
        quantity: 1,
        unitPrice: 3000,
        total: 3000,
      },
    ],
    notes: 'Monthly cloud infrastructure',
    purchaseOrder: 'PO-2025-001',
  },
  {
    id: '2',
    billNumber: 'BILL-2025-002',
    vendorName: 'Office Supplies Co',
    vendorEmail: 'sales@officesupplies.com',
    issueDate: '2025-12-05',
    dueDate: '2026-01-05',
    amount: 1250,
    amountPaid: 0,
    tax: 125,
    status: 'approved',
    items: [
      {
        id: '1',
        description: 'Office Equipment & Supplies',
        quantity: 1,
        unitPrice: 1250,
        total: 1250,
      },
    ],
    notes: 'Furniture and stationery',
    purchaseOrder: 'PO-2025-002',
  },
  {
    id: '3',
    billNumber: 'BILL-2025-003',
    vendorName: 'Business Insurance Inc',
    vendorEmail: 'accounts@businessinsurance.com',
    issueDate: '2025-12-01',
    dueDate: '2025-12-20',
    amount: 5000,
    amountPaid: 0,
    tax: 500,
    status: 'overdue',
    items: [
      {
        id: '1',
        description: 'General Liability Insurance - Q4',
        quantity: 1,
        unitPrice: 5000,
        total: 5000,
      },
    ],
    notes: 'Quarterly insurance premium',
    purchaseOrder: 'PO-2025-003',
  },
  {
    id: '4',
    billNumber: 'BILL-2025-004',
    vendorName: 'Software Licenses Ltd',
    vendorEmail: 'billing@softwarelicenses.com',
    issueDate: '2025-12-10',
    dueDate: '2026-01-10',
    amount: 2500,
    amountPaid: 0,
    tax: 250,
    status: 'received',
    items: [
      {
        id: '1',
        description: 'Software Licenses Renewal',
        quantity: 1,
        unitPrice: 2500,
        total: 2500,
      },
    ],
    notes: 'Development tools and utilities',
    purchaseOrder: 'PO-2025-004',
  },
];

const mockExpenses: Expense[] = [
  {
    id: '1',
    expenseNumber: 'EXP-2025-001',
    category: 'Travel',
    amount: 850,
    date: '2025-12-10',
    description: 'Client meeting - Flight & Hotel',
    paymentMethod: 'credit card',
    status: 'reimbursed',
    attachmentCount: 3,
    submittedBy: 'John Anderson',
    approvedBy: 'David Thompson',
    notes: 'Business development trip',
  },
  {
    id: '2',
    expenseNumber: 'EXP-2025-002',
    category: 'Meals & Entertainment',
    amount: 275,
    date: '2025-12-12',
    description: 'Team lunch meeting',
    paymentMethod: 'cash',
    status: 'reimbursed',
    attachmentCount: 1,
    submittedBy: 'Sarah Mitchell',
    approvedBy: 'David Thompson',
    notes: 'Department strategy session',
  },
  {
    id: '3',
    expenseNumber: 'EXP-2025-003',
    category: 'Office Supplies',
    amount: 145,
    date: '2025-12-11',
    description: 'Printer ink and paper stock',
    paymentMethod: 'credit card',
    status: 'approved',
    attachmentCount: 2,
    submittedBy: 'Michael Chen',
    approvedBy: 'David Thompson',
    notes: 'Monthly office supplies',
  },
  {
    id: '4',
    expenseNumber: 'EXP-2025-004',
    category: 'Professional Development',
    amount: 500,
    date: '2025-12-08',
    description: 'Accounting software training course',
    paymentMethod: 'bank transfer',
    status: 'pending',
    attachmentCount: 1,
    submittedBy: 'David Thompson',
    notes: 'Professional certification training',
  },
];

const mockReports: FinancialReport[] = [
  {
    id: '1',
    type: 'balance sheet',
    period: 'December 2025',
    startDate: '2025-01-01',
    endDate: '2025-12-14',
    generatedDate: '2025-12-14',
    totalAssets: 460000,
    totalLiabilities: 45000,
    totalEquity: 415000,
    status: 'draft',
  },
  {
    id: '2',
    type: 'income statement',
    period: 'December 2025',
    startDate: '2025-01-01',
    endDate: '2025-12-14',
    generatedDate: '2025-12-14',
    totalRevenue: 250000,
    totalExpenses: 175000,
    netIncome: 75000,
    status: 'draft',
  },
];

const mockTransactions: BankTransaction[] = [
  {
    id: '1',
    date: '2025-12-14',
    description: 'Invoice INV-2025-001 Payment',
    amount: 16500,
    type: 'credit',
    balance: 125000,
    reconciled: true,
    reference: 'INV-2025-001',
    accountName: 'Main Operating Account',
  },
  {
    id: '2',
    date: '2025-12-12',
    description: 'BILL-2025-001 Payment',
    amount: 3300,
    type: 'debit',
    balance: 108500,
    reconciled: true,
    reference: 'BILL-2025-001',
    accountName: 'Main Operating Account',
  },
  {
    id: '3',
    date: '2025-12-10',
    description: 'Payroll Processing',
    amount: 42500,
    type: 'debit',
    balance: 111800,
    reconciled: true,
    reference: 'PAYROLL-DEC',
    accountName: 'Main Operating Account',
  },
  {
    id: '4',
    date: '2025-12-08',
    description: 'Invoice INV-2025-002 Payment',
    amount: 24750,
    type: 'credit',
    balance: 154300,
    reconciled: false,
    reference: 'INV-2025-002',
    accountName: 'Main Operating Account',
  },
];

// Service Methods
class AccountingService {
  async getAccounts(): Promise<Account[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockAccounts), 300);
    });
  }

  async getInvoices(): Promise<Invoice[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockInvoices), 300);
    });
  }

  async getBills(): Promise<Bill[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockBills), 300);
    });
  }

  async getExpenses(): Promise<Expense[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockExpenses), 300);
    });
  }

  async getFinancialReports(): Promise<FinancialReport[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockReports), 300);
    });
  }

  async getBankTransactions(): Promise<BankTransaction[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockTransactions), 300);
    });
  }

  async searchInvoices(query: string): Promise<Invoice[]> {
    return Promise.resolve(
      mockInvoices.filter((inv) =>
        inv.invoiceNumber.toLowerCase().includes(query.toLowerCase()) ||
        inv.clientName.toLowerCase().includes(query.toLowerCase())
      )
    );
  }

  async searchBills(query: string): Promise<Bill[]> {
    return Promise.resolve(
      mockBills.filter((bill) =>
        bill.billNumber.toLowerCase().includes(query.toLowerCase()) ||
        bill.vendorName.toLowerCase().includes(query.toLowerCase())
      )
    );
  }

  async getAccountsTotal(): Promise<number> {
    return Promise.resolve(
      mockAccounts.reduce((sum, acc) => {
        if (acc.type === 'asset') return sum + acc.balance;
        if (acc.type === 'revenue') return sum + acc.balance;
        return sum;
      }, 0)
    );
  }
}

export default new AccountingService();
