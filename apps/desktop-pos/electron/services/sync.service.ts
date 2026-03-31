import { CategoryRepository } from '../repositories/category.repo';
import { ProductRepository } from '../repositories/product.repo';
import { SyncRepository } from '../repositories/sync.repo';
import { CreateOrderDto, OrderResultDto, PaymentMethod } from '@algo/types';

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

  public onConfigUpdate?: (config: any) => void;

  constructor(
    private repo: SyncRepository,
    private productRepo: ProductRepository,
    private categoryRepo: CategoryRepository,
  ) {
    this.apiUrl = process.env.API_URL || 'http://localhost:8080';
    this.apiKey = process.env.API_KEY || '';

    // 🛡️ SECURITY: Fail fast if Tenant ID is missing
    const envTenantId = process.env.TENANT_ID;
    if (!envTenantId) {
      throw new Error(
        'FATAL: TENANT_ID is missing from environment variables. Cannot start SyncService.',
      );
    }
    this.tenantId = envTenantId;
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

  public onUpdates?: (stats: {
    products: number;
    categories: number;
    orders: number;
    changedProducts?: any[];
  }) => void;

  async sync() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.notify('SYNCING');
    this.hasRecentActivity = false; // Reset

    const stats: Parameters<Required<SyncService>['onUpdates']>[0] = {
      products: 0,
      categories: 0,
      orders: 0,
      changedProducts: [],
    };

    try {
      const orders = await this.pushOrders();
      if (orders) stats.orders++;

      const cats = await this.pullCategories(); // Categories usually small, no need to optimise yet
      if (cats) stats.categories++;

      const changedItems = await this.pullProducts(); // Modified to return items
      if (changedItems.length > 0) {
        stats.products = changedItems.length;
        stats.changedProducts = changedItems;
      }

      // Pull tenant config from server
      await this.pullConfig();

      if (stats.orders > 0 || stats.categories > 0 || stats.products > 0) {
        this.hasRecentActivity = true;
        if (this.onUpdates) this.onUpdates(stats);
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
        let errorDetails = '';
        try {
          const errorJson = await response.json();
          errorDetails = JSON.stringify(errorJson);
        } catch (e) {
          errorDetails = await response.text();
        }
        console.error(`❌ Sync Request Failed [${endpoint}]:`, errorDetails);
        throw new Error(
          `Request Failed: ${response.status} ${response.statusText} - ${errorDetails}`,
        );
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

    // Batch processing (Chunk size = 5)
    const chunkSize = 5;
    const successfulIds: string[] = [];

    for (let i = 0; i < pendingOrders.length; i += chunkSize) {
      const chunk = pendingOrders.slice(i, i + chunkSize);

      const results = await Promise.allSettled(
        chunk.map(async (order) => {
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
              costPrice: i.costPrice ?? 0, // 🟢 Transmit Snapshot
              discountAmount: i.discountAmount ?? 0, // Transmit item-level discount if available
              discountType: i.discountType ?? 'MANUAL', // Transmit discount type if available
            })),
            id: order.id,
            orderNumber: order.orderNumber,
            createdAt: new Date(order.createdAt).toISOString(),
            paymentMethod: (order.paymentMethod as PaymentMethod) || 'CASH',
            status: order.status || 'COMPLETED', // 🟢 Pass status to backend
          };

          // Use Helper (POST)
          await this.request<OrderResultDto>('/orders', {
            method: 'POST',
            body: JSON.stringify(payload),
          });

          return order.id;
        }),
      );

      // Process batch results
      for (let j = 0; j < results.length; j++) {
        const result = results[j];
        const order = chunk[j];

        if (result.status === 'fulfilled') {
          successfulIds.push(result.value);
          console.log(`   -> Uploaded Order ${order.orderNumber}`);
        } else {
          console.error(`❌ Failed to sync order ${order.orderNumber}:`, result.reason);
          await this.repo.incrementRetryCount(
            order.id,
            result.reason instanceof Error ? result.reason.message : String(result.reason),
          );
        }
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

  private async pullProducts(): Promise<any[]> {
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
        const { success, failed } = await this.productRepo.bulkUpsert(items);

        console.log(`   -> Synced: ${success}, Failed: ${failed}`);

        if (failed > 0) {
          console.warn(`⚠️ Partial Sync Failure (${failed} items). NOT advancing cursor.`);
          // Do NOT update lastPulse, so we retry fetching these items next time
        } else if (serverTime) {
          this.lastPulse = serverTime;
        }

        return items;
      }

      // 2. Update Cursor even if empty (prevent re-scan loop)
      if (serverTime) {
        this.lastPulse = serverTime;
      }
    }
    return [];
  }

  /**
   * Pull tenant config from server and notify renderer.
   */
  private async pullConfig(): Promise<void> {
    try {
      const data = await this.request<{ tenant: { config: any } | null }>('/tenants/me');

      if (data?.tenant?.config && this.onConfigUpdate) {
        this.onConfigUpdate(data.tenant.config);
      }
    } catch (error) {
      // Config pull is non-critical — don't break the sync cycle
      console.warn('⚠️ Failed to pull tenant config:', error);
    }
  }

  /**
   * Push local config to server.
   * Called via IPC from renderer when user saves settings.
   */
  async pushConfig(config: any): Promise<boolean> {
    try {
      await this.request('/tenants/config', {
        method: 'PATCH',
        body: JSON.stringify(config),
      });
      console.log('✅ Config pushed to server successfully.');
      return true;
    } catch (error) {
      console.error('❌ Failed to push config to server:', error);
      return false;
    }
  }
}
