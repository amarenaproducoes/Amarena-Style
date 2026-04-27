import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  isOnSale?: boolean;
  label?: string;
  hasLabel?: boolean;
  imageUrl: string; // Keep as main image for backwards compatibility
  images?: string[]; // Up to 8 images
  department?: string; // e.g. Acessórios
  category: string; // e.g. Brincos
  installments?: number; // Installments count (e.g. 12)
  paymentType?: string; // 'credit', 'pix', etc
  options?: string[];
  colors?: string[];
  sizes?: string[];
  referenceCode?: string;
  sizeGuide?: 'male' | 'female';
  isNew?: boolean;
  isActive?: boolean;
}

export interface CartItem extends Product {
  quantity: number;
  selectedOption?: string;
  selectedColor?: string;
  selectedSize?: string;
}

interface CartStore {
  items: CartItem[];
  isCartOpen: boolean;
  appliedCoupon: Coupon | null;
  addItem: (product: Product, selectedOption?: string) => void;
  removeItem: (productId: string, selectedOption?: string) => void;
  updateQuantity: (productId: string, quantity: number, selectedOption?: string) => void;
  applyCoupon: (coupon: Coupon) => void;
  removeCoupon: () => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  getTotals: () => { totalItems: number; totalPrice: number; discountAmount: number; finalPrice: number };
}

export interface Coupon {
  id: string;
  code: string;
  discount_value?: number;
  discount_percent?: number;
  expiration_date: string;
  qtde_disponivel: number;
  qtde_utilizada: number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      appliedCoupon: null,
      isCartOpen: false,
      addItem: (product, selectedOption) => {
        set((state) => {
          const existingItemIndex = state.items.findIndex(
            (item) => item.id === product.id && item.selectedOption === selectedOption
          );

          if (existingItemIndex > -1) {
            const newItems = [...state.items];
            newItems[existingItemIndex].quantity += 1;
            return { items: newItems };
          }

          return { items: [...state.items, { ...product, quantity: 1, selectedOption }] };
        });
        get().openCart();
      },
      removeItem: (productId, selectedOption) => {
        set((state) => ({
          items: state.items.filter(
            (item) => !(item.id === productId && item.selectedOption === selectedOption)
          ),
        }));
      },
      updateQuantity: (productId, quantity, selectedOption) => {
        if (quantity < 1) return;
        set((state) => ({
          items: state.items.map((item) =>
            item.id === productId && item.selectedOption === selectedOption
              ? { ...item, quantity }
              : item
          ),
        }));
      },
      applyCoupon: (coupon) => set({ appliedCoupon: coupon }),
      removeCoupon: () => set({ appliedCoupon: null }),
      clearCart: () => set({ items: [], appliedCoupon: null }),
      
      toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),
      openCart: () => set({ isCartOpen: true }),
      closeCart: () => set({ isCartOpen: false }),
      
      getTotals: () => {
        const state = get();
        const totals = state.items.reduce(
          (acc, item) => {
            acc.totalItems += item.quantity;
            acc.totalPrice += item.price * item.quantity;
            return acc;
          },
          { totalItems: 0, totalPrice: 0 }
        );

        let discountAmount = 0;
        if (state.appliedCoupon) {
          if (state.appliedCoupon.discount_value) {
            discountAmount = state.appliedCoupon.discount_value;
          } else if (state.appliedCoupon.discount_percent) {
            discountAmount = (totals.totalPrice * state.appliedCoupon.discount_percent) / 100;
          }
        }

        return {
          ...totals,
          discountAmount,
          finalPrice: Math.max(0, totals.totalPrice - discountAmount)
        };
      },
    }),
    {
      name: 'amarena-cart-storage',
      partialize: (state) => ({ items: state.items }),
    }
  )
);
