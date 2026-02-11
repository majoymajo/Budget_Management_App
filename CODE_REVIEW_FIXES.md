# Code Review: Specific Fixes for F-01 to F-04

## F-01: Vendor Lock-in with Firebase 🟠 HIGH

### Problem
Firebase is tightly coupled throughout the authentication layer, making it impossible to switch providers without major refactoring.

### Code to Change

#### ❌ PROBLEM 1: Direct Firebase imports in useUserStore.ts

**File**: `src/modules/auth/store/useUserStore.ts`

**Lines 1-4 (REMOVE/CHANGE):**
```typescript
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { type User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';  // ❌ Firebase coupled
import { auth } from '../../../core/config/firebase.config.js';  // ❌ Firebase coupled
```

**Lines 6-8 (CHANGE):**
```typescript
interface UserState {
    user: FirebaseUser | null;  // ❌ Using Firebase type
    isAuthenticated: boolean;
    isLoading: boolean;
```

**Lines 37-42 (CHANGE):**
```typescript
logout: async () => {
    try {
        await auth.signOut();  // ❌ Direct Firebase call
        set({ user: null, isAuthenticated: false });
    } catch (error) {
        console.error('[Auth] Logout error:', error);
```

**Lines 45-49 (REMOVE):**
```typescript
initAuthListener: () => {
    onAuthStateChanged(auth, (user) => {  // ❌ Direct Firebase call
        get().setUser(user);
    });
},
```

**Line 67 (REMOVE):**
```typescript
useUserStore.getState().initAuthListener();  // ❌ Side effect at module load
```

---

#### ❌ PROBLEM 2: Direct Firebase imports in authService.ts

**File**: `src/modules/auth/services/authService.ts`

**Lines 1-8 (REMOVE/REPLACE):**
```typescript
import {
    signInWithEmailAndPassword,  // ❌ All Firebase specific
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    createUserWithEmailAndPassword,
    updateProfile,
    type UserCredential,  // ❌ Firebase type
} from 'firebase/auth';
import { auth } from '../../../core/config/firebase.config.js';  // ❌ Direct Firebase
```

**Lines 10-24 (CHANGE):**
```typescript
export const loginWithEmail = async (
    email: string,
    password: string
): Promise<UserCredential> => {  // ❌ Returns Firebase type
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);  // ❌ Direct Firebase
        console.log('[Auth Service] Login successful:', userCredential.user.email);
        return userCredential;  // ❌ Exposes Firebase object
    } catch (error: any) {
        console.error('[Auth Service] Login error:', error.code, error.message);
        throw mapFirebaseError(error);
    }
};
```

**Lines 26-37 (CHANGE):**
```typescript
export const loginWithGoogle = async (): Promise<UserCredential> => {  // ❌ Firebase type
    try {
        const provider = new GoogleAuthProvider();  // ❌ Firebase specific
        const userCredential = await signInWithPopup(auth, provider);  // ❌ Direct Firebase
        console.log('[Auth Service] Google login successful:', userCredential.user.email);
        return userCredential;  // ❌ Exposes Firebase object
    } catch (error: any) {
        console.error('[Auth Service] Google login error:', error.code, error.message);
        throw mapFirebaseError(error);
    }
};
```

---

### ✅ SUGGESTED FIX: Repository Pattern

#### Step 1: Create Repository Interface

**NEW FILE**: `src/core/repositories/IAuthRepository.ts`

```typescript
// Domain model (infrastructure-agnostic)
export interface User {
  id: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export enum AuthProvider {
  GOOGLE = 'GOOGLE',
  GITHUB = 'GITHUB',
}

export interface IAuthRepository {
  signIn(email: string, password: string): Promise<User>;
  signInWithProvider(provider: AuthProvider): Promise<User>;
  signOut(): Promise<void>;
  register(displayName: string, email: string, password: string): Promise<User>;
  onAuthStateChanged(callback: (user: User | null) => void): () => void;
}
```

---

#### Step 2: Create Firebase Implementation

**NEW FILE**: `src/infrastructure/repositories/FirebaseAuthRepository.ts`

