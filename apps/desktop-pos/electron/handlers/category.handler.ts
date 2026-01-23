import { ipcMain } from 'electron';
import { CategoryRepository } from '../repositories/category.repo';

export const registerCategoryHandlers = (repo: CategoryRepository) => {
  ipcMain.handle('categories:get-all', async () => {
    return await repo.getAll();
  });
};
