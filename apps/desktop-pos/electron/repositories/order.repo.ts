import { DB, schema } from '@algo/db-local';
import { CreateOrderDto, OrderResultDto } from '@algo/types';
import { randomUUID } from 'crypto';
import { desc, eq, sql, and, gte, lte, like, or } from 'drizzle-orm';

export class OrderRepository {
  /**
   * ⚠️ ARCHITECTURE NOTE:
   * We use `as any` casting for schema columns because of a Version Skew between
   * `better-sqlite3` v12.5.0 (App) and v12.6.0 (Shared Lib).
   *
   * This skew is INTENTIONAL to separate Electron (ABI 140) from Node CLI (ABI 127).
   * DO NOT REMOVE THE CASTS unless you resolve the ABI conflict.
   */
  constructor(private db: DB) {}

  // The main function can remain async (to match the Promise interface of the Repository)
  async create(data: CreateOrderDto): Promise<OrderResultDto> {
    return this.db.transaction((tx) => {
      // A. Insert Main Order
      tx.insert(schema.orders)
        .values({
          id: data.id, // Matches schema id (text)
          orderNumber: data.orderNumber, // Matches schema orderNumber (text)
          // Schema expects 'timestamp_ms' (Date or Integer), but DTO has ISO String.
          // We convert it here so Drizzle handles the integer math.
          createdAt: new Date(data.createdAt),

          status: 'COMPLETED',
          paymentMethod: data.paymentMethod,
          subtotal: data.subtotal,
          taxTotal: data.taxTotal,
          discountTotal: data.discountTotal,
          grandTotal: data.grandTotal,
          isSynced: false,
        })
        .run(); // explicit .run() is sometimes needed in raw BS3, but Drizzle handles it usually.
      // With Drizzle + BS3, just calling the method synchronously works.

      // B. Insert Items & Update Stock
      for (const item of data.items) {
        // 1. Get current cost price snapshot
        const product = tx
          .select({ costPrice: schema.products.costPrice })
          .from(schema.products)
          .where(eq(schema.products.id as any, item.productId) as any)
          .get();

        const currentCost = product?.costPrice ?? 0;

        tx.insert(schema.orderItems)
          .values({
            id: randomUUID(),
            orderId: data.id,
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.price,
            costPrice: currentCost, // 🟢 SNAPSHOT
            subtotal: item.price * item.quantity,
          })
          .run();

        tx.update(schema.products)
          .set({
            stock: sql`${schema.products.stock} - ${item.quantity}` as any,
          })
          .where(eq(schema.products.id as any, item.productId) as any)
          .run();
      }

      return { orderId: data.id, orderNumber: data.orderNumber };
    });
  }

