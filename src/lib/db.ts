/**
 * Singleton SQLite connection.
 * The DB file lives at /data/ade.db inside the container (mounted as a volume)
 * or at ./data/ade.db during local `npm run dev`.
 */
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = process.env.DB_PATH ?? path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'ade.db');

// Ensure the data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Module-level singleton — Next.js keeps this alive between requests in dev
// via the global object to survive hot-reloads
declare global {
  // eslint-disable-next-line no-var
  var __db: Database.Database | undefined;
}

function openDb(): Database.Database {
  const db = new Database(DB_FILE);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return db;
}

export const db: Database.Database =
  global.__db ?? (global.__db = openDb());
