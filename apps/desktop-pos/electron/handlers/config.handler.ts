import { ipcMain } from 'electron';
import { getDefaultShopConfig } from '../config';

export const registerConfigHandlers = () => {
  // Get default config (from env vars)
  ipcMain.handle('config:get-defaults', () => {
    return getDefaultShopConfig();
  });
};
