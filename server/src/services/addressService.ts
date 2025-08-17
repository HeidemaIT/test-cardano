import { dbRun, dbGet, dbAll } from '../config/database.js';

export interface SavedAddress {
  id: number;
  user_id: string;
  address: string;
  provider: string;
  created_at: string;
}

export class AddressService {
  static async saveAddress(
    userId: string,
    address: string,
    provider: string,
  ): Promise<SavedAddress> {
    try {
      // First ensure the user exists
      const user = await dbGet('SELECT id FROM users WHERE id = ?', [userId]);
      if (!user) {
        throw new Error('User not found');
      }

      // Insert the address (UNIQUE constraint will handle duplicates)
      await dbRun(
        'INSERT OR IGNORE INTO saved_addresses (user_id, address, provider) VALUES (?, ?, ?)',
        [userId, address, provider],
      );

      // Get the saved address
      const savedAddress = (await dbGet(
        'SELECT * FROM saved_addresses WHERE user_id = ? AND address = ? AND provider = ?',
        [userId, address, provider],
      )) as SavedAddress;

      return savedAddress;
    } catch (error) {
      console.error('Error saving address:', error);
      throw new Error('Failed to save address');
    }
  }

  static async getAddressesByUser(userId: string): Promise<SavedAddress[]> {
    try {
      const addresses = (await dbAll(
        'SELECT * FROM saved_addresses WHERE user_id = ? ORDER BY created_at DESC',
        [userId],
      )) as SavedAddress[];

      return addresses;
    } catch (error) {
      console.error('Error getting addresses by user:', error);
      throw new Error('Failed to get addresses');
    }
  }

  static async getAddressesByUserAndProvider(
    userId: string,
    provider: string,
  ): Promise<SavedAddress[]> {
    try {
      const addresses = (await dbAll(
        'SELECT * FROM saved_addresses WHERE user_id = ? AND provider = ? ORDER BY created_at DESC',
        [userId, provider],
      )) as SavedAddress[];

      return addresses;
    } catch (error) {
      console.error('Error getting addresses by user and provider:', error);
      throw new Error('Failed to get addresses');
    }
  }

  static async removeAddress(userId: string, address: string, provider: string): Promise<boolean> {
    try {
      const result = await dbRun(
        'DELETE FROM saved_addresses WHERE user_id = ? AND address = ? AND provider = ?',
        [userId, address, provider],
      );

      return (result as { changes: number }).changes > 0;
    } catch (error) {
      console.error('Error removing address:', error);
      throw new Error('Failed to remove address');
    }
  }

  static async removeAllAddresses(userId: string): Promise<number> {
    try {
      const result = await dbRun('DELETE FROM saved_addresses WHERE user_id = ?', [userId]);

      return (result as { changes: number }).changes;
    } catch (error) {
      console.error('Error removing all addresses:', error);
      throw new Error('Failed to remove all addresses');
    }
  }

  static async isAddressSaved(userId: string, address: string, provider: string): Promise<boolean> {
    try {
      const savedAddress = await dbGet(
        'SELECT id FROM saved_addresses WHERE user_id = ? AND address = ? AND provider = ?',
        [userId, address, provider],
      );

      return !!savedAddress;
    } catch (error) {
      console.error('Error checking if address is saved:', error);
      return false;
    }
  }
}
