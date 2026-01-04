import { contextBridge, ipcRenderer } from 'electron';

// Define the API object
const api = {
  getProducts: () => ipcRenderer.invoke('products:get-all'),
};

// Expose it to the window object
// contextBridge protect the renderer from accessing full Node.js API
contextBridge.exposeInMainWorld('api', api);

// TypeScript Helper (Put this in a .d.ts file later, but okay here for reference)
export type AppApi = typeof api;
