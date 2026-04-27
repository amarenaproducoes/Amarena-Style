import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { MenuDrawer } from './components/layout/MenuDrawer';
import { CartDrawer } from './components/layout/CartDrawer';
import { Home } from './pages/Home';
import { ProductDetails } from './pages/ProductDetails';
import { Admin } from './pages/Admin';
import { Favorites } from './pages/Favorites';
import { useProductStore } from './store/useProductStore';

function Layout({ children }: { children: React.ReactNode }) {

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { init, initialized } = useProductStore();
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

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
      <MenuDrawer isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      <CartDrawer />
      
      <main className="flex-1 flex flex-col">
        {children}
      </main>

      <footer className="h-16 md:h-12 border-t border-zinc-100 flex flex-col md:flex-row items-center justify-between px-4 md:px-8 text-[9px] uppercase tracking-[0.2em] text-zinc-400 mt-auto bg-white pb-4 md:pb-0 z-10 w-full max-w-7xl mx-auto gap-4 md:gap-0 pt-4 md:pt-0">
        <div className="text-center md:text-left">&copy; {new Date().getFullYear()} Amarena Style. Todos os direitos reservados.</div>
        <div className="flex gap-6 md:gap-8 justify-center">
          <span className="cursor-pointer hover:text-zinc-600 transition-colors">Privacidade</span>
          <span className="cursor-pointer hover:text-zinc-600 transition-colors">Termos</span>
          <a href="https://wa.me/5511933014850?text=Ol%C3%A1.%20Estou%20com%20d%C3%BAvidas%20no%20site%20do%20Amarena%20Style.%20Poderia%20me%20Ajudar%3F" target="_blank" rel="noopener noreferrer" className="cursor-pointer hover:text-zinc-600 transition-colors">Ajuda</a>
        </div>
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
          <Route path="/admin" element={<Admin />} />
          <Route path="/favoritos" element={<Favorites />} />
        </Routes>
      </Layout>
    </Router>
  );
}

