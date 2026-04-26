import { useState } from 'react';
import { useProductStore, Department } from '../store/useProductStore';
import { Product } from '../store/useCartStore';
import { uploadImageToSupabase } from '../lib/storage';
import { Plus, Trash2, Edit2, X, Upload } from 'lucide-react';

export function Admin() {
  const { logoUrl, setLogoUrl, products, addProduct, updateProduct, removeProduct, departments, setDepartments } = useProductStore();
  
  const [activeTab, setActiveTab] = useState<'products' | 'settings'>('products');

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState('');
  
  // Product Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    department: '',
    category: '',
    installments: '1',
    paymentType: 'À vista'
  });
  const [productImagesFiles, setProductImagesFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [isUploadingProduct, setIsUploadingProduct] = useState(false);
  const [productError, setProductError] = useState('');

  // Settings State
  const [newDeptName, setNewDeptName] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const [selectedDeptForCat, setSelectedDeptForCat] = useState('');

  const BUCKET_NAME = 'Imagens';

  // --- SETTINGS (DEPARTMENTS) HANDLERS ---
  const handleAddDept = () => {
    if (!newDeptName.trim()) return;
    const exists = departments.find(d => d.name.toLowerCase() === newDeptName.toLowerCase());
    if (!exists) {
      setDepartments([...departments, { name: newDeptName, categories: [] }]);
    }
    setNewDeptName('');
  };

  const handleAddCat = () => {
    if (!newCatName.trim() || !selectedDeptForCat) return;
    const updated = departments.map(d => {
      if (d.name === selectedDeptForCat && !d.categories.includes(newCatName)) {
        return { ...d, categories: [...d.categories, newCatName] };
      }
      return d;
    });
    setDepartments(updated);
    setNewCatName('');
  };

  const handleRemoveDept = (deptName: string) => {
    setDepartments(departments.filter(d => d.name !== deptName));
  };

  const handleRemoveCat = (deptName: string, catName: string) => {
    setDepartments(departments.map(d => 
      d.name === deptName ? { ...d, categories: d.categories.filter(c => c !== catName) } : d
    ));
  };

  // --- FILE HANDLERS ---
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingLogo(true);
      setLogoError('');
      const fileExt = file.name.split('.').pop();
      const path = `brand/logo-${Date.now()}.${fileExt}`;
      const url = await uploadImageToSupabase(BUCKET_NAME, path, file);
      await setLogoUrl(url);
    } catch (err: any) {
      setLogoError(`Falha no envio. Detalhe: ${err.message}`);
    } finally {
      setIsUploadingLogo(false);
      e.target.value = '';
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const totalImages = existingImages.length + productImagesFiles.length + files.length;
      if (totalImages > 8) {
        setProductError('Máximo de 8 imagens por produto allowed.');
        return;
      }
      setProductImagesFiles(prev => [...prev, ...files]);
    }
  };

  const removeSelectedFile = (index: number) => {
    setProductImagesFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (url: string) => {
    setExistingImages(prev => prev.filter(img => img !== url));
  };

  const startEditProduct = (p: Product) => {
    setEditingId(p.id);
    setProductForm({
      name: p.name,
      description: p.description,
      price: p.price.toString(),
      department: p.department || '',
      category: p.category,
      installments: p.installments?.toString() || '1',
      paymentType: p.paymentType || 'À vista'
    });
    setExistingImages(p.images || [p.imageUrl]);
    setProductImagesFiles([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setProductForm({ name: '', description: '', price: '', department: '', category: '', installments: '1', paymentType: 'À vista' });
    setExistingImages([]);
    setProductImagesFiles([]);
    setProductError('');
  };

  // --- PRODUCT SUBMIT ---
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (existingImages.length === 0 && productImagesFiles.length === 0) {
      setProductError('O produto precisa ter pelo menos uma imagem.');
      return;
    }

    try {
      setIsUploadingProduct(true);
      setProductError('');
      
      const uploadedUrls: string[] = [];
      for (const file of productImagesFiles) {
        const fileExt = file.name.split('.').pop();
        const path = `products/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        const url = await uploadImageToSupabase(BUCKET_NAME, path, file);
        uploadedUrls.push(url);
      }
      
      const allImages = [...existingImages, ...uploadedUrls];
      
      const payload: Partial<Product> = {
        name: productForm.name,
        description: productForm.description,
        price: parseFloat(productForm.price),
        department: productForm.department,
        category: productForm.category,
        installments: parseInt(productForm.installments) || 1,
        paymentType: productForm.paymentType,
        imageUrl: allImages[0], // primary
        images: allImages
      };

      if (editingId) {
        await updateProduct(editingId, payload);
      } else {
        await addProduct({
          ...payload,
          id: Date.now().toString()
        } as Product);
      }

      cancelEdit();
    } catch (err: any) {
      setProductError(`Falha ao salvar produto. Detalhe: ${err.message}`);
    } finally {
      setIsUploadingProduct(false);
    }
  };

  const selectedDeptCategories = departments.find(d => d.name === productForm.department)?.categories || [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 w-full">
      <h1 className="font-serif text-3xl text-zinc-900 mb-8">Área Administrativa</h1>
      
      <div className="flex border-b border-zinc-200 mb-8">
        <button 
          className={`py-2 px-6 font-semibold text-sm uppercase tracking-wider ${activeTab === 'products' ? 'border-b-2 border-wine-800 text-wine-800' : 'text-zinc-500'}`}
          onClick={() => setActiveTab('products')}
        >
          Produtos
        </button>
        <button 
          className={`py-2 px-6 font-semibold text-sm uppercase tracking-wider ${activeTab === 'settings' ? 'border-b-2 border-wine-800 text-wine-800' : 'text-zinc-500'}`}
          onClick={() => setActiveTab('settings')}
        >
          Configurações (Dep/Cat)
        </button>
      </div>

      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 border border-zinc-100">
            <h2 className="font-sans font-semibold uppercase tracking-widest text-sm text-wine-800 mb-6">Logo</h2>
            <div className="border border-zinc-200 p-4 flex flex-col items-center mb-6 overflow-hidden relative group">
              {logoUrl ? <img src={logoUrl} className="max-h-24 mix-blend-multiply" /> : <span className="text-zinc-400">Sem logo</span>}
              <label className="mt-4 cursor-pointer bg-wine-800 text-white px-4 py-2 text-xs uppercase font-bold hover:bg-wine-900">
                {isUploadingLogo ? 'Enviando...' : 'Fazer Upload'}
                <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={isUploadingLogo} />
              </label>
              {logoError && <p className="text-red-500 text-xs mt-2">{logoError}</p>}
            </div>
          </div>

          <div className="bg-white p-6 border border-zinc-100">
            <h2 className="font-sans font-semibold uppercase tracking-widest text-sm text-wine-800 mb-6">Departamentos e Categorias</h2>
            
            <div className="flex gap-2 mb-4">
              <input 
                type="text" placeholder="Novo Departamento" value={newDeptName} onChange={e => setNewDeptName(e.target.value)}
                className="flex-1 border p-2 text-sm focus:border-wine-800 outline-none"
              />
              <button onClick={handleAddDept} className="bg-wine-800 text-white px-4 rounded-sm hover:bg-wine-900"><Plus size={16} /></button>
            </div>
            
            <div className="flex gap-2 mb-8">
              <select 
                value={selectedDeptForCat} onChange={e => setSelectedDeptForCat(e.target.value)}
                className="w-1/3 border p-2 text-sm focus:border-wine-800 outline-none"
              >
                <option value="">Selecione Depto</option>
                {departments.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
              </select>
              <input 
                type="text" placeholder="Nova Categoria" value={newCatName} onChange={e => setNewCatName(e.target.value)}
                className="flex-1 border p-2 text-sm focus:border-wine-800 outline-none"
              />
              <button onClick={handleAddCat} className="bg-wine-800 text-white px-4 rounded-sm hover:bg-wine-900"><Plus size={16} /></button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {departments.map(dept => (
                <div key={dept.name} className="border border-zinc-200 p-3">
                  <div className="flex justify-between items-center mb-2">
                    <strong className="text-wine-800">{dept.name}</strong>
                    <button onClick={() => handleRemoveDept(dept.name)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {dept.categories.map(cat => (
                      <span key={cat} className="bg-zinc-100 text-xs px-2 py-1 rounded-sm flex items-center gap-1">
                        {cat}
                        <button onClick={() => handleRemoveCat(dept.name, cat)} className="text-red-400 hover:text-red-600 ml-1"><X size={12}/></button>
                      </span>
                    ))}
                    {dept.categories.length === 0 && <span className="text-xs text-zinc-400">Nenhuma categoria</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'products' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-white p-6 border border-zinc-100 h-fit lg:sticky lg:top-24">
            <h2 className="font-sans font-semibold uppercase tracking-widest text-sm text-wine-800 mb-6">
              {editingId ? 'Editar Produto' : 'Novo Produto'}
            </h2>
            
            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Nome</label>
                <input required type="text" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} className="w-full border p-2 text-sm outline-none" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Preço (R$)</label>
                  <input required type="number" step="0.01" min="0" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} className="w-full border p-2 text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Pagamento</label>
                  <select value={productForm.paymentType} onChange={e => setProductForm({...productForm, paymentType: e.target.value})} className="w-full border p-2 text-sm outline-none">
                    <option value="À vista">À vista</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Pix">Pix</option>
                  </select>
                </div>
              </div>

              {productForm.paymentType === 'Cartão de Crédito' && (
                <div>
                  <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Máx de Parcelas</label>
                  <input type="number" min="1" max="24" value={productForm.installments} onChange={e => setProductForm({...productForm, installments: e.target.value})} className="w-full border p-2 text-sm outline-none" />
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Departamento</label>
                  <select required value={productForm.department} onChange={e => setProductForm({...productForm, department: e.target.value, category: ''})} className="w-full border p-2 text-sm outline-none">
                    <option value="">Selecione...</option>
                    {departments.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Categoria</label>
                  <select required value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})} className="w-full border p-2 text-sm outline-none">
                    <option value="">Selecione...</option>
                    {selectedDeptCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Descrição</label>
                <textarea required value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} className="w-full border p-2 text-sm h-20 outline-none resize-none" />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1 flex justify-between">
                  <span>Imagens (Máx 8)</span>
                  <span className="font-normal">{existingImages.length + productImagesFiles.length}/8</span>
                </label>
                
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {existingImages.map((img, i) => (
                    <div key={i} className="relative group aspect-[3/4] border border-zinc-200 bg-zinc-50">
                      <img src={img} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeExistingImage(img)} className="absolute top-1 right-1 bg-white rounded-full p-0.5 text-red-500 shadow hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"><X size={14}/></button>
                    </div>
                  ))}
                  {productImagesFiles.map((file, i) => (
                    <div key={i} className="relative group aspect-[3/4] border border-zinc-200 bg-zinc-50">
                      <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeSelectedFile(i)} className="absolute top-1 right-1 bg-white rounded-full p-0.5 text-red-500 shadow hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"><X size={14}/></button>
                    </div>
                  ))}
                  {(existingImages.length + productImagesFiles.length) < 8 && (
                    <label className="aspect-[3/4] border border-dashed border-zinc-300 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-50 text-zinc-400 hover:text-wine-800 transition-colors">
                      <Upload size={20} />
                      <span className="text-[10px] mt-1 font-semibold uppercase">Adicionar</span>
                      <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageSelect} />
                    </label>
                  )}
                </div>
              </div>

              {productError && <p className="text-red-500 text-xs">{productError}</p>}

              <div className="flex gap-2 mt-4">
                {editingId && (
                  <button type="button" onClick={cancelEdit} className="flex-1 bg-zinc-200 text-zinc-800 py-3 text-xs uppercase font-bold hover:bg-zinc-300 transition-colors">
                    Cancelar
                  </button>
                )}
                <button type="submit" disabled={isUploadingProduct} className="flex-2 bg-wine-800 text-white w-full py-3 text-xs uppercase tracking-widest font-bold hover:bg-wine-900 transition-colors disabled:opacity-50">
                  {isUploadingProduct ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-2">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map(p => (
                <div key={p.id} className="border border-zinc-100 p-3 bg-white relative group">
                  <div className="aspect-[3/4] mb-3 overflow-hidden bg-zinc-50">
                    <img src={p.imageUrl} className="w-full h-full object-cover" />
                  </div>
                  <h4 className="font-semibold text-sm truncate">{p.name}</h4>
                  <p className="text-wine-800 text-sm italic mb-1">R$ {p.price.toFixed(2)}</p>
                  <p className="text-xs text-zinc-500 truncate">{p.department} &gt; {p.category}</p>
                  
                  <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEditProduct(p)} className="p-2 bg-white text-zinc-700 shadow border border-zinc-100 hover:text-wine-800 hover:border-wine-200"><Edit2 size={14}/></button>
                    <button onClick={() => removeProduct(p.id)} className="p-2 bg-white text-red-500 shadow border border-zinc-100 hover:text-red-700 hover:border-red-200"><Trash2 size={14}/></button>
                  </div>
                </div>
              ))}
              {products.length === 0 && <p className="text-zinc-500 text-sm col-span-full">Nenhum produto cadastrado.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
