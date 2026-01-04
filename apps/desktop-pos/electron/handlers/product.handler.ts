import { ipcMain } from 'electron';
import { ProductRepository } from '../repositories/product.repo';

export const registerProductHandlers = (repo: ProductRepository) => {
  ipcMain.handle('products:get-all', async () => {
    return await repo.getAll();
  });

  // Future handlers (e.g., create, delete) go here...
};
