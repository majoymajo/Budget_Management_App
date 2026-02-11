import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './core/config/queryClient';
import { AppRouter } from './core/router/AppRouter';
import { authStateManager } from './core/config/dependencies';
import { useUserStore } from './modules/auth';
import './index.css';

/**
 * App Component - Entry point for controlled initialization
 * Demonstrates all 3 patterns in action:
 * 
 * 1️⃣ DEPENDENCY INJECTION: authStateManager receives IAuthRepository
 * 2️⃣ LAZY INITIALIZATION: initialize() called on mount, not at module load
 * 3️⃣ OBSERVER PATTERN: subscribe() to auth state changes
 */
function App() {
  useEffect(() => {
    // 2️⃣ LAZY INITIALIZATION
    // Initialize ONLY when component mounts (not at module load)
    console.log('[App] Initializing auth state manager...');
    authStateManager.initialize();

    // 3️⃣ OBSERVER PATTERN
    // Subscribe user store to auth state changes
    const unsubscribe = authStateManager.subscribe((user) => {
      console.log('[App] Auth state changed, updating store:', user?.email);
      useUserStore.getState().setUser(user);
    });

    // 2️⃣ LAZY INITIALIZATION
    // Cleanup when app unmounts
    return () => {
      console.log('[App] App unmounting, cleaning up...');
      unsubscribe();
      authStateManager.cleanup();
    };
  }, []); // Run once on mount

  return <AppRouter />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);