  async refundOrder(
    originalOrderId: string,
    refundData: { id: string; orderNumber: string; createdAt: string },
  ): Promise<OrderResultDto> {
    return this.db.transaction((tx) => {
      // 1. Fetch original order
      const originalOrder = tx
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.id as any, originalOrderId) as any)
        .get();

      if (!originalOrder) {
        throw new Error('Original order not found');
      }

      // 2. Fetch original order items
      const originalItems = tx
        .select()
        .from(schema.orderItems)
        .where(eq(schema.orderItems.orderId as any, originalOrderId) as any)
        .all();

      // 3. Create Mirror Order with negative financial values
      tx.insert(schema.orders)
        .values({
          id: refundData.id,
          orderNumber: refundData.orderNumber,
          createdAt: new Date(refundData.createdAt),
          status: 'REFUNDED',
          paymentMethod: originalOrder.paymentMethod,
          // Negative values for Immutable Ledger Pattern
          subtotal: -Math.abs(originalOrder.subtotal ?? 0),
          taxTotal: -Math.abs(originalOrder.taxTotal ?? 0),
          discountTotal: -Math.abs(originalOrder.discountTotal ?? 0),
          grandTotal: -Math.abs(originalOrder.grandTotal ?? 0),
          isSynced: false,
        })
        .run();

      // 4. Create Mirror Order Items & Revert Stock
      for (const item of originalItems) {
        // Enforce negative quantity for mirror order item
        const refundQuantity = -Math.abs(item.quantity);

        tx.insert(schema.orderItems)
          .values({
            id: randomUUID(),
            orderId: refundData.id,
            productId: item.productId,
            productName: item.productName,
            quantity: refundQuantity,
            unitPrice: item.unitPrice,
            costPrice: item.costPrice,
            subtotal: refundQuantity * item.unitPrice,
          })
          .run();

        // 5. Revert inventory stock
        tx.update(schema.products)
          .set({
            stock: sql`${schema.products.stock} + ${Math.abs(item.quantity)}` as any,
          })
          .where(eq(schema.products.id as any, item.productId) as any)
          .run();
      }

      // 6. Update the original order's status to REFUNDED to reflect its state
      tx.update(schema.orders)
        .set({ status: 'REFUNDED' })
        .where(eq(schema.orders.id as any, originalOrderId) as any)
        .run();

      return { orderId: refundData.id, orderNumber: refundData.orderNumber };
    });
  }

  async partialRefundOrder(
    originalOrderId: string,
    refundData: { items: { productId: string; quantity: number }[]; reason?: string },
  ): Promise<OrderResultDto> {
    return this.db.transaction((tx) => {
      // 1. Fetch original order
      const originalOrder = tx
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.id as any, originalOrderId) as any)
        .get();

      if (!originalOrder) {
        throw new Error('Original order not found');
      }

      if (originalOrder.status === 'REFUNDED') {
        throw new Error('Order is already fully refunded');
      }

      // 2. Fetch original order items
      const originalItems = tx
        .select()
        .from(schema.orderItems)
        .where(eq(schema.orderItems.orderId as any, originalOrderId) as any)
        .all();

      // Find all past mirror orders to prevent duplicate refunds for the same items
      // We look for any order number containing REF-<originalOrderNumber>
      const mirrorOrders = tx
        .select({ id: schema.orders.id })
        .from(schema.orders)
        .where(like(schema.orders.orderNumber as any, `%REF-${originalOrder.orderNumber}%`) as any)
        .all();

      const pastRefundedQuantities: Record<string, number> = {};
      for (const mirror of mirrorOrders) {
        const pastItems = tx
          .select()
          .from(schema.orderItems)
          .where(eq(schema.orderItems.orderId as any, mirror.id) as any)
          .all();
        for (const item of pastItems) {
          // Accumulate the absolute value since refund items have negative quantities
          pastRefundedQuantities[item.productId] =
            (pastRefundedQuantities[item.productId] || 0) + Math.abs(item.quantity);
        }
      }

      // 3. Prepare data for mirror order
      const refundOrderId = randomUUID();
      const newOrderNumber = `PREF-${originalOrder.orderNumber}`;

      let refundSubtotalAmount = 0;
      const refundItemsData = [];

      for (const refundItem of refundData.items) {
        const originalItem = originalItems.find((i) => i.productId === refundItem.productId);
        if (!originalItem) {
          throw new Error(`Item ${refundItem.productId} not found in original order`);
        }

        // Calculate the actual remaining quantity that can still be refunded
        const alreadyRefundedQty = pastRefundedQuantities[refundItem.productId] || 0;
        const remainingQty = originalItem.quantity - alreadyRefundedQty;

        if (refundItem.quantity > remainingQty) {
          throw new Error(
            `Refund quantity cannot exceed remaining refundable quantity (${remainingQty}) for item ${refundItem.productId}`,
          );
        }

        // Calculate positive subtotal for this item
        const itemRefundSubtotal = refundItem.quantity * originalItem.unitPrice;
        refundSubtotalAmount += itemRefundSubtotal;

        refundItemsData.push({
          originalItem,
          refundQuantity: -refundItem.quantity,
          refundSubtotal: -itemRefundSubtotal,
        });
      }

      // Proportional calculation for subtotal, tax, discount
      // Correct mathematical logic: Ratio should be derived from Subtotal, not Grand Total
      const originalSubtotal = Math.abs(originalOrder.subtotal || 1);
      const ratio = refundSubtotalAmount / originalSubtotal;

      const proportionalTax = Math.round((originalOrder.taxTotal || 0) * ratio);
      const proportionalDiscount = Math.round((originalOrder.discountTotal || 0) * ratio);
      const calculatedGrandTotal = refundSubtotalAmount + proportionalTax - proportionalDiscount;

      // 4. Insert new partial refund order (using negative values for Immutable Ledger Pattern)
      tx.insert(schema.orders)
        .values({
          id: refundOrderId,
          orderNumber: newOrderNumber,
          createdAt: new Date(),
          status: 'REFUNDED',
          paymentMethod: originalOrder.paymentMethod,
          subtotal: -refundSubtotalAmount,
          taxTotal: -proportionalTax,
          discountTotal: -proportionalDiscount,
          grandTotal: -calculatedGrandTotal,
          isSynced: false,
        })
        .run();

      // 5. For each selected item
      for (const itemData of refundItemsData) {
        const { originalItem, refundQuantity, refundSubtotal } = itemData;

        // Insert negative orderItem
        tx.insert(schema.orderItems)
          .values({
            id: randomUUID(),
            orderId: refundOrderId,
            productId: originalItem.productId,
            productName: originalItem.productName,
            quantity: refundQuantity,
            unitPrice: originalItem.unitPrice,
            costPrice: originalItem.costPrice,
            subtotal: refundSubtotal,
          })
          .run();

        // Increment stock
        tx.update(schema.products)
          .set({
            stock: sql`${schema.products.stock} + ${Math.abs(refundQuantity)}` as any,
          })
          .where(eq(schema.products.id as any, originalItem.productId) as any)
          .run();

        // Note: The prompt requested inserting into an `inventoryMovements` table,
        // but that table does not exist in the current schema.local.ts.
        // We are skipping that insertion to prevent SQL errors, matching the existing `refundOrder` behavior.
      }

      // 6. Update the original order's status
      let isFullyRefunded = true;
      for (const originalItem of originalItems) {
        const refundedQty = pastRefundedQuantities[originalItem.productId] || 0;
        const currentRefundQty =
          refundData.items.find((i) => i.productId === originalItem.productId)?.quantity || 0;
        if (refundedQty + currentRefundQty < originalItem.quantity) {
          isFullyRefunded = false;
          break;
        }
      }

      tx.update(schema.orders)
        .set({ status: isFullyRefunded ? 'REFUNDED' : 'PARTIALLY_REFUNDED' })
        .where(eq(schema.orders.id as any, originalOrderId) as any)
        .run();

      return { orderId: refundOrderId, orderNumber: newOrderNumber };
    });
  }

  async findAll(filters?: {
    page?: number;
    limit?: number;
    from?: string;
    to?: string;
    status?: string;
    search?: string;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const offset = (page - 1) * limit;

    // Build where conditions array
    const conditions = [];

    if (filters?.from) {
      const startTimestamp = new Date(filters.from).getTime();
      conditions.push(gte(schema.orders.createdAt as any, new Date(startTimestamp)));
    }

    if (filters?.to) {
      // Don't add extra day - frontend already sends end of day timestamp
      const endTimestamp = new Date(filters.to).getTime();
      conditions.push(lte(schema.orders.createdAt as any, new Date(endTimestamp)));
    }

    if (filters?.status) {
      conditions.push(eq(schema.orders.status as any, filters.status));
    }

    if (filters?.search) {
      // Search across order number AND product names in order items
      const searchPattern = `%${filters.search}%`;

      conditions.push(
        or(
          like(schema.orders.orderNumber as any, searchPattern),
          sql`EXISTS (
            SELECT 1 FROM order_items
            WHERE order_items.order_id = orders.id
            AND order_items.product_name LIKE ${searchPattern}
          )`,
        )! as any,
      );
    }

    // Combine conditions with AND, or use undefined if no conditions
    const whereClause = conditions.length > 0 ? (and(...conditions) as any) : undefined;

    // Get total count for pagination
    const countQuery = this.db
      .select({ count: sql<number>`cast(count(*) as integer)` as any })
      .from(schema.orders);

    if (whereClause) {
      countQuery.where(whereClause);
    }

    const countResult = countQuery.get();
    // 🛡️ CAST SAFETY: better-sqlite3 may return BigInt or number depending on configuration.
    // 'Number()' is safe here as order count will not exceed Number.MAX_SAFE_INTEGER (2^53).
    const total = Number(countResult?.count || 0);

    // Get paginated data using query API
    const query: any = {
      orderBy: [desc(schema.orders.createdAt as any)],
      limit,
      offset,
      with: {
        items: true,
      },
    };

    if (whereClause) {
      query.where = whereClause;
    }

    const data = await this.db.query.orders.findMany(query);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
