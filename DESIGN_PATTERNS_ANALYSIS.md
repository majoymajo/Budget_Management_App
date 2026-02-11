# Design Patterns Analysis: Observer & Repository

## Executive Summary

This document provides a comprehensive analysis of how **Observer** and **Repository** design patterns can resolve the identified bugs in the Frontend codebase, improving maintainability, scalability, and architectural robustness.

---

## 🎯 Pattern Overview

### Repository Pattern
**Purpose**: Abstracts data access logic, providing a uniform interface for data operations independent of the underlying data source.

**Benefits**:
- ✅ Decouples business logic from data sources (solves F-01 Vendor Lock-in)
- ✅ Centralizes data access logic (solves F-03 Fragmented Logic)
- ✅ Improves testability through interface-based design
- ✅ Simplifies switching data providers without code changes

### Observer Pattern
**Purpose**: Establishes a subscription mechanism where objects (observers) can react to state changes in other objects (subjects).

**Benefits**:
- ✅ Decouples state management from UI components (solves F-02 Side Effects)
- ✅ Enables reactive data flow
- ✅ Reduces prop drilling and component coupling
- ✅ Centralizes state change notifications

---

## 🐛 Bug Analysis & Solutions

### F-01: Firebase Vendor Lock-in 🟠 HIGH

**Current Problem**:
```typescript
// useUserStore.ts - TIGHTLY COUPLED TO FIREBASE
import { type User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../../core/config/firebase.config.js';

// authService.ts - DIRECT FIREBASE DEPENDENCY
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
```

**Issues**:
- Firebase types and functions used directly across the codebase
- Impossible to switch auth providers without major refactoring
- Business logic mixed with infrastructure concerns

**Solution: Repository Pattern**

Create an **AuthRepository** interface that abstracts authentication operations:

```typescript
// core/repositories/interfaces/IAuthRepository.ts
export interface IAuthRepository {
  signIn(email: string, password: string): Promise<User>;
  signInWithProvider(provider: AuthProvider): Promise<User>;
  signOut(): Promise<void>;
  register(displayName: string, email: string, password: string): Promise<User>;
  onAuthStateChanged(callback: (user: User | null) => void): () => void;
}

// Enum for auth providers (not tied to Firebase)
export enum AuthProvider {
  GOOGLE = 'GOOGLE',
  GITHUB = 'GITHUB',
  // etc.
}

// Domain User type (not Firebase-specific)
export interface User {
  id: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}
```

**Firebase Implementation** (can be swapped):

```typescript
// infrastructure/repositories/FirebaseAuthRepository.ts
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  type UserCredential 
} from 'firebase/auth';
import { auth } from '../../core/config/firebase.config';
import type { IAuthRepository, User, AuthProvider } from '../../core/repositories/interfaces/IAuthRepository';

export class FirebaseAuthRepository implements IAuthRepository {
  async signIn(email: string, password: string): Promise<User> {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      return this.mapToUser(credential.user);
    } catch (error: any) {
      throw this.mapError(error);
    }
  }

  async signInWithProvider(provider: AuthProvider): Promise<User> {
    const providerInstance = this.getProvider(provider);
    const credential = await signInWithPopup(auth, providerInstance);
    return this.mapToUser(credential.user);
  }

  async signOut(): Promise<void> {
    await auth.signOut();
  }

  async register(displayName: string, email: string, password: string): Promise<User> {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName });
    return this.mapToUser(credential.user);
  }

  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, (firebaseUser) => {
      callback(firebaseUser ? this.mapToUser(firebaseUser) : null);
    });
  }

  // Helper methods
  private mapToUser(firebaseUser: any): User {
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
    // Error mapping logic...
    return new Error(error.message);
  }
}
```

**Alternative Auth0 Implementation** (easy to swap):

```typescript
// infrastructure/repositories/Auth0Repository.ts
export class Auth0Repository implements IAuthRepository {
  // Implementation using Auth0 SDK
  // Same interface, different implementation
}
```

