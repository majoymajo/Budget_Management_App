# Practical Implementation Guide - Code Transformations

This guide shows concrete **before and after** code examples for each bug fix using Observer and Repository patterns.

---

## 🔧 F-01: Firebase Vendor Lock-in - Step by Step

### Step 1: Create Repository Interface

**New File**: `src/core/repositories/interfaces/IAuthRepository.ts`

```typescript
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

### Step 2: Create Firebase Implementation

**New File**: `src/infrastructure/repositories/FirebaseAuthRepository.ts`

```typescript
import { 
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  type UserCredential,
} from 'firebase/auth';
import { auth } from '../../core/config/firebase.config';
import type { IAuthRepository, User, AuthProvider } from '../../core/repositories/interfaces/IAuthRepository';

export class FirebaseAuthRepository implements IAuthRepository {
  async signIn(email: string, password: string): Promise<User> {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      console.log('[AuthRepo] Login successful:', credential.user.email);
      return this.toUser(credential.user);
    } catch (error: any) {
      throw this.mapError(error);
    }
  }

  async signInWithProvider(provider: AuthProvider): Promise<User> {
    try {
      const providerInstance = this.getProviderInstance(provider);
      const credential = await signInWithPopup(auth, providerInstance);
      console.log('[AuthRepo] Provider login successful:', credential.user.email);
      return this.toUser(credential.user);
    } catch (error: any) {
      throw this.mapError(error);
    }
  }

  async signOut(): Promise<void> {
    try {
      await signOut(auth);
      console.log('[AuthRepo] Logout successful');
    } catch (error: any) {
      console.error('[AuthRepo] Logout error:', error);
      throw new Error('Error al cerrar sesión');
    }
  }

  async register(displayName: string, email: string, password: string): Promise<User> {
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(credential.user, { displayName });
      console.log('[AuthRepo] Registration successful:', credential.user.email);
      return this.toUser(credential.user);
    } catch (error: any) {
      throw this.mapError(error);
    }
  }

  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return firebaseOnAuthStateChanged(auth, (firebaseUser) => {
      callback(firebaseUser ? this.toUser(firebaseUser) : null);
    });
  }

  // Private helper methods
  private toUser(firebaseUser: any): User {
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
    };
  }

  private getProviderInstance(provider: AuthProvider) {
    switch (provider) {
      case AuthProvider.GOOGLE:
        return new GoogleAuthProvider();
      default:
        throw new Error(`Provider ${provider} not supported`);
    }
  }

  private mapError(error: any): Error {
    const errorCode = error.code;
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
    const message = errorMessages[errorCode] || 'Error de autenticación. Intenta de nuevo.';
    return new Error(message);
  }
}
```

### Step 3: Dependency Injection Configuration

**New File**: `src/core/config/dependencies.ts`

```typescript
import type { IAuthRepository } from '../repositories/interfaces/IAuthRepository';
import { FirebaseAuthRepository } from '../../infrastructure/repositories/FirebaseAuthRepository';

// Single place to configure implementations
// To switch auth providers, just change this one line!
export const authRepository: IAuthRepository = new FirebaseAuthRepository();

// Example: Switch to Auth0 (when implemented)
// import { Auth0Repository } from '../../infrastructure/repositories/Auth0Repository';
// export const authRepository: IAuthRepository = new Auth0Repository();
```

### Step 4: Refactor Auth Service

**BEFORE**: `src/modules/auth/services/authService.ts`
```typescript
// OLD - Tightly coupled to Firebase
import {
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    createUserWithEmailAndPassword,
    updateProfile,
    type UserCredential,
} from 'firebase/auth';
import { auth } from '../../../core/config/firebase.config.js';

export const loginWithEmail = async (
    email: string,
    password: string
): Promise<UserCredential> => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('[Auth Service] Login successful:', userCredential.user.email);
        return userCredential;
    } catch (error: any) {
        console.error('[Auth Service] Login error:', error.code, error.message);
        throw mapFirebaseError(error);
    }
};

// ... more Firebase-specific code
```

**AFTER**: `src/modules/auth/services/authService.ts`
```typescript
// NEW - Infrastructure agnostic
import type { User, AuthProvider } from '@/core/repositories/interfaces/IAuthRepository';
import { authRepository } from '@/core/config/dependencies';

