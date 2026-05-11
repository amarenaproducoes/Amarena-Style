import { motion, AnimatePresence } from 'motion/react';
import { X, Minus, Plus, Trash2, ShoppingBag, Ticket, Check, AlertCircle } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';
import { useProductStore } from '../../store/useProductStore';
import { formatPrice, formatWhatsAppMessage } from '../../lib/utils';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export function CartDrawer() {
  const { isCartOpen, closeCart, items, updateQuantity, removeItem, getTotals, clearCart, appliedCoupon, applyCoupon, removeCoupon } = useCartStore();
  const { totalItems, totalPrice, discountAmount, finalPrice } = getTotals();
  const { 
    validateCoupon, redeemCoupon, isStockSystemEnabled, 
    products, adjustStock 
  } = useProductStore();

  const [couponInput, setCouponInput] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isWhatsAppAgreed, setIsWhatsAppAgreed] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    
    setIsValidating(true);
    setCouponError(null);
    
    const result = await validateCoupon(couponInput);
    
    if (result.success) {
      applyCoupon(result.coupon);
      setCouponInput('');
    } else {
      setCouponError(result.message || 'Erro ao validar cupom.');
    }
    
    setIsValidating(false);
  };

  const handleCheckout = async () => {
    if (items.length === 0 || isProcessing) return;
    
    setIsProcessing(true);
    try {
      // 0. Verificar estoque se habilitado
      if (isStockSystemEnabled) {
        // Busca produtos atualizados do store (que já foram carregados no init)
        for (const item of items) {
          const product = products.find(p => p.id === item.id);
          if (!product || (product.currentStock || 0) < item.quantity) {
            alert(`O produto "${item.name}" acabou de esgotar ou não possui estoque suficiente. Por favor, ajuste sua sacola.`);
            setIsProcessing(false);
            return;
          }
        }
      }

      // 1. Cadastrar a compra no Supabase
      const { data: purchase, error: pError } = await supabase
        .from('purchases')
        .insert({ 
          total_value: finalPrice,
        })
        .select()
        .single();

      if (pError) throw pError;

      // 2. Cadastrar os itens da compra
      const itemsToInsert = items.map(item => ({
        purchase_id: purchase.id,
        product_id: item.id,
        reference_code: item.referenceCode || null,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('purchase_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      // 3. Atualizar estoque (Sempre registra o movimento, mas o bloqueio acima só ocorre se isStockSystemEnabled for true)
      for (const item of items) {
        await adjustStock(item.id, 'out', item.quantity, 'Venda via Site');
      }

      // 4. Resgatar cupom se houver
      if (appliedCoupon) {
        await redeemCoupon(appliedCoupon);
      }

      // 5. Abrir WhatsApp
      const url = formatWhatsAppMessage(
        items, 
        finalPrice, 
        appliedCoupon ? { code: appliedCoupon.code, discount: discountAmount } : null
      );
      
      window.open(url, '_blank');
      clearCart();
      closeCart();
    } catch (error) {
      console.error('Erro ao processar compra:', error);
      alert('Houve um erro ao processar sua compra. Por favor, tente novamente.');
    } finally {
      setIsProcessing(false);
    }
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
                Sua Sacola
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
                    Sua sacola está vazia
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
                {/* Coupon Section */}
                <div className="mb-6">
                  {!appliedCoupon ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            placeholder="Cupom de desconto"
                            value={couponInput}
                            onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                            className="w-full border border-zinc-200 px-3 py-2 text-xs uppercase tracking-widest focus:outline-none focus:border-wine-800"
                          />
                        </div>
                        <button
                          onClick={handleApplyCoupon}
                          disabled={isValidating || !couponInput.trim()}
                          className="bg-wine-800 text-white px-4 py-2 text-[10px] uppercase font-bold tracking-widest hover:bg-wine-900 transition-colors disabled:opacity-50"
                        >
                          {isValidating ? '...' : 'Aplicar'}
                        </button>
                      </div>
                      {couponError && (
                        <p className="text-[10px] text-red-500 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {couponError}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-green-50 border border-green-100 p-2 rounded-sm">
                      <div className="flex items-center gap-2">
                        <Ticket className="w-4 h-4 text-green-600" />
                        <div>
                          <p className="text-[10px] font-bold text-green-700 uppercase tracking-widest">
                            Cupom: {appliedCoupon.code}
                          </p>
                          <p className="text-[9px] text-green-600">
                            Desconto aplicado: {appliedCoupon.discount_value ? formatPrice(appliedCoupon.discount_value) : `${appliedCoupon.discount_percent}%`}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={removeCoupon}
                        className="text-green-700 hover:text-green-900"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3 bg-zinc-50 p-4 rounded-sm border border-zinc-100">
                    <div className="flex items-center h-5">
                      <input
                        id="whatsapp-agreement"
                        type="checkbox"
                        checked={isWhatsAppAgreed}
                        onChange={(e) => setIsWhatsAppAgreed(e.target.checked)}
                        className="w-4 h-4 text-wine-800 border-zinc-300 rounded focus:ring-wine-800 cursor-pointer"
                      />
                    </div>
                    <label htmlFor="whatsapp-agreement" className="text-[10px] leading-relaxed text-zinc-500 cursor-pointer select-none">
                      Ao clicar em finalizar, você será redirecionado para o WhatsApp para concluir a sua compra. Caso esteja em um computador, certifique-se de que está conectado ao WhatsApp Web. Caso contrário, refaça o processo pelo celular que contenha o seu WhatsApp.
                    </label>
                  </div>

                  <div className="flex justify-between items-center text-xs text-zinc-500 uppercase tracking-widest">
                    <span>Subtotal</span>
                    <span>{formatPrice(totalPrice)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between items-center text-xs text-green-600 uppercase tracking-widest font-semibold">
                      <span>Desconto</span>
                      <span>-{formatPrice(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t border-zinc-100">
                    <span className="text-xs uppercase tracking-widest font-bold text-zinc-900">Total Final</span>
                    <span className="text-wine-800 font-serif text-xl">{formatPrice(finalPrice)}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <button 
                    onClick={handleCheckout}
                    disabled={isProcessing || !isWhatsAppAgreed}
                    className="w-full bg-wine-800 text-white py-4 text-[10px] md:text-xs uppercase tracking-[0.2em] font-bold hover:bg-wine-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? 'Processando...' : 'Finalizar via WhatsApp'}
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
