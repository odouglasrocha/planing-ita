// API Authentication for Browser
// This module handles authentication using backend API instead of MongoDB directly

import { MongoUser, AuthSession } from './auth-types';

// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiAuthBrowser {
  private currentSession: AuthSession | null = null;
  private listeners: ((session: AuthSession | null) => void)[] = [];

  constructor() {
    // Initialize session from localStorage
    this.loadSessionFromStorage();
  }

  // Load session from localStorage
  private loadSessionFromStorage() {
    try {
      const sessionData = localStorage.getItem('mongo_auth_session');
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

  // Clear session
  private clearSession() {
    this.currentSession = null;
    localStorage.removeItem('mongo_auth_session');
    localStorage.removeItem('mongo_auth_user');
    localStorage.removeItem('mongo_auth_token');
  }

  // Save session to localStorage
  private saveSessionToStorage(session: AuthSession) {
    try {
      localStorage.setItem('mongo_auth_session', JSON.stringify(session));
      localStorage.setItem('mongo_auth_user', JSON.stringify(session.user));
      // Store JWT token separately for easy access
      if (session.token) {
        localStorage.setItem('mongo_auth_token', session.token);
      }
    } catch (error) {
      console.error('Error saving session to storage:', error);
    }
  }

  // Handle API response
  private async handleApiResponse(response: Response) {
    const data = await response.json();
    
    if (!response.ok) {
      // Special handling for rate limiting
      if (response.status === 429) {
        throw new Error('Muitas tentativas de login. Aguarde alguns minutos antes de tentar novamente.');
      }
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }
    
    if (!data.success) {
      throw new Error(data.error || 'API request failed');
    }
    
    return data;
  }

  // Register new user
  async register(email: string, password: string, name?: string): Promise<{ user: MongoUser; session: AuthSession }> {
    try {
      console.log('🔍 Registering new user:', email);
      
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await this.handleApiResponse(response);
      
      const session: AuthSession = {
        id: data.session.id,
        user: data.user,
        token: data.token,
        expires_at: data.session.expires_at
      };

      this.currentSession = session;
      this.saveSessionToStorage(session);
      this.notifyListeners();
      
      console.log('✅ Registration successful:', data.user.email);
      return { user: data.user, session };
      
    } catch (error) {
      console.error('❌ Registration error:', error);
      throw error;
    }
  }

  // Sign in with email and password
  async signIn(email: string, password: string): Promise<{ user: MongoUser; session: AuthSession }> {
    try {
      console.log('🔍 Authenticating with API:', email);
      
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await this.handleApiResponse(response);
      
      const session: AuthSession = {
        id: data.session.id,
        user: data.user,
        token: data.token,
        expires_at: data.session.expires_at
      };

      this.currentSession = session;
      this.saveSessionToStorage(session);
      this.notifyListeners();
      
      console.log('✅ Login successful:', data.user.email);
      return { user: data.user, session };
      
    } catch (error) {
      console.error('❌ Login error:', error);
      throw error;
    }
  }

  // Sign out
  async signOut(): Promise<void> {
    try {
      const token = this.getToken();
      
      if (token) {
        // Call logout endpoint to update server-side records
        const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        // Don't throw error if logout fails on server side
        if (response.ok) {
          console.log('✅ Server-side logout successful');
        } else {
          console.warn('⚠️ Server-side logout failed, but continuing with client-side cleanup');
        }
      }
    } catch (error) {
      console.error('Error during server-side logout:', error);
      // Continue with client-side cleanup even if server-side fails
    }
    
    this.clearSession();
    this.notifyListeners();
    console.log('✅ Client-side logout completed');
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

  // Get JWT token
  getToken(): string | null {
    try {
      return localStorage.getItem('mongo_auth_token');
    } catch (error) {
      console.error('Error getting token from storage:', error);
      return null;
    }
  }

  // Make authenticated API request
  async makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const token = this.getToken();
    
    if (!token) {
      throw new Error('No authentication token available');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    };

    return fetch(url, {
      ...options,
      headers,
    });
  }

  // Get user profile (protected endpoint)
  async getProfile(): Promise<MongoUser> {
    try {
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/api/profile`);
      const data = await this.handleApiResponse(response);
      return data.user;
    } catch (error) {
      console.error('❌ Error fetching profile:', error);
      throw error;
    }
  }

  // Subscribe to auth state changes
  onAuthStateChange(callback: (session: AuthSession | null) => void): () => void {
    this.listeners.push(callback);
    
    // Call immediately with current state
    callback(this.currentSession);
    
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

  // Sign in with notification
  async signInWithNotification(email: string, password: string) {
    const result = await this.signIn(email, password);
    this.notifyListeners();
    return result;
  }

  // Sign out with notification
  async signOutWithNotification() {
    await this.signOut();
  }

  // Seed users (for development) - now calls API
  async seedUsers(): Promise<void> {
    console.log('Seed users should be handled by the backend API');
    // This could call a development-only API endpoint if needed
  }
}

// Export singleton instance
export const mongoAuth = new ApiAuthBrowser();

// Export types and constants
export type { MongoUser, AuthSession };