export const loginWithEmail = async (email: string, password: string): Promise<User> => {
  return await authRepository.signIn(email, password);
};

export const loginWithGoogle = async (): Promise<User> => {
  return await authRepository.signInWithProvider(AuthProvider.GOOGLE);
};

export const logout = async (): Promise<void> => {
  await authRepository.signOut();
};

export const registerWithEmail = async (
  displayName: string,
  email: string,
  password: string
): Promise<User> => {
  return await authRepository.register(displayName, email, password);
};
```

✅ **Benefits**: 
- No Firebase imports
- Can switch auth providers by changing 1 line in `dependencies.ts`
- Testable with mock repositories

---

## 🔧 F-02: Side Effects in Module Loading

### Step 1: Create Auth State Manager (Observer Pattern)

**New File**: `src/core/observers/AuthStateManager.ts`

```typescript
import type { IAuthRepository, User } from '../repositories/interfaces/IAuthRepository';

export type AuthStateObserver = (user: User | null) => void;

/**
 * AuthStateManager - Implements Observer Pattern
 * Manages authentication state and notifies all subscribers of changes
 */
export class AuthStateManager {
  private observers: Set<AuthStateObserver> = new Set();
  private currentUser: User | null = null;
  private unsubscribe: (() => void) | null = null;
  private isInitialized = false;

  constructor(private authRepository: IAuthRepository) {}

  /**
   * Initialize auth state listener
   * ONLY call this when app is ready (not at module load)
   */
  initialize(): void {
    if (this.isInitialized) {
      console.warn('[AuthStateManager] Already initialized');
      return;
    }

    console.log('[AuthStateManager] Initializing...');
    
    this.unsubscribe = this.authRepository.onAuthStateChanged((user) => {
      console.log('[AuthStateManager] Auth state changed:', user?.email || 'logged out');
      this.currentUser = user;
      this.notifyObservers(user);
    });

    this.isInitialized = true;
  }

  /**
   * Subscribe to auth state changes
   * Returns unsubscribe function
   */
  subscribe(observer: AuthStateObserver): () => void {
    console.log('[AuthStateManager] New subscriber added');
    this.observers.add(observer);
    
    // Immediately notify with current state
    observer(this.currentUser);

    // Return unsubscribe function
    return () => {
      console.log('[AuthStateManager] Subscriber removed');
      this.observers.delete(observer);
    };
  }

  /**
   * Notify all observers of state change
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
   * Get current user (synchronous)
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Cleanup all subscriptions
   */
  cleanup(): void {
    console.log('[AuthStateManager] Cleaning up...');
    this.unsubscribe?.();
    this.observers.clear();
    this.isInitialized = false;
    this.currentUser = null;
  }
}

