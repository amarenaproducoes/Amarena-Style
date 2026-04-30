import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, ChevronDown, Sparkles, Heart } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useProductStore } from '../../store/useProductStore';
import { slugify } from '../../utils/slugify';

interface MenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MenuDrawer({ isOpen, onClose }: MenuDrawerProps) {
  const { departments, setFilter } = useProductStore();
  const [expandedDept, setExpandedDept] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleNovidades = () => {
    setFilter({ isNew: true });
    onClose();
  };

  const handleDeptClick = (deptName: string) => {
    if (expandedDept === deptName) {
      setExpandedDept(null);
    } else {
      setExpandedDept(deptName);
    }
  };

  const handleGoHome = () => {
    setFilter(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 lg:hidden"
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 w-[85%] max-w-sm bg-white z-50 flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between p-6 md:p-8 border-b border-zinc-100">
              <span className="font-serif text-2xl text-zinc-900 tracking-tight">Menu</span>
              <button 
                onClick={onClose}
                className="text-wine-800 hover:opacity-80 transition-opacity"
                aria-label="Fechar menu"
              >
                <X className="w-5 h-5 md:w-6 md:h-6 stroke-[2]" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto py-4 bg-white">
              <nav className="flex flex-col">
                <Link 
                  to="/"
                  onClick={handleNovidades}
                  className="px-6 md:px-8 py-4 text-sm font-sans tracking-widest uppercase text-wine-800 hover:bg-zinc-50 transition-colors flex items-center gap-3"
                >
                  <Sparkles className="w-4 h-4" />
                  Novidades
                </Link>

                <Link
                  to="/favoritos"
                  onClick={onClose}
                  className="px-6 md:px-8 py-4 text-sm font-sans tracking-widest uppercase text-wine-800 hover:bg-zinc-50 transition-colors flex items-center gap-3"
                >
                  <Heart className="w-4 h-4" />
                  Favoritos
                </Link>

                <Link 
                  to="/" 
                  onClick={handleGoHome}
                  className="px-6 md:px-8 py-4 text-sm font-sans tracking-widest uppercase text-zinc-900 hover:bg-zinc-50 transition-colors flex items-center justify-between"
                >
                  Página Inicial
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </Link>
                
                <div className="h-px bg-zinc-100 my-2 mx-6 md:mx-8" />
                
                {departments.map((dept) => (
                  <div key={dept.name} className="flex flex-col">
                    <button
                      onClick={() => handleDeptClick(dept.name)}
                      className="px-6 md:px-8 py-3.5 text-sm font-sans tracking-wide text-zinc-600 hover:text-wine-800 hover:bg-zinc-50 transition-colors flex items-center justify-between group"
                    >
                      {dept.name}
                      <div className="flex items-center gap-2">
                        {expandedDept === dept.name ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </div>
                    </button>
                    
                    <AnimatePresence>
                      {expandedDept === dept.name && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="bg-zinc-50 overflow-hidden"
                        >
                          <Link
                            to={`/${slugify(dept.name)}`}
                            onClick={onClose}
                            className="block w-full text-left px-12 md:px-14 py-3 text-xs uppercase tracking-widest text-wine-800 font-bold hover:bg-zinc-100"
                          >
                            Ver Tudo em {dept.name}
                          </Link>
                          {dept.categories.map(cat => (
                            <Link
                              key={cat}
                              to={`/${slugify(cat)}`}
                              onClick={onClose}
                              className="block w-full text-left px-12 md:px-14 py-3 text-xs tracking-widest text-zinc-500 hover:text-wine-800 hover:bg-zinc-100"
                            >
                              {cat}
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}

                <div className="h-px bg-zinc-100 my-4 mx-6 md:mx-8" />
                
                <Link
                  to="/admin"
                  onClick={onClose}
                  className="px-6 md:px-8 py-3 text-xs uppercase tracking-widest font-semibold font-sans text-wine-800 hover:text-wine-900 transition-colors"
                >
                  Área Administrativa
                </Link>
              </nav>
            </div>
            
            {/* <div className="p-6 md:p-8 bg-zinc-50 border-t border-zinc-100 shrink-0">
              <p className="text-[10px] text-zinc-500 font-sans tracking-[0.2em] uppercase leading-relaxed mb-4 text-center">
                Benefícios Exclusivos
              </p>
              <button className="w-full py-4 border border-wine-800 text-wine-800 font-sans text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase hover:bg-wine-800 hover:text-white transition-colors">
                Fazer Login
              </button>
            </div> */}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