```typescript
import { 
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged as firebaseOnAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../../core/config/firebase.config';
import type { IAuthRepository, User, AuthProvider } from '../../core/repositories/IAuthRepository';

export class FirebaseAuthRepository implements IAuthRepository {
  async signIn(email: string, password: string): Promise<User> {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      return this.toUser(credential.user);
    } catch (error: any) {
      throw this.mapError(error);
    }
  }

  async signInWithProvider(provider: AuthProvider): Promise<User> {
    const providerInstance = this.getProvider(provider);
    const credential = await signInWithPopup(auth, providerInstance);
    return this.toUser(credential.user);
  }

  async signOut(): Promise<void> {
    await signOut(auth);
  }

  async register(displayName: string, email: string, password: string): Promise<User> {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName });
    return this.toUser(credential.user);
  }

  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return firebaseOnAuthStateChanged(auth, (firebaseUser) => {
      callback(firebaseUser ? this.toUser(firebaseUser) : null);
    });
  }

  // Private helpers - encapsulate Firebase details
  private toUser(firebaseUser: any): User {
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
    };
  }

  private getProvider(provider: AuthProvider) {
    switch (provider) {
      case AuthProvider.GOOGLE:
        return new GoogleAuthProvider();
      default:
        throw new Error(`Provider ${provider} not supported`);
    }
  }

  private mapError(error: any): Error {
    const errorMessages: Record<string, string> = {
      'auth/invalid-email': 'El correo electrónico no es válido',
      'auth/user-disabled': 'Esta cuenta ha sido deshabilitada',
      'auth/user-not-found': 'No existe una cuenta con este correo',
      'auth/wrong-password': 'Contraseña incorrecta',
      'auth/invalid-credential': 'Credenciales incorrectas',
      'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
      'auth/network-request-failed': 'Error de conexión. Verifica tu internet',
      'auth/popup-closed-by-user': 'Inicio de sesión cancelado',
      'auth/email-already-in-use': 'El correo electrónico ya está en uso',
      'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
    };
    const message = errorMessages[error.code] || 'Error de autenticación';
    return new Error(message);
  }
}
```

---

#### Step 3: Dependency Injection Configuration

**NEW FILE**: `src/core/config/dependencies.ts`

```typescript
import type { IAuthRepository } from '../repositories/IAuthRepository';
import { FirebaseAuthRepository } from '../../infrastructure/repositories/FirebaseAuthRepository';

// ✅ Single place to switch implementations
export const authRepository: IAuthRepository = new FirebaseAuthRepository();

// To switch to Auth0, just change this one line:
// import { Auth0Repository } from '../../infrastructure/repositories/Auth0Repository';
// export const authRepository: IAuthRepository = new Auth0Repository();
```

---

#### Step 4: Update authService.ts

**REPLACE ENTIRE FILE**: `src/modules/auth/services/authService.ts`

```typescript
import type { User, AuthProvider } from '@/core/repositories/IAuthRepository';
import { authRepository } from '@/core/config/dependencies';

/**
 * Login with Email and Password
 * ✅ No Firebase imports - infrastructure agnostic
 */
export const loginWithEmail = async (
  email: string,
  password: string
): Promise<User> => {
  return await authRepository.signIn(email, password);
};

/**
 * Login with Google
 * ✅ Provider abstracted
 */
export const loginWithGoogle = async (): Promise<User> => {
  return await authRepository.signInWithProvider(AuthProvider.GOOGLE);
};

/**
 * Register with Email and Password
 * ✅ No Firebase dependency
 */
export const registerWithEmail = async (
  displayName: string,
  email: string,
  password: string
): Promise<User> => {
  return await authRepository.register(displayName, email, password);
};

/**
 * Logout
 * ✅ Delegates to repository
 */
export const logout = async (): Promise<void> => {
  await authRepository.signOut();
};
```

---

#### Step 5: Update useUserStore.ts

**REPLACE**: `src/modules/auth/store/useUserStore.ts`

