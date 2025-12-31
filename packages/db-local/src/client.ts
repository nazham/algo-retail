import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";
import path from "path";

export const initDb = (dbPath: string) => {
  // 1. Open the file (create if missing)
  const sqlite = new Database(dbPath);
  // Enable WAL mode for better performance
  sqlite.pragma("journal_mode = WAL");
  // 2. Connect Drizzle
  const db = drizzle(sqlite, { schema });

  // 3. Enable Foreign Keys (Critical for SQLite!)
  sqlite.pragma("foreign_keys = ON");

  return db;
};

export const runMigrations = (
  db: ReturnType<typeof initDb>,
  migrationsFolder: string
) => {
  migrate(db, { migrationsFolder });
};

// Export schema type for using in other files
export type DB = ReturnType<typeof initDb>;
export { schema };
