// Re-export the useAuth hook from AuthContext for backward compatibility
export { useAuth, type AuthContextType, type AuthUser } from '@/contexts/AuthContext';

// Keep existing types for compatibility
export type UserRole = 'admin' | 'supervisor' | 'operador';

// Demo users data for reference (kept for documentation)
const demoUsers = [
  { email: 'admin@oee.com', password: 'admin123', full_name: 'João Silva', role: 'admin' as UserRole },
  { email: 'supervisor@oee.com', password: 'supervisor123', full_name: 'Maria Santos', role: 'supervisor' as UserRole },
  { email: 'operador@oee.com', password: 'operador123', full_name: 'Pedro Costa', role: 'operador' as UserRole }
];

export { demoUsers };
