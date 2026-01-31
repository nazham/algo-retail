import { ipcMain } from 'electron';
import { OrderRepository } from '../repositories/order.repo';
import { CreateOrderDto, OrderFilters } from '@algo/types';
import { randomUUID } from 'crypto';

export const registerOrderHandlers = (repo: OrderRepository) => {
  ipcMain.handle(
    'orders:create',
    async (_, payload: Omit<CreateOrderDto, 'id' | 'orderNumber' | 'createdAt'>) => {
      // 1. Generate Identity locally (Source of Truth)
      const tenantId = process.env.TENANT_ID || '00000000-0000-0000-0000-000000000001';
      const tenantSuffix = tenantId.slice(-2);
      const timeSuffix = Date.now().toString().slice(-8); // Last 8 digits of timestamp (~27 hours uniqueness)

      const fullOrder: CreateOrderDto = {
        ...payload,
        id: randomUUID(),
        orderNumber: `${tenantSuffix}-${timeSuffix}`,
        createdAt: new Date().toISOString(),
      };

      console.log(`📝 Creating Order: ${fullOrder.orderNumber}`);

      // 2. Pass full object to Repo
      return await repo.create(fullOrder);
    },
  );

  ipcMain.handle('orders:get-all', async (_, filters?: OrderFilters) => {
    console.log('Fetching orders with filters:', filters);
    return await repo.findAll(filters);
  });
};
