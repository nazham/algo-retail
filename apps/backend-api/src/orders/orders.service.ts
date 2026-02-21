import {
  BadRequestException,
  NotFoundException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';

import { DB_CONNECTION } from '../db/database.module';
import * as schema from '../db/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { CreateOrderDto, OrderResultDto, OrderStatusType } from '@algo/types';
import { eq, sql, and, ilike, desc, count } from 'drizzle-orm';
import { InventoryService } from '../inventory/inventory.service';
import { GetOrdersDto } from './dto/get-orders.dto';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @Inject(DB_CONNECTION) private db: NodePgDatabase<typeof schema>,
    private readonly inventoryService: InventoryService,
  ) {}

  async create(tenantId: string, dto: CreateOrderDto): Promise<OrderResultDto> {
    // 🛡️ SECURITY: Tenant ID extracted from Guard/Middleware context

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
        status: (dto.status as OrderStatusType) || 'COMPLETED', // 🟢 Respect Desktop Status
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

  async findAll(tenantId: string, query: GetOrdersDto) {
    const { page = 1, limit = 20 } = query;
    const offset = (page - 1) * limit;

    const whereClause = this.buildWhereClause(tenantId, query);

    const data = await this.db.query.orders.findMany({
      where: whereClause,
      limit: limit,
      offset: offset,
      orderBy: [desc(schema.orders.createdAt)],
      with: {
        items: true,
      },
    });

    const totalResult = await this.db
      .select({ count: count() })
      .from(schema.orders)
      .where(whereClause);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      data: data.map((order) => ({
        ...order,
        createdAt: order.createdAt?.toISOString() ?? new Date().toISOString(),
        syncedAt: order.syncedAt?.toISOString() ?? null,
        items: order.items.map((item) => ({
          ...item,
        })),
        status: (order.status as OrderStatusType) || 'COMPLETED',
        paymentMethod: order.paymentMethod || 'CASH', // Fallback
      })),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findOne(tenantId: string, id: string) {
    const order = await this.db.query.orders.findFirst({
      where: and(
        eq(schema.orders.id, id),
        eq(schema.orders.tenantId, tenantId),
      ),
      with: {
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  private buildWhereClause(tenantId: string, query: GetOrdersDto) {
    const { search, status, from, to } = query;
    const filters = [eq(schema.orders.tenantId, tenantId)];

    if (search) {
      const escapedSearch = search.replace(/%/g, '\\%').replace(/_/g, '\\_');
      filters.push(ilike(schema.orders.orderNumber, `%${escapedSearch}%`));
    }

    if (status) {
      filters.push(eq(schema.orders.status, status));
    }

    if (from) {
      // Parse 'YYYY-MM-DD' properly and ensure it represents the start of the day in local time
      const fromDate = new Date(from);
      fromDate.setHours(0, 0, 0, 0);
      filters.push(sql`${schema.orders.createdAt} >= ${fromDate}`);
    }

    if (to) {
      // Ensure 'to' represents the very end of the day in local time
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      filters.push(sql`${schema.orders.createdAt} <= ${toDate}`);
    }

    return and(...filters);
  }
}
