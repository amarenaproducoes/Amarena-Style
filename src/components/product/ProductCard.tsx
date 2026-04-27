import { Link } from 'react-router-dom';
import { Product } from '../../store/useCartStore';
import { formatPrice } from '../../lib/utils';
import { Heart } from 'lucide-react';
import React from 'react';
import { motion } from 'motion/react';
import { useProductStore } from '../../store/useProductStore';

interface ProductCardProps {
  product: Product;
  index?: number;
  key?: React.Key;
}

export function ProductCard({ product, index }: ProductCardProps) {
  const { favorites, toggleFavorite } = useProductStore();
  const isFavorite = favorites.includes(product.id);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      className="group cursor-pointer flex flex-col h-full"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-zinc-50 mb-3 flex items-center justify-center">
        {index !== undefined && (
          <div className="absolute w-24 h-24 border border-wine-800/20 rounded-full flex items-center justify-center text-wine-800/10 font-serif text-4xl pointer-events-none z-0">
            {index.toString().padStart(2, '0')}
          </div>
        )}
        
        {/* Label/Etiqueta */}
        {product.label && (
          <div className="absolute top-0 left-0 z-20 overflow-hidden w-24 h-24 pointer-events-none">
            <div className="bg-wine-800 text-white text-[10px] font-bold uppercase tracking-tighter w-[160%] h-7 -rotate-45 -translate-x-[32%] translate-y-[18%] shadow-lg shadow-black/20 border-b border-white/10 flex items-center justify-center">
              <span className="whitespace-nowrap w-full text-center block leading-none">{product.label}</span>
            </div>
          </div>
        )}

        <Link to={`/produto/${product.id}`} className="block w-full h-full z-10">
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105 mix-blend-multiply"
            loading="lazy"
          />
        </Link>
        <button 
          onClick={(e) => {
            e.preventDefault();
            toggleFavorite(product.id);
          }}
          className={`absolute top-3 right-3 p-2 z-20 rounded-full backdrop-blur-md transition-all ${isFavorite ? 'bg-wine-50 text-wine-800' : 'bg-white/50 text-zinc-600 hover:bg-white hover:text-wine-800'}`}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
      </div>

      <div className="flex flex-col flex-1 px-1 text-center">
        <Link to={`/produto/${product.id}`}>
          <h5 className="font-sans text-xs font-semibold mb-1 text-zinc-900 group-hover:text-wine-800 transition-colors line-clamp-1">
            {product.name}
          </h5>
        </Link>
        <div className="flex items-center justify-center gap-1.5 mb-3">
          {product.originalPrice && product.originalPrice > product.price && (
            <>
              <span className="text-zinc-400 text-[10px] line-through font-serif font-light">
                {formatPrice(product.originalPrice)}
              </span>
              <p className="text-wine-800 text-sm font-serif italic">
                {formatPrice(product.price)}
              </p>
              <span className="text-red-600 text-[10px] font-bold ml-0.5">
                -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
              </span>
            </>
          )}
          {(!product.originalPrice || product.originalPrice <= product.price) && (
            <p className="text-wine-800 text-sm font-serif italic">
              {formatPrice(product.price)}
            </p>
          )}
        </div>
        <Link 
          to={`/produto/${product.id}`}
          className="w-full py-2 mt-auto text-[10px] uppercase tracking-widest border border-wine-800 text-wine-800 font-bold hover:bg-wine-800 hover:text-white transition-colors text-center inline-block"
        >
          Ver Detalhes
        </Link>
      </div>
    </motion.div>
  );
}