**Updated Auth Service** (infrastructure-agnostic):

```typescript
// modules/auth/services/authService.ts
import type { IAuthRepository, User, AuthProvider } from '@/core/repositories/interfaces/IAuthRepository';
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

**Dependency Injection Configuration**:

```typescript
// core/config/dependencies.ts
import type { IAuthRepository } from '../repositories/interfaces/IAuthRepository';
import { FirebaseAuthRepository } from '../../infrastructure/repositories/FirebaseAuthRepository';
// import { Auth0Repository } from '../../infrastructure/repositories/Auth0Repository';

// Single place to configure which implementation to use
export const authRepository: IAuthRepository = new FirebaseAuthRepository();
// To switch: export const authRepository: IAuthRepository = new Auth0Repository();
```

**Impact**:
- ✅ Decouples 100% from Firebase
- ✅ Can switch to Auth0, Supabase, or custom backend with **ONE line change**
- ✅ Business logic now infrastructure-agnostic
- ✅ Easier testing with mock repositories

---

### F-02: Side Effects in Module Loading 🟠 HIGH

**Current Problem**:
```typescript
// useUserStore.ts - SIDE EFFECT AT MODULE LOAD
export const useUserStore = create<UserState>()(/* ... */);

// This runs immediately when module loads!
useUserStore.getState().initAuthListener();
```

**Issues**:
- Auth listener initialized at module import time
- Hard to test
- Can't control when initialization happens
- Violates Single Responsibility Principle

**Solution: Observer Pattern + Lazy Initialization**

Create an **AuthStateManager** that implements the Observer pattern:

```typescript
// core/observers/AuthStateManager.ts
export type AuthStateObserver = (user: User | null) => void;

export class AuthStateManager {
  private observers: Set<AuthStateObserver> = new Set();
  private currentUser: User | null = null;
  private unsubscribe: (() => void) | null = null;
  private isInitialized = false;

  constructor(private authRepository: IAuthRepository) {}

  // Initialize ONLY when needed
  initialize(): void {
    if (this.isInitialized) return;

    this.unsubscribe = this.authRepository.onAuthStateChanged((user) => {
      this.currentUser = user;
      this.notifyObservers(user);
    });

    this.isInitialized = true;
  }

  // Subscribe to auth state changes
  subscribe(observer: AuthStateObserver): () => void {
    this.observers.add(observer);
    
    // Notify immediately with current state
    observer(this.currentUser);

    // Return unsubscribe function
    return () => {
      this.observers.delete(observer);
    };
  }

