// MongoDB Production Orders Client for Frontend
// API-based client with JWT authentication

import { mongoAuth } from './mongodb-auth-browser';

export interface ProductionOrder {
  id: string;
  code: string;
  product_name: string;
  machine_id: string;
  planned_quantity: number;
  pallet_quantity?: number;
  status: string;
  shift: string;
  priority?: string;
  notes?: string;
  production_date: string; // Data do planejamento (YYYY-MM-DD)
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class MongoOrdersClient {
  // Helper method to make authenticated requests
  private async makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const token = mongoAuth.getToken();
    
    if (!token) {
      throw new Error('No authentication token available. Please login first.');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle authentication errors
    if (response.status === 401) {
      // Token might be expired, clear session and redirect to login
      mongoAuth.signOut();
      throw new Error('Authentication expired. Please login again.');
    }

    return response;
  }

  // Get all production orders
  async getOrders(): Promise<ProductionOrder[]> {
    try {
      console.log('📋 Fetching production orders...');
      
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/api/production-orders`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch orders');
      }
      
      console.log('✅ Orders fetched:', data.data.length);
      return data.data;
      
    } catch (error) {
      console.error('❌ Error fetching orders:', error);
      throw error;
    }
  }

  // Get production order by ID
  async getOrderById(id: string): Promise<ProductionOrder> {
    try {
      console.log('📋 Fetching production order by ID:', id);
      
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/api/production-orders/${id}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch order');
      }
      
      console.log('✅ Order fetched:', data.data.code);
      return data.data;
      
    } catch (error) {
      console.error('❌ Error fetching order:', error);
      throw error;
    }
  }

  // Create new production order
  async createOrder(order: Omit<ProductionOrder, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>): Promise<ProductionOrder> {
    try {
      console.log('➕ Creating production order:', order.code);
      
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/api/production-orders`, {
        method: 'POST',
        body: JSON.stringify(order),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create order');
      }
      
      console.log('✅ Production order created:', data.data.code);
      return data.data;
      
    } catch (error) {
      console.error('❌ Error creating production order:', error);
      throw error;
    }
  }

  // Update production order
  async updateOrder(id: string, updates: Partial<Omit<ProductionOrder, 'id' | 'created_at' | 'created_by'>>): Promise<ProductionOrder> {
    try {
      console.log('📝 Updating production order:', id);
      
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/api/production-orders/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to update order');
      }
      
      console.log('✅ Production order updated:', data.data.code);
      return data.data;
      
    } catch (error) {
      console.error('❌ Error updating production order:', error);
      throw error;
    }
  }

  // Delete production order
  async deleteOrder(id: string): Promise<void> {
    try {
      console.log('🗑️ Deleting production order:', id);
      
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/api/production-orders/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to delete order');
      }
      
      console.log('✅ Production order deleted');
      
    } catch (error) {
      console.error('❌ Error deleting production order:', error);
      throw error;
    }
  }

  // Get orders by machine
  async getOrdersByMachine(machineId: string): Promise<ProductionOrder[]> {
    try {
      console.log('📋 Fetching orders for machine:', machineId);
      
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/api/production-orders/machine/${machineId}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch orders by machine');
      }
      
      console.log('✅ Orders by machine fetched:', data.data.length);
      return data.data;
      
    } catch (error) {
      console.error('❌ Error fetching orders by machine:', error);
      throw error;
    }
  }

  // Get orders by status
  async getOrdersByStatus(status: string): Promise<ProductionOrder[]> {
    try {
      console.log('📋 Fetching orders by status:', status);
      
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/api/production-orders/status/${status}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch orders by status');
      }
      
      console.log('✅ Orders by status fetched:', data.data.length);
      return data.data;
      
    } catch (error) {
      console.error('❌ Error fetching orders by status:', error);
      throw error;
    }
  }

  // Get orders by shift
  async getOrdersByShift(shift: string): Promise<ProductionOrder[]> {
    try {
      console.log('📋 Fetching orders by shift:', shift);
      
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/api/production-orders/shift/${shift}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch orders by shift');
      }
      
      console.log('✅ Orders by shift fetched:', data.data.length);
      return data.data;
      
    } catch (error) {
      console.error('❌ Error fetching orders by shift:', error);
      throw error;
    }
  }

  // Update order status
  async updateOrderStatus(id: string, status: string): Promise<ProductionOrder> {
    return this.updateOrder(id, { status });
  }

  // Search orders
  async searchOrders(query: string): Promise<ProductionOrder[]> {
    try {
      console.log('🔍 Searching orders:', query);
      
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/api/production-orders/search/${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to search orders');
      }
      
      console.log('✅ Orders found:', data.data.length);
      return data.data;
      
    } catch (error) {
      console.error('❌ Error searching orders:', error);
      throw error;
    }
  }

  // Get orders by production date (YYYY-MM-DD format)
  async getOrdersByDate(date: string): Promise<ProductionOrder[]> {
    try {
      console.log('📅 Getting orders by date:', date);
      
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/api/production-orders/date/${date}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get orders by date');
      }
      
      console.log('✅ Orders found for date:', data.data.length);
      return data.data;
      
    } catch (error) {
      console.error('❌ Error getting orders by date:', error);
      throw error;
    }
  }

  // Get today's orders (convenience method)
  async getTodaysOrders(): Promise<ProductionOrder[]> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    return this.getOrdersByDate(today);
  }
}

// Export singleton instance
export const mongoOrdersClient = new MongoOrdersClient();