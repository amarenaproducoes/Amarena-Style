import { useState } from 'react';
import { useProductStore } from '../store/useProductStore';
import { uploadImageToSupabase } from '../lib/storage';

export function Admin() {
  const { logoUrl, setLogoUrl, products, addProduct, removeProduct } = useProductStore();
  
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState('');
  
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
  });
  const [productImage, setProductImage] = useState<File | null>(null);
  const [isUploadingProduct, setIsUploadingProduct] = useState(false);
  const [productError, setProductError] = useState('');

  // IMPORTANT: Ensure you have created a public bucket named "Imagens Amarena Style" in your Supabase project
  const BUCKET_NAME = 'Imagens Amarena Style';

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingLogo(true);
      setLogoError('');
      const path = `brand/logo-${Date.now()}-${file.name}`;
      const url = await uploadImageToSupabase(BUCKET_NAME, path, file);
      setLogoUrl(url);
    } catch (err: any) {
      setLogoError(`Erro ao fazer upload do logo. Certifique-se de que o bucket "${BUCKET_NAME}" existe e é público no Supabase. Detalhes: ${err.message}`);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productImage) {
      setProductError('Por favor, selecione uma imagem para o produto.');
      return;
    }

    try {
      setIsUploadingProduct(true);
      setProductError('');
      
      const path = `products/${Date.now()}-${productImage.name}`;
      const imageUrl = await uploadImageToSupabase(BUCKET_NAME, path, productImage);
      
      addProduct({
        id: Date.now().toString(),
        name: newProduct.name,
        description: newProduct.description,
        price: parseFloat(newProduct.price),
        category: newProduct.category,
        imageUrl,
      });

      setNewProduct({ name: '', description: '', price: '', category: '' });
      setProductImage(null);
      // Reset input file
      const fileInput = document.getElementById('product-image') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (err: any) {
      setProductError(`Erro ao cadastrar produto. Certifique-se de que o bucket "${BUCKET_NAME}" existe e é público. Detalhes: ${err.message}`);
    } finally {
      setIsUploadingProduct(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 w-full">
      <h1 className="font-serif text-3xl text-zinc-900 mb-8">Área Administrativa</h1>
      
      <div className="bg-amber-50 border border-amber-200 p-4 mb-4 text-sm text-amber-800 space-y-2">
        <p><strong>Aviso Supabase Storage:</strong> Para que os uploads funcionem, você precisa ter criado um bucket chamado <strong>"{BUCKET_NAME}"</strong> no Storage do Supabase e definido ele como <strong>Público</strong>.</p>
        <p><strong>Aviso Supabase Database:</strong> Para que as informações migrem automaticamente, crie as tabelas abaixo no SQL Editor do Supabase:</p>
        <pre className="bg-white p-3 text-xs overflow-x-auto border border-amber-100 font-mono mt-2">
{`CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT,
  description TEXT,
  price NUMERIC,
  category TEXT,
  "imageUrl" TEXT,
  options JSONB
);

CREATE TABLE settings (
  id TEXT PRIMARY KEY,
  value TEXT
);`}
        </pre>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Logo Section */}
        <div className="bg-zinc-50 p-6 md:p-8 border border-zinc-100 flex flex-col items-center justify-center text-center">
          <h2 className="font-sans font-semibold uppercase tracking-widest text-sm text-wine-800 mb-6">Logotipo do Site</h2>
          
          <div className="w-full aspect-[3/1] bg-white border-2 border-dashed border-zinc-200 flex items-center justify-center mb-6 overflow-hidden relative group">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain p-4 mix-blend-multiply" />
            ) : (
              <span className="text-zinc-400 font-sans text-sm">Nenhum logo cadastrado</span>
            )}
            
            <div className="absolute inset-0 bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <label className="cursor-pointer bg-wine-800 text-white px-6 py-2 text-xs uppercase tracking-widest font-bold hover:bg-wine-900 transition-colors">
                {isUploadingLogo ? 'Enviando...' : 'Alterar Logo'}
                <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={isUploadingLogo} />
              </label>
            </div>
          </div>
          
          {logoError && <p className="text-red-500 text-xs mt-2">{logoError}</p>}
        </div>

        {/* Product Registration Section */}
        <div className="bg-white p-6 md:p-8 border border-zinc-100">
          <h2 className="font-sans font-semibold uppercase tracking-widest text-sm text-wine-800 mb-6">Cadastrar Produto</h2>
          
          <form onSubmit={handleAddProduct} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Nome</label>
              <input 
                required
                type="text" 
                value={newProduct.name}
                onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                className="w-full border border-zinc-200 p-2 text-sm focus:outline-none focus:border-wine-800"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Preço (R$)</label>
                <input 
                  required
                  type="number" 
                  step="0.01"
                  min="0"
                  value={newProduct.price}
                  onChange={e => setNewProduct({...newProduct, price: e.target.value})}
                  className="w-full border border-zinc-200 p-2 text-sm focus:outline-none focus:border-wine-800"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Categoria</label>
                <input 
                  required
                  type="text" 
                  placeholder="Ex: Acessórios"
                  value={newProduct.category}
                  onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                  className="w-full border border-zinc-200 p-2 text-sm focus:outline-none focus:border-wine-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Descrição</label>
              <textarea 
                required
                value={newProduct.description}
                onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                className="w-full border border-zinc-200 p-2 text-sm h-24 resize-none focus:outline-none focus:border-wine-800"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Foto do Produto (Supabase Storage)</label>
              <input 
                id="product-image"
                required
                type="file" 
                accept="image/*"
                onChange={e => setProductImage(e.target.files?.[0] || null)}
                className="w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:border-0 file:text-xs file:uppercase file:tracking-widest file:font-semibold file:bg-wine-50 file:text-wine-800 hover:file:bg-wine-100"
              />
            </div>

            {productError && <p className="text-red-500 text-xs">{productError}</p>}

            <button 
              type="submit" 
              disabled={isUploadingProduct}
              className="w-full bg-wine-800 text-white py-3 text-xs uppercase tracking-[0.2em] font-bold hover:bg-wine-900 transition-colors disabled:opacity-50 mt-4"
            >
              {isUploadingProduct ? 'Salvando...' : 'Cadastrar Produto'}
            </button>
          </form>
        </div>
      </div>

      {/* Cadastrados */}
      <div className="mt-16">
        <h2 className="font-serif text-2xl text-zinc-900 mb-6">Produtos Cadastrados ({products.length})</h2>
        {products.length === 0 ? (
          <p className="text-zinc-500 text-sm">Nenhum produto cadastrado pela área administrativa ainda.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {products.map(p => (
              <div key={p.id} className="flex gap-4 border border-zinc-100 p-4 relative group">
                <img src={p.imageUrl} alt={p.name} className="w-20 h-24 object-cover" />
                <div>
                  <h4 className="font-semibold text-sm">{p.name}</h4>
                  <p className="text-wine-800 text-sm italic">R$ {p.price.toFixed(2)}</p>
                  <p className="text-xs text-zinc-500 mt-1">{p.category}</p>
                </div>
                <button 
                  onClick={() => removeProduct(p.id)}
                  className="absolute top-2 right-2 text-red-500 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Excluir
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
