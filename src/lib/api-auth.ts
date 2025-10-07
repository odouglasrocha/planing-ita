// API Authentication Client
// This client communicates with the backend API instead of MongoDB directly

import { MongoUser, AuthSession } from './auth-types';

// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Local storage keys
const STORAGE_KEYS = {
  SESSION: 'mongo_auth_session',
  USER: 'mongo_auth_user'
};

class ApiAuthClient {
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

  // Clear session
  private clearSession() {
    this.currentSession = null;
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    localStorage.removeItem(STORAGE_KEYS.USER);
  }

  // Sign in with email and password
  async signIn(email: string, password: string): Promise<{ user: MongoUser; session: AuthSession }> {
    try {
      console.log('🔍 Authenticating with API:', email);

      const response = await fetch(`${API_BASE_URL}/api/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: email.trim(), 
          password: password.trim() 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro de autenticação');
      }

      const result = await response.json();
      
      this.currentSession = result.session;
      this.saveSessionToStorage(result.session);
      this.notifyListeners();

      console.log('✅ Login successful:', result.user.email);
      return result;

    } catch (error) {
      console.error('❌ Login error:', error);
      throw error;
    }
  }

  // Sign out
  async signOut(): Promise<void> {
    this.clearSession();
    this.notifyListeners();
    console.log('✅ Logout successful');
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

  // Get user profile from API
  async getUserProfile(): Promise<MongoUser | null> {
    try {
      if (!this.currentSession?.token) {
        return null;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${this.currentSession.token}`,
        },
      });

      if (!response.ok) {
        this.clearSession();
        this.notifyListeners();
        return null;
      }

      const data = await response.json();
      return data.user;

    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  // Auth state change listener
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
    this.listeners.forEach(callback => {
      try {
        callback(this.currentSession);
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
}

// Export singleton instance
export const apiAuth = new ApiAuthClient();

// Export types
export type { MongoUser, AuthSession };