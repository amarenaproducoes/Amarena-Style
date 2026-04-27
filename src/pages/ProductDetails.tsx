import { useParams, useNavigate } from 'react-router-dom';
import React, { useState, useEffect, useRef } from 'react';
import { useCartStore } from '../store/useCartStore';
import { useProductStore } from '../store/useProductStore';
import { formatPrice } from '../lib/utils';
import { ChevronRight, Heart, Share2, Ruler, X } from 'lucide-react';
import { ProductCard } from '../components/product/ProductCard';

export function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem, openCart } = useCartStore();
  const { products: registeredProducts, sizeGuides, favorites, toggleFavorite, registerView } = useProductStore();
  
  const allProducts = registeredProducts.filter(p => p.isActive !== false);
  const product = allProducts.find(p => p.id === id);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const registeredId = useRef<string | null>(null);
  
  useEffect(() => {
    if (id && registeredId.current !== id) {
      registerView(id);
      registeredId.current = id;
    }
  }, [id, registerView]);

  const [selectedOption, setSelectedOption] = useState<string | undefined>(
    product?.options ? product.options[0] : undefined
  );
  const [selectedColor, setSelectedColor] = useState<string | undefined>(
    product?.colors ? product.colors[0] : undefined
  );
  const [selectedSize, setSelectedSize] = useState<string | undefined>(
    product?.sizes ? product.sizes[0] : undefined
  );
  
  const [selectedImage, setSelectedImage] = useState(product?.images?.[0] || product?.imageUrl);
  
  useEffect(() => {
    if (product) {
      setSelectedImage(product.images?.[0] || product.imageUrl);
      setSelectedOption(product.options ? product.options[0] : undefined);
      setSelectedColor(product.colors ? product.colors[0] : undefined);
      setSelectedSize(product.sizes ? product.sizes[0] : undefined);
    }
  }, [product]);
  
  if (!product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <h2 className="font-serif text-2xl text-zinc-900 mb-4">Produto não encontrado</h2>
        <button 
          onClick={() => navigate('/')}
          className="px-6 py-2 border border-wine-800 text-wine-800 hover:bg-wine-50 transition-colors font-sans text-sm"
        >
          Voltar para Home
        </button>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (product.options && !selectedOption) {
      alert('Por favor, selecione uma opção.');
      return;
    }
    if (product.colors && product.colors.length > 0 && !selectedColor) {
      alert('Por favor, selecione uma cor.');
      return;
    }
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      alert('Por favor, selecione um tamanho.');
      return;
    }
    
    // Create a variant description for the cart
    const options: string[] = [];
    if (selectedOption) options.push(selectedOption);
    if (selectedColor) options.push(`Cor: ${selectedColor}`);
    if (selectedSize) options.push(`Tam: ${selectedSize}`);
    
    addItem(product, options.join(' | '));
  };

  const relatedProducts = allProducts.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);

  const imagesList = product.images && product.images.length > 0 ? product.images : [product.imageUrl];

  const renderPaymentInfo = () => {
    if (product.installments && product.installments > 1 && product.paymentType === 'Cartão de Crédito') {
      return `em até ${product.installments}x de ${formatPrice(product.price / product.installments)} sem juros`;
    }
    return `Pagamento ${product.paymentType || 'À vista'}`;
  };

  const handleShare = async () => {
    const shareData = {
      title: product.name,
      text: 'Olha que demais esse produto que vi no Site do Amarena Style!',
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      const waLink = `https://wa.me/?text=${encodeURIComponent(shareData.text + ' ' + shareData.url)}`;
      window.open(waLink, '_blank');
    }
  };

  return (
    <div className="min-h-screen">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        <nav className="flex items-center space-x-2 text-xs font-sans text-zinc-500">
          <button onClick={() => { useProductStore.getState().setFilter(null); navigate('/'); }} className="hover:text-wine-800 transition-colors">Home</button>
          <ChevronRight className="w-3 h-3" />
          <span 
            onClick={() => { useProductStore.getState().setFilter({ department: product.department }); navigate('/'); }}
            className="hover:text-wine-800 transition-colors cursor-pointer"
          >
            {product.department || 'Produtos'}
          </span>
          <ChevronRight className="w-3 h-3" />
          <span 
            onClick={() => { useProductStore.getState().setFilter({ department: product.department, category: product.category }); navigate('/'); }}
            className="hover:text-wine-800 transition-colors cursor-pointer"
          >
            {product.category}
          </span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-zinc-900">{product.name}</span>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 pb-16 md:pb-24">
        <div className="flex flex-col md:flex-row gap-8 lg:gap-16">
          {/* Images */}
          <div className="w-full md:w-1/2">
            <div className="aspect-[3/4] bg-zinc-100 relative group">
              <img 
                src={selectedImage} 
                alt={product.name} 
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => product && toggleFavorite(product.id)}
                  className={`p-2 rounded-full shadow-sm transition-colors ${
                    product && favorites.includes(product.id) 
                      ? 'bg-wine-50 text-wine-800' 
                      : 'bg-white text-zinc-600 hover:text-wine-800'
                  }`}
                  aria-label="Adicionar aos favoritos"
                >
                  <Heart className={`w-5 h-5 ${product && favorites.includes(product.id) ? 'fill-current' : ''}`} />
                </button>
                <button onClick={handleShare} className="p-2 bg-white rounded-full text-zinc-600 hover:text-wine-800 shadow-sm">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>
            {/* Thumbnails */}
            <div className="grid grid-cols-4 gap-2 mt-2">
              {imagesList.map((img, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setSelectedImage(img)}
                  className={`aspect-[3/4] bg-zinc-100 cursor-pointer ${selectedImage === img ? 'border border-wine-800' : 'opacity-70 hover:opacity-100'}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="w-full md:w-1/2 flex flex-col">
            <div className="mb-6">
              <h1 className="font-serif text-3xl md:text-4xl text-zinc-900 tracking-tight leading-tight mb-4">
                {product.name}
              </h1>
              
              <div className="prose prose-sm prose-zinc font-sans text-zinc-600 mb-6">
                <p>{product.description}</p>
              </div>

              <div className="flex items-center gap-4 mb-2">
                <div className="text-2xl font-sans font-medium text-wine-900">
                  {formatPrice(product.price)}
                </div>
                {product.originalPrice && product.originalPrice > product.price && (
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400 text-lg line-through font-serif font-light">
                      {formatPrice(product.originalPrice)}
                    </span>
                    <span className="text-red-600 text-xs font-bold bg-red-50 px-2 py-1 rounded-sm">
                      -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                    </span>
                  </div>
                )}
              </div>
              <p className="text-sm font-sans text-zinc-500 mt-2 mb-2">
                {renderPaymentInfo()}
              </p>

              {product.referenceCode && (
                <p className="text-[10px] text-zinc-400 tracking-wider uppercase font-mono">Ref: {product.referenceCode}</p>
              )}
            </div>

            {product.colors && product.colors.length > 0 && (
              <div className="mb-6 border-t border-zinc-100 pt-6">
                <span className="block font-sans text-sm font-medium uppercase tracking-wide text-zinc-900 mb-3">
                  Cor: <span className="font-normal text-zinc-500">{selectedColor}</span>
                </span>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2 border font-sans text-xs transition-all
                        ${selectedColor === color 
                          ? 'border-zinc-900 bg-zinc-900 text-white' 
                          : 'border-zinc-200 text-zinc-700 hover:border-zinc-900'
                        }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-sans text-sm font-medium uppercase tracking-wide text-zinc-900">
                    Tamanho
                  </span>
                  {product.sizeGuide && (
                    <button onClick={() => setIsSizeGuideOpen(true)} className="flex items-center gap-1 text-xs font-sans text-zinc-500 hover:text-wine-800 transition-colors">
                      <Ruler className="w-3 h-3" /> Guia de Medidas
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-[3rem] px-4 py-2 border font-sans text-sm transition-all
                        ${selectedSize === size 
                          ? 'border-wine-800 bg-wine-800 text-white' 
                          : 'border-zinc-200 text-zinc-700 hover:border-wine-800 hover:text-wine-800'
                        }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {product.options && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-sans text-sm font-medium uppercase tracking-wide text-zinc-900">
                    Selecione a Opção
                  </span>
                  {product.sizeGuide && (
                    <button onClick={() => setIsSizeGuideOpen(true)} className="flex items-center gap-1 text-xs font-sans text-zinc-500 hover:text-wine-800 transition-colors">
                      <Ruler className="w-3 h-3" /> Guia de Medidas
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  {product.options.map((option) => (
                    <button
                      key={option}
                      onClick={() => setSelectedOption(option)}
                      className={`min-w-[3rem] px-4 py-2 border font-sans text-sm transition-all
                        ${selectedOption === option 
                          ? 'border-wine-800 bg-wine-800 text-white' 
                          : 'border-zinc-200 text-zinc-700 hover:border-wine-800 hover:text-wine-800'
                        }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button 
              onClick={handleAddToCart}
              className="w-full py-4 bg-wine-800 text-white font-sans text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase hover:bg-wine-900 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-wine-800 mb-8 mt-auto"
            >
              Adicionar à Sacola
            </button>
          </div>
        </div>
      </div>

      {/* Size Guide Modal */}
      {isSizeGuideOpen && product.sizeGuide && sizeGuides.find(s => s.id === product.sizeGuide) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-sm relative p-6 md:p-8">
            <button 
              onClick={() => setIsSizeGuideOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-black transition-colors"
            >
              <X size={24} />
            </button>
            
            <h2 className="text-xl font-serif text-wine-800 mb-6 text-center border-b border-zinc-100 pb-4">
              Guia de Medidas - {sizeGuides.find(s => s.id === product.sizeGuide)?.name}
            </h2>
            
            <div className="flex flex-col md:flex-row gap-8 items-center md:items-start justify-center">
              {/* T-Shirt Illustration */}
              <div className="w-full md:w-1/3 flex justify-center flex-shrink-0">
                <svg viewBox="0 0 300 350" className="w-full max-w-[300px] drop-shadow-sm mx-auto">
                  {/* Back/Inside Collar */}
                  <path 
                    d="M 115,30 Q 150,45 185,30 Q 150,55 115,30 Z" 
                    className="fill-zinc-300 stroke-zinc-800" 
                    strokeWidth="2.5" 
                  />
                  
                  {/* T-Shirt Base */}
                  <path 
                    d="M 115,30 Q 150,55 185,30 L 270,75 L 245,125 L 210,105 L 210,310 Q 150,315 90,310 L 90,105 L 55,125 L 30,75 Z" 
                    className="fill-white stroke-zinc-800" 
                    strokeWidth="2.5" 
                    strokeLinejoin="round" 
                  />
                  
                  {/* Collar Front Ribbing Line */}
                  <path 
                    d="M 110,25 Q 150,52 190,25" 
                    className="fill-none stroke-zinc-800" 
                    strokeWidth="2.5" 
                  />

                  {/* Sleeve Seams */}
                  <path d="M 75,54 Q 85,80 90,105" className="stroke-zinc-800" strokeWidth="1.5" fill="none" opacity="0.6"/>
                  <path d="M 225,54 Q 215,80 210,105" className="stroke-zinc-800" strokeWidth="1.5" fill="none" opacity="0.6"/>

                  {/* Measurement 1: Width */}
                  <path d="M 90,150 L 210,150" className="stroke-zinc-400" strokeWidth="2.5" strokeDasharray="6 6" />
                  <circle cx="210" cy="150" r="7" className="fill-zinc-400" />
                  <circle cx="90" cy="150" r="16" className="fill-wine-900 stroke-white" strokeWidth="2" />
                  <text x="90" y="155" fill="white" fontSize="14" fontWeight="bold" textAnchor="middle">1</text>

                  {/* Measurement 2: Height */}
                  <path d="M 125,40 L 125,311" className="stroke-zinc-400" strokeWidth="2.5" strokeDasharray="6 6" />
                  <circle cx="125" cy="311" r="7" className="fill-zinc-400" />
                  <circle cx="125" cy="25" r="16" className="fill-wine-900 stroke-white" strokeWidth="2" />
                  <text x="125" y="30" fill="white" fontSize="14" fontWeight="bold" textAnchor="middle">2</text>
                </svg>
              </div>

              {/* Table */}
              <div className="w-full md:w-2/3 overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse min-w-[400px]">
                  <thead>
                    <tr>
                      {sizeGuides.find(s => s.id === product.sizeGuide)?.dimensions.columns.map((col, i) => (
                        <th key={col} className={`py-3 px-4 ${i === 0 ? 'text-zinc-500' : 'text-wine-800 text-center'} font-semibold uppercase tracking-wider bg-zinc-50 border border-zinc-200`}>
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sizeGuides.find(s => s.id === product.sizeGuide)?.dimensions.rows.map((row, idx) => (
                      <tr key={row.label}>
                        <td className="py-3 px-4 border border-zinc-200 font-semibold flex items-center gap-2 text-zinc-700 bg-white">
                          {idx === 1 && <span className="w-6 h-6 rounded-full bg-wine-800 text-white flex items-center justify-center text-xs flex-shrink-0">1</span>}
                          {idx === 2 && <span className="w-6 h-6 rounded-full bg-wine-800 text-white flex items-center justify-center text-xs flex-shrink-0">2</span>}
                          {row.label}
                        </td>
                        {row.values.map((v, i) => (
                          <td key={i} className="py-3 px-4 border border-zinc-200 text-center text-zinc-600 bg-white">
                            {v}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-xs text-zinc-500 mt-4 italic">As medidas estão em centímetros.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compre Junto / Relacionados */}
      {relatedProducts.length > 0 && (
        <section className="bg-zinc-50 py-16 px-4 md:px-8">
          <div className="max-w-7xl mx-auto">
            <h2 className="font-serif text-2xl text-zinc-900 tracking-tight mb-8 text-center">Compre Junto</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
