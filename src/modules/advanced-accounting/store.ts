import { create } from 'zustand';
import {
  Journal,
  GeneralLedger,
  TrialBalance,
  FinancialStatement,
  BudgetAllocation,
  PaymentReconciliation,
  TaxCalculation,
  DeprecationSchedule,
} from './types';

interface AdvancedAccountingStore {
  journals: Journal[];
  generalLedgers: GeneralLedger[];
  trialBalances: TrialBalance[];
  financialStatements: FinancialStatement[];
  budgets: BudgetAllocation[];
  reconciliations: PaymentReconciliation[];
  taxCalculations: TaxCalculation[];
  depreciationSchedules: DeprecationSchedule[];

  // Journal actions
  createJournal: (journal: Journal) => void;
  updateJournal: (id: string, journal: Partial<Journal>) => void;
  postJournal: (id: string) => void;

  // General Ledger actions
  updateGeneralLedger: (id: string, ledger: Partial<GeneralLedger>) => void;

  // Trial Balance actions
  generateTrialBalance: (trialBalance: TrialBalance) => void;

  // Financial Statement actions
  generateFinancialStatement: (statement: FinancialStatement) => void;

  // Budget actions
  allocateBudget: (budget: BudgetAllocation) => void;
  updateBudgetSpent: (budgetId: string, spentAmount: number) => void;

  // Reconciliation actions
  createReconciliation: (reconciliation: PaymentReconciliation) => void;
  updateReconciliation: (id: string, reconciliation: Partial<PaymentReconciliation>) => void;

  // Tax actions
  calculateTax: (taxCalc: TaxCalculation) => void;

  // Depreciation actions
  createDepreciationSchedule: (schedule: DeprecationSchedule) => void;
}

export const useAdvancedAccountingStore = create<AdvancedAccountingStore>((set) => ({
  journals: [],
  generalLedgers: [],
  trialBalances: [],
  financialStatements: [],
  budgets: [],
  reconciliations: [],
  taxCalculations: [],
  depreciationSchedules: [],

  createJournal: (journal) => set((state) => ({ journals: [...state.journals, journal] })),
  updateJournal: (id, journal) =>
    set((state) => ({
      journals: state.journals.map((j) => (j.id === id ? { ...j, ...journal } : j)),
    })),
  postJournal: (id) =>
    set((state) => ({
      journals: state.journals.map((j) =>
        j.id === id ? { ...j, status: 'posted' } : j
      ),
    })),

  updateGeneralLedger: (id, ledger) =>
    set((state) => ({
      generalLedgers: state.generalLedgers.map((g) =>
        g.id === id ? { ...g, ...ledger } : g
      ),
    })),

  generateTrialBalance: (trialBalance) =>
    set((state) => ({ trialBalances: [...state.trialBalances, trialBalance] })),

  generateFinancialStatement: (statement) =>
    set((state) => ({ financialStatements: [...state.financialStatements, statement] })),

  allocateBudget: (budget) =>
    set((state) => ({ budgets: [...state.budgets, budget] })),
  updateBudgetSpent: (budgetId, spentAmount) =>
    set((state) => ({
      budgets: state.budgets.map((b) =>
        b.id === budgetId
          ? {
              ...b,
              spentAmount,
              status:
                spentAmount > b.allocatedAmount
                  ? 'exceeded'
                  : spentAmount > b.allocatedAmount * 0.8
                  ? 'at-risk'
                  : 'on-track',
            }
          : b
      ),
    })),

  createReconciliation: (reconciliation) =>
    set((state) => ({ reconciliations: [...state.reconciliations, reconciliation] })),
  updateReconciliation: (id, reconciliation) =>
    set((state) => ({
      reconciliations: state.reconciliations.map((r) =>
        r.id === id ? { ...r, ...reconciliation } : r
      ),
    })),

  calculateTax: (taxCalc) =>
    set((state) => ({ taxCalculations: [...state.taxCalculations, taxCalc] })),

  createDepreciationSchedule: (schedule) =>
    set((state) => ({ depreciationSchedules: [...state.depreciationSchedules, schedule] })),
}));