  // Notify all observers of state change
  private notifyObservers(user: User | null): void {
    this.observers.forEach(observer => observer(user));
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  cleanup(): void {
    this.unsubscribe?.();
    this.observers.clear();
    this.isInitialized = false;
  }
}

// Singleton instance
export const authStateManager = new AuthStateManager(authRepository);
```

**Updated User Store** (no side effects):

```typescript
// modules/auth/store/useUserStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { User } from '@/core/repositories/interfaces/IAuthRepository';

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

// NO MORE SIDE EFFECTS AT MODULE LEVEL!
```

**Controlled Initialization** in App Root:

```typescript
// main.tsx or App.tsx
import { useEffect } from 'react';
import { authStateManager } from '@/core/observers/AuthStateManager';
import { useUserStore } from '@/modules/auth';

function App() {
  useEffect(() => {
    // Initialize ONLY when app mounts
    authStateManager.initialize();

    // Subscribe store to auth state changes
    const unsubscribe = authStateManager.subscribe((user) => {
      useUserStore.getState().setUser(user);
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
      authStateManager.cleanup();
    };
  }, []);

  return <AppRouter />;
}
```

**Impact**:
- ✅ No side effects at module load
- ✅ Controlled initialization lifecycle
- ✅ Easy to test (can mock observers)
- ✅ Multiple observers can subscribe (extensible)
- ✅ Proper cleanup on unmount

---

### F-03: Fragmented Business Logic 🟠 HIGH

**Current Problem**:

**TransactionPage** mixing concerns:
```typescript
// TransactionPage.tsx - UI + BUSINESS LOGIC
export function TransactionPage() {
  const { user } = useUserStore();
  const { transactions, isLoading, error, createTransaction } = useTransactions();

  // BUSINESS LOGIC IN UI COMPONENT!
  const handleCreateTransaction = (data: {...}) => {
    const formData = {
      ...data,
      userId: user.uid,  // Business logic
      date: new Date(data.date),  // Data transformation
    };
    createTransaction(formData);
    setIsCreateDialogOpen(false);  // UI state
  };

  // More mixed concerns...
}
```

**LoginForm** has authentication logic:
```typescript
// LoginForm.tsx - UI + AUTHENTICATION LOGIC
const onSubmit = async (data: LoginFormData) => {
  setIsLoading(true);
  try {
    await loginWithEmail(data.email, data.password);  // Business logic
    navigate('/dashboard');  // Navigation logic
  } catch (err: any) {
    setError(err.message);  // Error handling
  }
};
```

**Solution: Repository Pattern + Use Cases/Services Layer**

Create dedicated **Use Case** classes that encapsulate business logic:

```typescript
// modules/auth/usecases/LoginUseCase.ts
export interface LoginUseCaseInput {
  email: string;
  password: string;
}

export interface LoginUseCaseOutput {
  success: boolean;
  user?: User;
  error?: string;
}

export class LoginUseCase {
  constructor(
    private authRepository: IAuthRepository,
    private authStateManager: AuthStateManager
  ) {}

  async execute(input: LoginUseCaseInput): Promise<LoginUseCaseOutput> {
    try {
      const user = await this.authRepository.signIn(input.email, input.password);
      
      // Business logic: validate user, log event, etc.
      console.log('[UseCase] Login successful:', user.email);
      
      return { success: true, user };
    } catch (error: any) {
      // Centralized error handling
      return { 
        success: false, 
        error: this.mapErrorMessage(error) 
      };
    }
  }

  private mapErrorMessage(error: any): string {
    // Centralized error mapping
    return error.message || 'Error de autenticación';
  }
}
```

**Updated LoginForm** (only UI concerns):

```typescript
// modules/auth/components/LoginForm.tsx
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

    // ONLY calls use case - NO business logic here
    const result = await loginUseCase.execute(data);

    setIsLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error!);
    }
  };

  // Rest is just UI...
};
```

**Transaction Use Case**:

```typescript
// modules/transactions/usecases/CreateTransactionUseCase.ts
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

    // Business logic: transform data
    const transaction: TransactionFormData = {
      ...input,
      date: new Date(input.date),
    };

    // Delegate to repository
    return await this.transactionRepository.create(transaction);
  }

  private validate(input: CreateTransactionInput): void {
    if (input.amount <= 0) {
      throw new Error('El monto debe ser mayor a 0');
    }
    if (!input.description.trim()) {
      throw new Error('La descripción es requerida');
    }
    // More validations...
  }
}
```

**Transaction Repository Interface**:

```typescript
// core/repositories/interfaces/ITransactionRepository.ts
export interface ITransactionRepository {
  getByUserId(userId: string, period?: string): Promise<TransactionModel[]>;
  create(data: TransactionFormData): Promise<TransactionModel>;
  update(id: number, data: Partial<TransactionFormData>): Promise<TransactionModel>;
  delete(id: number): Promise<void>;
}

// Implementation
// infrastructure/repositories/HttpTransactionRepository.ts
export class HttpTransactionRepository implements ITransactionRepository {
  private httpClient: AxiosInstance;

  constructor() {
    this.httpClient = HttpClient.getInstance('transactions');
  }

