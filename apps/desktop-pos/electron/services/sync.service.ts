import { CategoryRepository } from '../repositories/category.repo';
import { ProductRepository } from '../repositories/product.repo';
import { SyncRepository } from '../repositories/sync.repo';
import { CreateOrderDto, PaymentMethod } from '@algo/types';

export class SyncService {
  private isRunning = false;
  private apiUrl: string;
  private tenantId: string;
  private apiKey: string;
  private lastPulse: string | null = null;

  public onStateChange?: (
    state: 'IDLE' | 'SYNCING' | 'ERROR' | 'OFFLINE',
    message?: string,
  ) => void;

  constructor(
    private repo: SyncRepository,
    private productRepo: ProductRepository,
    private categoryRepo: CategoryRepository,
  ) {
    this.apiUrl = process.env.API_URL || 'http://localhost:8080';
    this.apiKey = process.env.API_KEY || '';
    this.tenantId = process.env.TENANT_ID || '00000000-0000-0000-0000-000000000001';
  }

  private notify(state: 'IDLE' | 'SYNCING' | 'ERROR' | 'OFFLINE', message?: string) {
    if (this.onStateChange) {
      this.onStateChange(state, message);
    }
  }

  async start() {
    this.isRunning = false;
    this.notify('IDLE', 'Deep Seek Initialized');

    // Initial Sync
    await this.sync();

    // Loop
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const interval = this.determineInterval();
      console.log(`⏳ Next sync in ${interval / 1000}s`);
      await new Promise((resolve) => setTimeout(resolve, interval));
      await this.sync();
    }
  }

  private hasRecentActivity = false;

  private determineInterval() {
    // If we just synced something, sync again soon (10s)
    // If idle, back off to 2 minutes
    return this.hasRecentActivity ? 10 * 1000 : 120 * 1000;
  }

  async sync() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.notify('SYNCING');
    this.hasRecentActivity = false; // Reset

    try {
      const orders = await this.pushOrders();
      const cats = await this.pullCategories();
      const prods = await this.pullProducts();

      if (orders || cats || prods) {
        this.hasRecentActivity = true;
      }

      this.notify('IDLE', 'Last sync: ' + new Date().toLocaleTimeString());
    } catch (error: any) {
      console.error('❌ Sync Cycle Failed:', error);

      if (this.isNetworkError(error)) {
        this.notify('OFFLINE');
      } else {
        this.notify('ERROR', 'Sync failed');
      }
    } finally {
      this.isRunning = false;
    }
  }

  private isNetworkError(error: any): boolean {
    if (!error) return false;

    // 1. Explicit Abort (Timeout)
    if (error.name === 'AbortError') return true;

    // 2. Custom Tag from request()
    if (error.cause === 'NETWORK_ERROR') return true;

    // 3. Common Node.js/Electron Network Codes
    const networkCodes = ['ENOTFOUND', 'ECONNREFUSED', 'EAI_AGAIN', 'ETIMEDOUT', 'ENETUNREACH'];
    if (networkCodes.includes(error.code) || networkCodes.includes(error?.cause?.code)) {
      return true;
    }

    // 4. Fetch specific error messages
    if (
      error.message &&
      (error.message.includes('fetch failed') ||
        error.message.includes('Network request failed') ||
        error.message.includes('Failed to fetch'))
    ) {
      return true;
    }
    return false;
  }

  /**
   * 🛡️ Generic Request Helper with Timeout & Auth
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s Timeout

    try {
      const url = new URL(`${this.apiUrl}${endpoint}`); // Safe URL concatenation

      const response = await fetch(url.toString(), {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'x-tenant-id': this.tenantId,
          ...options.headers,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Request Failed: ${response.status} ${response.statusText}`);
      }

      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.error(`⏱️ Request Timeout [${endpoint}]`);
          throw error;
        }
        // Just re-throw, let isNetworkError handle inspection
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // ... (Methods below)

  private async pushOrders(): Promise<boolean> {
    console.log('🔄 Sync Worker: Checking for pending orders...');
    const pendingOrders = await this.repo.getUnsyncedOrders();

    if (pendingOrders.length === 0) {
      console.log('✅ Sync Worker: Nothing to sync.');
      return false;
    }

    console.log(`📤 Sync Worker: Uploading ${pendingOrders.length} orders...`);
    const successfulIds: string[] = [];

    for (const order of pendingOrders) {
      const payload: CreateOrderDto = {
        subtotal: order.subtotal ?? 0,
        taxTotal: order.taxTotal ?? 0,
        discountTotal: order.discountTotal ?? 0,
        grandTotal: order.grandTotal ?? 0,
        // Map items safely
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

      // Use Helper (POST)
      try {
        await this.request<any>('/orders', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        successfulIds.push(order.id);
        console.log(`   -> Uploaded Order ${order.orderNumber}`);
      } catch (err) {
        console.error(`Failed to upload order ${order.orderNumber}`, err);
        throw err; // Stop syncing if one fails, or continue?
        // For now, let's stop to be safe and report error
      }
    }

    if (successfulIds.length > 0) {
      await this.repo.markOrdersAsSynced(successfulIds);
      console.log(`Sync Complete: Marked ${successfulIds.length} orders as synced.`);
      return true;
    }

    return false;
  }

  private async pullCategories(): Promise<boolean> {
    console.log(`🔄 Sync Worker: Synching categories...`);

    const endpoint = this.lastPulse
      ? `/products/categories/sync?lastSync=${this.lastPulse}`
      : `/products/categories/sync`;

    const data = await this.request<{ items: any[] }>(endpoint); // GET is default

    if (data?.items && data.items.length > 0) {
      console.log(`📥 Received ${data.items.length} categories.`);
      await this.categoryRepo.bulkUpsert(data.items);
      return true;
    }
    return false;
  }

  private async pullProducts(): Promise<boolean> {
    console.log(`🔄 Sync Worker: Checking for product updates...`);

    const endpoint = this.lastPulse
      ? `/products/sync?lastSync=${this.lastPulse}`
      : `/products/sync`;

    const data = await this.request<{ items: any[]; serverTime?: string }>(endpoint);

    if (data) {
      const { items, serverTime } = data;

      // 1. Process Items
      if (items && items.length > 0) {
        console.log(`📥 Received ${items.length} product updates.`);
        await this.productRepo.bulkUpsert(items);

        if (serverTime) this.lastPulse = serverTime;
        return true;
      }

      // 2. Update Cursor even if empty (prevent re-scan loop)
      if (serverTime) {
        this.lastPulse = serverTime;
      }
    }
    return false;
  }
}
