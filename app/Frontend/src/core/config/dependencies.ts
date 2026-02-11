/**
 * Dependency Injection Configuration
 * 
 * Centralizes all dependency injection setup
 * Makes it easy to swap implementations or mock in tests
 */

import { auth } from './firebase.config';
import { FirebaseAuthRepository } from '../repositories/FirebaseAuthRepository';
import { AuthStateManager } from '../observers/AuthStateManager';
import type { IAuthRepository } from '../repositories/IAuthRepository';

// 1️⃣ DEPENDENCY INJECTION: Create repository with injected Firebase auth
export const authRepository: IAuthRepository = new FirebaseAuthRepository(auth);

// 1️⃣ DEPENDENCY INJECTION: Create AuthStateManager with injected repository
export const authStateManager = new AuthStateManager(authRepository);
