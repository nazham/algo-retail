// packages/db-local/drizzle.config.js
const { defineConfig } = require('drizzle-kit');

const dbPath = process.env.DB_FILE || 'sqlite.db';

module.exports = defineConfig({
  schema: './src/schema.local.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: dbPath,
  },
});