  async getByUserId(userId: string, period?: string): Promise<TransactionModel[]> {
    const endpoint = period 
      ? `/v1/transactions?period=${period}` 
      : `/v1/transactions?userId=${userId}`;
    
    const response = await this.httpClient.get<TransactionItemResponse[]>(endpoint);
    return response.data.map(transactionAdapter);
  }

  async create(data: TransactionFormData): Promise<TransactionModel> {
    const response = await this.httpClient.post<TransactionItemResponse>(
      '/v1/transactions', 
      data
    );
    return transactionAdapter(response.data);
  }

  // Other methods...
}
```

**Updated TransactionPage** (clean):

```typescript
// modules/transactions/pages/TransactionPage.tsx
export function TransactionPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { user } = useUserStore();
  const { createTransactionUseCase } = useTransactionUseCases();
  const { transactions, isLoading, error, refetch } = useTransactions();

  if (!user) return null;

  const handleCreateTransaction = async (data: TransactionFormInput) => {
    // SIMPLE: just call the use case
    await createTransactionUseCase.execute({
      ...data,
      userId: user.id,
    });
    
    setIsCreateDialogOpen(false);
    refetch();
  };

  // UI rendering only...
}
```

**Impact**:
- ✅ Business logic centralized in Use Cases
- ✅ Components only handle UI concerns
- ✅ Easy to test business logic in isolation
- ✅ Reusable logic across different UI components
- ✅ Clear separation of concerns

---

### F-04: Type Safety Issues (any types) 🟠 HIGH

**Current Problem**:
```typescript
// transaction.adapter.ts
export const createTransactionAdapter = (data: TransactionModel): any => {
  return {
    transactionId: data.id,
    // ...
  };
};
```

**Solution: Strict Typing with Repository Pattern**

```typescript
// modules/transactions/types/transaction.types.ts
export interface TransactionDTO {
  transactionId: number;
  userId: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  description: string;
  date: string;
}

export interface TransactionModel {
  id: number;
  userId: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  description: string;
  date: Date;
}

export interface TransactionFormData {
  description: string;
  amount: number;
  category: string;
  type: 'INCOME' | 'EXPENSE';
  date: Date;
}

// Strongly typed adapters
export const transactionAdapter = (dto: TransactionDTO): TransactionModel => {
  return {
    id: dto.transactionId,
    userId: dto.userId,
    amount: dto.amount,
    type: dto.type,
    category: dto.category,
    description: dto.description,
    date: new Date(dto.date),
  };
};

export const toTransactionDTO = (model: TransactionFormData, userId: string): Omit<TransactionDTO, 'transactionId'> => {
  return {
    userId,
    amount: model.amount,
    type: model.type,
    category: model.category,
    description: model.description,
    date: model.date.toISOString().split('T')[0],
  };
};
```

**Impact**:
- ✅ No more `any` types
- ✅ Type safety throughout the data flow
- ✅ Catch errors at compile time
- ✅ Better IDE autocomplete

---

### F-05: Reinventing Date Utilities 🟡 MEDIUM

**Current Problem**:
```typescript
// lib/date-utils.ts - CUSTOM IMPLEMENTATION
export function format(date: Date, formatStr: string): string {
  // ~50 lines of custom code...
}
```

**Solution**: Use battle-tested library + Repository Pattern for dates

```typescript
// Remove custom date-utils.ts
// Use date-fns instead

