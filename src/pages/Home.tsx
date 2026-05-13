import { useState, useEffect } from 'react';
import { ProductCard } from '../components/product/ProductCard';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useProductStore } from '../store/useProductStore';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { slugify } from '../utils/slugify';

export function Home() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const { 
    products: registeredProducts, banners, departments, activeFilter, setFilter, 
    pinnedProductIds, getProductViewsInRange, isStockSystemEnabled 
  } = useProductStore();
  const [viewCounts, setViewCounts] = useState<{ [key: string]: number }>({});
  
  const activeBanners = banners.filter(b => {
    if (!b.active) return false;
    if (isStockSystemEnabled && b.productId) {
      const product = registeredProducts.find(p => p.id === b.productId);
      if (product && (product.currentStock || 0) <= 0) return false;
    }
    return true;
  });
  const currentBanner = activeBanners[currentBannerIndex];
  
  // URL Slug logic
  useEffect(() => {
    if (slug) {
      if (departments.length > 0) {
        const foundDept = departments.find(d => slugify(d.name) === slug);
        if (foundDept) {
          if (activeFilter?.department !== foundDept.name) {
            setFilter({ department: foundDept.name });
          }
        } else {
          // Check categories
          const allCategories = departments.flatMap(d => d.categories || []);
          const foundCat = allCategories.find(c => slugify(c) === slug);
          if (foundCat) {
            if (activeFilter?.category !== foundCat) {
              setFilter({ category: foundCat });
            }
          }
        }
      }
    } else {
      // If we are at root and the filter was set by a department/category slug, clear it.
      if (activeFilter?.department || activeFilter?.category) {
        setFilter(null);
      }
    }
  }, [slug, departments, activeFilter, setFilter]);
  
  useEffect(() => {
    const fetchViews = async () => {
      const counts = await getProductViewsInRange(7);
      setViewCounts(counts);
    };
    fetchViews();
  }, [getProductViewsInRange]);

  useEffect(() => {
    if (activeBanners.length > 1) {
      const interval = setInterval(() => {
        setCurrentBannerIndex((prev) => (prev === activeBanners.length - 1 ? 0 : prev + 1));
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [activeBanners.length]);
  
  // Filter registered products
  const allProducts = registeredProducts.filter(p => {
    const isActive = p.isActive !== false;
    if (isStockSystemEnabled) {
      return isActive && (p.currentStock || 0) > 0;
    }
    return isActive;
  });
  
  // Logic for sorting and pinning
  let displayProducts = [...allProducts];

  if (!activeFilter) {
    // 1. Get pinned products in order
    const pinnedProducts = pinnedProductIds
      .map(id => allProducts.find(p => p.id === id))
      .filter((p): p is any => !!p);

    // 2. Get other products sorted by views (last 7 days) and name
    const rankingProducts = allProducts
      .filter(p => !pinnedProductIds.includes(p.id))
      .sort((a, b) => {
        const viewsA = viewCounts[a.id] || 0;
        const viewsB = viewCounts[b.id] || 0;
        
        if (viewsB !== viewsA) {
          return viewsB - viewsA; // Higher views first
        }
        
        return a.name.localeCompare(b.name); // Alphabetical tie-break
      });

    displayProducts = [...pinnedProducts, ...rankingProducts];
  } else {
    // Apply filters normally
    displayProducts = allProducts.filter(p => {
      if (activeFilter.isNew && !p.isNew) return false;
      if (activeFilter.department && p.department !== activeFilter.department) return false;
      if (activeFilter.category && p.category !== activeFilter.category && !p.categories?.includes(activeFilter.category)) return false;
      return true;
    });
  }

  const nextBanner = () => {
    setCurrentBannerIndex((prev) => (prev === activeBanners.length - 1 ? 0 : prev + 1));
  };

  const prevBanner = () => {
    setCurrentBannerIndex((prev) => (prev === 0 ? activeBanners.length - 1 : prev - 1));
  };

  return (
    <div className="flex flex-col min-h-screen px-4 md:px-8 max-w-7xl mx-auto w-full">
      {/* Dynamic Hero Banner (Geometric design fallback if no banners) */}
      {!activeFilter && (
        <section className="group relative h-[400px] md:h-[500px] w-full bg-zinc-100 overflow-hidden rounded-sm mt-4 md:mt-8 mb-12 border border-zinc-200">
          
          <AnimatePresence initial={false} mode="wait">
            {currentBanner ? (
              <motion.div
                key={currentBannerIndex}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="absolute inset-0"
              >
                <img 
                  src={currentBanner.imageUrl} 
                  alt={currentBanner.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute bottom-4 md:bottom-8 left-4 right-4 md:left-8 w-auto md:w-max max-w-sm z-10">
                  <div className="bg-white/20 backdrop-blur-md p-3 md:p-4 shadow-sm rounded-sm border border-white/20 text-center md:text-left">
                    <h2 className="font-serif text-base md:text-lg lg:text-xl leading-tight text-zinc-900 mb-2 drop-shadow-sm">
                      {currentBanner.title}
                    </h2>
                    <div>
                      {currentBanner.link && (
                        <Link to={currentBanner.link} className="inline-block bg-wine-800 text-white px-5 py-2 text-[10px] tracking-widest uppercase font-bold hover:bg-wine-700 transition-all shadow-sm">
                          Conheça
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="fallback"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center"
              >
                <div className="absolute bottom-4 md:bottom-8 left-4 right-4 md:left-8 w-auto md:w-max max-w-sm z-10">
                  <div className="bg-white/20 backdrop-blur-md p-3 md:p-4 shadow-sm rounded-sm border border-white/20 text-center md:text-left">
                    <h2 className="font-serif text-base md:text-lg lg:text-xl leading-tight text-zinc-900 mb-2 drop-shadow-sm">
                      Essência de <br className="hidden md:block" />
                      <i className="font-normal text-wine-800">Amarena</i>
                    </h2>
                    <div>
                      <button className="bg-wine-800 text-white px-5 py-2 text-[10px] tracking-widest uppercase font-bold hover:bg-wine-700 transition-all shadow-sm">
                        Conheça
                      </button>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 w-full h-full bg-[#EAE7E4] z-0">
                  <div className="absolute inset-0 opacity-40" style={{ background: 'radial-gradient(circle at center, #4B2C3B 0.5px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {activeBanners.length > 1 && (
            <>
              <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-3 z-20 bg-black/10 px-3 py-2 rounded-full backdrop-blur-sm">
                {activeBanners.map((_, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setCurrentBannerIndex(idx)}
                    className={`w-10 h-[3px] rounded-full transition-colors ${idx === currentBannerIndex ? 'bg-white' : 'bg-white/40'}`}
                  ></button>
                ))}
              </div>
              
              {/* Navigation arrows */}
              <div className="absolute inset-y-0 left-4 right-4 flex justify-between items-center z-20 opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <button onClick={(e) => { e.preventDefault(); prevBanner(); }} className="w-10 h-10 bg-white/80 rounded-full flex items-center justify-center text-zinc-800 hover:bg-white shadow pointer-events-auto transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={(e) => { e.preventDefault(); nextBanner(); }} className="w-10 h-10 bg-white/80 rounded-full flex items-center justify-center text-zinc-800 hover:bg-white shadow pointer-events-auto transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </>
          )}
        </section>
      )}

      {/* Featured Products */}
      <section className="flex-1 flex flex-col mb-16">
        <div className="flex justify-between items-end mb-6">
          <h4 className="font-serif text-2xl text-zinc-900">
            {activeFilter ? (
              activeFilter.isNew ? 'Novidades' : 
              activeFilter.category ? activeFilter.category : 
              activeFilter.department
            ) : 'Destaques'}
          </h4>
          {activeFilter ? (
            <button 
              onClick={() => {
                setFilter(null);
                navigate('/');
              }}
              className="text-[10px] uppercase tracking-widest border-b border-red-400 pb-1 text-red-500 font-bold hover:opacity-80 transition-opacity"
            >
              Limpar Filtro
            </button>
          ) : (
            <button 
              onClick={() => {
                setFilter(null);
                navigate('/');
              }} 
              className="hidden md:inline-block text-[10px] uppercase tracking-widest border-b border-wine-800 pb-1 text-wine-800 font-bold hover:opacity-80 transition-opacity"
            >
              Ver todos os produtos
            </button>
          )}
        </div>
        
        <div className="min-h-[400px]">
          {displayProducts.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {displayProducts.map((product, idx) => (
                <ProductCard key={product.id} product={product} index={idx + 1} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
              <p className="font-serif text-xl mb-2">Nenhum produto encontrado</p>
              <p className="text-sm">Tente selecionar outra categoria ou limpar o filtro.</p>
            </div>
          )}
        </div>
        
        <div className="mt-8 text-center md:hidden">
          <button 
            onClick={() => {
              setFilter(null);
              navigate('/');
            }}
            className="inline-block text-[10px] uppercase tracking-widest border-b border-wine-800 pb-1 text-wine-800 font-bold hover:opacity-80 transition-opacity"
          >
            Ver todos os produtos
          </button>
        </div>
      </section>
      
      {/* Departments Banner */}
      <section className="bg-zinc-50 py-16 px-4 md:px-8 mb-16 rounded-sm relative overflow-hidden">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="font-serif text-2xl md:text-3xl text-wine-900 tracking-tight mb-8">Compre por Departamento</h2>
          {departments && departments.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {departments.map((dept) => (
                <Link 
                  key={dept.name} 
                  to={`/${slugify(dept.name)}`}
                  className="bg-white p-6 md:p-8 hover:shadow-md transition-shadow cursor-pointer border border-wine-100 flex items-center justify-center min-h-[120px]"
                >
                  <span className="font-sans text-sm font-medium text-wine-800 tracking-wider uppercase">{dept.name}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-zinc-500 text-sm">Nenhum departamento cadastrado.</p>
          )}
        </div>
      </section>
    </div>
  );
}
