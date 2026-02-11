import type { IAuthRepository, User, AuthStateListener } from '../repositories/IAuthRepository';

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
  private observers: Set<AuthStateListener> = new Set();
  private currentUser: User | null = null;
  private unsubscribe: (() => void) | null = null;

  // Lazy Initialization: Flag to prevent duplicate initialization
  private isInitialized = false;

  // 1️⃣ DEPENDENCY INJECTION
  private authRepository: IAuthRepository;

  /**
   * 1️⃣ DEPENDENCY INJECTION
   * Constructor receives dependency instead of importing it
   */
  constructor(authRepository: IAuthRepository) {
    this.authRepository = authRepository;
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
  subscribe(observer: AuthStateListener): () => void {
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
