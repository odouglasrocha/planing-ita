// MongoDB Production Records Client for Frontend
// API-based client with JWT authentication

import { mongoAuth } from './mongodb-auth-browser';

export interface ProductionRecord {
  id: string;
  order_id: string;
  operator_id: string | null;
  machine_id?: string | null;
  produced_quantity: number;
  reject_quantity: number;
  downtime_minutes: number;
  recorded_at: string;
  created_at: string;
  shift?: 'Manhã' | 'Tarde' | 'Noite';
  downtime_type_id?: string | null;
  downtime_start_time?: string | null;
  downtime_end_time?: string | null;
  downtime_description?: string | null;
  time_elapsed_minutes?: number;
  efficiency_percentage?: number;
  production_rate_per_minute?: number;
  previous_record_id?: string | null;
  cycle_time_minutes?: number;
}

// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class MongoProductionRecordsClient {
  private async makeAuthenticatedRequest(url: string, options: RequestInit = {}) {
    const token = mongoAuth.getToken();
    
    if (!token) {
      throw new Error('No authentication token available');
    }

    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    return fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });
  }

  // Get all production records
  async getRecords(orderId?: string): Promise<ProductionRecord[]> {
    try {
      console.log('📊 Fetching production records...');
      
      let url = `${API_BASE_URL}/api/production-records`;
      if (orderId) {
        url += `?order_id=${encodeURIComponent(orderId)}`;
      }
      
      const response = await this.makeAuthenticatedRequest(url);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch production records');
      }
      
      console.log('✅ Production records fetched:', data.data.length);
      return data.data;
      
    } catch (error) {
      console.error('❌ Error fetching production records:', error);
      throw error;
    }
  }

  // Get production record by ID
  async getRecordById(id: string): Promise<ProductionRecord> {
    try {
      console.log('📊 Fetching production record by ID:', id);
      
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/api/production-records/${id}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch production record');
      }
      
      console.log('✅ Production record fetched:', data.data.id);
      return data.data;
      
    } catch (error) {
      console.error('❌ Error fetching production record:', error);
      throw error;
    }
  }

  // Create new production record
  async createRecord(record: Omit<ProductionRecord, 'id' | 'created_at'>): Promise<ProductionRecord> {
    try {
      console.log('➕ Creating production record...');
      
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/api/production-records`, {
        method: 'POST',
        body: JSON.stringify(record),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create production record');
      }
      
      console.log('✅ Production record created:', data.data.id);
      return data.data;
      
    } catch (error) {
      console.error('❌ Error creating production record:', error);
      throw error;
    }
  }

  // Create downtime record
  async createDowntimeRecord(downtimeData: {
    order_id: string;
    operator_id?: string | null;
    machine_id: string;
    downtime_type_id: string;
    downtime_start_time: string;
    downtime_end_time: string;
    downtime_description?: string;
  }): Promise<ProductionRecord> {
    try {
      console.log('⏸️ Creating downtime record...');
      
      // Calculate downtime minutes
      const startTime = new Date(downtimeData.downtime_start_time);
      const endTime = new Date(downtimeData.downtime_end_time);
      const downtimeMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

      const recordData = {
        order_id: downtimeData.order_id,
        operator_id: downtimeData.operator_id || null,
        machine_id: downtimeData.machine_id,
        produced_quantity: 0,
        reject_quantity: 0,
        downtime_minutes: downtimeMinutes,
        recorded_at: new Date().toISOString(),
        downtime_type_id: downtimeData.downtime_type_id,
        downtime_start_time: downtimeData.downtime_start_time,
        downtime_end_time: downtimeData.downtime_end_time,
        downtime_description: downtimeData.downtime_description || null,
      };

      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/api/production-records`, {
        method: 'POST',
        body: JSON.stringify(recordData),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create downtime record');
      }
      
      console.log('✅ Downtime record created:', data.data.id);
      return data.data;
      
    } catch (error) {
      console.error('❌ Error creating downtime record:', error);
      throw error;
    }
  }

  // Update production record
  async updateRecord(id: string, updates: Partial<Omit<ProductionRecord, 'id' | 'created_at'>>): Promise<ProductionRecord> {
    try {
      console.log('📝 Updating production record:', id);
      
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/api/production-records/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to update production record');
      }
      
      console.log('✅ Production record updated:', data.data.id);
      return data.data;
      
    } catch (error) {
      console.error('❌ Error updating production record:', error);
      throw error;
    }
  }

  // Delete production record
  async deleteRecord(id: string): Promise<void> {
    try {
      console.log('🗑️ Deleting production record:', id);
      
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/api/production-records/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to delete production record');
      }
      
      console.log('✅ Production record deleted:', id);
      
    } catch (error) {
      console.error('❌ Error deleting production record:', error);
      throw error;
    }
  }

  // Get production records by order ID
  async getRecordsByOrder(orderId: string): Promise<ProductionRecord[]> {
    try {
      console.log('📊 Fetching production records by order:', orderId);
      
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/api/production-records/order/${orderId}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch production records by order');
      }
      
      console.log('✅ Production records by order fetched:', data.data.length);
      return data.data;
      
    } catch (error) {
      console.error('❌ Error fetching production records by order:', error);
      throw error;
    }
  }

  // Get production records by machine ID
  async getRecordsByMachine(machineId: string): Promise<ProductionRecord[]> {
    try {
      console.log('📊 Fetching production records by machine:', machineId);
      
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/api/production-records/machine/${machineId}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch production records by machine');
      }
      
      console.log('✅ Production records by machine fetched:', data.data.length);
      return data.data;
      
    } catch (error) {
      console.error('❌ Error fetching production records by machine:', error);
      throw error;
    }
  }

  // Clear all production records
  async clearAllRecords(): Promise<void> {
    try {
      console.log('🧹 Clearing all production records...');
      
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/api/production-records`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to clear production records');
      }
      
      console.log('✅ All production records cleared');
      
    } catch (error) {
      console.error('❌ Error clearing production records:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const mongoProductionRecordsClient = new MongoProductionRecordsClient();