// Export singleton instance
import { authRepository } from '../config/dependencies';
export const authStateManager = new AuthStateManager(authRepository);
```

### Step 2: Refactor User Store (Remove Side Effects)

**BEFORE**: `src/modules/auth/store/useUserStore.ts`
```typescript
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { type User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../../core/config/firebase.config.js';

// ... store definition ...

// ❌ SIDE EFFECT AT MODULE LOAD!
useUserStore.getState().initAuthListener();
```

**AFTER**: `src/modules/auth/store/useUserStore.ts`
```typescript
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { User } from '@/core/repositories/interfaces/IAuthRepository';
import { authRepository } from '@/core/config/dependencies';

interface UserState {
  user: User | null;
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
          await authRepository.signOut();
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

// ✅ NO MORE SIDE EFFECTS!
```

### Step 3: Initialize in App Root

**File**: `src/main.tsx`

```typescript
import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './core/config/queryClient';
import { AppRouter } from './core/router/AppRouter';
import { authStateManager } from './core/observers/AuthStateManager';
import { useUserStore } from './modules/auth';
import './index.css';

function App() {
  useEffect(() => {
    // ✅ Initialize ONLY when app mounts
    console.log('[App] Initializing auth state manager...');
    authStateManager.initialize();

    // Subscribe user store to auth state changes
    const unsubscribe = authStateManager.subscribe((user) => {
      console.log('[App] Auth state update:', user?.email);
      useUserStore.getState().setUser(user);
    });

    // Cleanup on unmount
    return () => {
      console.log('[App] Cleaning up auth state manager...');
      unsubscribe();
      authStateManager.cleanup();
    };
  }, []);

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

✅ **Benefits**:
- No side effects at module load
- Controlled initialization lifecycle
- Easy to test (can mock observers)
- Multiple components can subscribe
- Proper cleanup

---

## 🔧 F-03: Fragmented Business Logic

### Step 1: Create Use Cases

**New File**: `src/modules/auth/usecases/LoginUseCase.ts`

```typescript
import type { IAuthRepository, User } from '@/core/repositories/interfaces/IAuthRepository';

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
 * LoginUseCase - Encapsulates login business logic
 */
export class LoginUseCase {
  constructor(private authRepository: IAuthRepository) {}

  async execute(input: LoginUseCaseInput): Promise<LoginUseCaseOutput> {
    try {
      // Business validation
      this.validateInput(input);

      // Execute auth
      const user = await this.authRepository.signIn(input.email, input.password);
      
      // Business logic: log successful login
      console.log('[LoginUseCase] Login successful for:', user.email);
      
      // Could add more business logic here:
      // - Track login in analytics
      // - Update last login timestamp
      // - Send welcome notification
      // etc.

      return { success: true, user };
    } catch (error: any) {
      console.error('[LoginUseCase] Login failed:', error.message);
      return { 
        success: false, 
        error: this.mapErrorMessage(error) 
      };
    }
  }

  private validateInput(input: LoginUseCaseInput): void {
    if (!input.email || !input.email.includes('@')) {
      throw new Error('Email inválido');
    }
    if (!input.password || input.password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres');
    }
  }

  private mapErrorMessage(error: any): string {
    // Centralized error mapping for business layer
    return error.message || 'Error de autenticación';
  }
}
```

**New File**: `src/modules/transactions/usecases/CreateTransactionUseCase.ts`

```typescript
import type { ITransactionRepository } from '@/core/repositories/interfaces/ITransactionRepository';
import type { TransactionModel, TransactionFormData } from '../types/transaction.types';

export interface CreateTransactionInput {
  description: string;
  amount: number;
  category: string;
  type: 'INCOME' | 'EXPENSE';
  date: string;
  userId: string;
}

export class CreateTransactionUseCase {
  constructor(private transactionRepository: ITransactionRepository) {}

  async execute(input: CreateTransactionInput): Promise<TransactionModel> {
    // Business validation
    this.validate(input);

    // Business logic: transform and prepare data
    const transactionData: TransactionFormData = {
      description: input.description.trim(),
      amount: input.amount,
      category: input.category,
      type: input.type,
      date: new Date(input.date),
    };

    // Business logic: categorize if needed
    if (!input.category || input.category === 'auto') {
      transactionData.category = this.autoCategorizepInput.description, input.type);
    }

    // Delegate to repository
    const result = await this.transactionRepository.create(transactionData, input.userId);

    // Business logic: log event
    console.log('[CreateTransactionUseCase] Transaction created:', result.id);

    return result;
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

    if (!['INCOME', 'EXPENSE'].includes(input.type)) {
      throw new Error('Tipo de transacción inválido');
    }

    const date = new Date(input.date);
    if (isNaN(date.getTime())) {
      throw new Error('Fecha inválida');
    }
  }

  private autoCategorize(description: string, type: 'INCOME' | 'EXPENSE'): string {
    const desc = description.toLowerCase();
    
    // Simple auto-categorization logic
    if (type === 'EXPENSE') {
      if (desc.includes('comida') || desc.includes('restaurante')) return 'Alimentación';
      if (desc.includes('uber') || desc.includes('taxi')) return 'Transporte';
      if (desc.includes('arriendo') || desc.includes('alquiler')) return 'Vivienda';
      return 'Otros';
    } else {
      if (desc.includes('salario') || desc.includes('sueldo')) return 'Salario';
      if (desc.includes('negocio')) return 'Negocio';
      return 'Otros';
    }
  }
}
```

### Step 2: Create Repository Interface

**New File**: `src/core/repositories/interfaces/ITransactionRepository.ts`

```typescript
import type { TransactionModel, TransactionFormData } from '@/modules/transactions/types/transaction.types';

export interface ITransactionRepository {
  getByUserId(userId: string, period?: string): Promise<TransactionModel[]>;
  create(data: TransactionFormData, userId: string): Promise<TransactionModel>;
  update(id: number, data: Partial<TransactionFormData>): Promise<TransactionModel>;
  delete(id: number): Promise<void>;
}
```

### Step 3: Create Repository Implementation

**New File**: `src/infrastructure/repositories/HttpTransactionRepository.ts`

```typescript
import type { ITransactionRepository } from '@/core/repositories/interfaces/ITransactionRepository';
import type { TransactionModel, TransactionFormData, TransactionItemResponse } from '@/modules/transactions/types/transaction.types';
import { transactionAdapter } from '@/modules/transactions/adapters/transaction.adapter';
import HttpClient from '@/core/api/HttpClient';

export class HttpTransactionRepository implements ITransactionRepository {
  private httpClient = HttpClient.getInstance('transactions');

  async getByUserId(userId: string, period?: string): Promise<TransactionModel[]> {
    const endpoint = period 
      ? `/v1/transactions?period=${period}` 
      : `/v1/transactions?userId=${userId}`;
    
    const response = await this.httpClient.get<TransactionItemResponse[]>(endpoint);
    return response.data.map(transactionAdapter);
  }

  async create(data: TransactionFormData, userId: string): Promise<TransactionModel> {
    const payload = {
      ...data,
      userId,
      date: data.date.toISOString().split('T')[0],
    };

    const response = await this.httpClient.post<TransactionItemResponse>(
      '/v1/transactions',
      payload
    );
    
    return transactionAdapter(response.data);
  }

  async update(id: number, data: Partial<TransactionFormData>): Promise<TransactionModel> {
    const response = await this.httpClient.put<TransactionItemResponse>(
      `/v1/transactions/${id}`,
      data
    );
    
    return transactionAdapter(response.data);
  }

  async delete(id: number): Promise<void> {
    await this.httpClient.delete(`/v1/transactions/${id}`);
  }
}
```

### Step 4: Update Dependencies Configuration

**File**: `src/core/config/dependencies.ts`

```typescript
import type { IAuthRepository } from '../repositories/interfaces/IAuthRepository';
import type { ITransactionRepository } from '../repositories/interfaces/ITransactionRepository';
import { FirebaseAuthRepository } from '../../infrastructure/repositories/FirebaseAuthRepository';
import { HttpTransactionRepository } from '../../infrastructure/repositories/HttpTransactionRepository';

// ✅ Single place to configure all implementations
export const authRepository: IAuthRepository = new FirebaseAuthRepository();
export const transactionRepository: ITransactionRepository = new HttpTransactionRepository();
```

### Step 5: Create Custom Hook for Use Cases

**New File**: `src/modules/auth/hooks/useAuthUseCases.ts`

```typescript
import { useMemo } from 'react';
import { LoginUseCase } from '../usecases/LoginUseCase';
import { RegisterUseCase } from '../usecases/RegisterUseCase';
import { LogoutUseCase } from '../usecases/LogoutUseCase';
import { authRepository } from '@/core/config/dependencies';

export function useAuthUseCases() {
  return useMemo(() => ({
    loginUseCase: new LoginUseCase(authRepository),
    registerUseCase: new RegisterUseCase(authRepository),
    logoutUseCase: new LogoutUseCase(authRepository),
  }), []);
}
```

**New File**: `src/modules/transactions/hooks/useTransactionUseCases.ts`

```typescript
import { useMemo } from 'react';
import { CreateTransactionUseCase } from '../usecases/CreateTransactionUseCase';
import { GetTransactionsUseCase } from '../usecases/GetTransactionsUseCase';
import { transactionRepository } from '@/core/config/dependencies';

export function useTransactionUseCases() {
  return useMemo(() => ({
    createTransactionUseCase: new CreateTransactionUseCase(transactionRepository),
    getTransactionsUseCase: new GetTransactionsUseCase(transactionRepository),
  }), []);
}
```

### Step 6: Refactor Components (Clean UI)

**BEFORE**: `src/modules/auth/components/LoginForm.tsx`
```typescript
// OLD - Mixed concerns (UI + Business Logic)
export const LoginForm = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      // ❌ Business logic in UI component
      await loginWithEmail(data.email, data.password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ... rest of component
};
```

**AFTER**: `src/modules/auth/components/LoginForm.tsx`
```typescript
// NEW - Only UI concerns
import { useAuthUseCases } from '../hooks/useAuthUseCases';

export const LoginForm = () => {
  const navigate = useNavigate();
  const { loginUseCase } = useAuthUseCases();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

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

  // ... rest is just UI rendering
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Iniciar Sesión</CardTitle>
        <CardDescription>
          Ingresa tus credenciales para acceder a tu cuenta
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="ejemplo@correo.com"
              {...register('email')}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
              disabled={isLoading}
            />
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
```

**BEFORE**: `src/modules/transactions/pages/TransactionPage.tsx`
```typescript
// OLD - Business logic in UI
const handleCreateTransaction = (data: {...}) => {
  // ❌ Data transformation in UI
  const formData = {
    ...data,
    userId: user.uid,
    date: new Date(data.date),
  };
  createTransaction(formData);
  setIsCreateDialogOpen(false);
};
```

**AFTER**: `src/modules/transactions/pages/TransactionPage.tsx`
```typescript
// NEW - Clean component
import { useTransactionUseCases } from '../hooks/useTransactionUseCases';

export function TransactionPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { user } = useUserStore();
  const { createTransactionUseCase } = useTransactionUseCases();
  const { transactions, isLoading, error, refetch } = useTransactions();

  if (!user) return null;

  const handleCreateTransaction = async (data: TransactionFormInput) => {
    try {
      // ✅ SIMPLE: just call the use case
      await createTransactionUseCase.execute({
        ...data,
        userId: user.id,
      });
      
      toast.success('Transacción creada con éxito');
      setIsCreateDialogOpen(false);
      refetch();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // ... rest is just UI rendering
}
```

✅ **Benefits**:
- Business logic centralized in Use Cases
- Components only handle UI state and rendering
- Easy to test business logic in isolation
- Reusable logic across different components
- Clear separation of concerns

---

## 🔧 F-07: God Components - Refactoring DataTable

### Extract Custom Hooks

**New File**: `src/modules/transactions/hooks/useTableFiltering.ts`

```typescript
import { useState, useMemo } from 'react';

export interface FilterState {
  search: string;
  type: Set<string>;
  category: Set<string>;
}

export function useTableFiltering<T>(
  data: T[],
  filterFn: (item: T, filters: FilterState) => boolean
) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState<Set<string>>(new Set());

  const filters: FilterState = {
    search,
    type: typeFilter,
    category: categoryFilter,
  };

  const filteredData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data.filter(item => filterFn(item, filters));
  }, [data, search, typeFilter, categoryFilter]);

  const reset = () => {
    setSearch('');
    setTypeFilter(new Set());
    setCategoryFilter(new Set());
  };

  return {
    filteredData,
    filters: {
      search,
      setSearch,
      typeFilter,
      setTypeFilter,
      categoryFilter,
      setCategoryFilter,
      reset,
    },
  };
}
```

**New File**: `src/modules/transactions/hooks/useTablePagination.ts`

```typescript
import { useState, useMemo } from 'react';
import { TABLE_CONFIG } from '@/core/config/table.config';

export function useTablePagination<T>(
  data: T[],
  pageSize: number = TABLE_CONFIG.defaultPageSize
) {
  const [pageIndex, setPageIndex] = useState(0);

  const paginatedData = useMemo(() => {
    const start = pageIndex * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, pageIndex, pageSize]);

  const totalPages = Math.ceil(data.length / pageSize);

  const goToPage = (page: number) => {
    if (page >= 0 && page < totalPages) {
      setPageIndex(page);
    }
  };

  const nextPage = () => goToPage(pageIndex + 1);
  const prevPage = () => goToPage(pageIndex - 1);
  const resetPage = () => setPageIndex(0);

  return {
    paginatedData,
    pageIndex,
    setPageIndex,
    totalPages,
    hasNext: pageIndex < totalPages - 1,
    hasPrev: pageIndex > 0,
    goToPage,
    nextPage,
    prevPage,
    resetPage,
  };
}
```

### Extract Utilities

**New File**: `src/shared/utils/formatters.ts`

```typescript
export const formatters = {
  currency: (amount: number, locale: string = 'es-CO', currency: string = 'COP') => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(amount);
  },

  date: (date: Date, locale: string = 'es-CO') => {
    return date.toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  },

  datetime: (date: Date, locale: string = 'es-CO') => {
    return date.toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },
};
```

**New File**: `src/modules/transactions/config/categories.config.ts`

```typescript
export const CATEGORY_COLORS: Record<string, string> = {
  'Alimentación': 'bg-blue-100 text-blue-800',
  'Transporte': 'bg-green-100 text-green-800',
  'Vivienda': 'bg-purple-100 text-purple-800',
  'Salud': 'bg-red-100 text-red-800',
  'Educación': 'bg-yellow-100 text-yellow-800',
  'Entretenimiento': 'bg-pink-100 text-pink-800',
  'Salario': 'bg-emerald-100 text-emerald-800',
  'Negocio': 'bg-orange-100 text-orange-800',
  'Inversiones': 'bg-indigo-100 text-indigo-800',
  'Otros': 'bg-gray-100 text-gray-800',
} as const;

export const getCategoryColor = (category: string): string => {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS['Otros'];
};
```

### Refactored DataTable

**BEFORE**: 200+ lines with mixed concerns

**AFTER**: `src/modules/transactions/components/DataTable.tsx` (~80 lines)

```typescript
import { useMemo } from 'react';
import { DataTableToolbar } from './DataTableToolbar';
import { TransactionTable } from './TransactionTable';
import { DataTablePagination } from './DataTablePagination';
import { useTableFiltering } from '../hooks/useTableFiltering';
import { useTablePagination } from '../hooks/useTablePagination';
import type { TransactionModel } from '../types/transaction.types';

interface DataTableProps {
  data: TransactionModel[];
  onCreateTransaction: () => void;
}

export function DataTable({ data, onCreateTransaction }: DataTableProps) {
  // Extract categories
  const categories = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return Array.from(new Set(data.map(item => item.category))).sort();
  }, [data]);

  // Use filtering hook
  const { filteredData, filters } = useTableFiltering(data, (transaction, filters) => {
    const matchesSearch = transaction.description
      .toLowerCase()
      .includes(filters.search.toLowerCase());
    const matchesType = filters.type.size === 0 || filters.type.has(transaction.type);
    const matchesCategory = filters.category.size === 0 || filters.category.has(transaction.category);
    return matchesSearch && matchesType && matchesCategory;
  });

  // Use pagination hook
  const pagination = useTablePagination(filteredData);

  // Reset pagination when filters change
  const handleFiltersChange = () => {
    pagination.resetPage();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">
            Listado de Transacciones
          </h2>
          <p className="text-sm text-muted-foreground">
            Gestiona y visualiza tus movimientos financieros
          </p>
        </div>
      </div>

      <DataTableToolbar
        filters={filters}
        categories={categories}
        onCreateTransaction={onCreateTransaction}
        onFiltersChange={handleFiltersChange}
      />

      <TransactionTable data={pagination.paginatedData} />

      <DataTablePagination
        pagination={pagination}
        totalItems={filteredData.length}
      />
    </div>
  );
}
```

**New File**: `src/modules/transactions/components/TransactionTable.tsx`

```typescript
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatters } from '@/shared/utils/formatters';
import { getCategoryColor } from '../config/categories.config';
import type { TransactionModel } from '../types/transaction.types';

interface TransactionTableProps {
  data: TransactionModel[];
}

export function TransactionTable({ data }: TransactionTableProps) {
  if (data.length === 0) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Concepto</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Monto</TableHead>
            <TableHead>Tipo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell colSpan={5} className="h-24 text-center">
              No se encontraron transacciones.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Concepto</TableHead>
          <TableHead>Categoría</TableHead>
          <TableHead>Monto</TableHead>
          <TableHead>Tipo</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((transaction) => (
          <TableRow key={transaction.id}>
            <TableCell>
              {formatters.date(transaction.date)}
            </TableCell>
            <TableCell className="font-medium max-w-[200px] truncate">
              {transaction.description}
            </TableCell>
            <TableCell>
              <Badge className={getCategoryColor(transaction.category)}>
                {transaction.category}
              </Badge>
            </TableCell>
            <TableCell className={`font-semibold ${
              transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
            }`}>
              {transaction.type === 'INCOME' ? '+' : '-'} {formatters.currency(transaction.amount)}
            </TableCell>
            <TableCell>
              <Badge variant={transaction.type === 'INCOME' ? 'default' : 'destructive'}>
                {transaction.type === 'INCOME' ? 'Ingreso' : 'Egreso'}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

✅ **Benefits**:
- Reduced from 200+ lines to ~80 lines
- Single Responsibility Principle
- Reusable hooks for other tables
- Easier to test
- Better maintainability

---

## 🧪 Testing Examples

### Testing Repository

**File**: `src/infrastructure/repositories/__tests__/FirebaseAuthRepository.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { FirebaseAuthRepository } from '../FirebaseAuthRepository';
import type { IAuthRepository } from '@/core/repositories/interfaces/IAuthRepository';

// Mock Firebase
vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  signOut: vi.fn(),
}));

