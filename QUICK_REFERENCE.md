# Quick Reference: Code Changes Summary

## 🎯 F-01: Firebase Vendor Lock-in

### What to Remove
```typescript
// ❌ REMOVE from useUserStore.ts
import { type User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../../core/config/firebase.config.js';

// ❌ REMOVE from authService.ts  
import { signInWithEmailAndPassword, signInWithPopup, ... } from 'firebase/auth';
import { auth } from '../../../core/config/firebase.config.js';

// ❌ REMOVE this line (line 67 in useUserStore.ts)
useUserStore.getState().initAuthListener();
```

### What to Create
- `src/core/repositories/IAuthRepository.ts` - Interface
- `src/infrastructure/repositories/FirebaseAuthRepository.ts` - Implementation  
- `src/core/config/dependencies.ts` - DI config

### What to Replace
- Entire `authService.ts` - Now uses repository
- `useUserStore.ts` - Remove Firebase imports, use domain types

---

## 🎯 F-02: Side Effects at Module Load

### What to Remove
```typescript
// ❌ REMOVE line 67 from useUserStore.ts
useUserStore.getState().initAuthListener();

// ❌ REMOVE this method from UserState interface
initAuthListener: () => void;

// ❌ REMOVE this implementation
initAuthListener: () => {
  onAuthStateChanged(auth, (user) => {
    get().setUser(user);
  });
},
```

### What to Create
- `src/core/observers/AuthStateManager.ts` - **3 Patterns Combined:**
  - 1️⃣ **Dependency Injection**: Receives IAuthRepository via constructor
  - 2️⃣ **Lazy Initialization**: initialize() must be called explicitly
  - 3️⃣ **Observer Pattern**: Notifies multiple subscribers of state changes

### What to Modify
- `src/main.tsx` - Add controlled initialization with useEffect

### Design Patterns Demonstrated

#### 1️⃣ Dependency Injection
```typescript
export class AuthStateManager {
  // ✅ Dependency injected via constructor (not imported)
  constructor(private authRepository: IAuthRepository) {}
}

// ✅ Factory function for flexibility
export const createAuthStateManager = (
  repository: IAuthRepository = authRepository
): AuthStateManager => {
  return new AuthStateManager(repository);
};
```

#### 2️⃣ Lazy Initialization
```typescript
export class AuthStateManager {
  private isInitialized = false;

  // ✅ Explicit initialization - NO automatic execution
  initialize(): void {
    if (this.isInitialized) return;
    // ... start listening
    this.isInitialized = true;
  }

  // ✅ Cleanup when done
  cleanup(): void {
    this.unsubscribe?.();
    this.isInitialized = false;
  }
}
```

#### 3️⃣ Observer Pattern
```typescript
export class AuthStateManager {
  private observers: Set<AuthStateObserver> = new Set();

  // ✅ Subscribe: Add observer to list
  subscribe(observer: AuthStateObserver): () => void {
    this.observers.add(observer);
    observer(this.currentUser); // Notify immediately
    return () => this.observers.delete(observer); // Unsubscribe
  }

  // ✅ Notify: Inform all observers of changes
  private notifyObservers(user: User | null): void {
    this.observers.forEach(observer => observer(user));
  }
}
```

### Usage in main.tsx
```typescript
function App() {
  useEffect(() => {
    // 2️⃣ LAZY INITIALIZATION: Explicit, controlled start
    authStateManager.initialize();

    // 3️⃣ OBSERVER PATTERN: Subscribe to state changes
    const unsubscribe = authStateManager.subscribe((user) => {
      useUserStore.getState().setUser(user);
    });

    // 2️⃣ LAZY INITIALIZATION: Proper cleanup
    return () => {
      unsubscribe();
      authStateManager.cleanup();
    };
  }, []);

  return <AppRouter />;
}
```

### Testing with Dependency Injection
```typescript
// 1️⃣ DEPENDENCY INJECTION: Easy to mock for tests
const mockRepo: IAuthRepository = { /* mock implementation */ };
const manager = createAuthStateManager(mockRepo);

// 2️⃣ LAZY INITIALIZATION: Control when it starts
manager.initialize();

// 3️⃣ OBSERVER PATTERN: Verify notifications
const observer = vi.fn();
manager.subscribe(observer);
expect(observer).toHaveBeenCalled();
```

---

## 🎯 F-03: Fragmented Business Logic

### What to Change in Components

