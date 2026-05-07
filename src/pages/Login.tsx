import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { ADMIN_SECRET_PATH } from '../constants';
import { motion } from 'motion/react';
import { LogIn, Lock, Mail, AlertCircle } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Artificial delay for security feel
    await new Promise(resolve => setTimeout(resolve, 800));

    const success = login(email, password);
    
    if (success) {
      // The secret path - should match the one in App.tsx
      navigate(`/${ADMIN_SECRET_PATH}`);
    } else {
      setError('Credenciais inválidas. Verifique seu e-mail e senha.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-white px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <h1 className="font-serif text-3xl text-zinc-900 mb-2">Acesso Restrito</h1>
          <p className="text-zinc-500 text-xs uppercase tracking-[0.2em]">Área Administrativa Amarena Style</p>
        </div>

        <div className="bg-white p-8 md:p-10 border border-zinc-100 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 text-red-600 text-xs rounded-sm">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold block">E-mail de Acesso</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-wine-800 transition-colors" size={18} />
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@gmail.com"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 outline-none focus:border-wine-800 focus:bg-white transition-all text-sm font-sans"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold block">Senha de Segurança</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-wine-800 transition-colors" size={18} />
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 outline-none focus:border-wine-800 focus:bg-white transition-all text-sm font-sans"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-wine-800 text-white py-4 text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-wine-900 transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg shadow-wine-800/10"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={16} />
                  Entrar no Painel
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center">
          <p className="text-[9px] text-zinc-400 uppercase tracking-widest">
            Acesso monitorado &bull; Proteção Amarena Security
          </p>
        </div>
      </motion.div>
    </div>
  );
}
