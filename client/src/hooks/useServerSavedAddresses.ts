import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../lib/api';
import { useAuth } from './useAuth';

export interface SavedAddress {
  id: number;
  user_id: string;
  address: string;
  provider: string;
  created_at: string;
}

export function useServerSavedAddresses() {
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const loadAddresses = useCallback(async () => {
    if (!user) {
      setSavedAddresses([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.getSavedAddresses();
      if (response.success && response.data) {
        setSavedAddresses(response.data);
      } else {
        setError(response.message || 'Failed to load addresses');
      }
    } catch (err) {
      console.error('Failed to load saved addresses:', err);
      setError(err instanceof Error ? err.message : 'Failed to load addresses');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addAddress = useCallback(async (address: string, provider: string) => {
    if (!user || !address.trim()) return;

    const trimmedAddress = address.trim();
    
    try {
      const response = await apiClient.saveAddress(trimmedAddress, provider);
      if (response.success && response.data) {
        // Reload addresses to get the updated list
        await loadAddresses();
        return true;
      } else {
        setError(response.message || 'Failed to save address');
        return false;
      }
    } catch (err) {
      console.error('Failed to save address:', err);
      setError(err instanceof Error ? err.message : 'Failed to save address');
      return false;
    }
  }, [user, loadAddresses]);

  const removeAddress = useCallback(async (address: string, provider: string) => {
    if (!user) return;

    try {
      const response = await apiClient.removeAddress(address, provider);
      if (response.success) {
        // Reload addresses to get the updated list
        await loadAddresses();
        return true;
      } else {
        setError(response.message || 'Failed to remove address');
        return false;
      }
    } catch (err) {
      console.error('Failed to remove address:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove address');
      return false;
    }
  }, [user, loadAddresses]);

  const clearAddresses = useCallback(async () => {
    if (!user) return;

    try {
      const response = await apiClient.removeAllAddresses();
      if (response.success) {
        setSavedAddresses([]);
        return true;
      } else {
        setError(response.message || 'Failed to clear addresses');
        return false;
      }
    } catch (err) {
      console.error('Failed to clear addresses:', err);
      setError(err instanceof Error ? err.message : 'Failed to clear addresses');
      return false;
    }
  }, [user]);

  const isAddressSaved = useCallback(async (address: string, provider: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const response = await apiClient.checkAddressSaved(address, provider);
      return Boolean(response.success && response.data?.isSaved);
    } catch (err) {
      console.error('Failed to check if address is saved:', err);
      return false;
    }
  }, [user]);

  // Load addresses when user changes
  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  return {
    savedAddresses,
    loading,
    error,
    addAddress,
    removeAddress,
    clearAddresses,
    isAddressSaved,
    refresh: loadAddresses,
  };
}