**LoginForm.tsx - Lines 24-37:**
```typescript
// ❌ BEFORE
const onSubmit = async (data: LoginFormData) => {
  setIsLoading(true);
  setError(null);
  try {
    await loginWithEmail(data.email, data.password);  // Business logic
    navigate('/dashboard');  // Navigation logic
  } catch (err: any) {
    setError(err.message);
  } finally {
    setIsLoading(false);
  }
};

// ✅ AFTER
const { loginUseCase } = useAuthUseCases();

const onSubmit = async (data: LoginFormData) => {
  setIsLoading(true);
  setError(null);
  
  const result = await loginUseCase.execute(data);  // Only call use case
  
  setIsLoading(false);
  if (result.success) {
    navigate('/dashboard');
  } else {
    setError(result.error!);
  }
};
```

**TransactionPage.tsx - Lines 24-33:**
```typescript
// ❌ BEFORE
const handleCreateTransaction = (data: {...}) => {
  const formData = {
    ...data,
    userId: user.uid,  // Business logic
    date: new Date(data.date),  // Data transformation
  }
  createTransaction(formData)
  setIsCreateDialogOpen(false)
}

// ✅ AFTER
const createTransactionUseCase = useMemo(() => new CreateTransactionUseCase(), []);

const handleCreateTransaction = async (data: {...}) => {
  await createTransactionUseCase.execute({
    ...data,
    userId: user.uid,
  });
  setIsCreateDialogOpen(false);
};
```

### What to Create
- `src/modules/auth/usecases/LoginUseCase.ts` - Business logic
- `src/modules/transactions/usecases/CreateTransactionUseCase.ts` - Business logic
- `src/modules/auth/hooks/useAuthUseCases.ts` - DI hook

---

## 🎯 F-04: Type Safety Issues

### What to Change

**transaction.adapter.ts - Line 18:**
```typescript
// ❌ BEFORE
export const createTransactionAdapter = (data: TransactionModel): any => {

// ✅ AFTER
export const createTransactionAdapter = (data: TransactionModel): TransactionDTO => {
```

**useTransactions.ts - Line 34:**
```typescript
// ❌ BEFORE
onError: (error: any) => {

// ✅ AFTER  
onError: (error: Error) => {
```

**useTransactions.ts - Add return type:**
```typescript
// ✅ ADD
interface UseTransactionsReturn {
  transactions: TransactionModel[];
  isLoading: boolean;
  error: Error | null;
  createTransaction: (data: TransactionFormData) => void;
  isCreating: boolean;
}

export function useTransactions(period?: string): UseTransactionsReturn {
```

