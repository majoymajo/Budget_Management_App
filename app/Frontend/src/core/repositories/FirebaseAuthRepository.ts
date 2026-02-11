import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  type Auth,
  type User as FirebaseUser,
} from 'firebase/auth';
import type { IAuthRepository, User, AuthStateListener } from './IAuthRepository';

/**
 * Firebase Implementation of IAuthRepository
 * 
 * 1️⃣ DEPENDENCY INJECTION:
 *    - Receives Firebase Auth instance through constructor
 *    - Easy to swap or mock in tests
 * 
 * This adapter wraps Firebase Auth and converts it to our interface
 */
export class FirebaseAuthRepository implements IAuthRepository {
  private currentUser: User | null = null;
  private auth: Auth;

  /**
   * 1️⃣ DEPENDENCY INJECTION
   * Constructor receives Firebase auth instance (injected)
   */
  constructor(auth: Auth) {
    this.auth = auth;
    console.log('[FirebaseAuthRepository] Created');
    this.initializeCurrentUser();
  }

  /**
   * Initialize current user from Firebase
   */
  private initializeCurrentUser(): void {
    const firebaseUser = this.auth.currentUser;
    if (firebaseUser) {
      this.currentUser = this.mapFirebaseUserToUser(firebaseUser);
    }
  }

  /**
   * Login with Email and Password
   */
  async signIn(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        this.auth,
        email,
        password
      );
      console.log('[FirebaseAuthRepository] Login successful:', userCredential.user.email);
      this.currentUser = this.mapFirebaseUserToUser(userCredential.user);
      return this.currentUser;
    } catch (error: unknown) {
      console.error('[FirebaseAuthRepository] Login error:', error);
      throw this.mapFirebaseError(error);
    }
  }

  /**
   * Login with OAuth provider
   */
  async signInWithProvider(providerName: string): Promise<User> {
    try {
      let provider;

      if (providerName === 'google' || providerName === 'Google') {
        provider = new GoogleAuthProvider();
      } else {
        throw new Error(`Provider "${providerName}" not supported`);
      }

      const userCredential = await signInWithPopup(this.auth, provider);
      console.log('[FirebaseAuthRepository] Provider login successful:', userCredential.user.email);
      this.currentUser = this.mapFirebaseUserToUser(userCredential.user);
      return this.currentUser;
    } catch (error: unknown) {
      console.error('[FirebaseAuthRepository] Provider login error:', error);
      throw this.mapFirebaseError(error);
    }
  }

  /**
   * Register new user
   */
  async register(displayName: string, email: string, password: string): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password
      );

      await updateProfile(userCredential.user, {
        displayName,
      });

      console.log('[FirebaseAuthRepository] Registration successful:', userCredential.user.email);
      this.currentUser = this.mapFirebaseUserToUser(userCredential.user);
      return this.currentUser;
    } catch (error: unknown) {
      console.error('[FirebaseAuthRepository] Registration error:', error);
      throw this.mapFirebaseError(error);
    }
  }

  /**
   * Logout current user
   */
  async signOut(): Promise<void> {
    try {
      await signOut(this.auth);
      this.currentUser = null;
      console.log('[FirebaseAuthRepository] Logout successful');
    } catch (error: unknown) {
      console.error('[FirebaseAuthRepository] Logout error:', error);
      throw new Error('Error al cerrar sesión');
    }
  }

  /**
   * Subscribe to auth state changes
   * Returns unsubscribe function
   */
  onAuthStateChanged(listener: AuthStateListener): () => void {
    const unsubscribe = onAuthStateChanged(this.auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        this.currentUser = this.mapFirebaseUserToUser(firebaseUser);
      } else {
        this.currentUser = null;
      }
      listener(this.currentUser);
    });

    return unsubscribe;
  }

  /**
   * Get current user synchronously
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Map Firebase User to our User interface
   */
  private mapFirebaseUserToUser(firebaseUser: FirebaseUser): User {
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email || null,
      displayName: firebaseUser.displayName || null,
      photoURL: firebaseUser.photoURL || null,
    };
  }

  /**
   * Map Firebase errors to user-friendly messages
   */
  private mapFirebaseError(error: unknown): Error {
    const firebaseError = error as any;
    const errorCode = firebaseError.code;

    const errorMessages: Record<string, string> = {
      'auth/invalid-email': 'El correo electrónico no es válido',
      'auth/user-disabled': 'Esta cuenta ha sido deshabilitada',
      'auth/user-not-found': 'No existe una cuenta con este correo',
      'auth/wrong-password': 'Contraseña incorrecta',
      'auth/invalid-credential': 'Credenciales incorrectas',
      'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
      'auth/network-request-failed': 'Error de conexión. Verifica tu internet',
      'auth/popup-closed-by-user': 'Inicio de sesión cancelado',
      'auth/cancelled-popup-request': 'Inicio de sesión cancelado',
      'auth/email-already-in-use': 'El correo electrónico ya está en uso',
      'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
      'auth/operation-not-allowed': 'El registro con correo y contraseña está deshabilitado',
    };

    const message = errorMessages[errorCode] || 'Error de autenticación. Intenta de nuevo.';
    return new Error(message);
  }
}
