import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { DB_CONNECTION } from '../db/database.module';
import * as schema from '../db/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { CreateOrderDto, OrderResultDto } from '@algo/types';
import { eq, sql } from 'drizzle-orm';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @Inject(DB_CONNECTION) private db: NodePgDatabase<typeof schema>,
    private readonly inventoryService: InventoryService,
    @Inject(REQUEST) private request: { tenantId: string },
  ) {}

  async create(dto: CreateOrderDto): Promise<OrderResultDto> {
    // 🛡️ SECURITY: Tenant ID extracted from Guard/Middleware context
    const tenantId = this.request.tenantId;

    if (!tenantId) {
      throw new BadRequestException('Tenant ID missing from request context');
    }

    // 🔍 AUDIT: Verify Order Totals (Server-Side Validation)
    const calculatedSubtotal = dto.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    // Tolerance for floating point math (0.05 currency unit)
    if (Math.abs(calculatedSubtotal - dto.subtotal) > 0.05) {
      this.logger.warn(
        `🚨 Price Mismatch detected for Order ${dto.orderNumber}. POS: ${dto.subtotal}, Calc: ${calculatedSubtotal}`,
      );
      throw new BadRequestException(
        `Order integrity check failed: Subtotal mismatch. POS: ${dto.subtotal}, Server: ${calculatedSubtotal}`,
      );
    }

    // Verify Grand Total Math: Subtotal + Tax - Discount = GrandTotal
    const calculatedGrand = dto.subtotal + dto.taxTotal - dto.discountTotal;
    if (Math.abs(calculatedGrand - dto.grandTotal) > 0.05) {
      throw new BadRequestException(
        `Order integrity check failed: GrandTotal mismatch. POS: ${dto.grandTotal}, Server: ${calculatedGrand}`,
      );
    }
    // 1. Idempotency Check: Does this Order ID already exist?
    const existing = await this.db.query.orders.findFirst({
      where: eq(schema.orders.id, dto.id),
    });

    if (existing) {
      this.logger.log(`⚠️ Order ${dto.orderNumber} already synced. Skipping.`);
      return { orderId: dto.id, orderNumber: dto.orderNumber };
    }

    return await this.db.transaction(async (tx) => {
      // 2. Insert Order
      await tx.insert(schema.orders).values({
        id: dto.id, // 🟢 Trust the Desktop UUID
        tenantId: tenantId,
        orderNumber: dto.orderNumber, // 🟢 Trust the Desktop Receipt #
        createdAt: new Date(dto.createdAt), // 🟢 Trust the Desktop Time

        subtotal: dto.subtotal,
        taxTotal: dto.taxTotal,
        discountTotal: dto.discountTotal,
        grandTotal: dto.grandTotal,
        paymentMethod: dto.paymentMethod,
        status: dto.status || 'COMPLETED', // 🟢 Respect Desktop Status
        syncedAt: new Date(), // 🟢 Track Sync Time
      });

      // 3. Insert Items & UPDATE STOCK via InventoryService
      // 🛡️ DEADLOCK PREVENTION: Always sort items by ID to enforce lock acquisition order
      const sortedItems = [...dto.items].sort((a, b) =>
        a.productId.localeCompare(b.productId),
      );

      for (const item of sortedItems) {
        await tx.insert(schema.orderItems).values({
          tenantId: tenantId,
          orderId: dto.id,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.price,
          subtotal: item.price * item.quantity,
        });

        // 📉 Stock Adjustment (Logged Movement)
        await this.inventoryService.recordSale(
          tenantId,
          item.productId,
          item.quantity,
          dto.id,
          item.costPrice, // 🟢 Pass Snapshot from DTO
          tx,
        );
      }

      this.logger.log(`✅ Synced Order: ${dto.orderNumber}`);
      return { orderId: dto.id, orderNumber: dto.orderNumber };
    });
  }

  findAll() {
    return this.db.select().from(schema.orders);
  }
}
