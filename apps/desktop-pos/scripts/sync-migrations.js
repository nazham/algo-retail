// apps/desktop-pos/scripts/sync-migrations.js
const fs = require('fs');
const path = require('path');

// Define paths relative to the project root (assuming script runs from apps/desktop-pos)
const SOURCE_DIR = path.resolve(__dirname, '../../../packages/db-local/drizzle');
const DEST_DIR = path.resolve(__dirname, '../drizzle');

console.log('🔄 Syncing migrations...');

try {
  // 1. Clean Destination
  if (fs.existsSync(DEST_DIR)) {
    fs.rmSync(DEST_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(DEST_DIR, { recursive: true });

  // 2. Check Source
  if (fs.existsSync(SOURCE_DIR)) {
    // Copy all files recursively
    fs.cpSync(SOURCE_DIR, DEST_DIR, { recursive: true, force: true });
    console.log('✅ Migrations synced successfully.');
  } else {
    console.warn('⚠️ Source migration folder not found. Skipping copy (Prototyping Mode).');
  }
} catch (error) {
  // We intentionally suppress the crash to allow "Workflow A" (Prototyping) to work
  console.warn('⚠️ Migration sync skipped or failed:', error.message);
}
