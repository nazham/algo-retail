import { contextBridge, ipcRenderer } from 'electron';

// 1. Define the Universal API
const api = {
  // The only method you'll ever need
  invoke: (channel: string, data?: any) => ipcRenderer.invoke(channel, data),

  // Optional: For listening to push events (like "Print Success")
  on: (channel: string, callback: (data: any) => void) => {
    const subscription = (_: any, data: any) => callback(data);
    ipcRenderer.on(channel, subscription);
    return () => ipcRenderer.removeListener(channel, subscription);
  },
};

// 2. Expose it
contextBridge.exposeInMainWorld('api', api);

// 3. Export type for TypeScript
export type AppApi = typeof api;
