import { DB, schema } from '@algo/db-local';
import { CreateOrderDto, OrderResultDto } from '@algo/types';
import { randomUUID } from 'crypto';
import { desc, eq, sql } from 'drizzle-orm';

export class OrderRepository {
  constructor(private db: DB) {}

  // The main function can remain async (to match the Promise interface of the Repository)
  async create(data: CreateOrderDto): Promise<OrderResultDto> {
    const orderId = randomUUID();
    const orderNumber = `INV-${Date.now().toString().slice(-6)}`;

    return this.db.transaction((tx) => {
      // A. Insert Main Order
      tx.insert(schema.orders)
        .values({
          id: orderId,
          orderNumber,
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
        tx.insert(schema.orderItems)
          .values({
            id: randomUUID(),
            orderId: orderId,
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.price,
            subtotal: item.price * item.quantity,
          })
          .run();

        tx.update(schema.products)
          .set({
            stock: sql`${schema.products.stock} - ${item.quantity}`,
          })
          .where(eq(schema.products.id, item.productId))
          .run();
      }

      return { orderId, orderNumber };
    });
  }

  async findAll() {
    return this.db.query.orders.findMany({
      orderBy: [desc(schema.orders.createdAt)],
      limit: 100, // Safety limit
      with: {
        items: true, // Auto-join items
      },
    });
  }
}
