import { dbRun, dbGet } from '../config/database.js';

export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export class UserService {
  static async createUser(id: string, email: string): Promise<User> {
    try {
      await dbRun(
        'INSERT OR REPLACE INTO users (id, email, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
        [id, email]
      );
      
      const user = await dbGet('SELECT * FROM users WHERE id = ?', [id]) as User;
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  static async getUserById(id: string): Promise<User | null> {
    try {
      const user = await dbGet('SELECT * FROM users WHERE id = ?', [id]) as User | null;
      return user;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw new Error('Failed to get user');
    }
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    try {
      const user = await dbGet('SELECT * FROM users WHERE email = ?', [email]) as User | null;
      return user;
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw new Error('Failed to get user');
    }
  }

  static async updateUser(id: string, email: string): Promise<User> {
    try {
      await dbRun(
        'UPDATE users SET email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [email, id]
      );
      
      const user = await dbGet('SELECT * FROM users WHERE id = ?', [id]) as User;
      return user;
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error('Failed to update user');
    }
  }
}