describe('FirebaseAuthRepository', () => {
  let repository: IAuthRepository;

  beforeEach(() => {
    repository = new FirebaseAuthRepository();
  });

  it('should implement IAuthRepository interface', () => {
    expect(repository).toHaveProperty('signIn');
    expect(repository).toHaveProperty('signInWithProvider');
    expect(repository).toHaveProperty('signOut');
    expect(repository).toHaveProperty('register');
    expect(repository).toHaveProperty('onAuthStateChanged');
  });

  it('should sign in user successfully', async () => {
    const mockUser = {
      uid: '123',
      email: 'test@test.com',
      displayName: 'Test User',
      photoURL: null,
    };

    const user = await repository.signIn('test@test.com', 'password123');

    expect(user).toEqual({
      id: '123',
      email: 'test@test.com',
      displayName: 'Test User',
      photoURL: null,
    });
  });
});
```

### Testing Use Case

**File**: `src/modules/transactions/usecases/__tests__/CreateTransactionUseCase.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { CreateTransactionUseCase } from '../CreateTransactionUseCase';
import type { ITransactionRepository } from '@/core/repositories/interfaces/ITransactionRepository';

// Mock Repository
class MockTransactionRepository implements ITransactionRepository {
  async getByUserId() { return []; }
  async create(data: any) {
    return {
      id: 1,
      ...data,
      userId: 'test_user',
    };
  }
  async update() { return {} as any; }
  async delete() {}
}

