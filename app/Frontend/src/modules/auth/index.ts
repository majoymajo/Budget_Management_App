// Store
export { useUserStore } from './store/useUserStore.ts';

// Services
export { loginWithEmail, loginWithGoogle, logout, registerWithEmail } from './services/authService.ts';

// Schemas
export { loginSchema, type LoginFormData } from './schemas/loginSchema.ts';
export { registerSchema, type RegisterFormData } from './schemas/registerSchema.ts';

// Components
export { LoginForm } from './components/LoginForm.tsx';
export { RegisterForm } from './components/RegisterForm.tsx';
export { ProtectedRoute } from './components/ProtectedRoute.tsx';
export { PublicRoute } from './components/PublicRoute.tsx';

// Pages
export { LoginPage } from './pages/LoginPage.tsx';
export { RegisterPage } from './pages/RegisterPage.tsx';

// Hooks
export { useAuthStatus } from './hooks/useAuthStatus.ts';

// Types & Repositories (New Pattern)
export type { User, AuthStateListener } from '../../core/repositories/IAuthRepository.ts';
export type { IAuthRepository } from '../../core/repositories/IAuthRepository.ts';
export { FirebaseAuthRepository } from '../../core/repositories/FirebaseAuthRepository.ts';
export { AuthStateManager } from '../../core/observers/AuthStateManager.ts';
export { authStateManager, authRepository } from '../../core/config/dependencies.ts';


