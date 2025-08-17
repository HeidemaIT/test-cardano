import { useState, useEffect } from 'react';

const STORAGE_KEY = 'cardano_saved_addresses';

export function useSavedAddresses() {
  const [savedAddresses, setSavedAddresses] = useState<string[]>([]);

  // Load saved addresses from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const addresses = JSON.parse(stored);
        if (Array.isArray(addresses)) {
          setSavedAddresses(addresses);
        }
      }
    } catch (error) {
      console.error('Failed to load saved addresses:', error);
    }
  }, []);

  // Save addresses to localStorage
  const saveToStorage = (addresses: string[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(addresses));
    } catch (error) {
      console.error('Failed to save addresses:', error);
    }
  };

  // Add a new address
  const addAddress = (address: string) => {
    if (!address.trim()) return;
    
    const trimmedAddress = address.trim();
    if (!savedAddresses.includes(trimmedAddress)) {
      const newAddresses = [...savedAddresses, trimmedAddress];
      setSavedAddresses(newAddresses);
      saveToStorage(newAddresses);
    }
  };

  // Remove an address
  const removeAddress = (address: string) => {
    const newAddresses = savedAddresses.filter(addr => addr !== address);
    setSavedAddresses(newAddresses);
    saveToStorage(newAddresses);
  };

  // Clear all addresses
  const clearAddresses = () => {
    setSavedAddresses([]);
    saveToStorage([]);
  };

  return {
    savedAddresses,
    addAddress,
    removeAddress,
    clearAddresses,
  };
}
