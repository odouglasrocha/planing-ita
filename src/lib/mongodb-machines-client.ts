// MongoDB Machines Client for Frontend
// API-based client with JWT authentication

import { mongoAuth } from './mongodb-auth-browser';

export interface Machine {
  id: string;
  name: string;
  code: string;
  model: string | null;
  location: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class MongoMachinesClient {
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

  // Get all machines
  async getMachines(): Promise<Machine[]> {
    try {
      console.log('📋 Loading machines...');
      
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/api/machines`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch machines');
      }
      
      console.log('✅ Machines loaded:', data.data.length);
      return data.data;
      
    } catch (error) {
      console.error('❌ Error loading machines:', error);
      throw error;
    }
  }

  // Get machine by ID
  async getMachine(id: string): Promise<Machine | null> {
    try {
      console.log('🔍 Loading machine:', id);
      
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/api/machines/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch machine');
      }
      
      console.log('✅ Machine loaded:', data.data.name);
      return data.data;
      
    } catch (error) {
      console.error('❌ Error loading machine:', error);
      throw error;
    }
  }

  // Create new machine
  async createMachine(machine: Omit<Machine, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>): Promise<Machine> {
    try {
      console.log('➕ Creating machine:', machine.name);
      
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/api/machines`, {
        method: 'POST',
        body: JSON.stringify(machine),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create machine');
      }
      
      console.log('✅ Machine created:', data.data.name);
      return data.data;
      
    } catch (error) {
      console.error('❌ Error creating machine:', error);
      throw error;
    }
  }

  // Update machine
  async updateMachine(id: string, updates: Partial<Omit<Machine, 'id' | 'created_at' | 'created_by'>>): Promise<Machine> {
    try {
      console.log('📝 Updating machine:', id);
      
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/api/machines/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to update machine');
      }
      
      console.log('✅ Machine updated:', data.data.name);
      return data.data;
      
    } catch (error) {
      console.error('❌ Error updating machine:', error);
      throw error;
    }
  }

  // Delete machine
  async deleteMachine(id: string): Promise<void> {
    try {
      console.log('🗑️ Deleting machine:', id);
      
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/api/machines/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to delete machine');
      }
      
      console.log('✅ Machine deleted');
      
    } catch (error) {
      console.error('❌ Error deleting machine:', error);
      throw error;
    }
  }

  // Get machines by status
  async getMachinesByStatus(status: string): Promise<Machine[]> {
    try {
      console.log('📋 Loading machines by status:', status);
      
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/api/machines/status/${status}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch machines by status');
      }
      
      console.log('✅ Machines loaded by status:', data.data.length);
      return data.data;
      
    } catch (error) {
      console.error('❌ Error loading machines by status:', error);
      throw error;
    }
  }

  // Get active machines
  async getActiveMachines(): Promise<Machine[]> {
    return this.getMachinesByStatus('ativa');
  }

  // Update machine status
  async updateMachineStatus(id: string, status: string): Promise<Machine> {
    return this.updateMachine(id, { status });
  }

  // Search machines
  async searchMachines(query: string): Promise<Machine[]> {
    try {
      console.log('🔍 Searching machines:', query);
      
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/api/machines/search/${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to search machines');
      }
      
      console.log('✅ Machines found:', data.data.length);
      return data.data;
      
    } catch (error) {
      console.error('❌ Error searching machines:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const mongoMachinesClient = new MongoMachinesClient();