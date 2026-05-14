import React, { useState } from 'react';
import { useProductStore, Department } from '../store/useProductStore';
import { useAuthStore } from '../store/useAuthStore';
import { formatPrice } from '../lib/utils';
import { Product } from '../store/useCartStore';
import { uploadImageToSupabase } from '../lib/storage';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Edit2, X, Upload, LogOut, Package, History, Settings as SettingsIcon, ShieldCheck, Link as LinkIcon, Check, Copy, Ticket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { slugify } from '../utils/slugify';

export function Admin() {
  const { 
    logoUrl, setLogoUrl, products, addProduct, updateProduct, removeProduct, 
    departments, setDepartments, banners, setBanners, sizeGuides, updateSizeGuide,
    pinnedProductIds, setPinnedProducts, getProductViewsInRange,
    getCartClicksInRange,
    announcement, setAnnouncement,
    socialConfig, setSocialConfig,
    isStockSystemEnabled, setStockSystemEnabled,
    inventoryMovements, adjustStock
  } = useProductStore();

  const logout = useAuthStore(state => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    if (window.confirm('Deseja realmente sair do painel administrativo?')) {
      logout();
      navigate('/');
    }
  };
  
  const [activeTab, setActiveTab] = useState<'products' | 'settings' | 'banners' | 'sizeGuides' | 'ranking' | 'coupons' | 'sales' | 'analytics' | 'inventory' | 'links'>('products');
  
  // Link Central State
  const [linkCouponId, setLinkCouponId] = useState<string>('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedDeptNames, setSelectedDeptNames] = useState<string[]>([]);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const handleCopyLinks = (type: 'products' | 'departments') => {
    const baseUrl = window.location.origin;
    const coupon = coupons.find(c => c.id === linkCouponId);
    const couponParam = coupon ? `?cupom=${coupon.code}` : '';
    let text = '';

    if (type === 'products') {
      const activeProducts = products.filter(p => p.isActive !== false);
      const selectedProducts = activeProducts.filter(p => selectedProductIds.includes(p.id));
      text = selectedProducts.map(p => `${baseUrl}/produto/${p.referenceCode}${couponParam}`).join('\n');
    } else {
      text = selectedDeptNames.map(dept => `${baseUrl}/${slugify(dept)}${couponParam}`).join('\n');
    }

    if (!text) {
      alert('Selecione pelo menos um item para copiar.');
      return;
    }

    navigator.clipboard.writeText(text).then(() => {
      setCopyStatus(type);
      setTimeout(() => setCopyStatus(null), 2000);
    });
  };

  // Inventory state
  const [stockAdjustment, setStockAdjustment] = useState({
    productId: '',
    quantity: '',
    reason: '',
    type: 'in' as 'in' | 'out' | 'adjustment'
  });
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [inventorySearch, setInventorySearch] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'positive' | 'zero'>('all');

  const [announcementForm, setAnnouncementForm] = useState({
    text: '',
    link: '',
    active: false
  });

  const [socialForm, setSocialForm] = useState({
    instagram: '',
    whatsapp: ''
  });

  React.useEffect(() => {
    if (announcement) {
      setAnnouncementForm({
        text: announcement.text,
        link: announcement.link || '',
        active: announcement.active
      });
    }
  }, [announcement]);

  React.useEffect(() => {
    if (socialConfig) {
      setSocialForm({
        instagram: socialConfig.instagram,
        whatsapp: socialConfig.whatsapp
      });
    }
  }, [socialConfig]);

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setAnnouncement(announcementForm);
      alert('Faixa de anúncio salva com sucesso!');
    } catch (err: any) {
      alert(`Erro ao salvar anúncio: ${err.message}`);
    }
  };

  const handleSaveSocial = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setSocialConfig(socialForm);
      alert('Configurações sociais salvas com sucesso!');
    } catch (err: any) {
      alert(`Erro ao salvar links: ${err.message}`);
    }
  };

  // Analytics State
  const [analyticsData, setAnalyticsData] = useState<{
    combinations: Array<{ p1: string, p2: string, count: number }>,
    matrix: Record<string, Record<string, number>>,
    topProducts: string[]
  }>({ combinations: [], matrix: {}, topProducts: [] });
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  const fetchAnalyticsData = async () => {
    setIsLoadingAnalytics(true);
    try {
      // Buscar todos os itens de compras agrupados por purchase_id
      const { data: items, error } = await supabase
        .from('purchase_items')
        .select('purchase_id, product_id');
      
      if (error) throw error;

      const purchaseGroups: Record<string, string[]> = {};
      const productCounts: Record<string, number> = {};

      items?.forEach(item => {
        if (!purchaseGroups[item.purchase_id]) purchaseGroups[item.purchase_id] = [];
        purchaseGroups[item.purchase_id].push(item.product_id);
        productCounts[item.product_id] = (productCounts[item.product_id] || 0) + 1;
      });

      const combinations: Record<string, number> = {};
      const matrix: Record<string, Record<string, number>> = {};

      Object.values(purchaseGroups).forEach(pIds => {
        const uniqueIds = [...new Set(pIds)];
        if (uniqueIds.length < 2) return;

        for (let i = 0; i < uniqueIds.length; i++) {
          for (let j = i + 1; j < uniqueIds.length; j++) {
            const [idA, idB] = [uniqueIds[i], uniqueIds[j]].sort();
            const key = `${idA}|${idB}`;
            combinations[key] = (combinations[key] || 0) + 1;

            if (!matrix[idA]) matrix[idA] = {};
            if (!matrix[idB]) matrix[idB] = {};
            matrix[idA][idB] = (matrix[idA][idB] || 0) + 1;
            matrix[idB][idA] = (matrix[idB][idA] || 0) + 1;
          }
        }
      });

      const formattedCombinations = Object.entries(combinations)
        .map(([key, count]) => {
          const [p1, p2] = key.split('|');
          return { p1, p2, count };
        })
        .sort((a, b) => b.count - a.count);

      const topProducts = Object.entries(productCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([id]) => id);

      setAnalyticsData({ combinations: formattedCombinations, matrix, topProducts });
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  React.useEffect(() => {
    if (activeTab === 'analytics') {
      fetchAnalyticsData();
    }
  }, [activeTab]);

  // Sales Data State
  const [salesData, setSalesData] = useState<{
    [key: string]: {
      sold7: number;
      soldMonth: number;
      soldPrevMonth: number;
      rev7: number;
      revMonth: number;
      revPrevMonth: number;
    }
  }>({});
  const [isLoadingSales, setIsLoadingSales] = useState(false);
  const [conversionData, setConversionData] = useState<{
    [key: string]: {
      clicks7: number;
      clicksMonth: number;
      clicksTotal: number;
    }
  }>({});

  const fetchSalesData = async () => {
    setIsLoadingSales(true);
    try {
      const now = new Date();
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);
      
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const firstDayOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      const fetchRange = async (start: Date, end: Date | null = null) => {
        let query = supabase
          .from('purchase_items')
          .select('product_id, quantity, total_price')
          .gte('created_at', start.toISOString());
        
        if (end) {
          query = query.lte('created_at', end.toISOString());
        }

        const { data } = await query;
        const stats: Record<string, { qty: number, val: number }> = {};
        data?.forEach(item => {
          if (item.product_id) {
            if (!stats[item.product_id]) stats[item.product_id] = { qty: 0, val: 0 };
            stats[item.product_id].qty += item.quantity;
            stats[item.product_id].val += Number(item.total_price || 0);
          }
        });
        return stats;
      };

      const fetchAllTimeSales = async () => {
        const { data } = await supabase
          .from('purchase_items')
          .select('product_id, quantity');
        
        const stats: Record<string, { qty: number }> = {};
        data?.forEach(item => {
          if (item.product_id) {
            if (!stats[item.product_id]) stats[item.product_id] = { qty: 0 };
            stats[item.product_id].qty += item.quantity;
          }
        });
        return stats;
      };

      const [s7, sm, sp, stotal, c7, cm, ctotal] = await Promise.all([
        fetchRange(sevenDaysAgo),
        fetchRange(firstDayOfMonth),
        fetchRange(firstDayOfPrevMonth, lastDayOfPrevMonth),
        fetchAllTimeSales(),
        getCartClicksInRange(7),
        getCartClicksInRange(0), // Month
        getCartClicksInRange(-2) // Total
      ]);

      const merged: any = {};
      const conv: any = {};
      products.forEach(p => {
        merged[p.id] = {
          sold7: s7[p.id]?.qty || 0,
          soldMonth: sm[p.id]?.qty || 0,
          soldPrevMonth: sp[p.id]?.qty || 0,
          soldTotal: stotal[p.id]?.qty || 0,
          rev7: s7[p.id]?.val || 0,
          revMonth: sm[p.id]?.val || 0,
          revPrevMonth: sp[p.id]?.val || 0
        };
        conv[p.id] = {
          clicks7: c7[p.id] || 0,
          clicksMonth: cm[p.id] || 0,
          clicksTotal: ctotal[p.id] || 0
        };
      });
      setSalesData(merged);
      setConversionData(conv);
    } catch (err) {
      console.error('Error fetching sales data:', err);
    } finally {
      setIsLoadingSales(false);
    }
  };

  React.useEffect(() => {
    if (activeTab === 'sales') {
      fetchSalesData();
    }
  }, [activeTab, products]);

  // Coupons State
  const [coupons, setCoupons] = useState<any[]>([]);
  const [couponHistory, setCouponHistory] = useState<any[]>([]);
  const [isLoadingCoupons, setIsLoadingCoupons] = useState(false);
  const [isSavingCoupon, setIsSavingCoupon] = useState(false);
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);
  const [couponForm, setCouponForm] = useState({
    code: '',
    discount_value: '',
    discount_percent: '',
    expiration_date: '',
    qtde_disponivel: '0'
  });

  const fetchCoupons = async () => {
    setIsLoadingCoupons(true);
    try {
      const { data: couponsData } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
      const { data: historyData } = await supabase.from('coupon_history').select('*').order('used_at', { ascending: false });
      setCoupons(couponsData || []);
      setCouponHistory(historyData || []);
    } finally {
      setIsLoadingCoupons(false);
    }
  };

  React.useEffect(() => {
    if (activeTab === 'coupons') {
      fetchCoupons();
    }
  }, [activeTab]);

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCoupon(true);
    try {
      // Set expiration to the very end of the selected day (23:59:59)
      const expirationDate = new Date(`${couponForm.expiration_date}T23:59:59`);
      
      const payload = {
        code: couponForm.code.toUpperCase(),
        discount_value: couponForm.discount_value ? parseFloat(couponForm.discount_value) : null,
        discount_percent: couponForm.discount_percent ? parseFloat(couponForm.discount_percent) : null,
        expiration_date: expirationDate.toISOString(),
        qtde_disponivel: parseInt(couponForm.qtde_disponivel) || 0
      };

      const { error } = editingCouponId 
        ? await supabase.from('coupons').update(payload).eq('id', editingCouponId)
        : await supabase.from('coupons').insert([payload]);

      if (error) {
        console.error('Error saving coupon:', error);
        alert(`Erro ao salvar cupom: ${error.message}`);
        return;
      }
      
      setCouponForm({ code: '', discount_value: '', discount_percent: '', expiration_date: '', qtde_disponivel: '0' });
      setEditingCouponId(null);
      fetchCoupons();
    } catch (err: any) {
      console.error('Unexpected error saving coupon:', err);
      alert('Ocorreu um erro inesperado ao salvar o cupom.');
    } finally {
      setIsSavingCoupon(false);
    }
  };

  const deleteCoupon = async (id: string) => {
    if (!window.confirm('Excluir este cupom?')) return;
    await supabase.from('coupons').delete().eq('id', id);
    fetchCoupons();
  };

  // Ranking data state
  const [rankingData, setRankingData] = useState<{
    [key: string]: {
      views7: number;
      viewsMonth: number;
      viewsPrevMonth: number;
    }
  }>({});
  const [isLoadingRanking, setIsLoadingRanking] = useState(false);
  const [searchProductQuery, setSearchProductQuery] = useState('');

  const filteredAndTotals = React.useMemo(() => {
    const filtered = products
      .filter(p => 
        p.name.toLowerCase().includes(searchProductQuery.toLowerCase()) || 
        p.referenceCode?.toLowerCase().includes(searchProductQuery.toLowerCase()) ||
        (p.department || '').toLowerCase().includes(searchProductQuery.toLowerCase())
      )
      .sort((a, b) => (a.referenceCode || '').localeCompare(b.referenceCode || ''));

    const totals = filtered.reduce((acc, p) => {
      const pData = salesData[p.id];
      const pConv = conversionData[p.id];
      return {
        sold7: acc.sold7 + (pData?.sold7 || 0),
        soldMonth: acc.soldMonth + (pData?.soldMonth || 0),
        soldPrevMonth: acc.soldPrevMonth + (pData?.soldPrevMonth || 0),
        soldTotal: acc.soldTotal + (pData?.soldTotal || 0),
        rev7: acc.rev7 + (pData?.rev7 || 0),
        revMonth: acc.revMonth + (pData?.revMonth || 0),
        revPrevMonth: acc.revPrevMonth + (pData?.revPrevMonth || 0),
        clicks7: acc.clicks7 + (pConv?.clicks7 || 0),
        clicksMonth: acc.clicksMonth + (pConv?.clicksMonth || 0),
        clicksTotal: acc.clicksTotal + (pConv?.clicksTotal || 0),
      };
    }, { 
      sold7: 0, soldMonth: 0, soldPrevMonth: 0, soldTotal: 0, 
      rev7: 0, revMonth: 0, revPrevMonth: 0,
      clicks7: 0, clicksMonth: 0, clicksTotal: 0
    });

    return { filtered, totals };
  }, [products, searchProductQuery, salesData, conversionData]);

  // Fetch ranking data
  const fetchRanking = async () => {
    setIsLoadingRanking(true);
    try {
      const v7 = await getProductViewsInRange(7);
      const vm = await getProductViewsInRange(0);
      const vp = await getProductViewsInRange(-1);

      const merged: any = {};
      products.forEach(p => {
        merged[p.id] = {
          views7: v7[p.id] || 0,
          viewsMonth: vm[p.id] || 0,
          viewsPrevMonth: vp[p.id] || 0
        };
      });
      setRankingData(merged);
    } finally {
      setIsLoadingRanking(false);
    }
  };

  React.useEffect(() => {
    if (activeTab === 'ranking') {
      fetchRanking();
    }
  }, [activeTab, products]);

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
    categories: [] as string[],
    installments: '1',
    paymentType: 'À vista',
    colors: '', // Comma separated
    sizes: '',   // Comma separated
    referenceCode: '',
    sizeGuide: '' as '' | 'male' | 'female',
    originalPrice: '',
    label: '',
    initialStock: '',
    unitCost: '',
    isNew: false,
    isActive: true,
    isHidden: false
  });
  const [productImagesFiles, setProductImagesFiles] = useState<File[]>([]);
  const [productImagesPreviews, setProductImagesPreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
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
        setProductError('Máximo de 8 imagens por produto.');
        return;
      }
      
      const newPreviews = files.map((file: File) => URL.createObjectURL(file));
      setProductImagesFiles(prev => [...prev, ...files]);
      setProductImagesPreviews(prev => [...prev, ...newPreviews]);
      
      if (!coverImageUrl) {
        setCoverImageUrl(newPreviews[0]);
      }
    }
  };

  const removeSelectedFile = (index: number) => {
    const previewToRemove = productImagesPreviews[index];
    setProductImagesFiles(prev => prev.filter((_, i) => i !== index));
    setProductImagesPreviews(prev => prev.filter((_, i) => i !== index));
    if (coverImageUrl === previewToRemove) {
      const remainingExisting = existingImages.length > 0 ? existingImages[0] : null;
      const remainingNew = productImagesPreviews.length > 1 ? (index === 0 ? productImagesPreviews[1] : productImagesPreviews[0]) : null;
      setCoverImageUrl(remainingExisting || remainingNew);
    }
  };

  const removeExistingImage = (url: string) => {
    setExistingImages(prev => prev.filter(img => img !== url));
    if (coverImageUrl === url) {
      const remainingExisting = existingImages.length > 1 ? existingImages.find(img => img !== url) || null : null;
      const remainingNew = productImagesPreviews.length > 0 ? productImagesPreviews[0] : null;
      setCoverImageUrl(remainingExisting || remainingNew);
    }
  };

  const startEditProduct = (p: Product) => {
    setEditingId(p.id);
    setProductForm({
      name: p.name,
      description: p.description,
      price: p.price.toString(),
      department: p.department || '',
      category: p.category,
      categories: p.categories || [p.category],
      installments: p.installments?.toString() || '1',
      paymentType: p.paymentType || 'À vista',
      colors: p.colors?.join(', ') || '',
      sizes: p.sizes?.join(', ') || '',
      referenceCode: p.referenceCode || '',
      sizeGuide: p.sizeGuide as ('' | 'male' | 'female') || '',
      originalPrice: p.originalPrice?.toString() || '',
      label: p.label || '',
      initialStock: p.initialStock?.toString() || '0',
      unitCost: p.unitCost?.toString() || '',
      isNew: p.isNew || false,
      isActive: p.isActive !== false,
      isHidden: p.isHidden || false
    });
    setExistingImages(p.images || [p.imageUrl]);
    setCoverImageUrl(p.imageUrl);
    setProductImagesFiles([]);
    setProductImagesPreviews([]);
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
      categories: [],
      installments: '1', 
      paymentType: 'À vista', 
      colors: '', 
      sizes: '',
      referenceCode: '',
      sizeGuide: '',
      originalPrice: '',
      label: '',
      initialStock: '',
      unitCost: '',
      isNew: false,
      isActive: true,
      isHidden: false
    });
    setExistingImages([]);
    setProductImagesFiles([]);
    setProductImagesPreviews([]);
    setCoverImageUrl(null);
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
      
      // Determine cover image URL
      let finalImageUrl = allImages[0];
      if (coverImageUrl) {
        const existingIdx = existingImages.indexOf(coverImageUrl);
        if (existingIdx !== -1) {
          finalImageUrl = existingImages[existingIdx];
        } else {
          const newIdx = productImagesPreviews.indexOf(coverImageUrl);
          if (newIdx !== -1 && uploadedUrls[newIdx]) {
            finalImageUrl = uploadedUrls[newIdx];
          }
        }
      }
      
      const payload: any = {
        name: productForm.name,
        description: productForm.description,
        price: parseFloat(productForm.price),
        department: productForm.department,
        category: productForm.categories[0] || productForm.category,
        categories: productForm.categories,
        installments: parseInt(productForm.installments) || 1,
        paymentType: productForm.paymentType,
        colors: productForm.colors.split(',').map(s => s.trim()).filter(Boolean),
        sizes: productForm.sizes.split(',').map(s => s.trim()).filter(Boolean),
        referenceCode: productForm.referenceCode.trim(),
        sizeGuide: productForm.sizeGuide || undefined,
        originalPrice: productForm.originalPrice ? parseFloat(productForm.originalPrice) : undefined,
        label: productForm.label || undefined,
        unitCost: productForm.unitCost ? parseFloat(productForm.unitCost) : undefined,
        isNew: productForm.isNew,
        isActive: productForm.isActive,
        isHidden: productForm.isHidden,
        imageUrl: finalImageUrl, 
        images: allImages
      };

      if (!editingId) {
        payload.initialStock = parseInt(productForm.initialStock) || 0;
        payload.currentStock = payload.initialStock;
      }

      // Uniqueness check
      const duplicate = products.find(p => p.id !== editingId && p.referenceCode?.toLowerCase() === productForm.referenceCode.trim().toLowerCase());
      if (duplicate) {
        setProductError(`Este código de referência "${productForm.referenceCode}" já está em uso pelo produto "${duplicate.name}".`);
        setIsUploadingProduct(false);
        return;
      }

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
        imageUrl = product?.imageUrl || product?.images?.[0] || '';
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
        link: bannerForm.productId ? `/produto/${products.find(p => p.id === bannerForm.productId)?.referenceCode || bannerForm.productId}` : bannerForm.link,
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
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl text-zinc-900">Área Administrativa</h1>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 text-xs uppercase tracking-widest text-zinc-400 hover:text-wine-800 transition-colors"
          title="Sair do Painel"
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
      
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
        <button 
          className={`py-2 px-4 md:px-6 font-semibold text-sm uppercase tracking-wider whitespace-nowrap ${activeTab === 'ranking' ? 'border-b-2 border-wine-800 text-wine-800' : 'text-zinc-500'}`}
          onClick={() => setActiveTab('ranking')}
        >
          Ranking e Destaques
        </button>
        <button 
          className={`py-2 px-4 md:px-6 font-semibold text-sm uppercase tracking-wider whitespace-nowrap ${activeTab === 'coupons' ? 'border-b-2 border-wine-800 text-wine-800' : 'text-zinc-500'}`}
          onClick={() => setActiveTab('coupons')}
        >
          Cupons
        </button>
        <button 
          className={`py-2 px-4 md:px-6 font-semibold text-sm uppercase tracking-wider whitespace-nowrap ${activeTab === 'sales' ? 'border-b-2 border-wine-800 text-wine-800' : 'text-zinc-500'}`}
          onClick={() => setActiveTab('sales')}
        >
          Vendas
        </button>
        <button 
          className={`py-2 px-4 md:px-6 font-semibold text-sm uppercase tracking-wider whitespace-nowrap ${activeTab === 'analytics' ? 'border-b-2 border-wine-800 text-wine-800' : 'text-zinc-500'}`}
          onClick={() => setActiveTab('analytics')}
        >
          Análise de Vendas
        </button>
        <button 
          className={`py-2 px-4 md:px-6 font-semibold text-sm uppercase tracking-wider whitespace-nowrap ${activeTab === 'inventory' ? 'border-b-2 border-wine-800 text-wine-800' : 'text-zinc-500'}`}
          onClick={() => setActiveTab('inventory')}
        >
          Estoque
        </button>
        <button 
          className={`py-2 px-4 md:px-6 font-semibold text-sm uppercase tracking-wider whitespace-nowrap ${activeTab === 'links' ? 'border-b-2 border-wine-800 text-wine-800' : 'text-zinc-500'}`}
          onClick={() => {
            setActiveTab('links');
            if (coupons.length === 0) fetchCoupons();
          }}
        >
          Central de Links
        </button>
      </div>

      {activeTab === 'inventory' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 border border-zinc-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Status do Sistema</p>
                <div className="flex items-center gap-2">
                  <Package className={isStockSystemEnabled ? "text-green-600" : "text-zinc-400"} size={20} />
                  <span className={`text-xs font-bold uppercase ${isStockSystemEnabled ? 'text-green-600' : 'text-zinc-500'}`}>
                    {isStockSystemEnabled ? 'Habilitado' : 'Desabilitado'}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setStockSystemEnabled(!isStockSystemEnabled)}
                className={`text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-sm transition-colors ${isStockSystemEnabled ? 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200' : 'bg-wine-800 text-white hover:bg-wine-900'}`}
              >
                {isStockSystemEnabled ? 'Desativar' : 'Ativar'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 bg-white p-6 border border-zinc-100 h-fit">
              <h2 className="font-sans font-semibold uppercase tracking-widest text-sm text-wine-800 mb-6 flex items-center gap-2">
                <Plus size={18} /> Ajuste Manual
              </h2>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const qtyValue = Math.abs(parseInt(stockAdjustment.quantity));
                if (!stockAdjustment.productId || !qtyValue || !stockAdjustment.reason) return;

                if (stockAdjustment.type === 'out') {
                  const product = products.find(p => p.id === stockAdjustment.productId);
                  if (product && (product.currentStock || 0) < qtyValue) {
                    alert('Saldo insuficiente para realizar esta saída.');
                    return;
                  }
                }

                setIsAdjusting(true);
                try {
                  await adjustStock(
                    stockAdjustment.productId,
                    stockAdjustment.type,
                    qtyValue,
                    stockAdjustment.reason
                  );
                  setStockAdjustment({ productId: '', quantity: '', reason: '', type: 'in' });
                  alert('Ajuste realizado com sucesso!');
                } catch (err: any) {
                  alert('Erro ao ajustar estoque: ' + err.message);
                } finally {
                  setIsAdjusting(false);
                }
              }} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1 font-bold">Produto</label>
                  <select 
                    required 
                    value={stockAdjustment.productId} 
                    onChange={e => setStockAdjustment({...stockAdjustment, productId: e.target.value})}
                    className="w-full border p-2 text-sm outline-none focus:border-wine-800"
                  >
                    <option value="">Selecione o produto...</option>
                    {[...products]
                      .sort((a, b) => (a.referenceCode || '').localeCompare(b.referenceCode || ''))
                      .map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.referenceCode})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1 font-bold">Tipo de Movimentação</label>
                  <select 
                    required 
                    value={stockAdjustment.type} 
                    onChange={e => setStockAdjustment({...stockAdjustment, type: e.target.value as any})}
                    className="w-full border p-2 text-sm outline-none focus:border-wine-800"
                  >
                    <option value="in">Entrada (+)</option>
                    <option value="out">Saída (-)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1 font-bold">Quantidade</label>
                  <input 
                    required 
                    type="number" 
                    min="1"
                    value={stockAdjustment.quantity} 
                    onChange={e => setStockAdjustment({...stockAdjustment, quantity: e.target.value})}
                    className="w-full border p-2 text-sm outline-none focus:border-wine-800"
                    placeholder="Ex: 5"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1 font-bold">Motivo</label>
                  <input 
                    required 
                    type="text" 
                    value={stockAdjustment.reason} 
                    onChange={e => setStockAdjustment({...stockAdjustment, reason: e.target.value})}
                    className="w-full border p-2 text-sm outline-none focus:border-wine-800"
                    placeholder="Ex: Correção de inventário"
                  />
                </div>
                <button type="submit" disabled={isAdjusting} className="w-full bg-wine-800 text-white py-3 text-xs uppercase font-bold tracking-widest hover:bg-wine-900 disabled:opacity-50 transition-colors">
                  {isAdjusting ? 'Processando...' : 'Confirmar Ajuste'}
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 border border-zinc-100 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                  <h2 className="font-sans font-semibold uppercase tracking-widest text-sm text-wine-800 flex items-center gap-2">
                    <Package size={18} /> Saldo de Produtos
                  </h2>
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                    <input 
                      type="text"
                      placeholder="Filtrar por nome, código ou departamento..."
                      value={inventorySearch}
                      onChange={e => setInventorySearch(e.target.value)}
                      className="text-xs border p-2 w-full md:w-64 outline-none focus:border-wine-800"
                    />
                    <div className="flex bg-zinc-100 p-0.5 rounded-sm">
                      <button 
                        onClick={() => setStockFilter('all')}
                        className={`px-3 py-1.5 text-[10px] uppercase font-bold tracking-widest transition-colors ${stockFilter === 'all' ? 'bg-white text-wine-800 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
                      >
                        Todos
                      </button>
                      <button 
                        onClick={() => setStockFilter('positive')}
                        className={`px-3 py-1.5 text-[10px] uppercase font-bold tracking-widest transition-colors ${stockFilter === 'positive' ? 'bg-white text-wine-800 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
                      >
                        Com Saldo
                      </button>
                      <button 
                        onClick={() => setStockFilter('zero')}
                        className={`px-3 py-1.5 text-[10px] uppercase font-bold tracking-widest transition-colors ${stockFilter === 'zero' ? 'bg-white text-wine-800 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
                      >
                        Sem Saldo
                      </button>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto border border-zinc-100">
                  <table className="w-full text-[11px] text-left border-collapse">
                    <thead className="sticky top-0 bg-zinc-50 border-b border-zinc-100 z-10">
                      <tr>
                        <th className="p-3 uppercase tracking-widest font-bold whitespace-nowrap">Produto</th>
                        <th className="p-3 uppercase tracking-widest font-bold whitespace-nowrap">Ativo</th>
                        <th className="p-3 uppercase tracking-widest font-bold whitespace-nowrap">Depto</th>
                        <th className="p-3 uppercase tracking-widest font-bold whitespace-nowrap">Custo</th>
                        <th className="p-3 uppercase tracking-widest font-bold whitespace-nowrap">Venda</th>
                        <th className="p-3 uppercase tracking-widest font-bold whitespace-nowrap">% Lucro</th>
                        <th className="p-3 uppercase tracking-widest font-bold whitespace-nowrap">Saldo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                      {products
                        .filter(p => {
                          const query = inventorySearch.toLowerCase();
                          const matchesSearch = (
                            p.name.toLowerCase().includes(query) || 
                            p.referenceCode?.toLowerCase().includes(query) ||
                            (p.department || '').toLowerCase().includes(query)
                          );
                          
                          if (!matchesSearch) return false;
                          
                          if (stockFilter === 'positive') return (p.currentStock || 0) > 0;
                          if (stockFilter === 'zero') return (p.currentStock || 0) <= 0;
                          
                          return true;
                        })
                        .sort((a, b) => (a.referenceCode || '').localeCompare(b.referenceCode || ''))
                        .map(p => (
                          <tr key={p.id} className="hover:bg-zinc-50/50 transition-colors">
                            <td className="p-3">
                              <div className="flex items-center gap-2 min-w-[140px]">
                                <img src={p.imageUrl} className="w-6 h-8 object-cover border flex-shrink-0" />
                                <div className="truncate">
                                  <p className="font-bold truncate">{p.name}</p>
                                  <p className="text-[9px] text-zinc-400">{p.referenceCode}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${p.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {p.isActive !== false ? 'SIM' : 'NÃO'}
                              </span>
                            </td>
                            <td className="p-3 text-zinc-500 uppercase tracking-tighter whitespace-nowrap">{p.department || '-'}</td>
                            <td className="p-3 font-mono whitespace-nowrap text-zinc-600">
                              {p.unitCost ? `R$ ${p.unitCost.toFixed(2)}` : '-'}
                            </td>
                            <td className="p-3 font-mono whitespace-nowrap text-zinc-900 font-semibold">
                              R$ {p.price.toFixed(2)}
                            </td>
                            <td className="p-3 font-mono whitespace-nowrap">
                              {p.unitCost && p.unitCost > 0 ? (
                                <span className="text-zinc-600">
                                  {((p.price / p.unitCost) * 100).toFixed(0)}%
                                </span>
                              ) : '-'}
                            </td>
                            <td className="p-3">
                              <span className={`font-mono font-bold px-2 py-0.5 rounded-sm ${ (p.currentStock || 0) > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                {p.currentStock || 0}
                              </span>
                            </td>
                          </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white p-6 border border-zinc-100 shadow-sm">
                <h2 className="font-sans font-semibold uppercase tracking-widest text-sm text-wine-800 mb-6 flex items-center gap-2">
                  <History size={18} /> Histórico de Movimentações
                </h2>
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-[10px] text-left">
                    <thead className="sticky top-0 bg-zinc-50 border-b border-zinc-100 z-10">
                      <tr>
                        <th className="p-3 uppercase tracking-tight font-bold">Data</th>
                        <th className="p-3 uppercase tracking-tight font-bold">Cód. Ref.</th>
                        <th className="p-3 uppercase tracking-tight font-bold">Produto</th>
                        <th className="p-3 uppercase tracking-tight font-bold">Tipo</th>
                        <th className="p-3 uppercase tracking-tight font-bold">Qtde</th>
                        <th className="p-3 uppercase tracking-tight font-bold">Motivo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                      {inventoryMovements.map(m => {
                        const p = products.find(x => x.id === m.productId);
                        return (
                          <tr key={m.id}>
                            <td className="p-3 text-zinc-400 whitespace-nowrap">{new Date(m.createdAt).toLocaleString('pt-BR')}</td>
                            <td className="p-3 font-mono text-zinc-500 whitespace-nowrap">{p?.referenceCode || '-'}</td>
                            <td className="p-3">
                              <p className="font-bold truncate max-w-[150px]">{p?.name || 'Deletado'}</p>
                            </td>
                            <td className="p-3 uppercase font-bold text-[9px] tracking-widest">
                              {m.type === 'in' && <span className="text-green-600">Entrada</span>}
                              {m.type === 'out' && <span className="text-red-600">Saída</span>}
                              {m.type === 'adjustment' && <span className="text-zinc-600">Ajuste</span>}
                            </td>
                            <td className={`p-3 font-mono font-bold ${m.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                            </td>
                            <td className="p-3 text-zinc-500 italic">{m.reason}</td>
                          </tr>
                        );
                      })}
                      {inventoryMovements.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-zinc-400 italic">Nenhuma movimentação registrada.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'coupons' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 border border-zinc-100 shadow-sm h-fit">
              <h2 className="font-sans font-semibold uppercase tracking-widest text-sm text-wine-800 mb-6">
                {editingCouponId ? 'Editar Cupom' : 'Novo Cupom'}
              </h2>
              <form onSubmit={handleSaveCoupon} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Código do Cupom</label>
                  <input required type="text" value={couponForm.code} onChange={e => setCouponForm({...couponForm, code: e.target.value.toUpperCase()})} className="w-full border p-2 text-sm outline-none" placeholder="EX: VERAO10" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Desconto (R$)</label>
                    <input type="number" step="0.01" value={couponForm.discount_value} onChange={e => setCouponForm({...couponForm, discount_value: e.target.value, discount_percent: ''})} className="w-full border p-2 text-sm outline-none" placeholder="0.00" disabled={!!couponForm.discount_percent} />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Desconto (%)</label>
                    <input type="number" step="0.1" value={couponForm.discount_percent} onChange={e => setCouponForm({...couponForm, discount_percent: e.target.value, discount_value: ''})} className="w-full border p-2 text-sm outline-none" placeholder="0" disabled={!!couponForm.discount_value} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Data de Validade</label>
                  <input required type="date" value={couponForm.expiration_date} onChange={e => setCouponForm({...couponForm, expiration_date: e.target.value})} className="w-full border p-2 text-sm outline-none" />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Qtd. Disponível</label>
                  <input required type="number" min="1" value={couponForm.qtde_disponivel} onChange={e => setCouponForm({...couponForm, qtde_disponivel: e.target.value})} className="w-full border p-2 text-sm outline-none" />
                </div>

                <div className="flex gap-2">
                  {editingCouponId && (
                    <button type="button" onClick={() => { setEditingCouponId(null); setCouponForm({ code: '', discount_value: '', discount_percent: '', expiration_date: '', qtde_disponivel: '0' }); }} className="flex-1 bg-zinc-200 text-zinc-800 py-3 text-xs uppercase font-bold">Cancelar</button>
                  )}
                  <button type="submit" disabled={isSavingCoupon} className="flex-[2] bg-wine-800 text-white py-3 text-xs uppercase font-bold hover:bg-wine-900 disabled:opacity-50">
                    {isSavingCoupon ? 'Salvando...' : 'Salvar Cupom'}
                  </button>
                </div>
              </form>
            </div>

            <div className="md:col-span-2 space-y-4">
              <h2 className="font-sans font-semibold uppercase tracking-widest text-sm text-wine-800 mb-4">Cupons Ativos</h2>
              <div className="grid grid-cols-1 gap-3">
                {coupons.map(c => (
                  <div key={c.id} className="bg-white border border-zinc-100 p-4 flex justify-between items-center shadow-sm">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-wine-900 tracking-widest">{c.code}</span>
                        <span className="text-[10px] bg-zinc-100 px-1.5 py-0.5 text-zinc-500 rounded-sm">
                          {c.discount_value ? `R$ ${c.discount_value}` : `${c.discount_percent}%`}
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-400 space-x-3">
                        <span>Validade: {new Date(c.expiration_date).toLocaleString('pt-BR')}</span>
                        <span>Uso: {c.qtde_utilizada} / {c.qtde_disponivel}</span>
                        {c.access_count !== undefined && (
                          <span className="text-wine-800 font-bold">Acessos: {c.access_count || 0}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => {
                        setEditingCouponId(c.id);
                        setCouponForm({
                          code: c.code,
                          discount_value: c.discount_value?.toString() || '',
                          discount_percent: c.discount_percent?.toString() || '',
                          expiration_date: new Date(c.expiration_date).toISOString().split('T')[0],
                          qtde_disponivel: c.qtde_disponivel.toString()
                        });
                      }} className="p-2 text-zinc-400 hover:text-wine-800"><Edit2 size={16}/></button>
                      <button onClick={() => deleteCoupon(c.id)} className="p-2 text-zinc-400 hover:text-red-600"><Trash2 size={16}/></button>
                    </div>
                  </div>
                ))}
                {coupons.length === 0 && <p className="text-zinc-400 text-sm italic py-8 text-center border-2 border-dashed">Nenhum cupom cadastrado.</p>}
              </div>

              {couponHistory.length > 0 && (
                <div className="mt-12">
                  <h2 className="font-sans font-semibold uppercase tracking-widest text-sm text-zinc-400 mb-4">Histórico de Uso</h2>
                  <div className="max-h-60 overflow-y-auto border border-zinc-100 bg-white">
                    <table className="w-full text-[10px] text-left">
                      <thead className="bg-zinc-50 border-b">
                        <tr>
                          <th className="p-2 uppercase tracking-tight">Cupom</th>
                          <th className="p-2 uppercase tracking-tight">Desconto</th>
                          <th className="p-2 uppercase tracking-tight text-right">Data/Hora de Uso</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-50">
                        {couponHistory.map(h => (
                          <tr key={h.id}>
                            <td className="p-2 font-bold">{h.coupon_code}</td>
                            <td className="p-2">{h.discount_value ? `R$ ${h.discount_value}` : `${h.discount_percent}%`}</td>
                            <td className="p-2 text-right text-zinc-400">{new Date(h.used_at).toLocaleString('pt-BR')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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

          <div className="bg-white p-6 border border-zinc-100 md:col-span-2">
            <h2 className="font-sans font-semibold uppercase tracking-widest text-sm text-wine-800 mb-6">Links Sociais e Contato</h2>
            <form onSubmit={handleSaveSocial} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Instagram (URL Completa)</label>
                  <input 
                    type="text" 
                    value={socialForm.instagram} 
                    onChange={e => setSocialForm({...socialForm, instagram: e.target.value})} 
                    placeholder="https://instagram.com/amarena.style"
                    className="w-full border p-2 text-sm outline-none focus:border-wine-800"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">WhatsApp (Número com DDD)</label>
                  <input 
                    type="text" 
                    value={socialForm.whatsapp} 
                    onChange={e => setSocialForm({...socialForm, whatsapp: e.target.value})} 
                    placeholder="5511999999999"
                    className="w-full border p-2 text-sm outline-none focus:border-wine-800"
                  />
                  <p className="text-[10px] text-zinc-400 mt-1 italic">Somente números, ex: 5511927028287</p>
                </div>
              </div>
              <div className="flex justify-end">
                <button type="submit" className="bg-wine-800 text-white px-8 py-2 text-xs uppercase font-bold hover:bg-wine-900 transition-colors">
                  Salvar Links Sociais
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white p-6 border border-zinc-100 md:col-span-2">
            <h2 className="font-sans font-semibold uppercase tracking-widest text-sm text-wine-800 mb-6">Barra de Anúncio (Scroll)</h2>
            <form onSubmit={handleSaveAnnouncement} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Texto do Anúncio</label>
                  <input 
                    type="text" 
                    value={announcementForm.text} 
                    onChange={e => setAnnouncementForm({...announcementForm, text: e.target.value})} 
                    placeholder="Ex: FRETE GRÁTIS EM COMPRAS ACIMA DE R$ 200,00"
                    className="w-full border p-2 text-sm outline-none focus:border-wine-800"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Link de Destino (Opcional)</label>
                  <input 
                    type="text" 
                    value={announcementForm.link} 
                    onChange={e => setAnnouncementForm({...announcementForm, link: e.target.value})} 
                    placeholder="Ex: /categoria/novidades ou https://exemplo.com"
                    className="w-full border p-2 text-sm outline-none focus:border-wine-800"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={announcementForm.active} 
                    onChange={e => setAnnouncementForm({...announcementForm, active: e.target.checked})} 
                    className="w-4 h-4 text-wine-800" 
                  />
                  <span className="text-xs uppercase tracking-widest text-zinc-500">Ativar Barra de Anúncio</span>
                </label>
                <button type="submit" className="bg-wine-800 text-white px-8 py-2 text-xs uppercase font-bold hover:bg-wine-900 transition-colors">
                  Salvar Barra
                </button>
              </div>
            </form>
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

      {activeTab === 'analytics' && (
        <div className="space-y-12">
          {/* Combinations Ranking */}
          <div className="bg-white border border-zinc-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              <div>
                <h2 className="font-sans font-semibold uppercase tracking-widest text-sm text-wine-800">Ranking de Combinações</h2>
                <p className="text-xs text-zinc-400 mt-1 uppercase tracking-tight">Produtos que mais saem juntos (Kits Orgânicos)</p>
              </div>
              <button onClick={fetchAnalyticsData} className="text-xs text-zinc-400 hover:text-wine-800">Atualizar</button>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {analyticsData.combinations.slice(0, 10).map((comb, idx) => {
                const p1 = products.find(p => p.id === comb.p1);
                const p2 = products.find(p => p.id === comb.p2);
                if (!p1 || !p2) return null;

                return (
                  <div key={idx} className="flex items-center justify-between p-4 bg-zinc-50 border border-zinc-100 rounded-sm">
                    <div className="flex items-center gap-4">
                      <div className="flex -space-x-4">
                        <img src={p1.imageUrl} className="w-12 h-14 object-cover border-2 border-white shadow-sm" />
                        <img src={p2.imageUrl} className="w-12 h-14 object-cover border-2 border-white shadow-sm" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-wine-800 uppercase tracking-widest">Top {idx + 1}</p>
                        <p className="text-xs font-semibold text-zinc-900 truncate max-w-[200px]">{p1.name} + {p2.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-mono font-bold text-wine-800">{comb.count}</p>
                      <p className="text-[9px] uppercase tracking-tighter text-zinc-400">Vendas Juntas</p>
                    </div>
                  </div>
                );
              })}
              {analyticsData.combinations.length === 0 && (
                <p className="col-span-full py-8 text-center text-zinc-400 italic text-sm">Sem combinações registradas até o momento.</p>
              )}
            </div>
          </div>

          {/* Affinity Matrix */}
          <div className="bg-white border border-zinc-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-100">
              <h2 className="font-sans font-semibold uppercase tracking-widest text-sm text-wine-800">Tabela de Afinidade (Matriz)</h2>
              <p className="text-xs text-zinc-400 mt-1 uppercase tracking-tight">Frequência de compras entre os 10 produtos mais vendidos</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-100">
                    <th className="p-4 bg-white sticky left-0 z-10 border-r border-zinc-100"></th>
                    {analyticsData.topProducts.map(pid => {
                      const p = products.find(prod => prod.id === pid);
                      return (
                        <th key={pid} className="p-4 min-w-[100px] text-[10px] font-bold uppercase tracking-widest text-zinc-500 border-r border-zinc-100">
                          <div className="flex flex-col items-center gap-1">
                            <img src={p?.imageUrl} className="w-8 h-10 object-cover" />
                            <span className="truncate w-full">{p?.name.split(' ')[0]}</span>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {analyticsData.topProducts.map(pidRow => {
                    const pRow = products.find(p => p.id === pidRow);
                    return (
                      <tr key={pidRow} className="border-b border-zinc-50">
                        <td className="p-4 bg-zinc-50 sticky left-0 z-10 border-r border-zinc-100 text-[10px] font-bold uppercase text-left whitespace-nowrap">
                          {pRow?.name.split(' ')[0]}
                        </td>
                        {analyticsData.topProducts.map(pidCol => {
                          if (pidRow === pidCol) return <td key={pidCol} className="p-4 bg-zinc-200"></td>;
                          const count = analyticsData.matrix[pidRow]?.[pidCol] || 0;
                          return (
                            <td key={pidCol} className={`p-4 border-r border-zinc-50 font-mono text-sm ${count > 0 ? 'bg-wine-50 text-wine-800 font-bold' : 'text-zinc-300'}`}>
                              {count}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recommended Bundles */}
          <div className="space-y-6">
            <div>
              <h2 className="font-sans font-semibold uppercase tracking-widest text-sm text-wine-800">Sugestões de "Compre Junto"</h2>
              <p className="text-xs text-zinc-400 mt-1 uppercase tracking-tight">Formatos recomendados para promoção baseados nos dados</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {analyticsData.combinations.slice(0, 3).map((comb, idx) => {
                const p1 = products.find(p => p.id === comb.p1);
                const p2 = products.find(p => p.id === comb.p2);
                if (!p1 || !p2) return null;

                return (
                  <div key={idx} className="bg-white border border-wine-800/10 p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-center mb-6">
                      <span className="bg-wine-800 text-white text-[9px] uppercase font-bold px-3 py-1 tracking-widest rounded-full">Sugestão de Combo</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 mb-6">
                      <img src={p1.imageUrl} className="w-16 h-20 object-cover shadow-sm" />
                      <Plus className="w-4 h-4 text-zinc-400" />
                      <img src={p2.imageUrl} className="w-16 h-20 object-cover shadow-sm" />
                    </div>
                    <div className="space-y-3 text-center">
                      <p className="text-xs font-bold text-zinc-900 uppercase leading-tight">{p1.name} + {p2.name}</p>
                      <p className="text-sm font-serif text-wine-800">Combinaram {comb.count} vezes</p>
                      <div className="pt-4 border-t border-zinc-100 flex flex-col gap-2">
                        <p className="text-[10px] text-zinc-400 uppercase tracking-widest text-left">Insight de Venda:</p>
                        <p className="text-[11px] text-zinc-600 leading-relaxed text-left italic">
                          "Estes itens possuem alta afinidade. Considere oferecer um desconto de R$ 10,00 na compra do kit para aumentar o ticket médio."
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sales' && (
        <div className="space-y-8">
          <div className="sticky top-0 z-20 bg-wine-50/90 backdrop-blur-sm p-4 border-b border-wine-100 -mx-4 px-4 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 shadow-sm">
            <div>
              <h2 className="font-sans font-bold uppercase tracking-widest text-xs text-wine-900">Filtro de Relatórios</h2>
              <p className="text-[10px] text-wine-700 uppercase tracking-tight">Filtre por REF, Nome ou Departamento</p>
            </div>
            <div className="relative w-full md:w-96">
              <input 
                type="text" 
                placeholder="Digitar REF, Produto ou Depto..." 
                value={searchProductQuery}
                onChange={(e) => setSearchProductQuery(e.target.value)}
                className="w-full pl-3 pr-10 py-2.5 border border-wine-200 bg-white text-xs uppercase tracking-widest focus:outline-none focus:border-wine-800 focus:ring-1 focus:ring-wine-800/20 shadow-inner"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-wine-300">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white border border-zinc-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="font-sans font-semibold uppercase tracking-widest text-sm text-wine-800">Controle de Vendas por Produto</h2>
                <p className="text-xs text-zinc-400 mt-1 uppercase tracking-tight">Quantidade vendida por período</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={fetchSalesData}
                  disabled={isLoadingSales}
                  className="p-2 border border-zinc-200 text-zinc-500 hover:text-wine-800 transition-colors disabled:opacity-50"
                  title="Atualizar dados"
                >
                  <svg className={`w-4 h-4 ${isLoadingSales ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-100">
                    <th className="py-4 px-6 text-[10px] uppercase tracking-widest font-bold text-zinc-500">Produto</th>
                    <th className="py-4 px-6 text-[10px] uppercase tracking-widest font-bold text-zinc-500">Depto</th>
                    <th className="py-4 px-6 text-[10px] uppercase tracking-widest font-bold text-zinc-500">REF</th>
                    <th className="py-4 px-6 text-[10px] uppercase tracking-widest font-bold text-zinc-500 text-center">
                      <div className="mb-1">Últimos 7 dias</div>
                      <div className="text-zinc-600 font-mono text-[11px] bg-white rounded-sm px-1 inline-block border border-zinc-100">Total: {filteredAndTotals.totals.sold7}</div>
                    </th>
                    <th className="py-4 px-6 text-[10px] uppercase tracking-widest font-bold text-zinc-500 text-center">
                      <div className="mb-1">Mês Atual</div>
                      <div className="text-zinc-600 font-mono text-[11px] bg-white rounded-sm px-1 inline-block border border-zinc-100">Total: {filteredAndTotals.totals.soldMonth}</div>
                    </th>
                    <th className="py-4 px-6 text-[10px] uppercase tracking-widest font-bold text-zinc-500 text-center">
                      <div className="mb-1">Mês Anterior</div>
                      <div className="text-zinc-600 font-mono text-[11px] bg-white rounded-sm px-1 inline-block border border-zinc-100">Total: {filteredAndTotals.totals.soldPrevMonth}</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {filteredAndTotals.filtered
                    .map(p => (
                      <tr key={p.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <img src={p.imageUrl} className="w-10 h-12 object-cover border border-zinc-100" />
                            <span className="font-semibold text-zinc-900 text-sm">{p.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-[10px] uppercase tracking-widest text-zinc-400">
                          {p.department}
                        </td>
                        <td className="py-4 px-6 font-mono text-xs text-zinc-400">
                          {p.referenceCode}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`px-2 py-1 rounded-sm text-xs font-bold font-mono ${salesData[p.id]?.sold7 > 0 ? 'bg-green-50 text-green-700' : 'bg-zinc-100 text-zinc-400'}`}>
                            {salesData[p.id]?.sold7 || 0}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`px-2 py-1 rounded-sm text-xs font-bold font-mono ${salesData[p.id]?.soldMonth > 0 ? 'bg-green-50 text-green-700' : 'bg-zinc-100 text-zinc-400'}`}>
                            {salesData[p.id]?.soldMonth || 0}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`px-2 py-1 rounded-sm text-xs font-bold font-mono ${salesData[p.id]?.soldPrevMonth > 0 ? 'bg-zinc-100 text-zinc-600' : 'bg-zinc-50 text-zinc-300'}`}>
                            {salesData[p.id]?.soldPrevMonth || 0}
                          </span>
                        </td>
                      </tr>
                    ))}
                  {filteredAndTotals.filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-zinc-400 italic">Nenhum produto encontrado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white border border-zinc-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="font-sans font-semibold uppercase tracking-widest text-sm text-wine-800">Controle de Faturamento por Produto</h2>
                <p className="text-xs text-zinc-400 mt-1 uppercase tracking-tight">Valor total vendido por período</p>
              </div>
              {searchProductQuery && (
                <div className="text-[10px] text-wine-800 bg-wine-50 px-2 py-1 uppercase font-bold tracking-widest animate-pulse border border-wine-100 rounded-sm">
                  Filtrando por: {searchProductQuery}
                </div>
              )}
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-100">
                    <th className="py-4 px-6 text-[10px] uppercase tracking-widest font-bold text-zinc-500">Produto</th>
                    <th className="py-4 px-6 text-[10px] uppercase tracking-widest font-bold text-zinc-500">Depto</th>
                    <th className="py-4 px-6 text-[10px] uppercase tracking-widest font-bold text-zinc-500">REF</th>
                    <th className="py-4 px-6 text-[10px] uppercase tracking-widest font-bold text-zinc-500 text-center">
                      <div className="mb-1">Últimos 7 dias</div>
                      <div className="text-zinc-600 font-mono text-[11px] bg-white rounded-sm px-1 inline-block border border-zinc-100">Total: {formatPrice(filteredAndTotals.totals.rev7)}</div>
                    </th>
                    <th className="py-4 px-6 text-[10px] uppercase tracking-widest font-bold text-zinc-500 text-center">
                      <div className="mb-1">Mês Atual</div>
                      <div className="text-zinc-600 font-mono text-[11px] bg-white rounded-sm px-1 inline-block border border-zinc-100">Total: {formatPrice(filteredAndTotals.totals.revMonth)}</div>
                    </th>
                    <th className="py-4 px-6 text-[10px] uppercase tracking-widest font-bold text-zinc-500 text-center">
                      <div className="mb-1">Mês Anterior</div>
                      <div className="text-zinc-600 font-mono text-[11px] bg-white rounded-sm px-1 inline-block border border-zinc-100">Total: {formatPrice(filteredAndTotals.totals.revPrevMonth)}</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {filteredAndTotals.filtered
                    .map(p => (
                      <tr key={p.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <img src={p.imageUrl} className="w-10 h-12 object-cover border border-zinc-100" />
                            <span className="font-semibold text-zinc-900 text-sm">{p.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-[10px] uppercase tracking-widest text-zinc-400">
                          {p.department}
                        </td>
                        <td className="py-4 px-6 font-mono text-xs text-zinc-400">
                          {p.referenceCode}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`px-2 py-1 rounded-sm text-xs font-bold font-mono ${salesData[p.id]?.rev7 > 0 ? 'bg-green-50 text-green-700' : 'bg-zinc-100 text-zinc-400'}`}>
                            {formatPrice(salesData[p.id]?.rev7 || 0)}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`px-2 py-1 rounded-sm text-xs font-bold font-mono ${salesData[p.id]?.revMonth > 0 ? 'bg-green-50 text-green-700' : 'bg-zinc-100 text-zinc-400'}`}>
                            {formatPrice(salesData[p.id]?.revMonth || 0)}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`px-2 py-1 rounded-sm text-xs font-bold font-mono ${salesData[p.id]?.revPrevMonth > 0 ? 'bg-zinc-100 text-zinc-600' : 'bg-zinc-50 text-zinc-300'}`}>
                            {formatPrice(salesData[p.id]?.revPrevMonth || 0)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  {filteredAndTotals.filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-zinc-400 italic">Nenhum produto encontrado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white border border-zinc-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="font-sans font-semibold uppercase tracking-widest text-sm text-wine-800">Controle de Conversão de Venda</h2>
                <p className="text-xs text-zinc-400 mt-1 uppercase tracking-tight">Conversão: Adições na sacola vs. Vendas efetuadas</p>
              </div>
              {searchProductQuery && (
                <div className="text-[10px] text-wine-800 bg-wine-50 px-2 py-1 uppercase font-bold tracking-widest animate-pulse border border-wine-100 rounded-sm">
                  Filtrando por: {searchProductQuery}
                </div>
              )}
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-100">
                    <th className="py-4 px-6 text-[10px] uppercase tracking-widest font-bold text-zinc-500">REF / Produto</th>
                    <th className="py-4 px-6 text-[10px] uppercase tracking-widest font-bold text-zinc-500 text-center">
                      <div className="mb-1">Últimos 7 dias</div>
                      <div className="flex flex-col gap-1 items-center">
                        <div className="text-[9px] text-zinc-400 uppercase">Sacola: {filteredAndTotals.totals.clicks7}</div>
                        <div className="text-[9px] text-zinc-400 uppercase">Vendas: {filteredAndTotals.totals.sold7}</div>
                        <div className="text-wine-800 font-bold font-mono text-[11px] bg-wine-50 rounded-sm px-1 inline-block border border-wine-100">
                          Conv: {filteredAndTotals.totals.clicks7 > 0 ? ((filteredAndTotals.totals.sold7 / filteredAndTotals.totals.clicks7) * 100).toFixed(1) : '0.0'}%
                        </div>
                      </div>
                    </th>
                    <th className="py-4 px-6 text-[10px] uppercase tracking-widest font-bold text-zinc-500 text-center">
                      <div className="mb-1">Mês Atual</div>
                      <div className="flex flex-col gap-1 items-center">
                        <div className="text-[9px] text-zinc-400 uppercase">Sacola: {filteredAndTotals.totals.clicksMonth}</div>
                        <div className="text-[9px] text-zinc-400 uppercase">Vendas: {filteredAndTotals.totals.soldMonth}</div>
                        <div className="text-wine-800 font-bold font-mono text-[11px] bg-wine-50 rounded-sm px-1 inline-block border border-wine-100">
                          Conv: {filteredAndTotals.totals.clicksMonth > 0 ? ((filteredAndTotals.totals.soldMonth / filteredAndTotals.totals.clicksMonth) * 100).toFixed(1) : '0.0'}%
                        </div>
                      </div>
                    </th>
                    <th className="py-4 px-6 text-[10px] uppercase tracking-widest font-bold text-zinc-500 text-center">
                      <div className="mb-1">Dados Totais</div>
                      <div className="flex flex-col gap-1 items-center">
                        <div className="text-[9px] text-zinc-400 uppercase">Sacola: {filteredAndTotals.totals.clicksTotal}</div>
                        <div className="text-[9px] text-zinc-400 uppercase">Vendas: {filteredAndTotals.totals.soldTotal}</div>
                        <div className="text-wine-800 font-bold font-mono text-[11px] bg-wine-50 rounded-sm px-1 inline-block border border-wine-100">
                          Conv: {filteredAndTotals.totals.clicksTotal > 0 ? ((filteredAndTotals.totals.soldTotal / filteredAndTotals.totals.clicksTotal) * 100).toFixed(1) : '0.0'}%
                        </div>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {filteredAndTotals.filtered
                    .sort((a, b) => (a.referenceCode || '').localeCompare(b.referenceCode || ''))
                    .map(p => {
                      const s = salesData[p.id];
                      const c = conversionData[p.id];
                      
                      const getConv = (sold: number, clicks: number) => {
                        if (!clicks) return '0.0%';
                        return `${((sold / clicks) * 100).toFixed(1)}%`;
                      };

                      return (
                        <tr key={p.id} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-xs font-bold text-zinc-400">{p.referenceCode}</span>
                              <img src={p.imageUrl} className="w-8 h-10 object-cover border border-zinc-100" />
                              <span className="font-semibold text-zinc-900 text-xs truncate max-w-[150px]">{p.name}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                              <div>
                                <p className="text-zinc-400 uppercase mb-0.5">Sacola</p>
                                <p className="font-mono font-bold text-zinc-600">{c?.clicks7 || 0}</p>
                              </div>
                              <div>
                                <p className="text-zinc-400 uppercase mb-0.5">Venda</p>
                                <p className="font-mono font-bold text-zinc-600">{s?.sold7 || 0}</p>
                              </div>
                              <div>
                                <p className="text-wine-800 uppercase mb-0.5 font-bold">Conv</p>
                                <p className="font-mono font-bold text-wine-900">{getConv(s?.sold7 || 0, c?.clicks7 || 0)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                              <div>
                                <p className="text-zinc-400 uppercase mb-0.5">Sacola</p>
                                <p className="font-mono font-bold text-zinc-600">{c?.clicksMonth || 0}</p>
                              </div>
                              <div>
                                <p className="text-zinc-400 uppercase mb-0.5">Venda</p>
                                <p className="font-mono font-bold text-zinc-600">{s?.soldMonth || 0}</p>
                              </div>
                              <div>
                                <p className="text-wine-800 uppercase mb-0.5 font-bold">Conv</p>
                                <p className="font-mono font-bold text-wine-900">{getConv(s?.soldMonth || 0, c?.clicksMonth || 0)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                              <div>
                                <p className="text-zinc-400 uppercase mb-0.5">Sacola</p>
                                <p className="font-mono font-bold text-zinc-600">{c?.clicksTotal || 0}</p>
                              </div>
                              <div>
                                <p className="text-zinc-400 uppercase mb-0.5">Venda</p>
                                <p className="font-mono font-bold text-zinc-600">{s?.soldTotal || 0}</p>
                              </div>
                              <div>
                                <p className="text-wine-800 uppercase mb-0.5 font-bold">Conv</p>
                                <p className="font-mono font-bold text-wine-900">{getConv(s?.soldTotal || 0, c?.clicksTotal || 0)}</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ranking' && (
        <div className="space-y-12">
          {/* Pinned Products Section */}
          <div className="bg-white p-6 border border-zinc-100 shadow-sm">
            <h2 className="font-sans font-semibold uppercase tracking-widest text-sm text-wine-800 mb-6">Configurar Destaques (Máx 6)</h2>
            <p className="text-xs text-zinc-500 mb-6">Estes produtos aparecerão sempre no topo da página inicial, na ordem selecionada abaixo.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Selector */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-2 font-bold">Buscar Produto</label>
                <div className="relative mb-4">
                  <input 
                    type="text" 
                    placeholder="Nome ou código..."
                    value={searchProductQuery}
                    onChange={(e) => setSearchProductQuery(e.target.value)}
                    className="w-full border p-3 text-sm outline-none focus:border-wine-800"
                  />
                </div>
                
                <div className="space-y-2 max-h-60 overflow-y-auto border border-zinc-100 p-2 bg-white">
                  {products
                    .filter(p => p.isActive !== false && !pinnedProductIds.includes(p.id))
                    .filter(p => 
                      p.name.toLowerCase().includes(searchProductQuery.toLowerCase()) || 
                      p.referenceCode?.toLowerCase().includes(searchProductQuery.toLowerCase())
                    )
                    .map(p => (
                      <div 
                        key={p.id} 
                        onClick={() => {
                          if (pinnedProductIds.length < 6) {
                            setPinnedProducts([...pinnedProductIds, p.id]);
                          } else {
                            alert('Máximo de 6 produtos atingido.');
                          }
                        }}
                        className="flex items-center justify-between p-3 hover:bg-zinc-50 text-sm border-b border-zinc-100 last:border-0 cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <img src={p.imageUrl} className="w-8 h-10 object-cover border border-zinc-100 shadow-sm" />
                          <div>
                            <p className="font-semibold text-zinc-900">{p.name}</p>
                            <p className="text-[10px] text-zinc-400 font-mono">{p.referenceCode}</p>
                          </div>
                        </div>
                        <div className="bg-wine-800 text-white p-1.5 rounded-sm hover:bg-wine-900 transition-colors">
                          <Plus size={16} />
                        </div>
                      </div>
                    ))}
                  {products.filter(p => p.isActive !== false && !pinnedProductIds.includes(p.id)).length === 0 && (
                    <div className="text-center py-8 text-zinc-400 text-xs italic">
                      Nenhum produto disponível para destaque.
                    </div>
                  )}
                </div>
              </div>

              {/* Sorted List */}
              <div className="bg-zinc-50 p-4 rounded-sm border border-zinc-100">
                <label className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-4 font-bold">Ordem dos Destaques ({pinnedProductIds.length}/6)</label>
                <div className="space-y-3">
                  {pinnedProductIds.map((id, index) => {
                    const p = products.find(prod => prod.id === id);
                    if (!p) return null;
                    return (
                      <div key={id} className="flex items-center bg-white p-3 border border-zinc-200 shadow-sm gap-4 transition-transform hover:translate-x-1 group">
                        <div className="bg-wine-800 text-white w-6 h-6 flex items-center justify-center text-xs font-bold font-mono rounded-full flex-shrink-0">
                          {index + 1}
                        </div>
                        <img src={p.imageUrl} className="w-10 h-10 object-cover bg-zinc-50 border border-zinc-100" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{p.name}</p>
                          <p className="text-[10px] text-zinc-400">{p.department}</p>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <button 
                            disabled={index === 0}
                            onClick={() => {
                              const newList = [...pinnedProductIds];
                              [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
                              setPinnedProducts(newList);
                            }}
                            className="p-1 text-zinc-400 hover:text-wine-800 disabled:opacity-20"
                          >
                            <svg className="w-4 h-4 rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 9l-7 7-7-7" /></svg>
                          </button>
                          <button 
                            disabled={index === pinnedProductIds.length - 1}
                            onClick={() => {
                              const newList = [...pinnedProductIds];
                              [newList[index + 1], newList[index]] = [newList[index], newList[index + 1]];
                              setPinnedProducts(newList);
                            }}
                            className="p-1 text-zinc-400 hover:text-wine-800 disabled:opacity-20"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 9l-7 7-7-7" /></svg>
                          </button>
                          <button 
                            onClick={() => setPinnedProducts(pinnedProductIds.filter(pid => pid !== id))}
                            className="ml-2 text-zinc-400 hover:text-red-600 p-1 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {pinnedProductIds.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed border-zinc-200 text-zinc-400 text-sm italic">
                      Nenhum produto destacado.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Ranking Table Section */}
          <div className="bg-white p-6 border border-zinc-100 shadow-sm overflow-hidden">
            <div className="flex justify-between items-center mb-8">
              <h2 className="font-sans font-semibold uppercase tracking-widest text-sm text-wine-800">Ranking de Visualizações</h2>
              <button 
                onClick={fetchRanking}
                disabled={isLoadingRanking}
                className="text-[10px] font-bold uppercase tracking-widest border border-zinc-200 px-4 py-2 hover:bg-zinc-50 transition-colors disabled:opacity-50"
              >
                {isLoadingRanking ? 'Atualizando...' : 'Atualizar Dados'}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 border-y border-zinc-100">
                    <th className="py-4 px-4 font-bold text-wine-900 uppercase tracking-widest text-[10px]">Produto</th>
                    <th className="py-4 px-4 font-bold text-wine-900 uppercase tracking-widest text-[10px]">Depto / Seção</th>
                    <th className="py-4 px-4 font-bold text-wine-900 uppercase tracking-widest text-[10px]">Valor</th>
                    <th className="py-4 px-4 font-bold text-wine-900 uppercase tracking-widest text-[10px] text-center">Últ. 7 Dias</th>
                    <th className="py-4 px-4 font-bold text-wine-900 uppercase tracking-widest text-[10px] text-center">Mês Atual</th>
                    <th className="py-4 px-4 font-bold text-wine-900 uppercase tracking-widest text-[10px] text-center">Mês Anterior</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {products
                    .map(p => ({
                      ...p,
                      stats: rankingData[p.id] || { views7: 0, viewsMonth: 0, viewsPrevMonth: 0 }
                    }))
                    .sort((a, b) => b.stats.views7 - a.stats.views7 || a.name.localeCompare(b.name))
                    .map((p) => (
                      <tr key={p.id} className="hover:bg-zinc-50 transition-colors group">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <img src={p.imageUrl} className="w-10 h-12 object-cover border border-zinc-100" />
                            <div>
                              <p className="font-semibold text-zinc-900">{p.name}</p>
                              <p className="text-[10px] text-zinc-400 font-mono">{p.referenceCode}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-xs text-zinc-500 uppercase tracking-wider">
                          {p.department} › {p.categories && p.categories.length > 0 ? p.categories.join(', ') : p.category}
                        </td>
                        <td className="py-4 px-4 font-mono font-bold text-zinc-700">
                          R$ {p.price.toFixed(2)}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`px-2 py-1 rounded-sm text-xs font-bold font-mono ${p.stats.views7 > 0 ? 'bg-wine-50 text-wine-800' : 'bg-zinc-100 text-zinc-400'}`}>
                            {p.stats.views7}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="text-xs font-bold font-mono text-zinc-600">
                            {p.stats.viewsMonth}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="text-xs font-bold font-mono text-zinc-400">
                            {p.stats.viewsPrevMonth}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
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
                  <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Preço Atual (R$)</label>
                  <input required type="number" step="0.01" min="0" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} className="w-full border p-2 text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Preço Antigo (Opcional)</label>
                  <input type="number" step="0.01" min="0" value={productForm.originalPrice} onChange={e => setProductForm({...productForm, originalPrice: e.target.value})} placeholder="Para De/Por" className="w-full border p-2 text-sm outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Qtd Inicial Estoque</label>
                  <input 
                    required 
                    readOnly={!!editingId} 
                    type="number" 
                    min="0" 
                    value={productForm.initialStock} 
                    onChange={e => setProductForm({...productForm, initialStock: e.target.value})} 
                    className={`w-full border p-2 text-sm outline-none ${editingId ? 'bg-zinc-50 text-zinc-400 select-none' : ''}`}
                    placeholder="Obrigatório"
                  />
                  {editingId && <p className="text-[9px] text-zinc-400 mt-0.5">Use aba Estoque para ajustes.</p>}
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Custo Unitário (Opcional)</label>
                  <input type="number" step="0.01" min="0" value={productForm.unitCost} onChange={e => setProductForm({...productForm, unitCost: e.target.value})} className="w-full border p-2 text-sm outline-none" placeholder="0.00" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Etiqueta (Opcional)</label>
                  <input type="text" value={productForm.label} onChange={e => setProductForm({...productForm, label: e.target.value})} placeholder="Ex: 25% OFF" className="w-full border p-2 text-sm outline-none" />
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
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Departamento</label>
                  <select required value={productForm.department} onChange={e => setProductForm({...productForm, department: e.target.value, category: '', categories: []})} className="w-full border p-2 text-sm outline-none">
                    <option value="">Selecione...</option>
                    {departments.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
                
                {productForm.department && (
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2">Categorias (Selecione uma ou mais)</label>
                    <div className="grid grid-cols-2 gap-2 border p-3 max-h-40 overflow-y-auto bg-zinc-50/50">
                      {selectedDeptCategories.map(c => (
                        <label key={c} className="flex items-center gap-2 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            checked={productForm.categories.includes(c)}
                            onChange={e => {
                              const newCategories = e.target.checked 
                                ? [...productForm.categories, c]
                                : productForm.categories.filter(cat => cat !== c);
                              setProductForm({
                                ...productForm, 
                                categories: newCategories,
                                category: newCategories[0] || '' // Mantém compatibilidade com o campo único
                              });
                            }}
                            className="w-4 h-4 text-wine-800 border-zinc-300 focus:ring-wine-800"
                          />
                          <span className="text-[11px] uppercase tracking-tight text-zinc-600 group-hover:text-wine-800 transition-colors">{c}</span>
                        </label>
                      ))}
                      {selectedDeptCategories.length === 0 && (
                        <p className="col-span-2 text-[10px] text-zinc-400 italic">Nenhuma categoria cadastrada para este departamento.</p>
                      )}
                    </div>
                    {productForm.categories.length === 0 && (
                      <p className="text-[10px] text-red-500 mt-1">* Selecione pelo menos uma categoria.</p>
                    )}
                  </div>
                )}
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
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={productForm.isHidden} onChange={e => setProductForm({...productForm, isHidden: e.target.checked})} className="w-4 h-4 text-wine-800" />
                    <span className="text-xs uppercase tracking-widest text-zinc-500">Ocultar produto</span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1 flex justify-between">
                    <span>Imagens (Máx 8)</span>
                    <span className="font-normal text-wine-800 font-bold">{existingImages.length + productImagesFiles.length}/8</span>
                  </label>
                  
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {existingImages.map((img, i) => (
                      <div key={`existing-${i}`} className="relative aspect-[3/4] border border-zinc-200 bg-zinc-50 overflow-hidden cursor-pointer" onClick={() => setCoverImageUrl(img)}>
                        <img src={img} className={`w-full h-full object-cover ${coverImageUrl === img ? 'opacity-100' : 'opacity-60'}`} />
                        {coverImageUrl === img && (
                          <div className="absolute top-0 left-0 bg-wine-800 text-white text-[8px] px-1 py-0.5 font-bold uppercase z-10">Capa</div>
                        )}
                        <button 
                          type="button" 
                          onClick={(e) => { e.stopPropagation(); removeExistingImage(img); }} 
                          className="absolute top-1 right-1 bg-white/90 rounded-full p-1 text-red-500 shadow-sm hover:bg-red-500 hover:text-white transition-colors z-20"
                          title="Remover imagem"
                        >
                          <X size={12}/>
                        </button>
                      </div>
                    ))}
                    {productImagesPreviews.map((preview, i) => (
                      <div key={`new-${i}`} className="relative aspect-[3/4] border border-zinc-200 bg-zinc-50 overflow-hidden cursor-pointer" onClick={() => setCoverImageUrl(preview)}>
                        <img src={preview} className={`w-full h-full object-cover ${coverImageUrl === preview ? 'opacity-100' : 'opacity-60'}`} />
                        {coverImageUrl === preview && (
                          <div className="absolute top-0 left-0 bg-wine-800 text-white text-[8px] px-1 py-0.5 font-bold uppercase z-10">Capa</div>
                        )}
                        <button 
                          type="button" 
                          onClick={(e) => { e.stopPropagation(); removeSelectedFile(i); }} 
                          className="absolute top-1 right-1 bg-white/90 rounded-full p-1 text-red-500 shadow-sm hover:bg-red-500 hover:text-white transition-colors z-20"
                          title="Remover imagem"
                        >
                          <X size={12}/>
                        </button>
                      </div>
                    ))}
                    {(existingImages.length + productImagesFiles.length) < 8 && (
                      <label className="aspect-[3/4] border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-50 hover:border-wine-200 text-zinc-400 hover:text-wine-800 transition-all">
                        <Upload size={18} />
                        <span className="text-[9px] mt-1 font-bold uppercase tracking-tighter">Incluir</span>
                        <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageSelect} />
                      </label>
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-400 italic">Clique em uma imagem para defini-la como capa.</p>
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
                      {p.isHidden && <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 font-bold uppercase tracking-widest">Oculto</span>}
                    </div>
                    <h4 className="font-semibold text-sm truncate text-zinc-900 mb-1">{p.name}</h4>
                    <p className="text-[11px] text-zinc-500 truncate">{p.department} › {p.categories && p.categories.length > 0 ? p.categories.join(', ') : p.category}</p>
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
                      onClick={() => updateProduct(p.id, { isActive: !p.isActive })}
                      className={`p-2.5 bg-zinc-50 transition-all rounded-sm border border-zinc-100 flex items-center justify-center ${p.isActive === false ? 'text-green-600 hover:bg-green-50' : 'text-zinc-400 hover:text-red-500 hover:bg-red-50'}`}
                      title={p.isActive === false ? 'Ativar no site' : 'Inativar no site'}
                    >
                      {p.isActive === false ? <Plus size={16} /> : <X size={16} />}
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
      {activeTab === 'links' && (
        <div className="space-y-8 animate-fade-in">
          <div className="bg-white p-6 border border-zinc-100 shadow-sm">
            <h2 className="font-sans font-semibold uppercase tracking-widest text-sm text-wine-800 mb-6 flex items-center gap-2">
              <Ticket size={18} /> Seletor de Cupom
            </h2>
            <p className="text-xs text-zinc-500 mb-4 uppercase tracking-tight">Selecione um cupom para anexar aos links automaticamente:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              <button 
                onClick={() => setLinkCouponId('')}
                className={`p-3 border text-center transition-all ${linkCouponId === '' ? 'border-wine-800 bg-wine-50 text-wine-800 font-bold' : 'border-zinc-100 text-zinc-400 hover:border-zinc-200'}`}
              >
                <div className="text-[10px] uppercase tracking-widest">Nenhum</div>
              </button>
              {coupons
                .filter(c => {
                  const isExpired = new Date(c.expiration_date) < new Date();
                  const isAvailable = c.qtde_utilizada < c.qtde_disponivel;
                  return !isExpired && isAvailable;
                })
                .map(c => (
                <button 
                  key={c.id}
                  onClick={() => setLinkCouponId(c.id)}
                  className={`p-3 border text-center transition-all ${linkCouponId === c.id ? 'border-wine-800 bg-wine-50 text-wine-800 font-bold' : 'border-zinc-100 text-zinc-400 hover:border-zinc-200'}`}
                >
                  <div className="text-xs tracking-widest mb-1">{c.code}</div>
                  <div className="text-[9px] opacity-60">
                    {c.discount_value ? `R$ ${c.discount_value}` : `${c.discount_percent}%`}
                  </div>
                </button>
              ))}
              {coupons.filter(c => {
                const isExpired = new Date(c.expiration_date) < new Date();
                const isAvailable = c.qtde_utilizada < c.qtde_disponivel;
                return !isExpired && isAvailable;
              }).length === 0 && (
                <p className="col-span-full text-zinc-400 text-[10px] italic">Nenhum cupom válido ou disponível encontrado. Crie um na aba "Cupons" primeiro.</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-sans font-semibold uppercase tracking-widest text-sm text-wine-800 flex items-center gap-2">
                  <Package size={18} /> Links de Produtos
                </h2>
                <button 
                  onClick={() => handleCopyLinks('products')}
                  className="flex items-center gap-2 bg-wine-800 text-white px-4 py-2 text-[10px] uppercase font-bold tracking-widest hover:bg-wine-900 transition-colors"
                >
                  {copyStatus === 'products' ? <Check size={14}/> : <Copy size={14}/>}
                  {copyStatus === 'products' ? 'Copiado!' : 'Copiar Selecionados'}
                </button>
              </div>

              <div className="mb-4 flex items-center gap-2 pb-2 border-b border-zinc-50">
                <input 
                  type="checkbox" 
                  id="select-all-products"
                  className="w-4 h-4 rounded border-zinc-300 text-wine-800 focus:ring-wine-800 cursor-pointer"
                  checked={(() => {
                    const activeProducts = products.filter(p => p.isActive !== false);
                    return selectedProductIds.length === activeProducts.length && activeProducts.length > 0;
                  })()}
                  onChange={(e) => {
                    const activeProducts = products.filter(p => p.isActive !== false);
                    if (e.target.checked) setSelectedProductIds(activeProducts.map(p => p.id));
                    else setSelectedProductIds([]);
                  }}
                />
                <label htmlFor="select-all-products" className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 cursor-pointer">
                  Selecionar Todos ({products.filter(p => p.isActive !== false).length})
                </label>
              </div>

              <div className="max-h-[500px] overflow-y-auto space-y-2 pr-2">
                {[...products]
                  .filter(p => p.isActive !== false)
                  .sort((a, b) => (a.referenceCode || '').localeCompare(b.referenceCode || ''))
                  .map(p => (
                    <label key={p.id} className="flex items-center gap-3 p-2 hover:bg-zinc-50 transition-colors cursor-pointer group rounded-sm border border-transparent hover:border-zinc-100">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-zinc-300 text-wine-800 focus:ring-wine-800 cursor-pointer"
                        checked={selectedProductIds.includes(p.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedProductIds([...selectedProductIds, p.id]);
                          else setSelectedProductIds(selectedProductIds.filter(id => id !== p.id));
                        }}
                      />
                      <div className="flex gap-2 items-center flex-1 min-w-0">
                        <img src={p.imageUrl} className="w-8 h-10 object-cover border border-zinc-100" />
                        <div className="truncate">
                          <p className="text-xs font-bold text-zinc-900 truncate uppercase">{p.name}</p>
                          <p className="text-[9px] text-zinc-400 font-mono italic">REF: {p.referenceCode || '-'}</p>
                        </div>
                      </div>
                    </label>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-sans font-semibold uppercase tracking-widest text-sm text-wine-800 flex items-center gap-2">
                  <LinkIcon size={18} /> Categorias / Departamentos
                </h2>
                <button 
                  onClick={() => handleCopyLinks('departments')}
                  className="flex items-center gap-2 bg-wine-800 text-white px-4 py-2 text-[10px] uppercase font-bold tracking-widest hover:bg-wine-900 transition-colors"
                >
                  {copyStatus === 'departments' ? <Check size={14}/> : <Copy size={14}/>}
                  {copyStatus === 'departments' ? 'Copiado!' : 'Copiar Selecionados'}
                </button>
              </div>

              <div className="mb-4 flex items-center gap-2 pb-2 border-b border-zinc-50">
                <input 
                  type="checkbox" 
                  id="select-all-depts"
                  className="w-4 h-4 rounded border-zinc-300 text-wine-800 focus:ring-wine-800 cursor-pointer"
                  checked={selectedDeptNames.length === departments.length && departments.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedDeptNames(departments.map(d => d.name));
                    else setSelectedDeptNames([]);
                  }}
                />
                <label htmlFor="select-all-depts" className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 cursor-pointer">
                  Selecionar Todos ({departments.length})
                </label>
              </div>

              <div className="space-y-2">
                {departments.map(dept => (
                  <label key={dept.name} className="flex items-center gap-3 p-3 hover:bg-zinc-50 transition-colors cursor-pointer group rounded-sm border border-transparent hover:border-zinc-100 bg-zinc-50/30">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-zinc-300 text-wine-800 focus:ring-wine-800 cursor-pointer"
                      checked={selectedDeptNames.includes(dept.name)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedDeptNames([...selectedDeptNames, dept.name]);
                        else setSelectedDeptNames(selectedDeptNames.filter(name => name !== dept.name));
                      }}
                    />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-zinc-900 uppercase tracking-widest">{dept.name}</p>
                      <p className="text-[9px] text-zinc-400">{dept.categories.length} Categorias</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
