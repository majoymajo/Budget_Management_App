import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { type User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../../core/config/firebase.config.js';

/**
 * User State Interface
 */
interface UserState {
    // User data
    user: FirebaseUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    // Actions
    setUser: (user: FirebaseUser | null) => void;
    logout: () => void;

    // Initialize listener
    initAuthListener: () => void;
}

/**
 * User Store
 * Manages authentication state and listens to Firebase Auth changes
 */
export const useUserStore = create<UserState>()(
    devtools(
        persist(
            (set, get) => ({
                // Initial state
                user: null,
                isAuthenticated: false,
                isLoading: true,

                // Set user from Firebase
                setUser: (user) =>
                    set({
                        user,
                        isAuthenticated: !!user,
                        isLoading: false,
                    }),

                // Logout
                logout: async () => {
                    try {
                        await auth.signOut();
                        set({ user: null, isAuthenticated: false });
                    } catch (error) {
                        console.error('[Auth] Logout error:', error);
                    }
                },

                // Initialize Firebase Auth Listener
                initAuthListener: () => {
                    onAuthStateChanged(auth, (user) => {
                        get().setUser(user);
                    });
                },
            }),
            {
                name: 'user-storage', // localStorage key
                partialize: (state) => ({
                    // Only persist these fields
                    user: state.user ? {
                        uid: state.user.uid,
                        email: state.user.email,
                        displayName: state.user.displayName,
                        photoURL: state.user.photoURL,
                    } : null,
                }),
            }
        ),
        { name: 'User Store' }
    )
);

// Initialize auth listener on module load
useUserStore.getState().initAuthListener();
