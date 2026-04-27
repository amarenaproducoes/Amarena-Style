import { useState } from 'react';
import { MOCK_PRODUCTS } from '../data/mock';
import { ProductCard } from '../components/product/ProductCard';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useProductStore } from '../store/useProductStore';
import { Link } from 'react-router-dom';

export function Home() {
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const { products: registeredProducts, banners, departments, activeFilter, setFilter } = useProductStore();
  
  const activeBanners = banners.filter(b => b.active);
  const currentBanner = activeBanners[currentBannerIndex];
  
  // Combine registered products with mock products and filter
  const allProducts = [...registeredProducts, ...MOCK_PRODUCTS].filter(p => p.isActive !== false);
  
  const displayProducts = allProducts.filter(p => {
    if (!activeFilter) return true;
    if (activeFilter.isNew && !p.isNew) return false;
    if (activeFilter.department && p.department !== activeFilter.department) return false;
    if (activeFilter.category && p.category !== activeFilter.category) return false;
    return true;
  });

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
        <section className="relative h-[400px] md:h-[500px] w-full bg-zinc-100 flex items-center overflow-hidden rounded-sm mt-4 md:mt-8 mb-12 border border-zinc-200">
          
          {currentBanner ? (
            <>
              <img 
                src={currentBanner.imageUrl} 
                alt={currentBanner.title}
                className="absolute inset-0 w-full h-full object-cover md:w-[70%] md:left-auto md:right-0"
              />
              {/* Gradient Overlay for Text Legibility */}
              <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-zinc-50/80 via-zinc-50/40 to-transparent w-full md:w-[60%]"></div>
              <div className="z-10 px-8 md:pl-16 max-w-lg">
                <h3 className="text-[11px] uppercase tracking-[0.4em] mb-4 text-wine-800 font-semibold">Destaque</h3>
                <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-tight mb-6 text-zinc-900 drop-shadow-sm">
                  {currentBanner.title}
                </h2>
                <p className="text-sm text-zinc-600 mb-8 max-w-sm font-medium">{currentBanner.subtitle}</p>
                {currentBanner.link && (
                  <Link to={currentBanner.link} className="inline-block bg-wine-800 text-white px-8 md:px-10 py-3 text-[10px] md:text-xs tracking-widest uppercase font-semibold hover:bg-wine-700 transition-all shadow-md">
                    Conheça
                  </Link>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="z-10 px-8 md:pl-16 max-w-lg">
                <h3 className="text-[11px] uppercase tracking-[0.4em] mb-4 text-wine-800 font-semibold">Nova Coleção</h3>
                <h2 className="font-serif text-4xl md:text-6xl leading-tight mb-6 text-zinc-900">
                  Essência de <br/>
                  <i className="font-normal text-wine-800">Amarena</i>
                </h2>
                <button className="bg-wine-800 text-white px-8 md:px-10 py-3 text-[10px] md:text-xs tracking-widest uppercase font-semibold hover:bg-wine-700 transition-all">
                  Conheça
                </button>
              </div>
              <div className="hidden md:block ml-auto h-full w-[45%] bg-[#EAE7E4] relative">
                <div className="absolute inset-0 opacity-40" style={{ background: 'radial-gradient(circle at center, #4B2C3B 0.5px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
              </div>
            </>
          )}

          {activeBanners.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-20">
              {activeBanners.map((_, idx) => (
                <button 
                  key={idx}
                  onClick={() => setCurrentBannerIndex(idx)}
                  className={`w-10 h-[2px] transition-colors ${idx === currentBannerIndex ? 'bg-wine-800' : 'bg-zinc-300'}`}
                ></button>
              ))}
            </div>
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
            ) : 'Destaques da Temporada'}
          </h4>
          {activeFilter ? (
            <button 
              onClick={() => setFilter(null)}
              className="text-[10px] uppercase tracking-widest border-b border-red-400 pb-1 text-red-500 font-bold hover:opacity-80 transition-opacity"
            >
              Limpar Filtro
            </button>
          ) : (
            <a href="#" className="hidden md:inline-block text-[10px] uppercase tracking-widest border-b border-wine-800 pb-1 text-wine-800 font-bold hover:opacity-80 transition-opacity">
              Ver todos os produtos
            </a>
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
          <a href="#" className="inline-block text-[10px] uppercase tracking-widest border-b border-wine-800 pb-1 text-wine-800 font-bold hover:opacity-80 transition-opacity">
            Ver todos os produtos
          </a>
        </div>
      </section>
      
      {/* Departments Banner */}
      <section className="bg-zinc-50 py-16 px-4 md:px-8 mb-16 rounded-sm relative overflow-hidden">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="font-serif text-2xl md:text-3xl text-wine-900 tracking-tight mb-8">Compre por Departamento</h2>
          {departments && departments.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {departments.map((dept) => (
                <div 
                  key={dept.name} 
                  onClick={() => {
                    setFilter({ department: dept.name });
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="bg-white p-6 md:p-8 hover:shadow-md transition-shadow cursor-pointer border border-wine-100 flex items-center justify-center min-h-[120px]"
                >
                  <span className="font-sans text-sm font-medium text-wine-800 tracking-wider uppercase">{dept.name}</span>
                </div>
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
