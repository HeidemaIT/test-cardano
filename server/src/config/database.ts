import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database file path
const dbPath = path.join(__dirname, '../../data/cardano.db');

// Create database directory if it doesn't exist
import fs from 'fs';
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize database
const db = new sqlite3.Database(dbPath);

// Promisify database methods
const dbRun = promisify(db.run.bind(db));
const dbGet = promisify(db.get.bind(db));
const dbAll = promisify(db.all.bind(db));

// Initialize tables
async function initializeDatabase() {
  try {
    // Create users table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create saved_addresses table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS saved_addresses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        address TEXT NOT NULL,
        provider TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        UNIQUE(user_id, address, provider)
      )
    `);

    // Create indexes for better performance
    await dbRun('CREATE INDEX IF NOT EXISTS idx_saved_addresses_user_id ON saved_addresses(user_id)');
    await dbRun('CREATE INDEX IF NOT EXISTS idx_saved_addresses_address ON saved_addresses(address)');
    await dbRun('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Initialize database on import
initializeDatabase();

export { db, dbRun, dbGet, dbAll };
