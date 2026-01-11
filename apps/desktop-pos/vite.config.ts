import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron/simple';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    electron({
      main: {
        entry: 'electron/main.ts',
        vite: {
          build: {
            rollupOptions: {
              // Here is the fix:
              external: ['better-sqlite3'],
            },
          },
        },
      },
      preload: {
        input: 'electron/preload.ts',
      },
      // Optional: Use this to ensure the renderer process can't use Node.js
      renderer: {},
    }),
  ],
  resolve: {
    alias: {
      // Force all imports to use the Root React instance
      react: path.resolve(__dirname, '../../node_modules/react'),
      'react-dom': path.resolve(__dirname, '../../node_modules/react-dom'),
      // Optimization: Point directly to UI source to avoid build/cache issues
      '@repo/ui': path.resolve(__dirname, '../../packages/ui/src'),
    },
  },
});