// lib/date-utils.ts (wrapper if needed)
export { format, addDays, subDays, startOfMonth, endOfMonth } from 'date-fns';
export { es } from 'date-fns/locale';
```

**Impact**:
- ✅ Reduces maintenance burden
- ✅ Leverages community-tested code
- ✅ Removes ~50 lines of custom code
- ✅ Better i18n support

---

### F-06: Hardcoded Styles & Components 🟡 MEDIUM

**Current Problem**:
```typescript
// AppRouter.tsx - INLINE HARDCODED COMPONENT
const HomePage = () => (
  <div className="text-center">
    <h1 className="text-4xl font-bold text-gray-800 mb-4">
      Bienvenido a Finanzas Personales
    </h1>
    <a
      href="/login"
      className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg..."
    >
      Iniciar Sesión
    </a>
  </div>
);
```

**Solution: Configuration Pattern + Component Extraction**

```typescript
// modules/home/pages/HomePage.tsx (separate file)
export const HomePage = () => {
  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">
        {APP_CONFIG.appName}
      </h1>
      <p className="text-gray-600">{APP_CONFIG.appDescription}</p>
      <Button asChild className="mt-8">
        <Link to="/login">Iniciar Sesión</Link>
      </Button>
    </div>
  );
};

// core/config/app.config.ts
export const APP_CONFIG = {
  appName: 'Finanzas Personales',
  appDescription: 'Sistema de gestión financiera personal',
  routes: {
    home: '/',
    login: '/login',
    dashboard: '/dashboard',
  },
} as const;
```

**Impact**:
- ✅ Centralized configuration
- ✅ Reusable components
- ✅ Easier to maintain and update

---

### F-07: God Components 🟡 MEDIUM

**Current Problem**:

**DataTable.tsx** has too many responsibilities (~200 lines):
- Filtering logic
- Pagination logic
- Formatting logic
- Rendering logic
- State management

**Solution: Extract Responsibilities into Smaller Components/Hooks**

```typescript
// hooks/useTableFiltering.ts
export function useTableFiltering<T>(
  data: T[],
  filterFn: (item: T, filters: FilterState) => boolean
) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    type: new Set(),
    category: new Set(),
  });

  const filteredData = useMemo(() => {
    return data.filter(item => filterFn(item, filters));
  }, [data, filters]);

  return { filteredData, filters, setFilters };
}

// hooks/useTablePagination.ts
export function useTablePagination<T>(data: T[], pageSize: number = 10) {
  const [pageIndex, setPageIndex] = useState(0);

  const paginatedData = useMemo(() => {
    const start = pageIndex * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, pageIndex, pageSize]);

  const totalPages = Math.ceil(data.length / pageSize);

  return {
    paginatedData,
    pageIndex,
    setPageIndex,
    totalPages,
    hasNext: pageIndex < totalPages - 1,
    hasPrev: pageIndex > 0,
  };
}

// utils/formatters.ts
export const formatters = {
  currency: (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP"
    }).format(amount);
  },
  
  date: (date: Date) => {
    return date.toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  },
};

// config/categoryColors.ts (externalize configuration)
export const CATEGORY_COLORS: Record<string, string> = {
  "Alimentación": "bg-blue-100 text-blue-800",
  "Transporte": "bg-green-100 text-green-800",
  "Vivienda": "bg-purple-100 text-purple-800",
  // etc...
};

export const getCategoryColor = (category: string): string => {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS["Otros"];
};
```

**Refactored DataTable**:

```typescript
// components/DataTable.tsx (simplified ~80 lines)
export function DataTable({ data, onCreateTransaction }: DataTableProps) {
  const { filteredData, filters, setFilters } = useTableFiltering(
    data,
    (transaction, filters) => {
      const matchesSearch = transaction.description
        .toLowerCase()
        .includes(filters.search.toLowerCase());
      const matchesType = filters.type.size === 0 || filters.type.has(transaction.type);
      const matchesCategory = filters.category.size === 0 || filters.category.has(transaction.category);
      return matchesSearch && matchesType && matchesCategory;
    }
  );

  const { paginatedData, ...pagination } = useTablePagination(filteredData);

  return (
    <div className="space-y-4">
      <DataTableToolbar {...filters} onFiltersChange={setFilters} />
      <TransactionTable data={paginatedData} />
      <DataTablePagination {...pagination} />
    </div>
  );
}
```

**Impact**:
- ✅ Single Responsibility Principle
- ✅ Reusable hooks across different tables
- ✅ Easier to test individual pieces
- ✅ Reduced component complexity

---

### F-08: Magic Numbers & Hardcoded Values 🟡 MEDIUM

**Current Problem**:
```typescript
// DataTable.tsx
const pageSize = 10;  // MAGIC NUMBER

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    "Alimentación": "bg-blue-100 text-blue-800",  // HARDCODED
    // ...
  };
};
```

**Solution: Configuration Constants**

```typescript
// core/config/table.config.ts
export const TABLE_CONFIG = {
  defaultPageSize: 10,
  pageSizeOptions: [5, 10, 20, 50, 100],
} as const;

