import React, { useState } from 'react';
import { useProductStore, Department } from '../store/useProductStore';
import { Product } from '../store/useCartStore';
import { uploadImageToSupabase } from '../lib/storage';
import { Plus, Trash2, Edit2, X, Upload } from 'lucide-react';

export function Admin() {
  const { logoUrl, setLogoUrl, products, addProduct, updateProduct, removeProduct, departments, setDepartments, banners, setBanners, sizeGuides, updateSizeGuide } = useProductStore();
  
  const [activeTab, setActiveTab] = useState<'products' | 'settings' | 'banners' | 'sizeGuides'>('products');

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
    paymentType: 'À vista',
    colors: '', // Comma separated
    sizes: '',   // Comma separated
    referenceCode: '',
    sizeGuide: '' as '' | 'male' | 'female',
    isNew: false,
    isActive: true
  });
  const [productImagesFiles, setProductImagesFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [isUploadingProduct, setIsUploadingProduct] = useState(false);
  const [productError, setProductError] = useState('');
  
  // Banner State
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [bannerForm, setBannerForm] = useState({
    title: '',
    subtitle: '',
    link: '',
    productId: '',
    active: true
  });
  const [bannerImageFile, setBannerImageFile] = useState<File | null>(null);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [bannerError, setBannerError] = useState('');

  // Settings State
  const [newDeptName, setNewDeptName] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const [selectedDeptForCat, setSelectedDeptForCat] = useState('');
  
  // Size Guide State
  const [editingSizeGuideId, setEditingSizeGuideId] = useState<'male' | 'female'>('male');
  const [sizeGuideSaving, setSizeGuideSaving] = useState(false);

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
      paymentType: p.paymentType || 'À vista',
      colors: p.colors?.join(', ') || '',
      sizes: p.sizes?.join(', ') || '',
      referenceCode: p.referenceCode || '',
      sizeGuide: p.sizeGuide as ('' | 'male' | 'female') || '',
      isNew: p.isNew || false,
      isActive: p.isActive !== false
    });
    setExistingImages(p.images || [p.imageUrl]);
    setProductImagesFiles([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setProductForm({ 
      name: '', 
      description: '', 
      price: '', 
      department: '', 
      category: '', 
      installments: '1', 
      paymentType: 'À vista', 
      colors: '', 
      sizes: '',
      referenceCode: '',
      sizeGuide: '',
      isNew: false,
      isActive: true
    });
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
        colors: productForm.colors.split(',').map(s => s.trim()).filter(Boolean),
        sizes: productForm.sizes.split(',').map(s => s.trim()).filter(Boolean),
        referenceCode: productForm.referenceCode,
        sizeGuide: productForm.sizeGuide || undefined,
        isNew: productForm.isNew,
        isActive: productForm.isActive,
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

  // --- BANNER HANDLERS ---
  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsUploadingBanner(true);
      setBannerError('');
      
      let imageUrl = '';
      if (bannerImageFile) {
        const fileExt = bannerImageFile.name.split('.').pop();
        const path = `banners/${Date.now()}.${fileExt}`;
        imageUrl = await uploadImageToSupabase(BUCKET_NAME, path, bannerImageFile);
      } else if (bannerForm.productId) {
        const product = products.find(p => p.id === bannerForm.productId);
        imageUrl = product?.images?.[0] || product?.imageUrl || '';
      } else if (editingBannerId) {
        imageUrl = banners.find(b => b.id === editingBannerId)?.imageUrl || '';
      }

      if (!imageUrl && !editingBannerId) {
        setBannerError('Selecione uma imagem ou um produto para o banner.');
        setIsUploadingBanner(false);
        return;
      }

      const bannerData = {
        id: editingBannerId || Date.now().toString(),
        imageUrl,
        title: bannerForm.title,
        subtitle: bannerForm.subtitle,
        link: bannerForm.productId ? `/produto/${bannerForm.productId}` : bannerForm.link,
        productId: bannerForm.productId || undefined,
        active: bannerForm.active
      };

      if (editingBannerId) {
        setBanners(banners.map(b => b.id === editingBannerId ? bannerData : b));
      } else {
        setBanners([...banners, bannerData]);
      }

      cancelBannerEdit();
    } catch (err: any) {
      setBannerError(`Erro ao salvar banner: ${err.message}`);
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const cancelBannerEdit = () => {
    setEditingBannerId(null);
    setBannerForm({ title: '', subtitle: '', link: '', productId: '', active: true });
    setBannerImageFile(null);
    setBannerError('');
  };

  const startEditBanner = (b: any) => {
    setEditingBannerId(b.id);
    setBannerForm({
      title: b.title,
      subtitle: b.subtitle,
      link: b.link || '',
      productId: b.productId || '',
      active: b.active
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const removeBanner = (id: string) => {
    setBanners(banners.filter(b => b.id !== id));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 w-full">
      <h1 className="font-serif text-3xl text-zinc-900 mb-8">Área Administrativa</h1>
      
      <div className="flex flex-wrap border-b border-zinc-200 mb-8 gap-2 pb-2">
        <button 
          className={`py-2 px-4 md:px-6 font-semibold text-sm uppercase tracking-wider whitespace-nowrap ${activeTab === 'products' ? 'border-b-2 border-wine-800 text-wine-800' : 'text-zinc-500'}`}
          onClick={() => setActiveTab('products')}
        >
          Produtos
        </button>
        <button 
          className={`py-2 px-4 md:px-6 font-semibold text-sm uppercase tracking-wider whitespace-nowrap ${activeTab === 'banners' ? 'border-b-2 border-wine-800 text-wine-800' : 'text-zinc-500'}`}
          onClick={() => setActiveTab('banners')}
        >
          Banners
        </button>
        <button 
          className={`py-2 px-4 md:px-6 font-semibold text-sm uppercase tracking-wider whitespace-nowrap ${activeTab === 'settings' ? 'border-b-2 border-wine-800 text-wine-800' : 'text-zinc-500'}`}
          onClick={() => setActiveTab('settings')}
        >
          Configurações
        </button>
        <button 
          className={`py-2 px-4 md:px-6 font-semibold text-sm uppercase tracking-wider whitespace-nowrap ${activeTab === 'sizeGuides' ? 'border-b-2 border-wine-800 text-wine-800' : 'text-zinc-500'}`}
          onClick={() => setActiveTab('sizeGuides')}
        >
          Guias de Medidas
        </button>
      </div>

      {activeTab === 'banners' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 bg-white p-6 border border-zinc-100 h-fit">
            <h2 className="font-sans font-semibold uppercase tracking-widest text-sm text-wine-800 mb-6">
              {editingBannerId ? 'Editar Banner' : 'Novo Banner'}
            </h2>
            <form onSubmit={handleSaveBanner} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Vincular Produto (Opcional)</label>
                <select 
                  value={bannerForm.productId} 
                  onChange={e => {
                    const pId = e.target.value;
                    const p = products.find(x => x.id === pId);
                    setBannerForm({
                      ...bannerForm, 
                      productId: pId,
                      title: p ? p.name : bannerForm.title,
                      subtitle: p ? p.description.substring(0, 100) : bannerForm.subtitle
                    });
                  }} 
                  className="w-full border p-2 text-sm outline-none"
                >
                  <option value="">Nenhum (Upload manual)</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.referenceCode})</option>
                  ))}
                </select>
                {bannerForm.productId && <p className="text-[10px] text-wine-800 mt-1">Usará a primeira imagem do produto selecionado.</p>}
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Título</label>
                <input required type="text" value={bannerForm.title} onChange={e => setBannerForm({...bannerForm, title: e.target.value})} className="w-full border p-2 text-sm outline-none" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Subtítulo</label>
                <input type="text" value={bannerForm.subtitle} onChange={e => setBannerForm({...bannerForm, subtitle: e.target.value})} className="w-full border p-2 text-sm outline-none" />
              </div>
              {!bannerForm.productId && (
                <>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Link (Opcional)</label>
                    <input type="text" value={bannerForm.link} onChange={e => setBannerForm({...bannerForm, link: e.target.value})} className="w-full border p-2 text-sm outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Imagem</label>
                    <input type="file" accept="image/*" onChange={e => setBannerImageFile(e.target.files?.[0] || null)} className="w-full border p-2 text-sm outline-none" />
                    {editingBannerId && !bannerImageFile && <p className="text-[10px] text-zinc-400 mt-1 italic">Deixe em branco para manter a imagem atual</p>}
                  </div>
                </>
              )}
              <div className="flex items-center gap-2">
                <input type="checkbox" id="banner-active" checked={bannerForm.active} onChange={e => setBannerForm({...bannerForm, active: e.target.checked})} />
                <label htmlFor="banner-active" className="text-sm text-zinc-700">Banner Ativo</label>
              </div>
              
              {bannerError && <p className="text-red-500 text-xs">{bannerError}</p>}

              <div className="flex gap-2">
                {editingBannerId && (
                  <button type="button" onClick={cancelBannerEdit} className="flex-1 bg-zinc-200 text-zinc-800 py-3 text-xs uppercase font-bold hover:bg-zinc-300 transition-colors">
                    Cancelar
                  </button>
                )}
                <button type="submit" disabled={isUploadingBanner} className="flex-[2] bg-wine-800 text-white py-3 text-xs uppercase font-bold hover:bg-wine-900 transition-colors disabled:opacity-50">
                  {isUploadingBanner ? 'Salvando...' : 'Salvar Banner'}
                </button>
              </div>
            </form>
          </div>
          
          <div className="md:col-span-2 space-y-4">
            {banners.map(b => (
              <div key={b.id} className="bg-white border border-zinc-100 p-4 flex gap-4 items-center">
                <img src={b.imageUrl} className="w-32 h-20 object-cover bg-zinc-50 border border-zinc-100" />
                <div className="flex-1 overflow-hidden">
                  <h4 className="font-semibold text-sm truncate">{b.title}</h4>
                  <p className="text-xs text-zinc-500 truncate">{b.subtitle}</p>
                  <span className={`text-[10px] uppercase font-bold ${b.active ? 'text-green-600' : 'text-zinc-400'}`}>
                    {b.active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <button onClick={() => startEditBanner(b)} className="p-2 bg-zinc-50 text-zinc-700 hover:text-wine-800 transition-colors"><Edit2 size={16}/></button>
                  <button onClick={() => removeBanner(b.id)} className="p-2 bg-zinc-50 text-red-400 hover:text-red-600 transition-colors"><Trash2 size={16}/></button>
                </div>
              </div>
            ))}
            {banners.length === 0 && <p className="text-zinc-500 text-sm italic">Nenhum banner cadastrado.</p>}
          </div>
        </div>
      )}

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
            
            <h3 className="text-xs uppercase tracking-widest text-zinc-500 mb-2 mt-8">Adicionar Categoria ao Departamento</h3>
            <div className="flex flex-col md:flex-row gap-2 mb-8">
              <select 
                value={selectedDeptForCat} onChange={e => setSelectedDeptForCat(e.target.value)}
                className="w-full md:w-1/3 border p-2 text-sm focus:border-wine-800 outline-none"
              >
                <option value="">Selecione Depto</option>
                {departments.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
              </select>
              <div className="flex gap-2 flex-1">
                <input 
                  type="text" placeholder="Nova Categoria" value={newCatName} onChange={e => setNewCatName(e.target.value)}
                  className="flex-1 border p-2 text-sm focus:border-wine-800 outline-none"
                />
                <button onClick={handleAddCat} className="bg-wine-800 text-white px-4 rounded-sm hover:bg-wine-900"><Plus size={16} /></button>
              </div>
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

      {activeTab === 'sizeGuides' && (
        <div className="bg-white p-6 md:p-8 border border-zinc-100">
          <div className="flex gap-4 mb-8">
            <button 
              className={`py-2 px-6 text-sm uppercase tracking-widest font-semibold border ${editingSizeGuideId === 'male' ? 'border-wine-800 text-wine-800 bg-wine-50/50' : 'border-zinc-200 text-zinc-500'}`}
              onClick={() => setEditingSizeGuideId('male')}
            >
              Masculino
            </button>
            <button 
              className={`py-2 px-6 text-sm uppercase tracking-widest font-semibold border ${editingSizeGuideId === 'female' ? 'border-wine-800 text-wine-800 bg-wine-50/50' : 'border-zinc-200 text-zinc-500'}`}
              onClick={() => setEditingSizeGuideId('female')}
            >
              Feminino
            </button>
          </div>
          
          {(() => {
            const guide = sizeGuides.find(s => s.id === editingSizeGuideId);
            if (!guide) return <div className="text-sm text-zinc-500">Guia de medidas não encontrado no banco de dados.</div>;
            
            return (
              <div className="space-y-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse border border-zinc-200">
                    <thead>
                      <tr>
                        {guide.dimensions.columns.map((col, cIdx) => (
                          <th key={cIdx} className="py-3 px-4 border border-zinc-200 bg-zinc-50 text-wine-800 uppercase tracking-widest text-xs font-semibold text-center h-12">
                            {cIdx === 0 ? "Tamanho" : col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {guide.dimensions.rows.map((row, rIdx) => (
                        <tr key={rIdx}>
                          <td className="py-2 px-4 border border-zinc-200 bg-zinc-50 font-semibold text-zinc-700 w-48">
                            <input 
                              type="text" 
                              className="w-full bg-transparent outline-none focus:border-wine-800 border-b border-transparent py-1"
                              value={row.label}
                              onChange={(e) => {
                                const newGuide = JSON.parse(JSON.stringify(guide));
                                newGuide.dimensions.rows[rIdx].label = e.target.value;
                                updateSizeGuide(newGuide);
                              }}
                            />
                          </td>
                          {row.values.map((val, vIdx) => (
                            <td key={vIdx} className="border border-zinc-200 text-center h-12">
                              {/* Keep inputs full width of td for easy clicking */}
                              <input 
                                type="text"
                                className="w-full h-full text-center outline-none focus:bg-wine-50 transition-colors"
                                value={val}
                                onChange={(e) => {
                                  const newGuide = JSON.parse(JSON.stringify(guide));
                                  newGuide.dimensions.rows[rIdx].values[vIdx] = e.target.value;
                                  updateSizeGuide(newGuide);
                                }}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-zinc-500 italic">As edições são salvas automaticamente.</p>
              </div>
            );
          })()}
        </div>
      )}

      {activeTab === 'products' && (
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="w-full lg:w-1/3 bg-white p-6 border border-zinc-100 lg:sticky lg:top-24 flex-shrink-0">
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
                  <select required value={productForm.paymentType} onChange={e => setProductForm({...productForm, paymentType: e.target.value})} className="w-full border p-2 text-sm outline-none">
                    <option value="À vista">À vista</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Pix">Pix</option>
                  </select>
                </div>
              </div>

              {productForm.paymentType === 'Cartão de Crédito' && (
                <div>
                  <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Máx de Parcelas</label>
                  <input required type="number" min="1" max="24" value={productForm.installments} onChange={e => setProductForm({...productForm, installments: e.target.value})} className="w-full border p-2 text-sm outline-none" />
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Cores (separadas por vírgula)</label>
                  <input type="text" value={productForm.colors} onChange={e => setProductForm({...productForm, colors: e.target.value})} placeholder="Azul, Rosa, Verde" className="w-full border p-2 text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Tamanhos (separados por vírgula)</label>
                  <input type="text" value={productForm.sizes} onChange={e => setProductForm({...productForm, sizes: e.target.value})} placeholder="P, M, G, GG" className="w-full border p-2 text-sm outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Cód. Referência (5 dig.)</label>
                  <input required type="text" maxLength={5} value={productForm.referenceCode} onChange={e => setProductForm({...productForm, referenceCode: e.target.value})} placeholder="REF01" className="w-full border p-2 text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Guia de Medidas</label>
                  <select value={productForm.sizeGuide} onChange={e => setProductForm({...productForm, sizeGuide: e.target.value as any})} className="w-full border p-2 text-sm outline-none">
                    <option value="">Nenhum</option>
                    <option value="male">Masculino</option>
                    <option value="female">Feminino</option>
                  </select>
                </div>
              </div>

              <div className="flex items-end pb-2 gap-4">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={productForm.isNew} onChange={e => setProductForm({...productForm, isNew: e.target.checked})} className="w-4 h-4 text-wine-800" />
                    <span className="text-xs uppercase tracking-widest text-zinc-500">Novidade</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={productForm.isActive} onChange={e => setProductForm({...productForm, isActive: e.target.checked})} className="w-4 h-4 text-wine-800" />
                    <span className="text-xs uppercase tracking-widest text-zinc-500">Ativo no site</span>
                  </label>
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
                <button type="submit" disabled={isUploadingProduct} className="flex-[2] bg-wine-800 text-white w-full py-3 text-xs uppercase tracking-widest font-bold hover:bg-wine-900 transition-colors disabled:opacity-50">
                  {isUploadingProduct ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>

          <div className="w-full lg:w-2/3">
            <h2 className="font-sans font-semibold uppercase tracking-widest text-sm text-wine-800 mb-6">
              Produtos Cadastrados ({products.length})
            </h2>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 text-left">
              {products.map(p => (
                <div key={p.id} className="bg-white border border-zinc-100 p-4 flex gap-4 items-center group shadow-sm transition-shadow hover:shadow-md relative">
                  <img src={p.imageUrl} className="w-20 h-24 object-cover bg-zinc-100 border border-zinc-100" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] text-zinc-400 font-mono tracking-tighter">{p.referenceCode || 'REF: -'}</span>
                      {p.isNew && <span className="text-[9px] bg-wine-800 text-white px-1.5 py-0.5 font-bold uppercase tracking-widest">New</span>}
                      {p.isActive === false && <span className="text-[9px] bg-zinc-200 text-zinc-600 px-1.5 py-0.5 font-bold uppercase tracking-widest">Inativo</span>}
                    </div>
                    <h4 className="font-semibold text-sm truncate text-zinc-900 mb-1">{p.name}</h4>
                    <p className="text-[11px] text-zinc-500 truncate">{p.department} › {p.category}</p>
                    <div className="mt-2 font-mono font-bold text-sm text-wine-800">
                      R$ {p.price.toFixed(2)}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={() => startEditProduct(p)}
                      className="p-2.5 bg-zinc-50 text-zinc-600 hover:text-wine-800 hover:bg-wine-50 transition-all rounded-sm border border-zinc-100 flex items-center justify-center"
                      title="Editar Produto"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => {
                        if (window.confirm(`Deseja realmente excluir o produto "${p.name}"?`)) {
                          removeProduct(p.id);
                        }
                      }}
                      className="p-2.5 bg-zinc-50 text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-all rounded-sm border border-zinc-100 flex items-center justify-center"
                      title="Excluir Produto"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {products.length === 0 && (
                <div className="col-span-full py-16 text-center border-2 border-dashed border-zinc-100 rounded-sm">
                  <p className="text-zinc-400 text-sm italic">Nenhum produto cadastrado no sistema.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
