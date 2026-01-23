import { Inject, Injectable } from '@nestjs/common';
import { DB_CONNECTION } from '../db/database.module';
import * as schema from '../db/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as crypto from 'crypto';
import { CreateOrderDto, OrderResultDto } from '@algo/types';
import { eq, sql } from 'drizzle-orm';

@Injectable()
export class OrdersService {
  constructor(
    @Inject(DB_CONNECTION) private db: NodePgDatabase<typeof schema>,
  ) {}

  async create(dto: CreateOrderDto): Promise<OrderResultDto> {
    // MVP Hack: Hardcode the Tenant ID for now (Simulating Single Tenant)
    const MVP_TENANT_ID = '00000000-0000-0000-0000-000000000001';

    // 1. Idempotency Check: Does this Order ID already exist?
    const existing = await this.db.query.orders.findFirst({
      where: eq(schema.orders.id, dto.id),
    });

    if (existing) {
      console.log(`⚠️ Order ${dto.orderNumber} already synced. Skipping.`);
      return { orderId: dto.id, orderNumber: dto.orderNumber };
    }

    return await this.db.transaction(async (tx) => {
      // 1. Insert Order
      // Note: We generate a NEW ID for the Cloud, or we could use the Desktop ID.
      // For sync resilience, it's often safer to let the Cloud generate its own ID
      // and map it back, OR trust the Desktop ID if it's a UUID.
      // Let's trust the Desktop UUID for simplicity in MVP.

      await tx.insert(schema.orders).values({
        id: dto.id, // 🟢 Trust the Desktop UUID
        tenantId: MVP_TENANT_ID,
        orderNumber: dto.orderNumber, // 🟢 Trust the Desktop Receipt #
        createdAt: new Date(dto.createdAt), // 🟢 Trust the Desktop Time

        subtotal: dto.subtotal,
        taxTotal: dto.taxTotal,
        discountTotal: dto.discountTotal,
        grandTotal: dto.grandTotal,
        paymentMethod: dto.paymentMethod,
        status: 'SYNCED',
      });

      // 2. Insert Items & UPDATE STOCK (Updated code)
      // 3. Insert Items & Decrement Stock
      for (const item of dto.items) {
        await tx.insert(schema.orderItems).values({
          tenantId: MVP_TENANT_ID,
          orderId: dto.id,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.price,
          subtotal: item.price * item.quantity,
        });

        // 📉 Stock Adjustment (Logic stays the same)
        await tx
          .update(schema.products)
          .set({
            stock: sql`${schema.products.stock} - ${item.quantity}`,
            updatedAt: new Date(),
          })
          .where(eq(schema.products.id, item.productId));
      }

      console.log(`✅ Synced Order: ${dto.orderNumber}`);
      return { orderId: dto.id, orderNumber: dto.orderNumber };
    });
  }

  findAll() {
    return this.db.select().from(schema.orders);
  }
}
