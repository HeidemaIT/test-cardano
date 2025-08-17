import { supabase } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
  [key: string]: any;
}

class ApiClient {
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.access_token) {
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      };
    }
    
    return {
      'Content-Type': 'application/json',
    };
  }

  async get<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API GET error:', error);
      throw error;
    }
  }

  async post<T = any>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API POST error:', error);
      throw error;
    }
  }

  async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API DELETE error:', error);
      throw error;
    }
  }

  // Specific methods for saved addresses
  async getSavedAddresses() {
    return this.get('/addresses');
  }

  async getSavedAddressesByProvider(provider: string) {
    return this.get(`/addresses/${provider}`);
  }

  async saveAddress(address: string, provider: string) {
    return this.post('/addresses', { address, provider });
  }

  async removeAddress(address: string, provider: string) {
    return this.delete(`/addresses/${provider}/${encodeURIComponent(address)}`);
  }

  async removeAllAddresses() {
    return this.delete('/addresses');
  }

  async checkAddressSaved(address: string, provider: string) {
    return this.get(`/addresses/${provider}/${encodeURIComponent(address)}/check`);
  }
}

export const apiClient = new ApiClient();