describe('CreateTransactionUseCase', () => {
  let useCase: CreateTransactionUseCase;
  let mockRepo: ITransactionRepository;

  beforeEach(() => {
    mockRepo = new MockTransactionRepository();
    useCase = new CreateTransactionUseCase(mockRepo);
  });

  it('should create transaction with valid data', async () => {
    const result = await useCase.execute({
      description: 'Test Transaction',
      amount: 100,
      type: 'INCOME',
      category: 'Salario',
      date: '2024-01-01',
      userId: 'test_user',
    });

    expect(result.id).toBe(1);
    expect(result.description).toBe('Test Transaction');
    expect(result.amount).toBe(100);
  });

  it('should throw error for invalid amount', async () => {
    await expect(useCase.execute({
      description: 'Test',
      amount: -100,
      type: 'INCOME',
      category: 'Salario',
      date: '2024-01-01',
      userId: 'test_user',
    })).rejects.toThrow('El monto debe ser mayor a 0');
  });

  it('should throw error for empty description', async () => {
    await expect(useCase.execute({
      description: '',
      amount: 100,
      type: 'INCOME',
      category: 'Salario',
      date: '2024-01-01',
      userId: 'test_user',
    })).rejects.toThrow('La descripción es requerida');
  });
});
```

---

## 📊 Summary

| Bug | Pattern Applied | Key Files Created | Lines of Code Impact |
|-----|----------------|-------------------|---------------------|
| F-01 | Repository | IAuthRepository.ts, FirebaseAuthRepository.ts, dependencies.ts | +150, -50 (net +100) |
| F-02 | Observer | AuthStateManager.ts, Updated main.tsx | +80, -20 (net +60) |
| F-03 | Repository + Use Cases | CreateTransactionUseCase.ts, ITransactionRepository.ts | +200,