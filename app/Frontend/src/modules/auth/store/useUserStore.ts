import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { User } from '../../../core/repositories/IAuthRepository';

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setUser: (user: User | null) => void;
  logout: () => void;
}

/**
 * User Store - Manages authentication state
 * 
 * ✅ UPDATED FOR NEW PATTERNS:
 * - Uses User type from IAuthRepository (new standard)
 * - Removed automatic initAuthListener() call (moved to main.tsx)
 * - Now receives updates via AuthStateManager.subscribe()
 * - No more side effects at module load (Lazy Initialization)
 * 
 * Store receives updates from AuthStateManager in App component
 */
export const useUserStore = create<UserState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        isAuthenticated: false,
        isLoading: true,

        setUser: (user) =>
          set({
            user,
            isAuthenticated: !!user,
            isLoading: false,
          }),

        logout: async () => {
          try {
            set({ user: null, isAuthenticated: false });
          } catch (error) {
            console.error('[Auth] Logout error:', error);
          }
        },
      }),
      {
        name: 'user-storage',
        partialize: (state) => ({
          user: state.user
            ? {
                id: state.user.id,
                email: state.user.email,
                displayName: state.user.displayName,
                photoURL: state.user.photoURL,
              }
            : null,
        }),
      }
    ),
    { name: 'User Store' }
  )
);