### What to Add to Types
**transaction.types.ts - Add these interfaces:**
```typescript
export interface TransactionDTO {
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

## 📊 Files Checklist

### New Files to Create (9 total)
- [ ] `src/core/repositories/IAuthRepository.ts`
- [ ] `src/infrastructure/repositories/FirebaseAuthRepository.ts`
- [ ] `src/core/config/dependencies.ts`
- [ ] `src/core/observers/AuthStateManager.ts`
- [ ] `src/modules/auth/usecases/LoginUseCase.ts`
- [ ] `src/modules/transactions/usecases/CreateTransactionUseCase.ts`
- [ ] `src/modules/auth/hooks/useAuthUseCases.ts`
- [ ] `src/infrastructure/` (new directory)
- [ ] `src/core/observers/` (new directory)

### Files to Modify (7 total)
- [ ] `src/modules/auth/services/authService.ts` - Complete rewrite
- [ ] `src/modules/auth/store/useUserStore.ts` - Remove Firebase, remove side effect
- [ ] `src/main.tsx` - Add initialization logic
- [ ] `src/modules/auth/components/LoginForm.tsx` - Use use case
- [ ] `src/modules/transactions/pages/TransactionPage.tsx` - Use use case
- [ ] `src/modules/transactions/adapters/transaction.adapter.ts` - Fix types
- [ ] `src/modules/transactions/hooks/useTransactions.ts` - Fix types
- [ ] `src/modules/transactions/types/transaction.types.ts` - Add DTO types

---

## 🚀 Implementation Steps

### Day 1: Repository Pattern (F-01)
1. Create `IAuthRepository.ts` interface (30 min)
2. Create `FirebaseAuthRepository.ts` implementation (1 hour)
3. Create `dependencies.ts` config (15 min)
4. Update `authService.ts` (30 min)
5. Update `useUserStore.ts` (30 min)
6. Test auth flows (1 hour)

**Total: ~4 hours**

### Day 2: Observer Pattern (F-02)
1. Create `AuthStateManager.ts` with 3 patterns:
   - Dependency Injection (constructor injection)
   - Lazy Initialization (explicit initialize())
   - Observer Pattern (subscribe/notify) (1.5 hours)
2. Update `main.tsx` initialization (30 min)
3. Remove side effects from `useUserStore.ts` (15 min)
4. Test all 3 patterns working together (1 hour)

**Total: ~3 hours**

### Day 3: Use Cases (F-03)
1. Create `LoginUseCase.ts` (45 min)
2. Create `CreateTransactionUseCase.ts` (45 min)
3. Create `useAuthUseCases.ts` hook (15 min)
4. Update `LoginForm.tsx` (30 min)
5. Update `TransactionPage.tsx` (30 min)
6. Test business logic (1 hour)

**Total: ~3.5 hours**

### Day 4: Type Safety (F-04)
1. Add DTO types to `transaction.types.ts` (30 min)
2. Fix `transaction.adapter.ts` (30 min)
3. Fix `useTransactions.ts` (30 min)
4. Search and fix remaining `any` types (1 hour)
5. Enable strict mode in tsconfig (30 min)

**Total: ~3 hours**

---

## 🧪 Testing Verification

After each day, verify:

### Day 1 Tests (F-01)
```bash
# Can you import without Firebase errors?
✓ No Firebase imports in authService.ts
✓ No Firebase imports in useUserStore.ts
✓ Login still works
✓ Logout still works
```

### Day 2 Tests (F-02)
```bash
# Does initialization happen correctly?
✓ No errors on app load
✓ Auth state syncs to store
✓ No module-level side effects
✓ Cleanup happens on unmount
✓ Dependency injection works (can inject mock repo)
✓ Lazy initialization (initialize() must be called)
✓ Observer pattern (multiple subscribers work)
```

### Day 3 Tests (F-03)
```bash
# Is business logic separated?
✓ LoginForm.tsx has no auth logic
✓ TransactionPage.tsx has no data transformation
✓ Can unit test use cases
✓ Logic is reusable
```

### Day 4 Tests (F-04)
```bash
# Is everything typed?
✓ No `any` types in adapters
✓ No `any` types in hooks
✓ TypeScript catches errors
✓ IDE autocomplete works
```

---

## 📝 Code Review Checklist

Before merging each fix:

### F-01 Review
- [ ] No Firebase imports outside `FirebaseAuthRepository.ts`
- [ ] `IAuthRepository` interface is framework-agnostic
- [ ] All auth methods use repository
- [ ] Can theoretically swap to Auth0 by changing 1 line

### F-02 Review
- [ ] No code executes at modul
- [ ] **Dependency Injection**: AuthStateManager receives IAuthRepository via constructor
- [ ] **Lazy Initialization**: initialize() must be called explicitly
- [ ] **Observer Pattern**: Multiple subscribers can be added
- [ ] Can create manager with mock repository for testinge import time
- [ ] `useUserStore.getState().initAuthListener()` is removed
- [ ] Initialization happens in `useEffect` in `main.tsx`
- [ ] Proper cleanup on unmount

### F-03 Review
- [ ] Components have no business logic
- [ ] All validation in use cases
- [ ] All data transformation in use cases
- [ ] Components only handle UI state

### F-04 Review
- [ ] Zero `any` types in modified files
- [ ] All DTOs properly typed
- [ ] All function returns properly typed
- [ ] TypeScript strict mode enabled (optional)

---

## 💡 Common Pitfalls to Avoid

### F-01
- ❌ Don't keep Firebase imports in business logic
- ❌ Don't expose Firebase types to components
- ✅ Keep all Firebase code in repository implementation
❌ Don't hardcode dependencies
- ✅ Use constructor injection for dependencies
- ✅ Use useEffect for initialization
- ✅ Return cleanup function
- ✅ Support multiple observers
- ❌ Don't initialize in constructor or top-level
- ❌ Don't forget cleanup
- ✅ Use useEffect for initialization
- ✅ Return cleanup function

### F-03
- ❌ Don't put validation in components
- ❌ Don't put data transformation in components
- ✅ Components should only call use cases
- ✅ All business rules in use cases

### F-04
- ❌ Don't use `any` for convenience
- ❌ Don't skip error types
- ✅ Define interfaces for all data structures
- ✅ Use proper TypeScript generics

---

## 🎉 Success Metrics

After implementing all fixes:

| Metric | Before | Target | How to Measure |
|--------|--------|--------|----------------|
| Firebase coupling | 5 files | 1 file | `grep -r "firebase/auth" src/` |
| Side effects | 1 | 0 | Check for top-level calls |
| Business logic in UI | 60% | 0% | Code review |
| `any` types | 3+ | 0 | `grep -r ": any" src/` |
| Test coverage | 20% | 80% | `npm test -- --coverage` |

---

For detailed implementations of each fix, see [CODE_REVIEW_FIXES.md](./CODE_REVIEW_FIXES.md)
