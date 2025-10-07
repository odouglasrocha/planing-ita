// MongoDB Client for Frontend
// Demo-only client for browser compatibility - no actual MongoDB connection

import { MongoUser, AuthSession } from './auth-types';

// Local storage keys
const STORAGE_KEYS = {
  SESSION: 'mongo_auth_session',
  USER: 'mongo_auth_user'
};

// Demo users for development
const DEMO_USERS: (MongoUser & { _id: string })[] = [
  {
    _id: '1',
    email: 'admin@oee.com',
    password: '$2b$10$rQJ8YnWkKhKZGqeQvJ5zKOXvJ5zKOXvJ5zKOXvJ5zKOXvJ5zKOXvJ5', // admin123
    name: 'João Silva',
    full_name: 'João Silva',
    role: 'admin' as const,
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    _id: '2',
    email: 'supervisor@oee.com',
    password: '$2b$10$rQJ8YnWkKhKZGqeQvJ5zKOXvJ5zKOXvJ5zKOXvJ5zKOXvJ5zKOXvJ6', // supervisor123
    name: 'Maria Santos',
    full_name: 'Maria Santos',
    role: 'supervisor' as const,
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    _id: '3',
    email: 'operador@oee.com',
    password: '$2b$10$rQJ8YnWkKhKZGqeQvJ5zKOXvJ5zKOXvJ5zKOXvJ5zKOXvJ5zKOXvJ7', // operador123
    name: 'Pedro Costa',
    full_name: 'Pedro Costa',
    role: 'operador' as const,
    created_at: new Date(),
    updated_at: new Date()
  }
];

// Simple password verification for demo (in production, use proper bcrypt)
const verifyPassword = (plainPassword: string, email: string): boolean => {
  console.log('🔐 Verifying password for email:', email);
  console.log('🔐 Password provided:', plainPassword);
  
  const passwordMap: Record<string, string> = {
    'admin@oee.com': 'admin123',
    'supervisor@oee.com': 'supervisor123',
    'operador@oee.com': 'operador123'
  };
  
  const expectedPassword = passwordMap[email.toLowerCase().trim()];
  console.log('🔐 Expected password:', expectedPassword);
  
  const isValid = expectedPassword === plainPassword.trim();
  console.log('🔐 Password validation result:', isValid);
  
  return isValid;
};

class MongoDBClient {
  private currentSession: AuthSession | null = null;
  private listeners: ((session: AuthSession | null) => void)[] = [];

  constructor() {
    this.loadSessionFromStorage();
  }

  // Load session from localStorage
  private loadSessionFromStorage() {
    try {
      const sessionData = localStorage.getItem(STORAGE_KEYS.SESSION);
      if (sessionData) {
        const session = JSON.parse(sessionData);
        if (new Date(session.expires_at) > new Date()) {
          this.currentSession = session;
        } else {
          this.clearSession();
        }
      }
    } catch (error) {
      console.error('Error loading session from storage:', error);
    }
  }

  // Save session to localStorage
  private saveSessionToStorage(session: AuthSession) {
    try {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
    } catch (error) {
      console.error('Error saving session to storage:', error);
    }
  }

  // Clear session from storage
  private clearSession() {
    try {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
      localStorage.removeItem(STORAGE_KEYS.USER);
    } catch (error) {
      console.error('Error clearing session from storage:', error);
    }
  }

  // Generate simple token
  private generateToken(user: MongoUser): string {
    const payload = {
      userId: user._id,
      email: user.email,
      role: user.role,
      timestamp: Date.now()
    };
    return btoa(JSON.stringify(payload));
  }

  // Authenticate user
  async signIn(email: string, password: string): Promise<{ user: MongoUser; session: AuthSession } | null> {
    try {
      console.log('🔍 Authenticating user:', email);
      console.log('🔍 Available demo users:', DEMO_USERS.map(u => u.email));
      
      // Find user in demo data (case insensitive)
      const user = DEMO_USERS.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
      
      if (!user) {
        console.log('❌ User not found for email:', email);
        console.log('❌ Available emails:', DEMO_USERS.map(u => u.email));
        throw new Error('Credenciais inválidas');
      }

      console.log('✅ User found:', user.email);

      // Verify password
      const isPasswordValid = verifyPassword(password, email);
      
      if (!isPasswordValid) {
        console.log('❌ Invalid password for user:', email);
        throw new Error('Credenciais inválidas');
      }

      console.log('✅ Password validated successfully');

      // Create session
      const token = this.generateToken(user);
      const session: AuthSession = {
        user,
        token,
        expires_at: new Date(Date.now() + (24 * 60 * 60 * 1000)) // 24 hours
      };

      this.currentSession = session;
      this.saveSessionToStorage(session);
      this.notifyListeners();

      console.log('✅ Authentication successful:', user.email);
      return { user, session };
      
    } catch (error) {
      console.error('❌ Authentication error:', error);
      throw error;
    }
  }

  // Sign out
  async signOut(): Promise<void> {
    this.currentSession = null;
    this.clearSession();
    this.notifyListeners();
  }

  // Get current session
  getSession(): AuthSession | null {
    return this.currentSession;
  }

  // Get current user
  getUser(): MongoUser | null {
    return this.currentSession?.user || null;
  }

  // Check if authenticated
  isAuthenticated(): boolean {
    return this.currentSession !== null && new Date(this.currentSession.expires_at) > new Date();
  }

  // Auth state change listener
  onAuthStateChange(callback: (session: AuthSession | null) => void) {
    this.listeners.push(callback);
    
    // Call immediately with current state
    callback(this.currentSession);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  // Notify all listeners
  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.currentSession);
      } catch (error) {
        console.error('Error in auth state listener:', error);
      }
    });
  }

  // Sign in with notification
  async signInWithNotification(email: string, password: string) {
    const result = await this.signIn(email, password);
    this.notifyListeners();
    return result;
  }

  // Sign out with notification
  async signOutWithNotification() {
    await this.signOut();
    this.notifyListeners();
  }

  // Seed users (for development)
  async seedUsers(): Promise<void> {
    console.log('🌱 Demo users are already available:', DEMO_USERS.map(u => u.email));
  }

  // Get all users (for admin)
  async getUsers(): Promise<MongoUser[]> {
    if (!this.isAuthenticated() || this.currentSession?.user.role !== 'admin') {
      throw new Error('Unauthorized');
    }
    return DEMO_USERS;
  }

  // Create user (for admin)
  async createUser(userData: Omit<MongoUser, '_id' | 'created_at' | 'updated_at'>): Promise<MongoUser> {
    if (!this.isAuthenticated() || this.currentSession?.user.role !== 'admin') {
      throw new Error('Unauthorized');
    }
    
    const newUser: MongoUser & { _id: string } = {
      ...userData,
      _id: (DEMO_USERS.length + 1).toString(),
      created_at: new Date(),
      updated_at: new Date()
    };
    
    DEMO_USERS.push(newUser);
    return newUser;
  }
}

// Export singleton instance
export const mongoClient = new MongoDBClient();
export type { MongoUser, AuthSession };