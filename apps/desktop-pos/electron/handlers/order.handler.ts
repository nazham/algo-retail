import { ipcMain } from 'electron';
import { OrderRepository } from '../repositories/order.repo';
import { CreateOrderDto } from '@algo/types';

export const registerOrderHandlers = (repo: OrderRepository) => {
  ipcMain.handle('orders:create', async (_, data: CreateOrderDto) => {
    return await repo.create(data);
  });

  ipcMain.handle('orders:get-all', async () => {
    console.log('Fetching all orders...');
    return await repo.findAll();
  });
};
