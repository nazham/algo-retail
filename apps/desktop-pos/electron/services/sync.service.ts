import { SyncRepository } from '../repositories/sync.repo';
import { CreateOrderDto } from '@algo/types';

export class SyncService {
  private isRunning = false;
  private apiUrl: string;
  private tenantId: string;

  constructor(private repo: SyncRepository) {
    this.apiUrl = process.env.API_URL || 'http://localhost:3000';
    this.tenantId = process.env.TENANT_ID || '00000000-0000-0000-0000-000000000001';
  }

  async sync() {
    // Prevent double-running (e.g., if previous sync is slow)
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      console.log('🔄 Sync Worker: Checking for pending orders...');

      // 1. Get Data
      const pendingOrders = await this.repo.getUnsyncedOrders();
      if (pendingOrders.length === 0) {
        console.log('✅ Sync Worker: Nothing to sync.');
        return;
      }

      console.log(`📤 Sync Worker: Found ${pendingOrders.length} orders. Uploading...`);

      // 2. Upload One by One (Simplest strategy for MVP)
      // We could do batching later, but one-by-one is safer for error handling.
      const successfulIds: string[] = [];

      for (const order of pendingOrders) {
        try {
          const payload: CreateOrderDto = {
            subtotal: order.subtotal ?? 0,
            taxTotal: order.taxTotal ?? 0,
            discountTotal: order.discountTotal ?? 0,
            grandTotal: order.grandTotal ?? 0,
            items: order.items.map((i) => ({
              productId: i.productId,
              productName: i.productName,
              quantity: i.quantity,
              price: i.unitPrice ?? 0,
            })),
          };

          const response = await fetch(`${this.apiUrl}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          if (response.ok) {
            successfulIds.push(order.id);
            console.log(`   -> Uploaded Order ${order.orderNumber}`);
          } else {
            console.error(`   -> Failed Order ${order.orderNumber}: ${response.statusText}`);
          }
        } catch (err) {
          console.error(`   -> Network Error for ${order.orderNumber}`);
        }
      }

      // 3. Update Local DB
      if (successfulIds.length > 0) {
        await this.repo.markOrdersAsSynced(successfulIds);
        console.log(`🎉 Sync Complete: Marked ${successfulIds.length} orders as synced.`);
      }
    } catch (error) {
      console.error('❌ Sync Worker Critical Failure:', error);
    } finally {
      this.isRunning = false;
    }
  }
}
