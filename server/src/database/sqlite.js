import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(process.cwd(), 'chat_history.db'));

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    name TEXT,
    conversationHistory TEXT,
    events TEXT,
    settings TEXT,
    createdAt INTEGER,
    updatedAt INTEGER
  );

  CREATE TABLE IF NOT EXISTS wallets (
    id TEXT PRIMARY KEY,
    label TEXT,
    address TEXT,
    publicKey TEXT,
    wif TEXT,
    createdAt INTEGER
  );
  CREATE TABLE IF NOT EXISTS global_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    value TEXT
  );
`);

export default db;