```typescript
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { User } from '@/core/repositories/IAuthRepository';  // ✅ Domain type
import { authRepository } from '@/core/config/dependencies';  // ✅ DI

interface UserState {
  user: User | null;  // ✅ Domain type, not Firebase
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
}

export const useUserStore = create<UserState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        isAuthenticated: false,
        isLoading: true,

        setUser: (user) => set({
          user,
          isAuthenticated: !!user,
          isLoading: false,
        }),

        logout: async () => {
          await authRepository.signOut();  // ✅ Uses repository
          set({ user: null, isAuthenticated: false });
        },
      }),
      {
        name: 'user-storage',
        partialize: (state) => ({ user: state.user }),
      }
    ),
    { name: 'User Store' }
  )
);

// ✅ NO SIDE EFFECTS - initialization moved to app root
```

---

## F-02: Side Effects at Module Load 🟠 HIGH

### Problem
`useUserStore.getState().initAuthListener()` executes immediately when the module loads, causing uncontrolled side effects, making testing difficult, and violating separation of concerns.

### Code to Change

#### ❌ PROBLEM: Module-level side effect

**File**: `src/modules/auth/store/useUserStore.ts`

**Line 67 (REMOVE):**
```typescript
useUserStore.getState().initAuthListener();  // ❌ Runs at import time!
```

