import { create } from 'zustand';
import { Product } from './useCartStore';
import { supabase } from '../lib/supabase';

interface ProductStore {
  products: Product[];
  logoUrl: string | null;
  initialized: boolean;
  init: () => Promise<void>;
  setLogoUrl: (url: string) => Promise<void>;
  addProduct: (product: Product) => Promise<void>;
  removeProduct: (id: string) => Promise<void>;
}

export const useProductStore = create<ProductStore>((set, get) => ({
  products: [],
  logoUrl: null,
  initialized: false,
  
  init: async () => {
    if (get().initialized) return;
    
    try {
      // Fetch logo
      const { data: logoData } = await supabase
        .from('settings')
        .select('value')
        .eq('id', 'logo_url')
        .single();
        
      if (logoData) {
        set({ logoUrl: logoData.value });
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

  addProduct: async (product) => {
    set((state) => ({ products: [...state.products, product] }));
    await supabase.from('products').upsert([{
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      imageUrl: product.imageUrl,
    }]);
  },

  removeProduct: async (id) => {
    set((state) => ({ products: state.products.filter(p => p.id !== id) }));
    await supabase.from('products').delete().eq('id', id);
  }
}));
