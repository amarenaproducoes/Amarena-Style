import { BrowserRouter as Router, Routes, Route, useLocation, Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { AnnouncementBar } from './components/layout/AnnouncementBar';
import { MenuDrawer } from './components/layout/MenuDrawer';
import { CartDrawer } from './components/layout/CartDrawer';
import { Home } from './pages/Home';
import { ProductDetails } from './pages/ProductDetails';
import { Admin } from './pages/Admin';
import { Login } from './pages/Login';
import { Favorites } from './pages/Favorites';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfUse } from './pages/TermsOfUse';
import { useProductStore } from './store/useProductStore';
import { useAuthStore } from './store/useAuthStore';
import { useCartStore } from './store/useCartStore';
import { supabase } from './lib/supabase';
import { ADMIN_SECRET_PATH } from './constants';
import { Instagram, MessageCircle, X } from 'lucide-react';

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Login />;
  }

  return <>{children}</>;
}

function Layout({ children }: { children: React.ReactNode }) {

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { init, initialized, socialConfig } = useProductStore();
  const { applyCoupon, appliedCoupon } = useCartStore();
  const location = useLocation();
  const [welcomeCoupon, setWelcomeCoupon] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const couponCode = params.get('cupom');
    
    if (couponCode && !appliedCoupon) {
      const fetchAndApply = async () => {
        try {
          const { data, error } = await supabase
            .from('coupons')
            .select('*')
            .eq('code', couponCode.toUpperCase())
            .single();

          if (data && !error) {
            const isExpired = new Date(data.expiration_date) < new Date();
            const isAvailable = data.qtde_utilizada < data.qtde_disponivel;

            if (!isExpired && isAvailable) {
              applyCoupon(data);
              setWelcomeCoupon(data.code);
              // Clean up URL
              const newParams = new URLSearchParams(location.search);
              newParams.delete('cupom');
              const newSearch = newParams.toString() ? `?${newParams.toString()}` : '';
              window.history.replaceState({}, '', `${location.pathname}${newSearch}`);
            }
          }
        } catch (err) {
          console.error('Error applying coupon from URL:', err);
        }
      };
      fetchAndApply();
    }
  }, [location.search, applyCoupon, appliedCoupon, location.pathname]);

  useEffect(() => {
    init();
  }, [init]);

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 rounded-full border-2 border-wine-800 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white border-0 md:border-8 border-zinc-100/50">
      <Navbar onOpenMenu={() => setIsMenuOpen(true)} />
      <AnnouncementBar />
      
      {welcomeCoupon && (
        <div className="bg-wine-800 text-white py-3 px-4 text-center text-[10px] uppercase tracking-[0.2em] relative animate-fade-in group">
          <span>Boas-vindas! O cupom <span className="font-bold">{welcomeCoupon}</span> foi aplicado à sua sacola. Aproveite!</span>
          <button 
            onClick={() => setWelcomeCoupon(null)}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <MenuDrawer isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      <CartDrawer />
      
      <main className="flex-1 flex flex-col">
        {children}
      </main>

      <footer className="py-8 border-t border-zinc-100 flex flex-col items-center gap-6 text-[9px] uppercase tracking-[0.2em] text-zinc-400 mt-auto bg-white z-10 w-full max-w-7xl mx-auto">
        <div className="flex gap-8 justify-center">
          <Link to="/privacidade" className="cursor-pointer hover:text-zinc-600 transition-colors">Privacidade</Link>
          <Link to="/termos" className="cursor-pointer hover:text-zinc-600 transition-colors">Termos</Link>
          <a href={`https://wa.me/${socialConfig?.whatsapp || '5511927028287'}?text=Ol%C3%A1.%20Estou%20com%20d%C3%BAvidas%20no%20site%20do%20Amarena%20Style.%20Poderia%20me%20Ajudar%3F`} target="_blank" rel="noopener noreferrer" className="cursor-pointer hover:text-zinc-600 transition-colors">Ajuda</a>
        </div>

        <div className="flex gap-6 items-center">
          {socialConfig?.instagram && (
            <a href={socialConfig.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-zinc-500 hover:text-wine-800 transition-colors group">
              <Instagram size={18} className="group-hover:scale-110 transition-transform" />
              <span className="hidden md:inline">Instagram</span>
            </a>
          )}
          {socialConfig?.whatsapp && (
            <a href={`https://wa.me/${socialConfig.whatsapp}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-zinc-500 hover:text-green-600 transition-colors group">
              <MessageCircle size={18} className="group-hover:scale-110 transition-transform" />
              <span className="hidden md:inline">WhatsApp</span>
            </a>
          )}
        </div>

        <div className="text-center">&copy; {new Date().getFullYear()} Amarena Style. Todos os direitos reservados.</div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/produto/:code" element={<ProductDetails />} />
          <Route 
            path={`/${ADMIN_SECRET_PATH}`} 
            element={
              <AdminGuard>
                <Admin />
              </AdminGuard>
            } 
          />
          <Route path="/favoritos" element={<Favorites />} />
          <Route path="/privacidade" element={<PrivacyPolicy />} />
          <Route path="/termos" element={<TermsOfUse />} />
          <Route path="/:slug" element={<Home />} />
        </Routes>
      </Layout>
    </Router>
  );
}

