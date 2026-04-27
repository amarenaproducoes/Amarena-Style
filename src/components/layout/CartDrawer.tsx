import { motion, AnimatePresence } from 'motion/react';
import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';
import { formatPrice, formatWhatsAppMessage } from '../../lib/utils';
import { useState } from 'react';

export function CartDrawer() {
  const { isCartOpen, closeCart, items, updateQuantity, removeItem, getTotals, clearCart } = useCartStore();
  const { totalPrice } = getTotals();

  const handleCheckout = () => {
    if (items.length === 0) return;
    const url = formatWhatsAppMessage(items, totalPrice);
    window.open(url, '_blank');
    clearCart();
    closeCart();
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full md:w-[400px] bg-white z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 md:p-8 border-b border-zinc-100 bg-white shrink-0">
              <span className="font-serif text-xl text-zinc-900 tracking-tight">
                Seu Carrinho
              </span>
              <button 
                onClick={closeCart}
                className="text-wine-800 hover:opacity-80 transition-opacity"
              >
                <X className="w-5 h-5 md:w-6 md:h-6 stroke-[2]" />
              </button>
            </div>
            
            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-white">
              {items.length === 0 ? (
                <div className="h-full flex flex-col pt-20">
                  <div className="border-b border-zinc-50 pb-4 text-[10px] text-zinc-400 italic text-center">
                    Seu carrinho está vazio
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {items.map((item) => (
                    <div key={`${item.id}-${item.selectedOption}`} className="flex gap-4 p-3 bg-white border border-zinc-100 shadow-sm relative group">
                      <div className="w-20 h-24 flex-shrink-0 bg-zinc-100">
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      
                      <div className="flex flex-col flex-1 py-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-sans text-sm text-zinc-900 font-medium line-clamp-2 pr-6">{item.name}</h4>
                          <button 
                            onClick={() => removeItem(item.id, item.selectedOption)}
                            className="text-zinc-400 hover:text-red-500 transition-colors absolute top-3 right-3 opacity-0 group-hover:opacity-100 md:opacity-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        
                        {item.selectedOption && (
                          <span className="text-xs text-zinc-500 font-sans mt-1">
                            Opção: {item.selectedOption}
                          </span>
                        )}
                        
                        <div className="mt-auto flex items-center justify-between">
                          <span className="font-medium text-wine-800 font-sans text-sm">
                            {formatPrice(item.price)}
                          </span>
                          
                          <div className="flex items-center border border-zinc-200 bg-zinc-50">
                            <button 
                              onClick={() => updateQuantity(item.id, item.quantity - 1, item.selectedOption)}
                              className="p-1.5 text-zinc-500 hover:text-zinc-900"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-8 text-center text-xs font-medium font-sans">
                              {item.quantity}
                            </span>
                            <button 
                              onClick={() => updateQuantity(item.id, item.quantity + 1, item.selectedOption)}
                              className="p-1.5 text-zinc-500 hover:text-zinc-900"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Footer */}
            {items.length > 0 && (
              <div className="p-6 md:p-8 shrink-0 bg-white border-t border-zinc-100">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xs uppercase tracking-widest font-semibold text-zinc-900">Subtotal</span>
                  <span className="text-wine-800 font-serif text-lg">{formatPrice(totalPrice)}</span>
                </div>
                <div className="space-y-3">
                  <button 
                    onClick={handleCheckout}
                    className="w-full bg-wine-800 text-white py-4 text-[10px] md:text-xs uppercase tracking-[0.2em] font-bold hover:bg-wine-900 transition-colors"
                  >
                    Finalizar via WhatsApp
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
