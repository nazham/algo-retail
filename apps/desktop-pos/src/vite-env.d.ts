/// <reference types="vite/client" />

interface Window {
  api: {
    getProducts: () => Promise<any[]>;
    // Add future API methods here
  };
}
