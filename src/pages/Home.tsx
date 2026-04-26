import { useState } from 'react';
import { MOCK_PRODUCTS } from '../data/mock';
import { ProductCard } from '../components/product/ProductCard';
import { ChevronRight, ChevronLeft } from 'lucide-react';

const BANNERS = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=2000&auto=format&fit=crop',
    title: 'Nova Coleção Outono',
    subtitle: 'Descubra a elegância em cada detalhe.',
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2000&auto=format&fit=crop',
    title: 'Acessórios Essenciais',
    subtitle: 'Completando seu estilo todos os dias.',
  }
];

export function Home() {
  const [currentBanner, setCurrentBanner] = useState(0);

  const nextBanner = () => {
    setCurrentBanner((prev) => (prev === BANNERS.length - 1 ? 0 : prev + 1));
  };

  const prevBanner = () => {
    setCurrentBanner((prev) => (prev === 0 ? BANNERS.length - 1 : prev - 1));
  };

  return (
    <div className="flex flex-col min-h-screen px-4 md:px-8 max-w-7xl mx-auto w-full">
      {/* Hero Banner Carousel (Geometric design) */}
      <section className="relative h-[400px] md:h-[500px] w-full bg-zinc-50 flex items-center overflow-hidden rounded-sm mt-4 md:mt-8 mb-12">
        <div className="absolute inset-0 bg-wine-800/5 mix-blend-multiply"></div>
        <div className="z-10 px-8 md:pl-16 max-w-lg">
          <h3 className="text-[11px] uppercase tracking-[0.4em] mb-4 text-wine-800 font-semibold">Nova Coleção</h3>
          <h2 className="font-serif text-4xl md:text-6xl leading-tight mb-6 text-zinc-900">
            Essência de <br/>
            <i className="font-normal text-wine-800">Amarena</i>
          </h2>
          <button className="bg-wine-800 text-white px-8 md:px-10 py-3 text-[10px] md:text-xs tracking-widest uppercase font-semibold hover:bg-wine-700 transition-all">
            Explorar Itens
          </button>
        </div>
        <div className="hidden md:block ml-auto h-full w-[45%] bg-[#EAE7E4] relative">
          <div className="absolute inset-0 opacity-40" style={{ background: 'radial-gradient(circle at center, #4B2C3B 0.5px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        </div>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
          <div className="w-10 h-[2px] bg-wine-800"></div>
          <div className="w-10 h-[2px] bg-zinc-200"></div>
          <div className="w-10 h-[2px] bg-zinc-200"></div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="flex-1 flex flex-col mb-16">
        <div className="flex justify-between items-end mb-6">
          <h4 className="font-serif text-2xl text-zinc-900">Destaques da Temporada</h4>
          <a href="#" className="hidden md:inline-block text-[10px] uppercase tracking-widest border-b border-wine-800 pb-1 text-wine-800 font-bold hover:opacity-80 transition-opacity">
            Ver todos os produtos
          </a>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {MOCK_PRODUCTS.slice(0, 4).map((product, idx) => (
            <ProductCard key={product.id} product={product} index={idx + 1} />
          ))}
        </div>
        
        <div className="mt-8 text-center md:hidden">
          <a href="#" className="inline-block text-[10px] uppercase tracking-widest border-b border-wine-800 pb-1 text-wine-800 font-bold hover:opacity-80 transition-opacity">
            Ver todos os produtos
          </a>
        </div>
      </section>
      
      {/* Categories Banner */}
      <section className="bg-zinc-50 py-16 px-4 md:px-8 mb-16 rounded-sm relative overflow-hidden">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="font-serif text-2xl md:text-3xl text-wine-900 tracking-tight mb-8">Compre por Categoria</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Roupas', 'Acessórios', 'Beleza', 'Cuidado Corporal'].map((cat) => (
              <div key={cat} className="bg-white p-6 md:p-8 hover:shadow-md transition-shadow cursor-pointer border border-wine-100 flex items-center justify-center min-h-[120px]">
                <span className="font-sans text-sm font-medium text-wine-800 tracking-wider uppercase">{cat}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
