import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AdminUser } from '@/types';

interface AuthStore {
  user: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  /** True once the persist middleware has rehydrated from localStorage. */
  _hasHydrated: boolean;
  setAuth: (user: AdminUser, token: string) => void;
  setToken: (token: string) => void;
  logout: () => void;
  _setHasHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      _hasHydrated: false,
      setAuth: (user, token) => set({ user, token, isAuthenticated: true }),
      setToken: (token) => set({ token }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
      _setHasHydrated: (value) => set({ _hasHydrated: value }),
    }),
    {
      name: 'up-admin-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
      // token is NOT persisted — lives in memory only.
      // _hasHydrated is NOT persisted — it's a runtime signal, always starts false.
      onRehydrateStorage: () => (state) => {
        state?._setHasHydrated(true);
      },
    }
  )
);
