import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MOCK_DEPARTMENTS } from '../../data/mock';

interface MenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MenuDrawer({ isOpen, onClose }: MenuDrawerProps) {
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
                  onClick={onClose}
                  className="px-6 md:px-8 py-4 text-sm font-sans tracking-widest uppercase text-wine-800 hover:bg-zinc-50 transition-colors flex items-center justify-between"
                >
                  Página Inicial
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </Link>
                
                <div className="h-px bg-zinc-100 my-2 mx-6 md:mx-8" />
                
                {MOCK_DEPARTMENTS.map((dept) => (
                  <Link
                    key={dept}
                    to={`/departamento/${dept.toLowerCase()}`}
                    onClick={onClose}
                    className="px-6 md:px-8 py-3.5 text-sm font-sans tracking-wide text-zinc-600 hover:text-wine-800 hover:bg-zinc-50 transition-colors flex items-center justify-between group"
                  >
                    {dept}
                    <ChevronRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-wine-800" />
                  </Link>
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
            
            <div className="p-6 md:p-8 bg-zinc-50 border-t border-zinc-100 shrink-0">
              <p className="text-[10px] text-zinc-500 font-sans tracking-[0.2em] uppercase leading-relaxed mb-4 text-center">
                Benefícios Exclusivos
              </p>
              <button className="w-full py-4 border border-wine-800 text-wine-800 font-sans text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase hover:bg-wine-800 hover:text-white transition-colors">
                Fazer Login
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
