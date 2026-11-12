/**
 * Called once at app startup (from layout.tsx server component).
 * Runs migrations and seeds if the DB is empty.
 */
import { runMigrations } from './schema';
import { seedDatabase } from './seed';

let initialized = false;

export function ensureDbReady() {
  if (initialized) return;
  runMigrations();
  seedDatabase();
  initialized = true;
}
