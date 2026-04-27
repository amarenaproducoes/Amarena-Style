import { Link } from 'react-router-dom';
import { Product } from '../../store/useCartStore';
import { formatPrice } from '../../lib/utils';
import { Heart } from 'lucide-react';
import React, { useState } from 'react';
import { motion } from 'motion/react';

interface ProductCardProps {
  product: Product;
  index?: number;
  key?: React.Key;
}

export function ProductCard({ product, index }: ProductCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      className="group cursor-pointer flex flex-col"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-zinc-50 mb-3 flex items-center justify-center">
        {index !== undefined && (
          <div className="absolute w-24 h-24 border border-wine-800/20 rounded-full flex items-center justify-center text-wine-800/10 font-serif text-4xl pointer-events-none z-0">
            {index.toString().padStart(2, '0')}
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
            setIsFavorite(!isFavorite);
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
        <p className="text-wine-800 text-sm font-serif italic mb-3">
          {formatPrice(product.price)}
        </p>
        <Link 
          to={`/produto/${product.id}`}
          className="w-full py-2 text-[10px] uppercase tracking-widest border border-wine-800 text-wine-800 font-bold hover:bg-wine-800 hover:text-white transition-colors text-center inline-block"
        >
          Ver Detalhes
        </Link>
      </div>
    </motion.div>
  );
}
