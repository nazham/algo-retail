import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/schema.ts',
  out: './drizzle', // Where the SQL files will be saved
  dialect: 'sqlite',
});