// modules/transactions/config/categories.config.ts
export const TRANSACTION_CATEGORIES = {
  EXPENSE: [
    'Alimentación',
    'Transporte',
    'Vivienda',
    'Salud',
    'Educación',
    'Entretenimiento',
  ],
  INCOME: [
    'Salario',
    'Negocio',
    'Inversiones',
  ],
  COMMON: ['Otros'],
} as const;

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

**Usage**:

```typescript
import { TABLE_CONFIG } from '@/core/config/table.config';

const { paginatedData, ...pagination } = useTablePagination(
  filteredData,
  TABLE_CONFIG.defaultPageSize
);
```

**Impact**:
- ✅ Centralized configuration
- ✅ Easy to modify values
- ✅ Self-documenting code
- ✅ Type-safe constants

---

### F-09: Missing Error Boundaries 🟡 MEDIUM

**Current Problem**:
- No error boundaries in the app
- Errors crash the entire application
- Poor error recovery UX

**Solution: Error Boundary + Observer Pattern for Error Handling**

```typescript
// core/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h1 className="text-2xl font-bold mb-4">Algo salió mal</h1>
          <p className="text-gray-600 mb-4">
            {this.state.error?.message || 'Error inesperado'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 bg-indigo-600 text-white rounded"
          >
            Reintentar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Usage in AppRouter**:

```typescript
// core/router/AppRouter.tsx
import { ErrorBoundary } from '../components/ErrorBoundary';

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route element={<PublicLayout />}>
              <ErrorBoundary fallback={<PublicErrorFallback />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
              </ErrorBoundary>
            </Route>
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <ErrorBoundary fallback={<DashboardErrorFallback />}>
                <Route path="/dashboard" element={<ReportsPage />} />
                <Route path="/transactions" element={<TransactionPage />} />
              </ErrorBoundary>
            </Route>
          </Route>
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};
```

**Centralized Error Logging with Observer Pattern**:

```typescript
// core/observers/ErrorObserver.ts
export type ErrorHandler = (error: Error, context?: any) => void;

export class ErrorObserver {
  private handlers: Set<ErrorHandler> = new Set();

