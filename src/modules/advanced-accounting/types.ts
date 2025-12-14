export interface Journal {
  id: string;
  companyId: string;
  date: Date;
  description: string;
  entries: JournalEntry[];
  total: number;
  status: 'draft' | 'posted' | 'reconciled';
  createdBy: string;
  createdAt: Date;
}

export interface JournalEntry {
  id: string;
  accountId: string;
  accountName: string;
  debit: number;
  credit: number;
  description: string;
}

export interface GeneralLedger {
  id: string;
  companyId: string;
  accountId: string;
  accountName: string;
  accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  opening: number;
  debit: number;
  credit: number;
  closing: number;
  period: string; // e.g., "2024-01" for January 2024
}

export interface TrialBalance {
  id: string;
  companyId: string;
  period: string;
  generatedDate: Date;
  accounts: {
    accountId: string;
    accountName: string;
    accountType: string;
    debit: number;
    credit: number;
  }[];
  totalDebit: number;
  totalCredit: number;
  balanced: boolean;
}

export interface FinancialStatement {
  id: string;
  companyId: string;
  type: 'income-statement' | 'balance-sheet' | 'cash-flow';
  period: string;
  generatedDate: Date;
  data: any;
}

export interface BudgetAllocation {
  id: string;
  companyId: string;
  department: string;
  category: string;
  allocatedAmount: number;
  spentAmount: number;
  period: string;
  status: 'on-track' | 'at-risk' | 'exceeded';
}

export interface PaymentReconciliation {
  id: string;
  companyId: string;
  invoiceId: string;
  amountPaid: number;
  paymentMethod: 'bank-transfer' | 'cheque' | 'cash' | 'card' | 'credit';
  paymentDate: Date;
  bankAccount: string;
  status: 'pending' | 'cleared' | 'cancelled';
  referenceNumber: string;
}

export interface TaxCalculation {
  id: string;
  companyId: string;
  period: string;
  taxableIncome: number;
  taxRate: number;
  totalTax: number;
  deductions: { type: string; amount: number }[];
  status: 'calculated' | 'filed' | 'paid';
}

export interface DeprecationSchedule {
  id: string;
  companyId: string;
  assetId: string;
  assetName: string;
  purchaseDate: Date;
  originalCost: number;
  salvageValue: number;
  usefulLife: number;
  depreciationMethod: 'straight-line' | 'declining-balance' | 'units-of-production';
  annualDepreciation: number;
  accumulatedDepreciation: number;
  bookValue: number;
}
