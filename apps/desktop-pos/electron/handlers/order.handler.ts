import { ipcMain } from 'electron';
import { OrderRepository } from '../repositories/order.repo';
import { CreateOrderDto, OrderFilters, PartialRefundSchema } from '@algo/types';
import { randomUUID } from 'crypto';
import { UserRepository } from '../repositories/user.repo';

export const registerOrderHandlers = (repo: OrderRepository, userRepo: UserRepository) => {
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

  ipcMain.handle(
    'orders:refund',
    async (_, payload: { originalOrderId: string; adminPin: string }) => {
      console.log(`🔄 Processing refund for Order: ${payload.originalOrderId}`);

      // 1. Validate Admin PIN (Strictly no hardcoded values)
      const expectedPin = process.env.ADMIN_PIN;
      if (!expectedPin) {
        throw new Error('Server configuration error: Admin PIN is not set.');
      }

      if (payload.adminPin !== expectedPin) {
        throw new Error('Invalid Admin PIN.');
      }

      // 2. Generate Identity for the Mirror Order locally
      const tenantId = process.env.TENANT_ID || '00000000-0000-0000-0000-000000000001';
      const tenantSuffix = tenantId.slice(-2);
      const timeSuffix = Date.now().toString().slice(-8);

      const refundData = {
        id: randomUUID(),
        // Use REF prefix to clearly identify mirror orders
        orderNumber: `${tenantSuffix}-REF-${timeSuffix}`,
        createdAt: new Date().toISOString(),
      };

      // 3. Call Repository (No business logic here)
      return await repo.refundOrder(payload.originalOrderId, refundData);
    },
  );

  ipcMain.handle('orders:get-all', async (_, filters?: OrderFilters) => {
    console.log('Fetching orders with filters:', filters);
    return await repo.findAll(filters);
  });

  ipcMain.handle('orders:partial-refund', async (_, payload: unknown) => {
    try {
      // 1. Validate payload
      const parsed = PartialRefundSchema.safeParse(payload);
      if (!parsed.success) {
        return { success: false, error: 'Invalid payload' };
      }

      const { originalOrderId, adminPin, items, reason } = parsed.data;

      // 2 & 3. Validate Admin PIN via userRepository
      const adminUser = await userRepo.verifyPin(adminPin);
      if (!adminUser) {
        return { success: false, error: 'Invalid Admin PIN' };
      }

      // 4. Call OrderRepository
      const result = await repo.partialRefundOrder(originalOrderId, { items, reason });

      // 5. Return success
      return { success: true, orderId: result.orderId };
    } catch (error: any) {
      console.error('Partial refund error:', error);
      return { success: false, error: error.message || 'Partial refund failed' };
    }
  });
};
