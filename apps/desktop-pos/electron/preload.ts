import { contextBridge, ipcRenderer } from 'electron';
import type { CreateOrderDto, OrderResultDto } from '@algo/types';

// Define the API Interface strictly
export interface AppApi {
  getProducts: () => Promise<any[]>;
  createOrder: (data: CreateOrderDto) => Promise<OrderResultDto>;
  login: (pin: string) => Promise<{ id: string; name: string; role: string }>;
}

// Implement it
const api: AppApi = {
  getProducts: () => ipcRenderer.invoke('products:get-all'),
  createOrder: (data) => ipcRenderer.invoke('orders:create', data),
  login: (pin: string) => ipcRenderer.invoke('auth:login', pin),
};

// Expose it to the window object
// contextBridge protect the renderer from accessing full Node.js API
contextBridge.exposeInMainWorld('api', api);
