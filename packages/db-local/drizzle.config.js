// packages/db-local/drizzle.config.js
const { defineConfig } = require('drizzle-kit');

module.exports = defineConfig({
  schema: './src/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: 'sqlite.db',
  },
});
