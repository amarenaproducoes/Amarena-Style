import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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

export interface Announcement {
  text: string;
  link?: string;
  active: boolean;
}

export interface SocialConfig {
  instagram: string;
  whatsapp: string;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  type: 'in' | 'out' | 'adjustment';
  reason: string;
  quantity: number;
  createdAt: string;
}

interface ProductStore {
  products: Product[];
  logoUrl: string | null;
  departments: Department[];
  banners: Banner[];
  sizeGuides: SizeGuide[];
  announcement: Announcement | null;
  socialConfig: SocialConfig | null;
  isStockSystemEnabled: boolean;
  inventoryMovements: InventoryMovement[];
  initialized: boolean;
  activeFilter: { department?: string, category?: string, isNew?: boolean } | null;
  favorites: string[];
  pinnedProductIds: string[];
  init: () => Promise<void>;
  setLogoUrl: (url: string) => Promise<void>;
  setDepartments: (depts: Department[]) => Promise<void>;
  setBanners: (banners: Banner[]) => Promise<void>;
  setAnnouncement: (announcement: Announcement) => Promise<void>;
  setSocialConfig: (config: SocialConfig) => Promise<void>;
  setStockSystemEnabled: (enabled: boolean) => Promise<void>;
  setFilter: (filter: { department?: string, category?: string, isNew?: boolean } | null) => void;
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  removeProduct: (id: string) => Promise<void>;
  adjustStock: (productId: string, type: 'in' | 'out' | 'adjustment', quantity: number, reason: string) => Promise<void>;
  updateSizeGuide: (guide: SizeGuide) => Promise<void>;
  toggleFavorite: (id: string) => void;
  registerView: (productId: string) => Promise<void>;
  registerCartClick: (productId: string) => Promise<void>;
  setPinnedProducts: (ids: string[]) => Promise<void>;
  getProductViewsInRange: (days: number) => Promise<{ [key: string]: number }>;
  getCartClicksInRange: (days: number) => Promise<{ [key: string]: number }>;
  validateCoupon: (code: string) => Promise<{ success: boolean, message?: string, coupon?: any }>;
  redeemCoupon: (coupon: any) => Promise<void>;
  getProductBySlug: (slug: string) => Product | undefined;
}

