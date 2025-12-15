import { create } from 'zustand';

export interface SavedVendor {
  id: string;
  companyId: string;
  vendorId: string;
  vendorName: string;
  contactEmail: string;
  phoneNumber: string;
  address: string;
  category: string;
  lastPurchaseDate?: Date;
  totalTransactions: number;
  rating: number;
  savedDate: Date;
  notes?: string;
}

export interface VendorCategory {
  id: string;
  name: string;
  description?: string;
}

interface SavedVendorsStore {
  vendors: SavedVendor[];
  categories: VendorCategory[];

  // Vendor actions
  addVendor: (vendor: SavedVendor) => void;
  removeVendor: (vendorId: string) => void;
  updateVendor: (vendorId: string, vendor: Partial<SavedVendor>) => void;
  getVendorsByCategory: (category: string) => SavedVendor[];

  // Category actions
  addCategory: (category: VendorCategory) => void;
  removeCategory: (categoryId: string) => void;
}

export const useSavedVendorsStore = create<SavedVendorsStore>((set, get) => ({
  vendors: [],
  categories: [],

  addVendor: (vendor) =>
    set((state) => ({ vendors: [...state.vendors, vendor] })),

  removeVendor: (vendorId) =>
    set((state) => ({
      vendors: state.vendors.filter((v) => v.vendorId !== vendorId),
    })),

  updateVendor: (vendorId, vendor) =>
    set((state) => ({
      vendors: state.vendors.map((v) =>
        v.vendorId === vendorId ? { ...v, ...vendor } : v
      ),
    })),

  getVendorsByCategory: (category) =>
    get().vendors.filter((v) => v.category === category),

  addCategory: (category) =>
    set((state) => ({ categories: [...state.categories, category] })),

  removeCategory: (categoryId) =>
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== categoryId),
    })),
}));
