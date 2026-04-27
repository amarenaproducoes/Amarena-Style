import { create } from 'zustand';
import { Product } from './useCartStore';
import { supabase } from '../lib/supabase';

export interface Department {
  name: string;
  categories: string[];
}

export interface Banner {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  link?: string;
  productId?: string;
  active: boolean;
}

export interface SizeGuide {
  id: string;
  name: string;
  dimensions: {
    columns: string[];
    rows: { label: string; values: string[] }[];
  }
}

interface ProductStore {
  products: Product[];
  logoUrl: string | null;
  departments: Department[];
  banners: Banner[];
  sizeGuides: SizeGuide[];
  initialized: boolean;
  activeFilter: { department?: string, category?: string, isNew?: boolean } | null;
  favorites: string[];
  init: () => Promise<void>;
  setLogoUrl: (url: string) => Promise<void>;
  setDepartments: (depts: Department[]) => Promise<void>;
  setBanners: (banners: Banner[]) => Promise<void>;
  setFilter: (filter: { department?: string, category?: string, isNew?: boolean } | null) => void;
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  removeProduct: (id: string) => Promise<void>;
  updateSizeGuide: (guide: SizeGuide) => Promise<void>;
  toggleFavorite: (id: string) => void;
}

export const useProductStore = create<ProductStore>((set, get) => ({
  products: [],
  logoUrl: null,
  departments: [],
  banners: [],
  sizeGuides: [],
  initialized: false,
  activeFilter: null,
  favorites: [],
  
  toggleFavorite: (id: string) => {
    set((state) => {
      const isFavorite = state.favorites.includes(id);
      return {
        favorites: isFavorite 
          ? state.favorites.filter(favId => favId !== id)
          : [...state.favorites, id]
      };
    });
  },

  init: async () => {
    if (get().initialized) return;
    
    try {
      // Fetch settings (logo, departments, banners)
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

        const banners = settingsData.find(s => s.id === 'banners');
        if (banners) {
          try {
            set({ banners: JSON.parse(banners.value) });
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

      // Fetch size_guides
      const { data: sizeGuidesData } = await supabase
        .from('size_guides')
        .select('*');

      if (sizeGuidesData) {
        set({ sizeGuides: sizeGuidesData as SizeGuide[] });
      }
    } catch (error) {
      console.error('Failed to init from Supabase:', error);
    } finally {
      set({ initialized: true });
    }
  },

  setLogoUrl: async (url) => {
    set({ logoUrl: url });
    const { error } = await supabase.from('settings').upsert({ id: 'logo_url', value: url });
    if (error) throw error;
  },

  setDepartments: async (depts) => {
    set({ departments: depts });
    const { error } = await supabase.from('settings').upsert({ id: 'departments', value: JSON.stringify(depts) });
    if (error) throw error;
  },

  setBanners: async (banners) => {
    set({ banners });
    const { error } = await supabase.from('settings').upsert({ id: 'banners', value: JSON.stringify(banners) });
    if (error) throw error;
  },

  setFilter: (filter) => {
    set({ activeFilter: filter });
  },

  updateProduct: async (id, updates) => {
    set((state) => ({
      products: state.products.map(p => p.id === id ? { ...p, ...updates } : p)
    }));
    const { error } = await supabase.from('products').update(updates).eq('id', id);
    if (error) throw error;
  },

  addProduct: async (product) => {
    set((state) => ({ products: [...state.products, product] }));
    
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
      options: product.options || null,
      colors: product.colors || null,
      sizes: product.sizes || null,
      referenceCode: product.referenceCode || null,
      sizeGuide: product.sizeGuide || null,
      isNew: product.isNew || false,
      isActive: product.isActive !== false
    };

    const { error } = await supabase.from('products').upsert([productRecord]);
    if (error) throw error;
  },

  removeProduct: async (id) => {
    set((state) => ({ products: state.products.filter(p => p.id !== id) }));
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
  },

  updateSizeGuide: async (guide) => {
    set((state) => {
      const exists = state.sizeGuides.some(s => s.id === guide.id);
      return {
        sizeGuides: exists
          ? state.sizeGuides.map(s => s.id === guide.id ? guide : s)
          : [...state.sizeGuides, guide]
      };
    });
    const { error } = await supabase.from('size_guides').upsert([guide]);
    if (error) throw error;
  }
}));
