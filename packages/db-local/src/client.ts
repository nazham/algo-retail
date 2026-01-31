import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from './schema.local';
import path from 'path';
import fs from 'fs';

export const initDb = (dbPath: string) => {
  // Ensure the directory exists before opening the DB
  // This prevents "Disk I/O" errors if the userData folder was deleted.
  const dbFolder = path.dirname(dbPath);
  if (!fs.existsSync(dbFolder)) {
    console.log(`Creating database directory: ${dbFolder}`);
    fs.mkdirSync(dbFolder, { recursive: true });
  }

  // Open the file (create if missing)
  const sqlite = new Database(dbPath);

  // Enable WAL mode for better performance
  try {
    sqlite.pragma('journal_mode = WAL');
  } catch (err) {
    console.error('Failed to set WAL mode:', err);
    // We continue anyway; the app can run without WAL if absolutely necessary,
  }

  // Connect Drizzle
  const db = drizzle(sqlite, { schema });

  // Enable Foreign Keys (Critical for SQLite!)
  sqlite.pragma('foreign_keys = ON');

  return db;
};

export const runMigrations = (db: ReturnType<typeof initDb>, migrationsFolder: string) => {
  migrate(db, { migrationsFolder });
};

// Export schema type for using in other files
export type DB = ReturnType<typeof initDb>;
export { schema };
