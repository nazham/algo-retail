import { ipcMain } from 'electron';
import { getDefaultShopConfig } from '../config';
import { SyncService } from '../services/sync.service';

export const registerConfigHandlers = (syncService?: SyncService) => {
  // Get default config (from env vars)
  ipcMain.handle('config:get-defaults', () => {
    return getDefaultShopConfig();
  });

  // Push local config to server via SyncService
  ipcMain.handle('config:push-to-server', async (_, config: any) => {
    if (!syncService) {
      console.warn('SyncService not available, cannot push config.');
      return false;
    }
    return syncService.pushConfig(config);
  });
};
