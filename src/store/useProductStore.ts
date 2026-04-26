import { create } from 'zustand';
import { Product } from './useCartStore';
import { supabase } from '../lib/supabase';

export interface Department {
  name: string;
  categories: string[];
}

interface ProductStore {
  products: Product[];
  logoUrl: string | null;
  departments: Department[];
  initialized: boolean;
  init: () => Promise<void>;
  setLogoUrl: (url: string) => Promise<void>;
  setDepartments: (depts: Department[]) => Promise<void>;
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  removeProduct: (id: string) => Promise<void>;
}

export const useProductStore = create<ProductStore>((set, get) => ({
  products: [],
  logoUrl: null,
  departments: [],
  initialized: false,
  
  init: async () => {
    if (get().initialized) return;
    
    try {
      // Fetch settings (logo and departments)
      const { data: settingsData } = await supabase
        .from('settings')
        .select('*');
        
      if (settingsData) {
        const logo = settingsData.find(s => s.id === 'logo_url');
        if (logo) set({ logoUrl: logo.value });

        const depts = settingsData.find(s => s.id === 'departments');
        if (depts) {
          try {
            set({ departments: JSON.parse(depts.value) });
          } catch(e) {}
        }
      }

      // Fetch products
      const { data: productsData } = await supabase
        .from('products')
        .select('*');
        
      if (productsData) {
        set({ products: productsData as Product[] });
      }
    } catch (error) {
      console.error('Failed to init from Supabase:', error);
    } finally {
      set({ initialized: true });
    }
  },

  setLogoUrl: async (url) => {
    set({ logoUrl: url });
    await supabase.from('settings').upsert({ id: 'logo_url', value: url });
  },

  setDepartments: async (depts) => {
    set({ departments: depts });
    await supabase.from('settings').upsert({ id: 'departments', value: JSON.stringify(depts) });
  },

  updateProduct: async (id, updates) => {
    set((state) => ({
      products: state.products.map(p => p.id === id ? { ...p, ...updates } : p)
    }));
    await supabase.from('products').update(updates).eq('id', id);
  },

  addProduct: async (product) => {
    set((state) => ({ products: [...state.products, product] }));
    const { options, ...rest } = product; // Extract if any
    
    // Convert undefined to null or include all. Ensure we send valid object to supabase.
    const productRecord = {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      department: product.department || null,
      category: product.category,
      imageUrl: product.imageUrl,
      images: product.images || [product.imageUrl],
      installments: product.installments || 1,
      paymentType: product.paymentType || null,
      options: product.options || null
    };

    await supabase.from('products').upsert([productRecord]);
  },

  removeProduct: async (id) => {
    set((state) => ({ products: state.products.filter(p => p.id !== id) }));
    await supabase.from('products').delete().eq('id', id);
  }
}));