export const useProductStore = create<ProductStore>()(
  persist(
    (set, get) => ({
      products: [],
      logoUrl: null,
      departments: [],
      banners: [],
      sizeGuides: [],
      announcement: null,
      socialConfig: null,
      isStockSystemEnabled: true,
      inventoryMovements: [],
      initialized: false,
      activeFilter: null,
      favorites: [],
      pinnedProductIds: [],
      
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
      // Parallelize fetches for better performance
      const [settingsRes, productsRes, sizeGuidesRes, movementsRes] = await Promise.all([
        supabase.from('settings').select('*'),
        supabase.from('products').select('*'),
        supabase.from('size_guides').select('*'),
        supabase.from('inventory_movements').select('*').order('created_at', { ascending: false })
      ]);
        
      if (settingsRes.data) {
        const logo = settingsRes.data.find(s => s.id === 'logo_url');
        if (logo) set({ logoUrl: logo.value });

        const depts = settingsRes.data.find(s => s.id === 'departments');
        if (depts) {
          try {
            set({ departments: JSON.parse(depts.value) });
          } catch(e) {}
        }

        const banners = settingsRes.data.find(s => s.id === 'banners');
        if (banners) {
          try {
            set({ banners: JSON.parse(banners.value) });
          } catch(e) {}
        }

        const pinned = settingsRes.data.find(s => s.id === 'pinned_products');
        if (pinned) {
          try {
            set({ pinnedProductIds: JSON.parse(pinned.value) });
          } catch(e) {}
        }

        const announcement = settingsRes.data.find(s => s.id === 'announcement');
        if (announcement) {
          try {
            set({ announcement: JSON.parse(announcement.value) });
          } catch(e) {}
        }

        const social = settingsRes.data.find(s => s.id === 'social_config');
        if (social) {
          try {
            set({ socialConfig: JSON.parse(social.value) });
          } catch(e) {}
        }

        const stockEnabled = settingsRes.data.find(s => s.id === 'is_stock_system_enabled');
        if (stockEnabled) {
          set({ isStockSystemEnabled: stockEnabled.value === 'true' });
        }
      }

      if (productsRes.data) {
        const mappedProducts = (productsRes.data as any[]).map(p => ({
          ...p,
          originalPrice: p.original_price, // Mapeia snake_case para camelCase
          initialStock: p.initial_stock,
          currentStock: p.current_stock,
          unitCost: p.unit_cost,
          isHidden: p.is_hidden || false,
          label: p.label,
          categories: p.categories || (p.category ? [p.category] : [])
        }));
        set({ products: mappedProducts as Product[] });
      }

      if (sizeGuidesRes.data) {
        set({ sizeGuides: sizeGuidesRes.data as SizeGuide[] });
      }

      if (movementsRes.data) {
        const mappedMovements = (movementsRes.data as any[]).map(m => ({
          ...m,
          productId: m.product_id,
          createdAt: m.created_at
        }));
        set({ inventoryMovements: mappedMovements });
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

  setAnnouncement: async (announcement) => {
    set({ announcement });
    const { error } = await supabase.from('settings').upsert({ id: 'announcement', value: JSON.stringify(announcement) });
    if (error) throw error;
  },

  setSocialConfig: async (config) => {
    set({ socialConfig: config });
    const { error } = await supabase.from('settings').upsert({ id: 'social_config', value: JSON.stringify(config) });
    if (error) throw error;
  },

  setStockSystemEnabled: async (enabled) => {
    set({ isStockSystemEnabled: enabled });
    const { error } = await supabase.from('settings').upsert({ id: 'is_stock_system_enabled', value: enabled ? 'true' : 'false' });
    if (error) throw error;
  },

  setFilter: (filter) => {
    set({ activeFilter: filter });
  },

  updateProduct: async (id, updates) => {
    // Filter out undefined values to avoid overriding columns with null/default
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    if (Object.keys(cleanUpdates).length === 0) return;

    // Mapeia camelCase para snake_case do banco de dados
    const dbUpdates: any = { ...cleanUpdates };
    if ('originalPrice' in dbUpdates) {
      dbUpdates.original_price = dbUpdates.originalPrice;
      delete dbUpdates.originalPrice;
    }
    if ('initialStock' in dbUpdates) {
      dbUpdates.initial_stock = dbUpdates.initialStock;
      delete dbUpdates.initialStock;
    }
    if ('currentStock' in dbUpdates) {
      dbUpdates.current_stock = dbUpdates.currentStock;
      delete dbUpdates.currentStock;
    }
    if ('unitCost' in dbUpdates) {
      dbUpdates.unit_cost = dbUpdates.unitCost;
      delete dbUpdates.unitCost;
    }
    if ('isHidden' in dbUpdates) {
      dbUpdates.is_hidden = dbUpdates.isHidden;
      delete dbUpdates.isHidden;
    }

    set((state) => ({
      products: state.products.map(p => p.id === id ? { ...p, ...cleanUpdates } : p)
    }));
    const { error } = await supabase.from('products').update(dbUpdates).eq('id', id);
    if (error) throw error;
  },

  addProduct: async (product) => {
    const initialQty = Number(product.initialStock || 0);
    
    // Prepara o registro para o Supabase
    const productRecord = {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      department: product.department || null,
      category: product.category,
      categories: product.categories || (product.category ? [product.category] : []),
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
      isActive: product.isActive !== false,
      is_hidden: product.isHidden || false,
      original_price: product.originalPrice || null,
      label: product.label || null,
      initial_stock: initialQty,
      current_stock: initialQty, // Set it once here
      unit_cost: product.unitCost || null
    };

    // Update state once
    set((state) => ({ 
      products: [...state.products, { ...product, currentStock: initialQty, initialStock: initialQty }] 
    }));
    
    const { error } = await supabase.from('products').upsert([productRecord]);
    if (error) throw error;

    // Registrar o movimento inicial manualmente se houver estoque, 
    // mas SEM chamar adjustStock para evitar re-calculo e duplicidade no estado local
    if (initialQty > 0) {
      const movement = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        product_id: product.id,
        type: 'adjustment' as const,
        quantity: initialQty,
        reason: 'Estoque Inicial',
        created_at: new Date().toISOString()
      };

      await supabase.from('inventory_movements').insert([movement]);
      
      set(state => ({
        inventoryMovements: [{
          id: movement.id,
          productId: product.id,
          type: 'adjustment',
          quantity: initialQty,
          reason: 'Estoque Inicial',
          createdAt: movement.created_at
        }, ...state.inventoryMovements]
      }));
    }
  },

  removeProduct: async (id) => {
    set((state) => ({ products: state.products.filter(p => p.id !== id) }));
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
  },

  adjustStock: async (productId, type, quantity, reason) => {
    const product = get().products.find(p => p.id === productId);
    if (!product) return;

    const currentQty = product.currentStock || 0;
    let newQty = currentQty;

    // Logic updated to handle 'in' as positive and 'out' as negative adjustment
    if (type === 'in') newQty += Math.abs(quantity);
    else if (type === 'out') {
      if (currentQty < Math.abs(quantity)) throw new Error('Saldo insuficiente em estoque para esta saída.');
      newQty -= Math.abs(quantity);
    }
    else if (type === 'adjustment') newQty = currentQty + quantity; 

    // Update product current stock
    await get().updateProduct(productId, { currentStock: newQty });

    // Register movement
    const movement = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      product_id: productId,
      type,
      quantity: type === 'out' ? -Math.abs(quantity) : (type === 'in' ? Math.abs(quantity) : quantity),
      reason,
      created_at: new Date().toISOString()
    };

    const { error } = await supabase.from('inventory_movements').insert([movement]);
    if (error) throw error;

    // Update local state for movements
    set(state => ({
      inventoryMovements: [{
        id: movement.id,
        productId,
        type,
        quantity: movement.quantity,
        reason,
        createdAt: movement.created_at
      }, ...state.inventoryMovements]
    }));
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
  },

  registerView: async (productId) => {
    try {
      await supabase.from('product_views').insert([{ product_id: productId }]);
    } catch (error) {
      console.error('Failed to register view:', error);
    }
  },

  registerCartClick: async (productId) => {
    try {
      await supabase.from('product_clicks').insert([{ product_id: productId }]);
    } catch (error) {
      console.error('Failed to register cart click:', error);
    }
  },

  getProductBySlug: (slug: string) => {
    const products = get().products;
    return products.find(p => p.referenceCode === slug || p.id === slug);
  },

  setPinnedProducts: async (ids) => {
    set({ pinnedProductIds: ids });
    const { error } = await supabase.from('settings').upsert({ id: 'pinned_products', value: JSON.stringify(ids) });
    if (error) throw error;
  },

  getProductViewsInRange: async (days) => {
    try {
      // If days is 0, fetch current month views
      // If days is -1, fetch previous month views
      let query = supabase.from('product_views').select('product_id');
      
      const now = new Date();
      if (days > 0) {
        const startDate = new Date();
        startDate.setDate(now.getDate() - days);
        query = query.gte('created_at', startDate.toISOString());
      } else if (days === 0) {
        // Current Month
        const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        query = query.gte('created_at', startDate.toISOString());
      } else if (days === -1) {
        // Previous Month
        const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        query = query.gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString());
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      const counts: { [key: string]: number } = {};
      data?.forEach(view => {
        counts[view.product_id] = (counts[view.product_id] || 0) + 1;
      });
      
      return counts;
    } catch (error) {
      console.error('Failed to get product views:', error);
      return {};
    }
  },

  getCartClicksInRange: async (days) => {
    try {
      let query = supabase.from('product_clicks').select('product_id');
      
      const now = new Date();
      if (days > 0) {
        const startDate = new Date();
        startDate.setDate(now.getDate() - days);
        query = query.gte('created_at', startDate.toISOString());
      } else if (days === 0) {
        // Current Month
        const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        query = query.gte('created_at', startDate.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      
      const counts: { [key: string]: number } = {};
      data?.forEach(click => {
        counts[click.product_id] = (counts[click.product_id] || 0) + 1;
      });
      
      return counts;
    } catch (error) {
      console.error('Failed to get cart clicks:', error);
      return {};
    }
  },

  validateCoupon: async (code: string) => {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code.toUpperCase())
        .single();

      if (error || !data) {
        return { success: false, message: 'Cupom não encontrado.' };
      }

      const now = new Date();
      const expirationDate = new Date(data.expiration_date);

      if (now > expirationDate) {
        return { success: false, message: 'Cupom já está expirado.' };
      }

      if (data.qtde_utilizada >= data.qtde_disponivel) {
        return { success: false, message: 'Todos os cupons já foram utilizados.' };
      }

      return { success: true, coupon: data };
    } catch (err) {
      return { success: false, message: 'Erro ao validar cupom.' };
    }
  },

  redeemCoupon: async (coupon: any) => {
    try {
      // Incrementar qtde_utilizada
      await supabase
        .from('coupons')
        .update({ qtde_utilizada: coupon.qtde_utilizada + 1 })
        .eq('id', coupon.id);

      // Registrar no histórico
      await supabase
        .from('coupon_history')
        .insert([{
          coupon_code: coupon.code,
          discount_value: coupon.discount_value || null,
          discount_percent: coupon.discount_percent || null,
          expiration_date: coupon.expiration_date
        }]);
    } catch (err) {
      console.error('Failed to redeem coupon:', err);
    }
  }
}),
{
  name: 'amarena-favorites-v2',
  partialize: (state) => ({ favorites: state.favorites }),
}
)
);