  subscribe(handler: ErrorHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  notify(error: Error, context?: any): void {
    this.handlers.forEach(handler => handler(error, context));
  }
}

export const errorObserver = new ErrorObserver();

// Subscribe to log errors
errorObserver.subscribe((error, context) => {
  console.error('[Global Error]', error, context);
  // Send to error tracking service (Sentry, etc.)
});
```

**Impact**:
- ✅ Graceful error handling
- ✅ Better UX (errors don't crash the app)
- ✅ Centralized error logging
- ✅ Easy to integrate error tracking services

---

### F-10: Duplicate Types 🟢 LOW

**Current Problem**:
- Types duplicated across `transaction.types.ts` and `shared/types`
- User type defined multiple times

**Solution: Centralized Type Definitions**

```typescript
// shared/types/domain.types.ts
export interface User {
  id: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export type TransactionType = 'INCOME' | 'EXPENSE';

// shared/types/api.types.ts
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  meta: PaginationMeta;
}

// modules/transactions/types/transaction.types.ts (only transaction-specific)
import type { TransactionType } from '@/shared/types/domain.types';

export interface TransactionDTO {
  transactionId: number;
  userId: string;
  amount: number;
  type: TransactionType;  // Reuse shared type
  category: string;
  description: string;
  date: string;
}

export interface TransactionModel {
  id: number;
  userId: string;
  amount: number;
  type: TransactionType;  // Reuse shared type
  category: string;
  description: string;
  date: Date;
}
```

**Impact**:
- ✅ Single source of truth for types
- ✅ Reduced duplication
- ✅ Easier to maintain
- ✅ Consistent domain modeling

---

## 📊 Implementation Priority

### Phase 1: Foundation (High Impact, High Priority)
1. **F-01: Implement Repository Pattern for Auth** (4-6 hours)
   - Create `IAuthRepository` interface
   - Implement `FirebaseAuthRepository`
   - Update auth services
   - Setup dependency injection

2. **F-02: Implement Observer Pattern for Auth State** (3-4 hours)
   - Create `AuthStateManager`
   - Remove module-level side effects
   - Update app initialization

3. **F-03: Extract Business Logic to Use Cases** (6-8 hours)
   - Create Use Case classes
   - Update components to use Use Cases
   - Implement Transaction Repository

### Phase 2: Code Quality (Medium Impact)
4. **F-04: Fix Type Safety** (2-3 hours)
   - Remove all `any` types
   - Add strict type definitions

5. **F-07: Refactor God Components** (4-5 hours)
   - Extract hooks from DataTable
   - Create smaller, focused components

6. **F-08: Extract Configuration** (2 hours)
   - Create config files
   - Remove magic numbers

### Phase 3: Improvements (Lower Priority)
7. **F-05: Replace Custom Date Utils** (1 hour)
   - Install `date-fns`
   - Replace custom implementations

8. **F-09: Add Error Boundaries** (2-3 hours)
   - Implement ErrorBoundary component
   - Add to router

9. **F-06: Extract Hardcoded Components** (1-2 hours)
10. **F-10: Consolidate Types** (1 hour)

**Total Estimated Effort**: ~30-40 hours

---

## 🎯 Additional Bugs Detected

### F-11: Missing Loading States Repository Pattern
**Issue**: No centralized loading state management

**Solution**: Implement `LoadingStateManager` (Observer Pattern)

```typescript
// core/observers/LoadingStateManager.ts
export class LoadingStateManager {
  private loadingStates: Map<string, boolean> = new Map();
  private observers: Set<(states: Map<string, boolean>) => void> = new Set();

  setLoading(key: string, isLoading: boolean): void {
    this.loadingStates.set(key, isLoading);
    this.notifyObservers();
  }

  isLoading(key: string): boolean {
    return this.loadingStates.get(key) ?? false;
  }

  subscribe(observer: (states: Map<string, boolean>) => void): () => void {
    this.observers.add(observer);
    observer(this.loadingStates);
    return () => this.observers.delete(observer);
  }

  private notifyObservers(): void {
    this.observers.forEach(obs => obs(this.loadingStates));
  }
}
```

### F-12: No Data Caching Strategy
**Issue**: Repeated API calls for same data

**Solution**: Repository with Caching Layer

```typescript
// infrastructure/repositories/CachedTransactionRepository.ts
export class CachedTransactionRepository implements ITransactionRepository {
  private cache = new Map<string, { data: TransactionModel[], timestamp: number }>();
  private cacheTTL = 5 * 60 * 1000; // 5 minutes

  constructor(private baseRepository: ITransactionRepository) {}

