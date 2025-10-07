import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { mongoAuth } from '../lib/mongodb-auth-browser';
import { MongoUser, AuthSession } from '../lib/auth-types';
import { useToast } from '@/hooks/use-toast';

// Auth user type for compatibility with existing code
export interface AuthUser {
  id: string;
  email: string;
  role?: 'admin' | 'supervisor' | 'operador';
  full_name?: string;
}

// Auth context types
interface AuthContextType {
  user: AuthUser | null;
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loading: boolean; // Alias for backward compatibility
  error: string | null;
  
  // Auth actions
  signIn: (email: string, password: string) => Promise<{ user?: MongoUser; session?: AuthSession; error?: Error }>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  getProfile: () => Promise<MongoUser>;
  clearError: () => void;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Convert MongoUser to AuthUser for compatibility
const convertToAuthUser = (mongoUser: MongoUser): AuthUser => ({
  id: mongoUser._id || '',
  email: mongoUser.email,
  role: mongoUser.role,
  full_name: mongoUser.full_name
});

// Auth provider component
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Initialize auth state
  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = mongoAuth.onAuthStateChange((newSession) => {
      console.log('Auth state changed:', newSession?.user?.email);
      setSession(newSession);
      setUser(newSession?.user ? convertToAuthUser(newSession.user) : null);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Sign in
  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await mongoAuth.signIn(email, password);
      
      // State will be updated via onAuthStateChange
      console.log('Sign in successful:', result.user.email);
      
      toast({
        title: "Login realizado com sucesso!",
        description: `Bem-vindo, ${result.user.full_name}!`,
      });
      
      return { user: result.user, session: result.session };
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      
      toast({
        title: "Erro no login",
        description: errorMessage || "Credenciais inválidas",
        variant: "destructive",
      });
      
      return { error: err instanceof Error ? err : new Error(errorMessage) };
    } finally {
      setIsLoading(false);
    }
  };

  // Sign up
  const signUp = async (email: string, password: string, name?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await mongoAuth.register(email, password, name);
      
      // State will be updated via onAuthStateChange
      console.log('Registration successful:', result.user.email);
      
      toast({
        title: "Registro realizado com sucesso!",
        description: `Bem-vindo, ${result.user.full_name}!`,
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
      
      toast({
        title: "Erro no registro",
        description: errorMessage || "Falha ao criar conta",
        variant: "destructive",
      });
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await mongoAuth.signOut();
      
      // State will be updated via onAuthStateChange
      console.log('Sign out successful');
      
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign out failed';
      setError(errorMessage);
      
      toast({
        title: "Erro no logout",
        description: errorMessage || "Erro ao fazer logout",
        variant: "destructive",
      });
      
      console.error('Sign out error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Get user profile
  const getProfile = async (): Promise<MongoUser> => {
    try {
      setError(null);
      
      const profile = await mongoAuth.getProfile();
      
      // Update user state if profile is different
      const authUser = convertToAuthUser(profile);
      if (JSON.stringify(authUser) !== JSON.stringify(user)) {
        setUser(authUser);
      }
      
      return profile;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch profile';
      setError(errorMessage);
      throw err;
    }
  };

  // Computed values
  const isAuthenticated = mongoAuth.isAuthenticated();

  // Context value
  const value: AuthContextType = {
    user,
    session,
    isAuthenticated,
    isLoading,
    loading: isLoading, // Alias for backward compatibility
    error,
    signIn,
    signUp,
    signOut,
    getProfile,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

// Export types
export type { AuthContextType };