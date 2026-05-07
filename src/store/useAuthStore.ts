import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthStore {
  isAuthenticated: boolean;
  user: string | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      login: (email, password) => {
        // As requested by the user
        const VALID_EMAIL = 'amarena.producoes@gmail.com';
        const VALID_PASSWORD = 'Ama23';

        if (email === VALID_EMAIL && password === VALID_PASSWORD) {
          set({ isAuthenticated: true, user: email });
          return true;
        }
        return false;
      },
      logout: () => {
        set({ isAuthenticated: false, user: null });
      },
    }),
    {
      name: 'amarena-auth-storage',
    }
  )
);
