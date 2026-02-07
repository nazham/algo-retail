import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DB_CONNECTION } from '../db/database.module';
import * as schema from '../db/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, desc, sql, and } from 'drizzle-orm';
import {
  AddStockDto,
  AdjustStockDto,
  MovementsQueryDto,
} from './dto/inventory.dto';

@Injectable()
export class InventoryService {
  constructor(
    @Inject(DB_CONNECTION) private db: NodePgDatabase<typeof schema>,
  ) {}

  /**
   * Add stock to a product (PURCHASE movement)
   * Uses transaction to ensure atomicity of movement + stock update
   */
  async addStock(
    tenantId: string,
    productId: string,
    data: AddStockDto,
    userId?: string,
  ) {
    return this.db.transaction(async (tx) => {
      // 1. Get current product to verify it exists
      const [product] = await tx
        .select({
          stock: schema.products.stock,
          costPrice: schema.products.costPrice,
          isActive: schema.products.isActive,
        })
        .from(schema.products)
        .where(
          and(
            eq(schema.products.id, productId),
            eq(schema.products.tenantId, tenantId),
          ),
        )
        .for('update');

      if (!product) {
        throw new NotFoundException(`Product ${productId} not found`);
      }

      // 2. Insert movement record
      const [movement] = await tx
        .insert(schema.inventoryMovements)
        .values({
          tenantId,
          productId,
          type: 'PURCHASE',
          quantity: data.quantity, // Positive for stock in
          costPrice: data.costPrice,
          remarks: data.remarks,
          userId,
        })
        .returning();

      // 3. Update product stock and cost price (Atomic Increment)
      const updateData: Record<string, unknown> = {
        stock: sql`${schema.products.stock} + ${data.quantity}`,
        updatedAt: new Date(),
      };

      // Only update cost price if provided
      if (data.costPrice !== undefined) {
        updateData.costPrice = data.costPrice;
      }

      // Auto-activate if previously inactive and now has stock
      if (!product.isActive && data.quantity > 0) {
        updateData.isActive = true;
      }

      const [updatedProduct] = await tx
        .update(schema.products)
        .set(updateData)
        .where(
          and(
            eq(schema.products.id, productId),
            eq(schema.products.tenantId, tenantId),
          ),
        )
        .returning({ stock: schema.products.stock });

      return {
        movement,
        newStock: updatedProduct?.stock ?? 0,
      };
    });
  }

  /**
   * Adjust stock to match physical count (ADJUSTMENT movement)
   * Calculates the delta and records the adjustment
   */
  async adjustStock(
    tenantId: string,
    productId: string,
    data: AdjustStockDto,
    userId?: string,
  ) {
    return this.db.transaction(async (tx) => {
      // 1. Get current product stock
      const [product] = await tx
        .select({
          stock: schema.products.stock,
          costPrice: schema.products.costPrice,
        })
        .from(schema.products)
        .where(
          and(
            eq(schema.products.id, productId),
            eq(schema.products.tenantId, tenantId),
          ),
        )
        // Lock the row to prevent concurrent modifications during delta calculation
        .for('update');

      if (!product) {
        throw new NotFoundException(`Product ${productId} not found`);
      }

      const currentStock = product.stock || 0;
      const delta = data.actualStock - currentStock;

      // If no change, skip
      if (delta === 0) {
        return {
          movement: null,
          previousStock: currentStock,
          newStock: currentStock,
          delta: 0,
        };
      }

      // 2. Insert movement record
      const [movement] = await tx
        .insert(schema.inventoryMovements)
        .values({
          tenantId,
          productId,
          type: 'ADJUSTMENT',
          quantity: delta, // Can be negative for stock reduction
          costPrice: product.costPrice,
          reason: data.reason,
          remarks: data.remarks,
          userId,
        })
        .returning();

      // 3. Update product stock
      await tx
        .update(schema.products)
        .set({
          stock: data.actualStock,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.products.id, productId),
            eq(schema.products.tenantId, tenantId),
          ),
        );

      return {
        movement,
        previousStock: currentStock,
        newStock: data.actualStock,
        delta,
      };
    });
  }

  /**
   * Get movement history for a product
   */
  async getMovements(
    tenantId: string,
    productId: string,
    query: MovementsQueryDto,
  ) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    // Check if product exists for this tenant
    const [product] = await this.db
      .select({ id: schema.products.id })
      .from(schema.products)
      .where(
        and(
          eq(schema.products.id, productId),
          eq(schema.products.tenantId, tenantId),
        ),
      );

    if (!product) {
      throw new NotFoundException(`Product ${productId} not found`);
    }

    const movements = await this.db
      .select({
        id: schema.inventoryMovements.id,
        tenantId: schema.inventoryMovements.tenantId,
        productId: schema.inventoryMovements.productId,
        type: schema.inventoryMovements.type,
        quantity: schema.inventoryMovements.quantity,
        costPrice: schema.inventoryMovements.costPrice,
        reason: schema.inventoryMovements.reason,
        remarks: schema.inventoryMovements.remarks,
        referenceId: schema.inventoryMovements.referenceId,
        userId: schema.inventoryMovements.userId,
        userName: schema.user.name,
        createdAt: schema.inventoryMovements.createdAt,
      })
      .from(schema.inventoryMovements)
      .leftJoin(
        schema.user,
        eq(schema.inventoryMovements.userId, schema.user.id),
      )
      .where(
        and(
          eq(schema.inventoryMovements.productId, productId),
          eq(schema.inventoryMovements.tenantId, tenantId),
        ),
      )
      .orderBy(desc(schema.inventoryMovements.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const [{ count }] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.inventoryMovements)
      .where(
        and(
          eq(schema.inventoryMovements.productId, productId),
          eq(schema.inventoryMovements.tenantId, tenantId),
        ),
      );

    return {
      items: movements,
      total: count,
      page,
      limit,
    };
  }

  /**
   * Record a sale movement (called from order processing)
   * Note: This is typically called internally, not via API
   * @throws NotFoundException if product doesn't exist for tenant
   */
  async recordSale(
    tenantId: string,
    productId: string,
    quantity: number,
    orderId: string,
    costPrice?: number,
    tx?: any, // Optional transaction object
  ) {
    // 🛡️ ATOMICITY: Ensure we always have a transaction wrapper
    const work = async (dbOrTx: any) => {
      // Validate product exists and belongs to tenant
      const [product] = await dbOrTx
        .select({
          id: schema.products.id,
          stock: schema.products.stock,
          costPrice: schema.products.costPrice,
        })
        .from(schema.products)
        .where(
          and(
            eq(schema.products.id, productId),
            eq(schema.products.tenantId, tenantId),
          ),
        )
        .for('update'); // Lock row for atomic update

      if (!product) {
        throw new NotFoundException(`Product ${productId} not found`);
      }

      // 1. Log the movement (Capture Cost Price Snapshot)
      await dbOrTx.insert(schema.inventoryMovements).values({
        tenantId,
        productId,
        type: 'SALE',
        quantity: -Math.abs(quantity), // Always negative for sales
        costPrice: costPrice ?? product.costPrice, // Use provided cost or fallback to product current cost
        referenceId: orderId,
      });

      // 2. Decrement the stock
      await dbOrTx
        .update(schema.products)
        .set({
          stock: sql`${schema.products.stock} - ${Math.abs(quantity)}`,
          updatedAt: new Date(),
        })
        .where(eq(schema.products.id, productId));
    };

    // Use provided transaction or start a new one
    if (tx) {
      return await work(tx);
    } else {
      return await this.db.transaction(work);
    }
  }
}
