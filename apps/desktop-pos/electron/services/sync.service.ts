import { ProductRepository } from '../repositories/product.repo';
import { SyncRepository } from '../repositories/sync.repo';
import { CreateOrderDto, PaymentMethod } from '@algo/types';

export class SyncService {
  private isRunning = false;
  private apiUrl: string;
  private tenantId: string;
  private apiKey: string;
  private lastPulse: string | null = null;

  constructor(
    private repo: SyncRepository,
    private productRepo: ProductRepository,
  ) {
    this.apiUrl = process.env.API_URL || 'http://localhost:8080';
    this.apiKey = process.env.API_KEY || '';
    this.tenantId = process.env.TENANT_ID || '00000000-0000-0000-0000-000000000001';
  }

  async sync() {
    // Prevent double-running (e.g., if previous sync is slow)
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      // ---------------------------------------------------------
      // ⬆️ PHASE 1: PUSH (Existing Code)
      // ---------------------------------------------------------
      await this.pushOrders();

      // ---------------------------------------------------------
      // ⬇️ PHASE 2: PULL (New Code)
      // ---------------------------------------------------------
      await this.pullProducts();
    } catch (error) {
      console.error('❌ Sync Cycle Failed:', error);
    } finally {
      this.isRunning = false;
    }
  }

  private async pushOrders() {
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
          id: order.id,
          orderNumber: order.orderNumber,
          createdAt: new Date(order.createdAt).toISOString(),
          paymentMethod: (order.paymentMethod as PaymentMethod) || 'CASH',
        };

        const response = await fetch(`${this.apiUrl}/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'x-tenant-id': this.tenantId,
          },
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
        console.error(err);
      }
    }

    // 3. Update Local DB
    if (successfulIds.length > 0) {
      await this.repo.markOrdersAsSynced(successfulIds);
      console.log(`Sync Complete: Marked ${successfulIds.length} orders as synced.`);
    }
  }

  private async pullProducts() {
    try {
      const url = new URL(`${this.apiUrl}/products/sync`);
      if (this.lastPulse) {
        url.searchParams.append('lastSync', this.lastPulse);
      }

      console.log(`🔄 Sync Worker: Checking for product updates...`);

      const response = await fetch(url.toString(), {
        headers: {
          'x-api-key': this.apiKey,
          'x-tenant-id': this.tenantId,
        },
      });

      if (!response.ok) return;

      const products = await response.json();

      if (products.length > 0) {
        console.log(`📥 Received ${products.length} product updates.`);
        await this.productRepo.bulkUpsert(products);
      }

      // Update Timestamp so we only fetch newer stuff next time
      this.lastPulse = new Date().toISOString();
    } catch (error) {
      console.error('❌ Pull Failed:', error);
    }
  }
}
