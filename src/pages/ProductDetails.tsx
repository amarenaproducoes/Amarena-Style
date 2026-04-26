import { useParams, useNavigate } from 'react-router-dom';
import { MOCK_PRODUCTS } from '../data/mock';
import { useState } from 'react';
import { useCartStore } from '../store/useCartStore';
import { useProductStore } from '../store/useProductStore';
import { formatPrice } from '../lib/utils';
import { ChevronRight, Heart, Share2, Ruler } from 'lucide-react';
import { ProductCard } from '../components/product/ProductCard';

export function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem, openCart } = useCartStore();
  const { products: registeredProducts } = useProductStore();
  
  const allProducts = [...registeredProducts, ...MOCK_PRODUCTS];
  const product = allProducts.find(p => p.id === id);
  const [selectedOption, setSelectedOption] = useState<string | undefined>(
    product?.options ? product.options[0] : undefined
  );
  
  const [selectedImage, setSelectedImage] = useState(product?.images?.[0] || product?.imageUrl);
  
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
      return; // Do not proceed
    }
    addItem(product, selectedOption);
  };

  const relatedProducts = allProducts.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);

  const imagesList = product.images && product.images.length > 0 ? product.images : [product.imageUrl];

  const renderPaymentInfo = () => {
    if (product.installments && product.installments > 1 && product.paymentType === 'Cartão de Crédito') {
      return `em até ${product.installments}x de ${formatPrice(product.price / product.installments)} sem juros`;
    }
    return `Pagamento ${product.paymentType || 'À vista'}`;
  };

  return (
    <div className="min-h-screen">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        <nav className="flex items-center space-x-2 text-xs font-sans text-zinc-500">
          <button onClick={() => navigate('/')} className="hover:text-wine-800 transition-colors">Home</button>
          <ChevronRight className="w-3 h-3" />
          <span className="hover:text-wine-800 transition-colors cursor-pointer">{product.department || 'Produtos'}</span>
          <ChevronRight className="w-3 h-3" />
          <span className="hover:text-wine-800 transition-colors cursor-pointer">{product.category}</span>
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
                <button className="p-2 bg-white rounded-full text-zinc-600 hover:text-wine-800 shadow-sm">
                  <Heart className="w-5 h-5" />
                </button>
                <button className="p-2 bg-white rounded-full text-zinc-600 hover:text-wine-800 shadow-sm">
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
              <div className="text-2xl font-sans font-medium text-wine-900">
                {formatPrice(product.price)}
              </div>
              <p className="text-sm font-sans text-zinc-500 mt-2">
                {renderPaymentInfo()}
              </p>
            </div>

            {product.options && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-sans text-sm font-medium uppercase tracking-wide text-zinc-900">
                    Selecione a Opção
                  </span>
                  <button className="flex items-center gap-1 text-xs font-sans text-zinc-500 hover:text-wine-800 transition-colors">
                    <Ruler className="w-3 h-3" /> Guia de Medidas
                  </button>
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
              className="w-full py-4 bg-wine-800 text-white font-sans text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase hover:bg-wine-900 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-wine-800 mb-8"
            >
              Adicionar à Sacola
            </button>

            <div className="prose prose-sm prose-zinc font-sans text-zinc-600 border-t border-zinc-100 pt-8 mt-auto">
              <h3 className="text-zinc-900 font-medium uppercase tracking-wide text-xs mb-4">Descrição do Produto</h3>
              <p>{product.description}</p>
            </div>
            
            <div className="mt-6 border-t border-zinc-100 pt-6">
               <div className="flex items-center gap-2 text-sm font-sans text-zinc-600">
                 <span className="w-full bg-zinc-100 p-3 text-center">Frete Expresso disponível</span>
                 <span className="w-full bg-zinc-100 p-3 text-center">Devolução Grátis</span>
               </div>
            </div>
          </div>
        </div>
      </div>

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
