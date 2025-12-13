import { create } from 'zustand';
import { SalesQuotation } from './types';

interface SalesStore {
  quotations: SalesQuotation[];
  addQuotation: (quotation: SalesQuotation) => void;
  updateQuotation: (id: string, quotation: Partial<SalesQuotation>) => void;
  deleteQuotation: (id: string) => void;
  setQuotations: (quotations: SalesQuotation[]) => void;
}

export const useSalesStore = create<SalesStore>((set) => ({
  quotations: [],
  
  addQuotation: (quotation: SalesQuotation) =>
    set((state) => ({
      quotations: [...state.quotations, quotation],
    })),
  
  updateQuotation: (id: string, updatedData: Partial<SalesQuotation>) =>
    set((state) => ({
      quotations: state.quotations.map((q) =>
        q.id === id ? { ...q, ...updatedData } : q
      ),
    })),
  
  deleteQuotation: (id: string) =>
    set((state) => ({
      quotations: state.quotations.filter((q) => q.id !== id),
    })),
  
  setQuotations: (quotations: SalesQuotation[]) =>
    set({ quotations }),
}));
