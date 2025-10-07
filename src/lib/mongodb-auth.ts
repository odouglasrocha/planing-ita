// MongoDB Authentication Client
// Real authentication system using MongoDB Atlas

import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

// Import shared types
import { MongoUser, AuthSession } from './auth-types';

// MongoDB Atlas configuration
const MONGO_API_KEY = import.meta.env.VITE_MONGODB_API_KEY || 'KxUZTcs4cPIaNZsY';
const MONGODB_URI = import.meta.env.VITE_MONGODB_URI || 'mongodb+srv://orlanddouglas:KxUZTcs4cPIaNZsY@cluster0.gac2k0p.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const DATABASE_NAME = import.meta.env.VITE_MONGODB_DATABASE || 'Cluster0';

// Local storage keys
const STORAGE_KEYS = {
  SESSION: 'mongo_auth_session',
  USER: 'mongo_auth_user'
};

class MongoAuthClient {
  private currentSession: AuthSession | null = null;

  constructor() {
    this.loadSessionFromStorage();
  }

  // Load session from localStorage
  private loadSessionFromStorage() {
    try {
      const sessionData = localStorage.getItem(STORAGE_KEYS.SESSION);
      if (sessionData) {
        const session = JSON.parse(sessionData);
        // Check if session is still valid
        if (new Date(session.expires_at) > new Date()) {
          this.currentSession = session;
        } else {
          this.clearSession();
        }
      }
    } catch (error) {
      console.error('Error loading session from storage:', error);
      this.clearSession();
    }
  }

  // Save session to localStorage
  private saveSessionToStorage(session: AuthSession) {
    try {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(session.user));
    } catch (error) {
      console.error('Error saving session to storage:', error);
    }
  }

  // Clear session from localStorage
  private clearSession() {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    localStorage.removeItem(STORAGE_KEYS.USER);
    this.currentSession = null;
  }

  // Generate a simple JWT-like token
  private generateToken(user: MongoUser): string {
    const payload = {
      userId: user._id,
      email: user.email,
      role: user.role,
      iat: Date.now(),
      exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    };
    
    // Simple base64 encoding for demo purposes
    return btoa(JSON.stringify(payload));
  }

  // Sign in with email and password
  async signIn(email: string, password: string): Promise<{ user: MongoUser; session: AuthSession } | null> {
    let client: MongoClient | null = null;
    
    try {
      console.log('🔗 Conectando ao MongoDB Atlas para autenticação...');
      
      // Connect to MongoDB Atlas
      client = new MongoClient(MONGODB_URI);
      await client.connect();
      
      const db = client.db(DATABASE_NAME);
      const usersCollection = db.collection('users');
      
      // Find user by email
      const user = await usersCollection.findOne({ email });
      
      if (!user) {
        throw new Error('Credenciais inválidas');
      }
      
      // Verify password using bcrypt
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        throw new Error('Credenciais inválidas');
      }
      
      // Remove password from user object for security
      const { password: _, ...userWithoutPassword } = user;
      const safeUser: MongoUser = {
        ...userWithoutPassword,
        _id: user._id?.toString(),
        email: user.email,
        role: user.role || 'operador',
        name: user.name || user.full_name || 'Usuário'
      };

      // Create session
      const token = this.generateToken(safeUser);
      const session: AuthSession = {
        user: safeUser,
        token,
        expires_at: new Date(Date.now() + (24 * 60 * 60 * 1000)) // 24 hours
      };

      this.currentSession = session;
      this.saveSessionToStorage(session);

      console.log('✅ Login realizado com sucesso:', safeUser.email);
      return { user: safeUser, session };
      
    } catch (error) {
      console.error('❌ Erro no login:', error);
      throw error;
    } finally {
      if (client) {
        await client.close();
      }
    }
  }

  // Sign out
  async signOut(): Promise<void> {
    this.clearSession();
  }

  // Get current session
  getSession(): AuthSession | null {
    return this.currentSession;
  }

  // Get current user
  getUser(): MongoUser | null {
    return this.currentSession?.user || null;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.currentSession !== null && new Date(this.currentSession.expires_at) > new Date();
  }

  // Validate API key (for future use)
  validateApiKey(apiKey: string): boolean {
    return apiKey === MONGO_API_KEY;
  }

  // Auth state change listeners
  private listeners: ((session: AuthSession | null) => void)[] = [];

  onAuthStateChange(callback: (session: AuthSession | null) => void) {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Notify listeners of auth state changes
  private notifyListeners() {
    this.listeners.forEach(callback => callback(this.currentSession));
  }

  // Override signIn to notify listeners
  async signInWithNotification(email: string, password: string) {
    const result = await this.signIn(email, password);
    this.notifyListeners();
    return result;
  }

  // Override signOut to notify listeners
  async signOutWithNotification() {
    await this.signOut();
    this.notifyListeners();
  }
}

// Export singleton instance
export const mongoAuth = new MongoAuthClient();
export { MONGO_API_KEY };
export type { MongoUser, AuthSession };