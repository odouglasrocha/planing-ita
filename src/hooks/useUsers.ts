import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface User {
  id: string;
  user_id?: string;
  full_name: string;
  email: string;
  role: string;
  sector?: string;
  shift?: string;
  status?: string;
  last_login?: string;
  created_at: string;
  updated_at?: string;
}

export interface UserRole {
  id: string;
  name: string;
  color: string;
  permissions: string[];
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const roles: UserRole[] = [
    { 
      id: "admin", 
      name: "Administrador", 
      color: "bg-red-500", 
      permissions: ["Acesso total", "Gerenciar usuários", "Configurações"] 
    },
    { 
      id: "supervisor", 
      name: "Supervisor", 
      color: "bg-blue-500", 
      permissions: ["Dashboard", "Relatórios", "Gerenciar produção"] 
    },
    { 
      id: "operador", 
      name: "Operador", 
      color: "bg-green-500", 
      permissions: ["Apontamentos", "Registrar perdas", "Dashboard básico"] 
    }
  ];

  const fetchUsers = async () => {
    try {
      // Get auth token from mongoAuth
      const token = localStorage.getItem('mongo_auth_token');
      
      if (!token) {
        console.warn('No authentication token found, using demo data');
        // Fallback to Supabase for demo purposes
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        // Mapear para o formato esperado
        const mappedUsers = data?.map(profile => ({
          id: profile.id,
          user_id: profile.user_id,
          full_name: profile.full_name,
          email: profile.email,
          role: profile.role,
          sector: '', // Não temos esses campos na tabela profiles ainda
          shift: '',
          status: 'active', // Por padrão ativo
          last_login: '',
          created_at: profile.created_at,
          updated_at: profile.updated_at
        })) || [];

        setUsers(mappedUsers);
        return;
      }

      // Call the MongoDB API endpoint
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const result = await response.json();
      setUsers(result.data || []);
      
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Erro ao carregar usuários",
        description: "Não foi possível carregar os usuários.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (userData: {
    email: string;
    full_name: string;
    role: string;
    sector?: string;
    shift?: string;
  }) => {
    try {
      // Get auth token from mongoAuth
      const token = localStorage.getItem('mongo_auth_token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Call the MongoDB API endpoint
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: userData.email,
          full_name: userData.full_name,
          role: userData.role,
          sector: userData.sector,
          shift: userData.shift
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create user');
      }

      const newUser = result.data;
      setUsers(prev => [newUser, ...prev]);
      
      toast({
        title: "Usuário criado!",
        description: `${userData.full_name} foi adicionado ao sistema.`,
        variant: "default",
      });

      return result.data;
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: "Erro ao criar usuário",
        description: error instanceof Error ? error.message : "Não foi possível criar o usuário.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateUser = async (userId: string, updates: Partial<User>) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: updates.full_name,
          role: updates.role
        })
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, ...updates } : user
      ));
      
      toast({
        title: "Usuário atualizado!",
        description: "As informações do usuário foram atualizadas.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Erro ao atualizar usuário",
        description: "Não foi possível atualizar o usuário.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const token = localStorage.getItem('mongo_auth_token');
      if (!token) {
        toast({
          title: "Erro",
          description: "Token de autenticação não encontrado",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Error deleting user:', data);
        toast({
          title: "Erro",
          description: data.error || "Erro ao excluir usuário",
          variant: "destructive",
        });
        return;
      }

      // Update local state
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
      
      toast({
        title: "Sucesso",
        description: "Usuário excluído com sucesso",
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir usuário",
        variant: "destructive",
      });
    }
  };

  const getRoleInfo = (roleId: string) => {
    return roles.find(role => role.id === roleId);
  };

  const getUsersByRole = (roleId: string) => {
    return users.filter(user => user.role === roleId);
  };

  const getRoleStats = () => {
    return roles.map(role => ({
      ...role,
      count: users.filter(user => user.role === role.id).length
    }));
  };

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    roles,
    loading,
    createUser,
    updateUser,
    deleteUser,
    getRoleInfo,
    getUsersByRole,
    getRoleStats,
    getUserInitials,
    refetch: fetchUsers
  };
}