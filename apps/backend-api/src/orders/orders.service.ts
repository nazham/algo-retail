import { Inject, Injectable } from '@nestjs/common';
import { DB_CONNECTION } from '../db/database.module';
import * as schema from '../db/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as crypto from 'crypto';
import { CreateOrderDto, OrderResultDto } from '@algo/types';

@Injectable()
export class OrdersService {
  constructor(
    @Inject(DB_CONNECTION) private db: NodePgDatabase<typeof schema>,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<OrderResultDto> {
    // MVP Hack: Hardcode the Tenant ID for now (Simulating Single Tenant)
    const MVP_TENANT_ID = '00000000-0000-0000-0000-000000000001';

    return await this.db.transaction(async (tx) => {
      // 1. Insert Order
      // Note: We generate a NEW ID for the Cloud, or we could use the Desktop ID.
      // For sync resilience, it's often safer to let the Cloud generate its own ID
      // and map it back, OR trust the Desktop ID if it's a UUID.
      // Let's trust the Desktop UUID for simplicity in MVP.

      const orderId = crypto.randomUUID(); // Node 19+ native

      await tx.insert(schema.orders).values({
        id: orderId,
        tenantId: MVP_TENANT_ID,
        orderNumber: `WEB-${Date.now()}`, // Temporary, ideally we sync the Desktop Number
        subtotal: createOrderDto.subtotal,
        taxTotal: createOrderDto.taxTotal,
        discountTotal: createOrderDto.discountTotal,
        grandTotal: createOrderDto.grandTotal,
        status: 'SYNCED',
      });

      // 2. Insert Items
      if (createOrderDto.items.length > 0) {
        await tx.insert(schema.orderItems).values(
          createOrderDto.items.map((item) => ({
            tenantId: MVP_TENANT_ID,
            orderId: orderId,
            productId: item.productId, // This assumes Product IDs match! (We need to sync products next)
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.price,
            subtotal: item.price * item.quantity,
          })),
        );
      }

      return { orderId, orderNumber: 'SYNCED' };
    });
  }

  findAll() {
    return this.db.select().from(schema.orders);
  }
}
