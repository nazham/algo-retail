import { ipcMain } from 'electron';
import { OrderRepository } from '../repositories/order.repo';
import { CreateOrderDto } from '@algo/types';
import { randomUUID } from 'crypto';

export const registerOrderHandlers = (repo: OrderRepository) => {
  ipcMain.handle(
    'orders:create',
    async (_, payload: Omit<CreateOrderDto, 'id' | 'orderNumber' | 'createdAt'>) => {
      // 1. Generate Identity locally (Source of Truth)
      const fullOrder: CreateOrderDto = {
        ...payload,
        id: randomUUID(),
        orderNumber: `INV-${Date.now().toString().slice(-6)}`, // Simple Invoice # (You can make this fancier later)
        createdAt: new Date().toISOString(),
      };

      console.log(`📝 Creating Order: ${fullOrder.orderNumber}`);

      // 2. Pass full object to Repo
      return await repo.create(fullOrder);
    },
  );

  ipcMain.handle('orders:get-all', async () => {
    console.log('Fetching all orders...');
    return await repo.findAll();
  });
};
