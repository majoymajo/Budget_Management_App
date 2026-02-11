/**
 * User Type - Represents authenticated user
 */
export interface User {
  id: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

/**
 * Auth State Change Listener Type
 */
export type AuthStateListener = (user: User | null) => void;

/**
 * IAuthRepository Interface
 * 
 * Repository Pattern: Abstraction for auth operations
 * Allows different implementations (Firebase, Auth0, Custom, etc.)
 * Makes testing easy with mock implementations
 */
export interface IAuthRepository {
  /**
   * Login with email and password
   */
  signIn(email: string, password: string): Promise<User>;

  /**
   * Login with OAuth provider (Google, GitHub, etc.)
   */
  signInWithProvider(providerName: string): Promise<User>;

  /**
   * Register new user
   */
  register(displayName: string, email: string, password: string): Promise<User>;

  /**
   * Logout current user
   */
  signOut(): Promise<void>;

  /**
   * Subscribe to auth state changes
   * Returns unsubscribe function
   */
  onAuthStateChanged(listener: AuthStateListener): () => void;

  /**
   * Get current user synchronously
   */
  getCurrentUser(): User | null;
}
