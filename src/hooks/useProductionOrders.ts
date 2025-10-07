import { useState, useEffect } from 'react';
import { mongoOrdersClient, ProductionOrder } from '@/lib/mongodb-orders-client';
import { mongoAuth } from '@/lib/mongodb-auth-browser';
import { useToast } from '@/hooks/use-toast';
import { clearSupabaseData, forceSupabaseCacheClear } from '@/utils/clearSupabaseData';

// Utility function to convert MongoDB ObjectId to UUID-compatible format
const convertObjectIdToUUID = (objectId: string): string => {
  // If it's already a UUID format, return as is
  if (objectId.includes('-') && objectId.length === 36) {
    return objectId;
  }
  
  // If it's a MongoDB ObjectId (24 hex chars), convert to UUID format
  if (objectId.length === 24 && /^[0-9a-fA-F]{24}$/.test(objectId)) {
    // Create a valid UUID v4 format from ObjectId
    // UUID format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx (36 chars total)
    const hex = objectId.toLowerCase();
    // Pad with additional characters to make it 32 hex chars for UUID
    const paddedHex = hex + '00000000'; // Add 8 more chars to make 32 total
    return `${paddedHex.slice(0, 8)}-${paddedHex.slice(8, 12)}-4${paddedHex.slice(12, 15)}-a${paddedHex.slice(15, 18)}-${paddedHex.slice(18, 30)}`;
  }
  
  // If it's neither, return as is (might be a different format)
  return objectId;
};

export const useProductionOrders = () => {
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // FORÇAR USO EXCLUSIVO DO MONGODB - LIMPAR DADOS DO SUPABASE
  useEffect(() => {
    console.log('🎯 FORCING MONGODB EXCLUSIVE MODE - Clearing Supabase data...');
    const clearResult = forceSupabaseCacheClear();
    
    if (clearResult.success) {
      console.log('✅ Supabase data cleared successfully');
    } else {
      console.warn('⚠️ Error clearing Supabase data:', clearResult.error);
    }
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // USAR EXCLUSIVAMENTE MONGODB - SEM FALLBACK
      console.log('📊 Fetching TODAY\'S orders EXCLUSIVELY from MongoDB...');
      
      // Verificar autenticação MongoDB
      if (!mongoAuth.isAuthenticated()) {
        console.log('🔐 MongoDB not authenticated. Please login to view orders.');
        setError('MongoDB authentication required. Please login to view your orders.');
        setOrders([]);
        return;
      }
      
      // Buscar apenas as ordens do dia atual
      const mongoOrders = await mongoOrdersClient.getTodaysOrders();
      console.log('✅ MongoDB TODAY\'S orders fetched:', mongoOrders.length, 'orders');
      
      setOrders(mongoOrders);
      
    } catch (error) {
      console.error('❌ Error fetching today\'s orders from MongoDB:', error);
      setError('Failed to fetch today\'s orders from MongoDB. Please check your connection and authentication.');
      setOrders([]);
      
      toast({
        title: "Erro ao carregar ordens do dia atual",
        description: "Não foi possível carregar as ordens de produção do dia atual. Verifique sua autenticação.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async (orderData: Omit<ProductionOrder, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // USAR EXCLUSIVAMENTE MONGODB - SEM FALLBACK
      console.log('➕ Creating order EXCLUSIVELY in MongoDB...');
      
      // Forçar autenticação se necessário
      if (!mongoAuth.isAuthenticated()) {
        throw new Error('MongoDB authentication required. Please login again.');
      }
      
      // Adicionar data de produção atual se não fornecida
      const orderWithDate = {
        ...orderData,
        production_date: orderData.production_date || new Date().toISOString().split('T')[0] // YYYY-MM-DD
      };
      
      const mongoOrder = await mongoOrdersClient.createOrder(orderWithDate);
      console.log('✅ MongoDB order created with production_date:', mongoOrder);
      
      // Refresh orders after creation
      await fetchOrders();
      
      toast({
        title: "Ordem criada com sucesso!",
        description: "A ordem de produção foi criada no MongoDB para o dia atual.",
      });
      
      return mongoOrder;
      
    } catch (error) {
      console.error('❌ Error creating production order in MongoDB:', error);
      
      toast({
        title: "Erro ao criar ordem no MongoDB",
        description: "Não foi possível criar a ordem de produção. Verifique sua autenticação.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateOrder = async (id: string, updates: Partial<ProductionOrder>) => {
    try {
      // USAR EXCLUSIVAMENTE MONGODB - SEM FALLBACK
      console.log('🔄 Updating order EXCLUSIVELY in MongoDB...');
      
      // Forçar autenticação se necessário
      if (!mongoAuth.isAuthenticated()) {
        throw new Error('MongoDB authentication required. Please login again.');
      }
      
      const updatedOrder = await mongoOrdersClient.updateOrder(id, updates);
      console.log('✅ MongoDB order updated:', updatedOrder);
      
      // Refresh orders after update
      await fetchOrders();
      
      toast({
        title: "Ordem atualizada com sucesso!",
        description: "A ordem de produção foi atualizada no MongoDB.",
      });
      
      return updatedOrder;
      
    } catch (error) {
      console.error('❌ Error updating production order in MongoDB:', error);
      
      toast({
        title: "Erro ao atualizar ordem no MongoDB",
        description: "Não foi possível atualizar a ordem de produção. Verifique sua autenticação.",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []); // Removed useMongoDb dependency - always use MongoDB exclusively

  const deleteOrder = async (id: string) => {
    try {
      // USAR EXCLUSIVAMENTE MONGODB - SEM FALLBACK
      console.log('🗑️ Deleting order EXCLUSIVELY in MongoDB...');
      
      // Forçar autenticação se necessário
      if (!mongoAuth.isAuthenticated()) {
        throw new Error('MongoDB authentication required. Please login again.');
      }
      
      await mongoOrdersClient.deleteOrder(id);
      console.log('✅ MongoDB order deleted:', id);
      
      // Refresh orders after deletion
      await fetchOrders();
      
      toast({
        title: "Ordem excluída com sucesso!",
        description: "A ordem de produção foi excluída do MongoDB.",
      });
      
    } catch (error) {
      console.error('❌ Error deleting production order in MongoDB:', error);
      
      toast({
        title: "Erro ao excluir ordem no MongoDB",
        description: "Não foi possível excluir a ordem de produção. Verifique sua autenticação.",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    orders,
    loading,
    createOrder,
    updateOrder,
    deleteOrder,
    refetch: fetchOrders,
    // Novos métodos para filtrar por data
    getOrdersByDate: async (date: string) => {
      try {
        setLoading(true);
        const ordersForDate = await mongoOrdersClient.getOrdersByDate(date);
        return ordersForDate;
      } catch (error) {
        console.error('❌ Error fetching orders by date:', error);
        toast({
          title: "Erro ao carregar ordens por data",
          description: "Não foi possível carregar as ordens para a data especificada.",
          variant: "destructive",
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    getTodaysOrders: async () => {
      try {
        setLoading(true);
        const todaysOrders = await mongoOrdersClient.getTodaysOrders();
        setOrders(todaysOrders);
        return todaysOrders;
      } catch (error) {
        console.error('❌ Error fetching today\'s orders:', error);
        toast({
          title: "Erro ao carregar ordens do dia",
          description: "Não foi possível carregar as ordens do dia atual.",
          variant: "destructive",
        });
        throw error;
      } finally {
        setLoading(false);
      }
    }
  };
}