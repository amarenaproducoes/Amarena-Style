import { useProductStore } from '../store/useProductStore';
import { MOCK_PRODUCTS } from '../data/mock';
import { ProductCard } from '../components/product/ProductCard';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';

export function Favorites() {
  const { products: registeredProducts, favorites } = useProductStore();
  
  const allProducts = [...registeredProducts, ...MOCK_PRODUCTS].filter(p => p.isActive !== false);
  const favoriteProducts = allProducts.filter(p => favorites.includes(p.id));

  return (
    <div className="flex flex-col min-h-screen px-4 md:px-8 max-w-7xl mx-auto w-full pt-8 pb-16">
      <div className="mb-8 border-b border-zinc-100 pb-4">
        <h1 className="font-serif text-3xl md:text-4xl text-zinc-900 tracking-tight flex items-center gap-3">
          <Heart className="w-8 h-8 md:w-10 md:h-10 text-wine-800 fill-wine-800" />
          Meus Favoritos
        </h1>
        <p className="text-zinc-500 mt-2 text-sm">
          {favoriteProducts.length} {favoriteProducts.length === 1 ? 'produto salvo' : 'produtos salvos'}
        </p>
      </div>

      {favoriteProducts.length > 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {favoriteProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center flex-1 bg-zinc-50 border border-zinc-100 rounded-sm">
          <Heart className="w-16 h-16 text-zinc-300 mb-4" />
          <h2 className="font-serif text-2xl text-zinc-900 mb-2">Nenhum favorito ainda</h2>
          <p className="text-zinc-500 text-sm mb-8 max-w-sm">
            Navegue pelos nossos departamentos e clique no coração para salvar os produtos que você mais gostou.
          </p>
          <Link 
            to="/" 
            className="bg-wine-800 text-white px-8 py-3 text-xs uppercase tracking-widest font-bold hover:bg-wine-900 transition-colors"
          >
            Começar a explorar
          </Link>
        </div>
      )}
    </div>
  );
}