**Why this is bad:**
- Executes before app is ready
- Impossible to control initialization timing
- Hard to test
- Can't mock dependencies
- Violates Single Responsibility (store shouldn't manage initialization)

---

### ✅ SUGGESTED FIX: Dependency Injection + Lazy Initialization + Observer Pattern

This solution combines three design patterns:
1. **Dependency Injection** - AuthStateManager receives IAuthRepository through constructor
2. **Lazy Initialization** - Initialization happens only when explicitly called, not at module load
3. **Observer Pattern** - Multiple subscribers can listen to auth state changes

#### Step 1: Create Auth State Manager (All 3 Patterns)

**NEW FILE**: `src/core/observers/AuthStateManager.ts`

```typescript
import type { IAuthRepository, User } from '../repositories/IAuthRepository';

export type AuthStateObserver = (user: User | null) => void;

/**
 * AuthStateManager - Combines 3 Design Patterns
 * 
 * 1️⃣ DEPENDENCY INJECTION:
 *    - Receives IAuthRepository through constructor (not imported directly)
 *    - Easy to swap implementations or mock in tests
 * 
 * 2️⃣ LAZY INITIALIZATION:
 *    - initialize() must be called explicitly
 *    - No automatic execution at module load
 *    - Controlled lifecycle management
 * 
 * 3️⃣ OBSERVER PATTERN:
 *    - Maintains list of observers (subscribers)
 *    - Notifies all observers when auth state changes
 *    - Decouples state changes from reactions
 */
export class AuthStateManager {
  // Observer Pattern: Collection of subscribers
  private observers: Set<AuthStateObserver> = new Set();
  private currentUser: User | null = null;
  private unsubscribe: (() => void) | null = null;
  
  // Lazy Initialization: Flag to prevent duplicate initialization
  private isInitialized = false;

  /**
   * 1️⃣ DEPENDENCY INJECTION
   * Constructor receives dependency instead of importing it
   */
  constructor(private authRepository: IAuthRepository) {
    console.log('[AuthStateManager] Created (not initialized yet)');
  }

  /**
   * 2️⃣ LAZY INITIALIZATION
   * Explicit initialization - called when app is ready
   */
  initialize(): void {
    if (this.isInitialized) {
      console.warn('[AuthStateManager] Already initialized');
      return;
    }

    console.log('[AuthStateManager] Initializing...');
    
    // Start listening to auth state changes via injected repository
    this.unsubscribe = this.authRepository.onAuthStateChanged((user) => {
      this.currentUser = user;
      // 3️⃣ OBSERVER PATTERN: Notify all subscribers
      this.notifyObservers(user);
    });

    this.isInitialized = true;
  }

  /**
   * 3️⃣ OBSERVER PATTERN
   * Allow components to subscribe to auth state changes
   */
  subscribe(observer: AuthStateObserver): () => void {
    this.observers.add(observer);
    
    // Immediately notify with current state
    observer(this.currentUser);

    // Return unsubscribe function (cleanup)
    return () => {
      this.observers.delete(observer);
    };
  }

  /**
   * 3️⃣ OBSERVER PATTERN
   * Notify all subscribers of state change
   */
  private notifyObservers(user: User | null): void {
    console.log(`[AuthStateManager] Notifying ${this.observers.size} observers`);
    
    this.observers.forEach(observer => {
      try {
        observer(user);
      } catch (error) {
        console.error('[AuthStateManager] Observer error:', error);
      }
    });
  }

  /**
   * Get current user without subscribing
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Check if already initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * 2️⃣ LAZY INITIALIZATION
   * Proper cleanup when app unmounts
   */
  cleanup(): void {
    console.log('[AuthStateManager] Cleaning up...');
    
    this.unsubscribe?.();
    this.observers.clear();
    this.isInitialized = false;
    this.currentUser = null;
  }
}

/**
 * 1️⃣ DEPENDENCY INJECTION
 * Factory function to create instance with injected dependency
 */
import { authRepository } from '../config/dependencies';

export const createAuthStateManager = (
  repository: IAuthRepository = authRepository
): AuthStateManager => {
  return new AuthStateManager(repository);
};

// Default singleton instance (but can create others for testing)
export const authStateManager = createAuthStateManager();
```

---

#### Step 2: Initialize in App Root (Lazy Initialization in Action)

**UPDATE**: `src/main.tsx`

**CHANGE this section:**
```typescript
import { StrictMode } from 'react';  // ❌ Missing useEffect
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './core/config/queryClient';
import { AppRouter } from './core/router/AppRouter';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppRouter />  {/* ❌ No auth initialization */}
    </QueryClientProvider>
  </StrictMode>
);
```

**TO THIS:**
```typescript
import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './core/config/queryClient';
import { AppRouter } from './core/router/AppRouter';
import { authStateManager } from './core/observers/AuthStateManager';
import { useUserStore } from './modules/auth';
import './index.css';

/**
 * App Component - Entry point for controlled initialization
 * Demonstrates all 3 patterns in action
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
  }, []);  // Run once on mount

  return <AppRouter />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);
```

---

#### Step 3: How to Use in Other Components (Observer Pattern)

**EXAMPLE**: Any component can subscribe to auth changes

```typescript
import { useEffect, useState } from 'react';
import { authStateManager } from '@/core/observers/AuthStateManager';
import type { User } from '@/core/repositories/IAuthRepository';

function AnyComponent() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    // 3️⃣ OBSERVER PATTERN: Subscribe to auth changes
    const unsubscribe = authStateManager.subscribe((user) => {
      setCurrentUser(user);
    });

    // Cleanup subscription
    return unsubscribe;
  }, []);

  return <div>User: {currentUser?.email || 'Not logged in'}</div>;
}
```

---

#### Step 4: Testing with Dependency Injection

**EXAMPLE**: Easy to test with mock repository

```typescript
import { describe, it, expect, vi } from 'vitest';
import { AuthStateManager, createAuthStateManager } from '@/core/observers/AuthStateManager';
import type { IAuthRepository, User } from '@/core/repositories/IAuthRepository';

describe('AuthStateManager', () => {
  it('should use injected repository', () => {
    // 1️⃣ DEPENDENCY INJECTION: Create mock repository
    const mockRepository: IAuthRepository = {
      signIn: vi.fn(),
      signOut: vi.fn(),
      signInWithProvider: vi.fn(),
      register: vi.fn(),
      onAuthStateChanged: vi.fn((callback) => {
        // Simulate auth state change
        callback({ id: '123', email: 'test@test.com', displayName: 'Test', photoURL: null });
        return () => {}; // unsubscribe function
      }),
    };

    // 1️⃣ DEPENDENCY INJECTION: Inject mock
    const manager = createAuthStateManager(mockRepository);

    // 2️⃣ LAZY INITIALIZATION: Not initialized yet
    expect(manager.isReady()).toBe(false);

    // 2️⃣ LAZY INITIALIZATION: Explicitly initialize
    manager.initialize();
    expect(manager.isReady()).toBe(true);

    // 3️⃣ OBSERVER PATTERN: Subscribe and verify notification
    const observer = vi.fn();
    manager.subscribe(observer);
    
    expect(observer).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'test@test.com' })
    );
  });

  it('should notify multiple observers', () => {
    // 1️⃣ DEPENDENCY INJECTION
    const mockRepo: IAuthRepository = {
      onAuthStateChanged: vi.fn((cb) => {
        cb({ id: '1', email: 'user@test.com', displayName: 'User', photoURL: null });
        return () => {};
      }),
    } as any;

    const manager = createAuthStateManager(mockRepo);
    manager.initialize();

    // 3️⃣ OBSERVER PATTERN: Multiple subscribers
    const observer1 = vi.fn();
    const observer2 = vi.fn();
    const observer3 = vi.fn();

    manager.subscribe(observer1);
    manager.subscribe(observer2);
    manager.subscribe(observer3);

    expect(observer1).toHaveBeenCalled();
    expect(observer2).toHaveBeenCalled();
    expect(observer3).toHaveBeenCalled();
  });
});
```

**Benefits of This Approach:**
- ✅ **Dependency Injection**: Easy to test with mocks, swap implementations
- ✅ **Lazy Initialization**: No side effects at module load, controlled lifecycle
- ✅ **Observer Pattern**: Decoupled state management, multiple subscribers
- ✅ **Single Responsibility**: Each component has one clear purpose
- ✅ **Testability**: Can test each pattern independently
- ✅ **Flexibility**: Can create multiple instances with different repositories

---

## F-03: Fragmented Business Logic 🟠 HIGH

### Problem
Business logic is scattered in UI components, mixing concerns and making code hard to test and reuse.

### Code to Change

#### ❌ PROBLEM 1: Business logic in TransactionPage.tsx

**File**: `src/modules/transactions/pages/TransactionPage.tsx`

**Lines 24-33 (CHANGE):**
```typescript
const handleCreateTransaction = (data: {
  description: string
  amount: number
  category: string
  type: "INCOME" | "EXPENSE"
  date: string
}) => {
  const formData = {  // ❌ Data transformation in UI component
    ...data,
    userId: user.uid,  // ❌ Business logic: attaching userId
    date: new Date(data.date),  // ❌ Data transformation
  }
  createTransaction(formData)  // ❌ Direct service call
  setIsCreateDialogOpen(false)  // UI logic mixed with business logic
}
```

**Why this is bad:**
- Data transformation logic in UI
- Can't reuse this logic elsewhere
- Hard to test business rules
- Violates Single Responsibility

---

#### ❌ PROBLEM 2: Business logic in LoginForm.tsx

**File**: `src/modules/auth/components/LoginForm.tsx`

**Lines 24-37 (CHANGE):**
```typescript
const onSubmit = async (data: LoginFormData) => {
  setIsLoading(true);  // UI state
  setError(null);  // UI state

  try {
    await loginWithEmail(data.email, data.password);  // ❌ Business logic
    navigate('/dashboard');  // ❌ Navigation logic
  } catch (err: any) {
    setError(err.message);  // ❌ Error handling
  } finally {
    setIsLoading(false);  // UI state
  }
};
```

**Lines 39-51 (CHANGE):**
```typescript
const handleGoogleLogin = async () => {
  setIsGoogleLoading(true);
  setError(null);

  try {
    await loginWithGoogle();  // ❌ Business logic
    navigate('/dashboard');  // ❌ Navigation logic
  } catch (err: any) {
    setError(err.message);  // ❌ Error handling
  } finally {
    setIsGoogleLoading(false);
  }
};
```

**Why this is bad:**
- Authentication logic mixed with UI
- Can't test business logic without rendering component
- Can't reuse logic in other components
- Hard to add validation or business rules

---

### ✅ SUGGESTED FIX: Use Cases + Repository Pattern

#### Step 1: Create Use Cases

**NEW FILE**: `src/modules/auth/usecases/LoginUseCase.ts`

```typescript
import type { IAuthRepository, User } from '@/core/repositories/IAuthRepository';

export interface LoginUseCaseInput {
  email: string;
  password: string;
}

export interface LoginUseCaseOutput {
  success: boolean;
  user?: User;
  error?: string;
}

/**
 * ✅ Encapsulates login business logic
 */
export class LoginUseCase {
  constructor(private authRepository: IAuthRepository) {}

  async execute(input: LoginUseCaseInput): Promise<LoginUseCaseOutput> {
    try {
      // ✅ Business validation
      this.validate(input);

      // ✅ Execute authentication
      const user = await this.authRepository.signIn(input.email, input.password);
      
      // ✅ Business logic: could add logging, analytics, etc.
      console.log('[LoginUseCase] Login successful for:', user.email);
      
      return { success: true, user };
    } catch (error: any) {
      console.error('[LoginUseCase] Login failed:', error.message);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  private validate(input: LoginUseCaseInput): void {
    if (!input.email || !input.email.includes('@')) {
      throw new Error('Email inválido');
    }
    if (!input.password || input.password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres');
    }
  }
}
```

---

**NEW FILE**: `src/modules/transactions/usecases/CreateTransactionUseCase.ts`

```typescript
import type { TransactionModel, TransactionFormData } from '../types/transaction.types';

export interface CreateTransactionInput {
  description: string;
  amount: number;
  category: string;
  type: 'INCOME' | 'EXPENSE';
  date: string;
  userId: string;
}

/**
 * ✅ Encapsulates transaction creation business logic
 */
export class CreateTransactionUseCase {
  async execute(input: CreateTransactionInput): Promise<TransactionModel> {
    // ✅ Business validation
    this.validate(input);

    // ✅ Business logic: transform data
    const transactionData: TransactionFormData = {
      description: input.description.trim(),
      amount: input.amount,
      category: input.category,
      type: input.type,
      date: new Date(input.date),
    };

    // ✅ Delegate to service/repository
    // (You'll need to inject the repository here)
    const response = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...transactionData, userId: input.userId }),
    });

    if (!response.ok) {
      throw new Error('Error al crear transacción');
    }

    const data = await response.json();
    
    console.log('[CreateTransactionUseCase] Transaction created:', data.id);
    
    return data;
  }

  private validate(input: CreateTransactionInput): void {
    if (!input.description || input.description.trim().length === 0) {
      throw new Error('La descripción es requerida');
    }
    
    if (input.amount <= 0) {
      throw new Error('El monto debe ser mayor a 0');
    }

    if (input.amount > 1000000000) {
      throw new Error('El monto es demasiado alto');
    }

    const date = new Date(input.date);
    if (isNaN(date.getTime())) {
      throw new Error('Fecha inválida');
    }
  }
}
```

---

#### Step 2: Create Hook for Use Cases

**NEW FILE**: `src/modules/auth/hooks/useAuthUseCases.ts`

```typescript
import { useMemo } from 'react';
import { LoginUseCase } from '../usecases/LoginUseCase';
import { authRepository } from '@/core/config/dependencies';

export function useAuthUseCases() {
  return useMemo(() => ({
    loginUseCase: new LoginUseCase(authRepository),
  }), []);
}
```

---

#### Step 3: Update LoginForm.tsx (Clean UI)

**REPLACE lines 24-37**: `src/modules/auth/components/LoginForm.tsx`

```typescript
import { useAuthUseCases } from '../hooks/useAuthUseCases';  // ✅ Add import

// ... in component:

const { loginUseCase } = useAuthUseCases();  // ✅ Get use case

const onSubmit = async (data: LoginFormData) => {
  setIsLoading(true);
  setError(null);

  // ✅ ONLY call use case - NO business logic here
  const result = await loginUseCase.execute(data);

  setIsLoading(false);

  if (result.success) {
    navigate('/dashboard');
  } else {
    setError(result.error!);
  }
};
```

---

#### Step 4: Update TransactionPage.tsx (Clean UI)

**REPLACE lines 24-33**: `src/modules/transactions/pages/TransactionPage.tsx`

```typescript
import { CreateTransactionUseCase } from '../usecases/CreateTransactionUseCase';  // ✅ Add import

// ... in component:

const createTransactionUseCase = useMemo(() => new CreateTransactionUseCase(), []);  // ✅ Create instance

const handleCreateTransaction = async (data: {
  description: string;
  amount: number;
  category: string;
  type: "INCOME" | "EXPENSE";
  date: string;
}) => {
  try {
    // ✅ SIMPLE: just call the use case
    await createTransactionUseCase.execute({
      ...data,
      userId: user.uid,
    });
    
    setIsCreateDialogOpen(false);
    // Trigger refetch or state update
  } catch (error: any) {
    console.error(error.message);
  }
};
```

**Benefits:**
- ✅ Business logic centralized in use cases
- ✅ Components only handle UI state and rendering
- ✅ Easy to test business logic in isolation
- ✅ Reusable across different UI components

---

## F-04: Inconsistent Props and use of `any` 🟠 HIGH

### Problem
The `createTransactionAdapter` function returns `any`, losing type safety and making the codebase error-prone.

### Code to Change

#### ❌ PROBLEM 1: `any` return type in adapter

**File**: `src/modules/transactions/adapters/transaction.adapter.ts`

**Lines 18-27 (CHANGE):**
```typescript
export const createTransactionAdapter = (data: TransactionModel): any => {  // ❌ Returns any!
    return {
        transactionId: data.id, 
        userId: data.userId,
        amount: data.amount,
        type: data.type,
        category: data.category,
        description: data.description,
        date: data.date.toISOString().split('T')[0],
    };
};
```

**Why this is bad:**
- Loses all type safety
- TypeScript can't catch errors
- No IDE autocomplete
- Runtime errors likely

---

#### ❌ PROBLEM 2: `any` in error handling

**File**: `src/modules/transactions/hooks/useTransactions.ts`

**Lines 16-19 (CHANGE):**
```typescript
if (!user) {
  return {
    transactions: [],
    isLoading: false,
    error: null,
    createTransaction: () => {},  // ❌ No-op function, wrong type
    isCreating: false,
  }
}
```

**Lines 34-36 (CHANGE):**
```typescript
onError: (error: any) => {  // ❌ any type
  toast.error(`Error al crear transacción: ${error.message}`)
},
```

---

### ✅ SUGGESTED FIX: Strict Type Definitions

#### Step 1: Define DTO Types

**UPDATE**: `src/modules/transactions/types/transaction.types.ts`

**ADD these types:**
```typescript
// ✅ Backend DTO (what API sends/receives)
export interface TransactionDTO {
  transactionId: number;
  userId: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  description: string;
  date: string;  // ISO string
}

// ✅ Frontend Model (what app uses)
export interface TransactionModel {
  id: number;
  userId: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  description: string;
  date: Date;  // Parsed Date object
}

// ✅ Form data
export interface TransactionFormData {
  description: string;
  amount: number;
  category: string;
  type: 'INCOME' | 'EXPENSE';
  date: Date;
}

// Keep existing TransactionItemResponse for compatibility
export interface TransactionItemResponse {
  transactionId: number;
  userId: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  description: string;
  date: string;
}
```

---

#### Step 2: Fix Adapter with Strict Types

**REPLACE ENTIRE FILE**: `src/modules/transactions/adapters/transaction.adapter.ts`

```typescript
import type { 
  TransactionItemResponse, 
  TransactionModel,
  TransactionDTO,
  TransactionFormData,
} from '../types/transaction.types';

/**
 * ✅ Convert API response to domain model
 */
export const transactionAdapter = (
  response: TransactionItemResponse
): TransactionModel => {
  return {
    id: response.transactionId,
    userId: response.userId || '',
    amount: response.amount || 0,
    type: response.type || 'EXPENSE',
    category: response.category || '',
    description: response.description || '',
    date: response.date ? new Date(response.date) : new Date(),
  };
};

/**
 * ✅ Convert domain model to DTO for API
 * Now properly typed - NO MORE any!
 */
export const toTransactionDTO = (
  data: TransactionFormData,
  userId: string
): Omit<TransactionDTO, 'transactionId'> => {
  return {
    userId,
    amount: data.amount,
    type: data.type,
    category: data.category,
    description: data.description,
    date: data.date.toISOString().split('T')[0],
  };
};

/**
 * ✅ Alternative: if you need to convert full model
 */
export const createTransactionAdapter = (
  data: TransactionModel
): TransactionDTO => {  // ✅ Properly typed!
  return {
    transactionId: data.id,
    userId: data.userId,
    amount: data.amount,
    type: data.type,
    category: data.category,
    description: data.description,
    date: data.date.toISOString().split('T')[0],
  };
};
```

---

#### Step 3: Fix useTransactions Hook

**REPLACE**: `src/modules/transactions/hooks/useTransactions.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getTransactionsByUser, createTransaction } from "../services/transactionService"
import type { TransactionFormData, TransactionModel } from "../types/transaction.types"
import { toast } from "sonner"
import { useUserStore } from "@/modules/auth"

// ✅ Define proper return type
interface UseTransactionsReturn {
  transactions: TransactionModel[];
  isLoading: boolean;
  error: Error | null;
  createTransaction: (data: TransactionFormData) => void;
  isCreating: boolean;
}

export function useTransactions(period?: string): UseTransactionsReturn {
  const { user } = useUserStore()
  const queryClient = useQueryClient()

  // ✅ Properly typed return when no user
  if (!user) {
    return {
      transactions: [],
      isLoading: false,
      error: null,
      createTransaction: () => {
        console.warn('Cannot create transaction: user not authenticated');
      },
      isCreating: false,
    }
  }

  const transactionsQuery = useQuery({
    queryKey: ["transactions", period],
    queryFn: () => getTransactionsByUser(user.uid, period),
    staleTime: 1000 * 60 * 5,
    retry: 2,
  })

  const createTransactionMutation = useMutation({
    mutationFn: (data: TransactionFormData) => createTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] })
      toast.success("Transacción creada con éxito")
    },
    onError: (error: Error) => {  // ✅ Properly typed
      toast.error(`Error al crear transacción: ${error.message}`)
    },
  })

  return {
    transactions: transactionsQuery.data || [],
    isLoading: transactionsQuery.isLoading,
    error: transactionsQuery.error,
    createTransaction: createTransactionMutation.mutate,
    isCreating: createTransactionMutation.isPending,
  }
}
```

**Benefits:**
- ✅ No `any` types anywhere
- ✅ Full type safety from API to UI
- ✅ Catch errors at compile time
- ✅ Better IDE autocomplete and refactoring

---

## Summary of Changes

| Finding | Files to Create | Files to Modify | Lines Changed |
|---------|-----------------|-----------------|---------------|
| **F-01** | IAuthRepository.ts<br>FirebaseAuthRepository.ts<br>dependencies.ts | authService.ts<br>useUserStore.ts | ~200 |
| **F-02** | AuthStateManager.ts | main.tsx<br>useUserStore.ts | ~100 |
| **F-03** | LoginUseCase.ts<br>CreateTransactionUseCase.ts<br>useAuthUseCases.ts | LoginForm.tsx<br>TransactionPage.tsx | ~150 |
| **F-04** | - | transaction.adapter.ts<br>transaction.types.ts<br>useTransactions.ts | ~80 |

---

## Implementation Order

1. **Start with F-01** (Repository Pattern)
   - Create repository interface
   - Create Firebase implementation
   - Update all auth services
   - Test thoroughly

2. **Then F-02** (Observer Pattern)
   - Create AuthStateManager
   - Update app initialization
   - Remove side effects

3. **Then F-03** (Use Cases)
   - Create use case classes
   - Update components
   - Test business logic

4. **Finally F-04** (Type Safety)
   - Update type definitions
   - Fix all `any` types
   - Enable strict mode

---

## Testing Checklist

After each fix:

- [ ] **F-01**: Can you switch from Firebase to a mock repository in tests?
- [ ] **F-02**: Does auth initialization happen only when app mounts?
- [ ] **F-03**: Can you test business logic without rendering components?
- [ ] **F-04**: Does TypeScript catch errors when you use wrong types?

---

## Next Steps

1. Review this document with your team
2. Create feature branches for each finding
3. Implement fixes incrementally
4. Write tests for each change
5. Code review before merging
6. Deploy and monitor

Each section above provides the exact code to change and the replacement code. You can copy these implementations directly into your project.
