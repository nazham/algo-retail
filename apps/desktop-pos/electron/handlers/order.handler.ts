import { ipcMain } from 'electron';
import { OrderRepository } from '../repositories/order.repo';
import { CreateOrderDto } from '@algo/types';
export const registerOrderHandlers = (repo: OrderRepository) => {
  // Use the specific type for 'data' to ensure safety
  ipcMain.handle('orders:create', async (_, data: CreateOrderDto) => {
    return await repo.create(data);
  });
};