  async getByUserId(userId: string, period?: string): Promise<TransactionModel[]> {
    const cacheKey = `${userId}-${period || 'all'}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      console.log('[Cache] Hit for', cacheKey);
      return cached.data;
    }

    console.log('[Cache] Miss for', cacheKey);
    const data = await this.baseRepository.getByUserId(userId, period);
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  }

  // Invalidate cache on mutations
  async create(data: TransactionFormData): Promise<TransactionModel> {
    const result = await this.baseRepository.create(data);
    this.invalidateCache();
    return result;
  }

  private invalidateCache(): void {
    this.cache.clear();
  }
}
```

### F-13: No Request Cancellation
**Issue**: Component unmounts but API requests continue

**Solution**: Repository with AbortController

```typescript
// infrastructure/repositories/HttpTransactionRepository.ts
export class HttpTransactionRepository implements ITransactionRepository {
  private abortControllers = new Map<string, AbortController>();

  async getByUserId(userId: string, period?: string): Promise<TransactionModel[]> {
    const key = `getByUserId-${userId}-${period}`;
    
    // Cancel previous request
    this.abortControllers.get(key)?.abort();
    
    // Create new controller
    const controller = new AbortController();
    this.abortControllers.set(key, controller);

    try {
      const response = await this.httpClient.get<TransactionItemResponse[]>(
        `/v1/transactions?userId=${userId}`,
        { signal: controller.signal }
      );
      return response.data.map(transactionAdapter);
    } finally {
      this.abortControllers.delete(key);
    }
  }
}
```

---

## 📈 Benefits Summary

### Before Patterns
- ❌ Tight coupling to Firebase
- ❌ Business logic scattered across components
- ❌ Side effects at module load
- ❌ Type safety issues
- ❌ God components (200+ lines)
- ❌ Magic numbers everywhere
- ❌ No error boundaries
- ❌ Duplicate types

### After Patterns
- ✅ **Repository Pattern**: Decoupled data access, swappable implementations
- ✅ **Observer Pattern**: Reactive state management, loose coupling
- ✅ **Use Cases**: Centralized business logic
- ✅ **Clean Architecture**: Clear separation of concerns
- ✅ **Type Safety**: No `any` types
- ✅ **SOLID Principles**: Single Responsibility, Open/Closed
- ✅ **Testability**: Easy to mock and test
- ✅ **Maintainability**: Clear, modular structure
- ✅ **Scalability**: Easy to add new features
- ✅ **Flexibility**: Swap implementations without changing business logic

---

## 🧪 Testing Strategy

### Repository Testing
```typescript
describe('FirebaseAuthRepository', () => {
  it('should sign in user', async () => {
    const mockAuth = createMockAuth();
    const repository = new FirebaseAuthRepository(mockAuth);
    
    const user = await repository.signIn('test@test.com', 'password');
    
    expect(user.email).toBe('test@test.com');
  });
});
```

### Use Case Testing
```typescript
describe('CreateTransactionUseCase', () => {
  it('should create transaction with valid data', async () => {
    const mockRepo = createMockRepository();
    const useCase = new CreateTransactionUseCase(mockRepo);
    
    const result = await useCase.execute({
      description: 'Test',
      amount: 100,
      type: 'INCOME',
      category: 'Salario',
      date: '2024-01-01',
      userId: '123',
    });
    
    expect(result.id).toBeDefined();
  });
  
  it('should throw error for invalid amount', async () => {
    const useCase = new CreateTransactionUseCase(mockRepo);
    
    await expect(useCase.execute({
      ...validData,
      amount: -100,
    })).rejects.toThrow('El monto debe ser mayor a 0');
  });
});
```

---

## 🚀 Next Steps

1. Review this analysis with the team
2. Prioritize implementation based on Phase 1-3
3. Create feature branches for each bug fix
4. Implement patterns incrementally
5. Write tests for new implementations
6. Code review and merge
7. Monitor for improvements in code quality metrics

---

## 📚 References

- **Repository Pattern**: Martin Fowler - Patterns of Enterprise Application Architecture
- **Observer Pattern**: Gang of Four - Design Patterns
- **Clean Architecture**: Robert C. Martin - Clean Architecture
- **SOLID Principles**: Robert C. Martin - Agile Software Development

