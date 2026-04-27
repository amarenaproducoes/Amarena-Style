import { Menu, Search, ShoppingBag, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCartStore } from '../../store/useCartStore';
import { useProductStore } from '../../store/useProductStore';
import { cn, formatPrice } from '../../lib/utils';
import { AnimatePresence, motion } from 'motion/react';

interface NavbarProps {
  onOpenMenu: () => void;
}

export function Navbar({ onOpenMenu }: NavbarProps) {
  const { getTotals, openCart } = useCartStore();
  const { logoUrl, setFilter } = useProductStore();
  const { totalItems } = getTotals();
  const location = useLocation();
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Use registered products for search
  const { products: registeredProducts } = useProductStore();
  const allProducts = registeredProducts;
  
  const [searchResults, setSearchResults] = useState(allProducts);

  useEffect(() => {
    setIsSearchOpen(false);
    setSearchQuery('');
  }, [location.pathname]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      return;
    }
    
    // Debounce effect logic (simple version)
    const timeoutId = setTimeout(() => {
      const results = allProducts.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(results);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [searchQuery, registeredProducts]);

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white border-b border-zinc-100">
        <div className="flex h-20 items-center justify-between px-4 md:px-8 max-w-7xl mx-auto relative">
          {/* Left: Menu Handle */}
          <div className="flex items-center gap-2 md:gap-4 flex-1 md:flex-none md:w-1/3">
            <button 
              onClick={onOpenMenu}
              className="p-2 -ml-2 text-wine-800 transition-colors"
              aria-label="Abrir menu"
            >
              <Menu className="w-6 h-6 stroke-[1.5]" />
            </button>
            <span className="text-[10px] tracking-widest uppercase opacity-60 font-semibold hidden md:block text-zinc-900">
              Menu
            </span>
          </div>

          {/* Center: Logo */}
          <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
            <Link 
              to="/" 
              className="flex flex-col items-center"
              onClick={() => {
                setFilter(null);
                window.scrollTo(0, 0);
              }}
            >
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt="Amarena Style" 
                  className="h-10 md:h-12 object-contain mix-blend-multiply" 
                />
              ) : (
                <>
                  <span className="font-serif text-xl sm:text-2xl md:text-3xl tracking-tight text-wine-800 font-normal leading-none whitespace-nowrap">
                    Amarena Style
                  </span>
                  <span className="text-[7px] sm:text-[8px] md:text-[9px] tracking-[0.3em] uppercase mt-1 text-zinc-600 hidden sm:block">
                    Leveza & Movimento
                  </span>
                </>
              )}
            </Link>
          </div>

          {/* Right: Search & Cart */}
          <div className="flex items-center justify-end flex-1 md:flex-none md:w-1/3 gap-0.5 md:gap-6 z-20">
            <div className="relative hidden md:flex items-center border-b border-zinc-300 pb-1">
              <input
                type="text"
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                className="text-xs bg-transparent outline-none w-24 lg:w-32 font-light italic font-sans text-zinc-900 placeholder:text-zinc-400"
              />
              <Search className="absolute right-0 w-3.5 h-3.5 text-wine-800 opacity-60" />
            </div>
            
            <button 
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-1.5 md:p-2 text-wine-800 transition-colors md:hidden"
            >
              <Search className="w-5 h-5 stroke-[1.5]" />
            </button>
            
            <button 
              onClick={openCart}
              className="relative p-1.5 md:p-2 -mr-1 md:-mr-2 text-wine-800 transition-colors"
              aria-label="Abrir carrinho"
            >
              <ShoppingBag className="w-5 h-5 md:w-[22px] md:h-[22px] stroke-[1.5]" />
              <span className="absolute top-0 right-0 md:top-0 md:right-0 bg-wine-800 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold translate-x-1.5 -translate-y-1.5 md:translate-x-0 md:translate-y-0">
                {totalItems}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Floating Search Bar */}
      <AnimatePresence>
        {isSearchOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
              className="fixed inset-0 bg-black/20 z-20"
            />
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="fixed top-16 left-0 w-full bg-white z-30 border-b border-zinc-100 shadow-sm"
            >
              <div className="max-w-3xl mx-auto px-4 py-4 relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Buscar produtos, categorias..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 bg-zinc-50 border border-zinc-200 rounded-none focus:outline-none focus:border-wine-800 focus:ring-1 focus:ring-wine-800 transition-all font-sans"
                    autoFocus
                  />
                  <button 
                    onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Results Dropdown */}
              {searchQuery.trim() !== '' && (
                <div className="absolute top-full left-0 right-0 max-h-[60vh] overflow-y-auto bg-white shadow-lg border-t border-zinc-100">
                  {searchResults.length > 0 ? (
                    <ul className="flex flex-col py-2">
                      {searchResults.map((product) => (
                        <li key={product.id}>
                          <Link 
                            to={`/produto/${product.id}`}
                            onClick={() => setIsSearchOpen(false)}
                            className="flex items-center gap-4 px-4 py-3 hover:bg-zinc-50 transition-colors"
                          >
                            <img src={product.imageUrl} alt={product.name} className="w-12 h-16 object-cover bg-zinc-100" />
                            <div>
                              <h4 className="font-sans text-sm text-zinc-900">{product.name}</h4>
                              <span className="text-sm font-medium text-wine-800">{formatPrice(product.price)}</span>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="px-4 py-8 text-center text-zinc-500 font-sans text-sm">
                      Nenhum produto encontrado para "{searchQuery}"
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
