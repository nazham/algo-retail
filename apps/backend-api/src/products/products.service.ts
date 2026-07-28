import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, count, eq, gt, gte, ilike, or, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DB_CONNECTION } from '../db/database.module';
import * as schema from '../db/schema';
import {
  CreateProductDto,
  ExportProductsDto,
  ProductQueryDto,
  UpdateProductDto,
} from './dto/product.dto';

import { AuditService } from '../audit/audit.service';

const LOW_STOCK_THRESHOLD = 10;
const EXPIRY_WARNING_DAYS = 30;

@Injectable()
export class ProductsService {
  constructor(
    @Inject(DB_CONNECTION) private db: NodePgDatabase<typeof schema>,
    private readonly auditService: AuditService,
  ) {}

  /**
   * 🏗️ Batch SKU Reservation
   * Atomically reserves a block of SKUs from the database.
   * Handles empty table case (Self-Healing).
   */
  async reserveSkuBatch(count: number): Promise<number> {
    if (count <= 0) return 0;

    return await this.db.transaction(async (tx) => {
      // 1. Try to lock/get existing row
      const row = await tx
        .select()
        .from(schema.skuSequence)
        .where(eq(schema.skuSequence.id, 1))
        .for('update')
        .then((rows) => rows[0]);

      let startValue = 0;

      if (!row) {
        // 2. Self-Healing: Insert if missing
        // Note: We insert count as current_value because we are reserving [1..count]
        await tx.insert(schema.skuSequence).values({
          id: 1,
          currentValue: count,
        });
        startValue = 0; // The first one will be 0+1 = 1
      } else {
        // 3. Increment
        startValue = row.currentValue;
        const [updated] = await tx
          .update(schema.skuSequence)
          .set({
            currentValue: row.currentValue + count,
            updatedAt: new Date(),
          })
          .where(eq(schema.skuSequence.id, 1))
          .returning();
      }

      return startValue;
    });
  }

  formatSku(sequence: number): string {
    const now = new Date();
    const yy = now.getFullYear().toString().slice(-2);
    const mm = (now.getMonth() + 1).toString().padStart(2, '0');
    const dd = now.getDate().toString().padStart(2, '0');
    const seqStr = sequence.toString().padStart(5, '0');
    return `99${yy}${mm}${dd}${seqStr}`;
  }

  async createProduct(tenantId: string, data: CreateProductDto) {
    let sku = data.sku;

    // Auto-generate SKU if not provided (format: 99YYMMDDSSSSS)
    if (!sku) {
      const sequenceStart = await this.reserveSkuBatch(1);
      sku = this.formatSku(sequenceStart + 1);
    }

    // Determine if product should be active (price > 0)
    const isActive =
      data.isActive !== undefined ? data.isActive : data.price > 0;

    const [product] = await this.db
      .insert(schema.products)
      .values({
        tenantId,
        name: data.name,
        sku,
        price: data.price,
        costPrice: data.costPrice || 0,
        stock: data.stock || 0,
        categoryId: data.categoryId || null,
        isActive,
        batchNo: data.batchNo || null,
        expiryDate: data.expiryDate || null,
      })
      .returning();

    return product;
  }

  async seed(tenantId: string, productsData: any[]) {
    // We use "ON CONFLICT DO UPDATE" so we can run this multiple times safely
    return await this.db
      .insert(schema.products)
      .values(
        productsData.map((p) => ({
          id: p.id,
          tenantId: tenantId,
          name: p.name,
          sku: p.sku,
          price: p.price,
          stock: p.stock,
          isActive: true,
        })),
      )
      .onConflictDoUpdate({
        target: schema.products.id,
        set: {
          name: sql`excluded.name`,
          price: sql`excluded.price`,
          stock: sql`excluded.stock`,
        },
      });
  }

  async findAllPaginated(tenantId: string, query: ProductQueryDto) {
    let {
      page = 1,
      limit = 50,
      search,
      categoryId,
      isActive,
      isLowStock,
      isExpiringSoon,
      sortBy,
      sortOrder = 'desc',
    } = query;
    // Defensive parsing in case pipe fails or is disabled
    page = Number(page) || 1;
    limit = Number(limit) || 50;

    const offset = (page - 1) * limit;

    const filters = [eq(schema.products.tenantId, tenantId)];

    if (search) {
      filters.push(
        or(
          ilike(schema.products.name, `%${search}%`),
          ilike(schema.products.sku, `%${search}%`),
        )!,
      );
    }

    if (categoryId) {
      filters.push(eq(schema.products.categoryId, categoryId));
    }

    if (isActive !== undefined) {
      filters.push(eq(schema.products.isActive, isActive));
    }

    if (isLowStock) {
      // Show items with stock <= threshold (
      // TODO: or use reorderPoint if we had it reliably populated)
      filters.push(sql`${schema.products.stock} <= ${LOW_STOCK_THRESHOLD}`);
    }

    if (isExpiringSoon) {
      const today = new Date().toISOString().split('T')[0];
      const thirtyDaysLater = new Date(
        Date.now() + EXPIRY_WARNING_DAYS * 24 * 60 * 60 * 1000,
      )
        .toISOString()
        .split('T')[0];

      // Filter expiry date between today and 30 days from now
      // Assuming expiryDate is stored as YYYY-MM-DD string
      filters.push(
        and(
          gte(schema.products.expiryDate, today),
          sql`${schema.products.expiryDate} <= ${thirtyDaysLater}`,
        )!,
      );
    }

    const whereClause = and(...filters);

    const [items, totalCount] = await Promise.all([
      this.db.query.products.findMany({
        where: whereClause,
        limit,
        offset,
        with: {
          category: true,
        },
        orderBy: (products, { asc, desc }) => {
          const order = sortOrder === 'asc' ? asc : desc;
          const sortField = sortBy || 'updatedAt';

          // Robust mapping to schema fields
          switch (sortField) {
            case 'name':
              return [order(products.name)];
            case 'price':
              return [order(products.price)];
            case 'costPrice':
              return [order(products.costPrice)];
            case 'stock':
              return [order(products.stock)];
            case 'expiryDate':
              return [order(products.expiryDate)];
            default:
              return [desc(products.updatedAt)];
          }
        },
      }),
      this.db
        .select({ value: count() })
        .from(schema.products)
        .where(whereClause as any),
    ]);

    return {
      items,
      total: totalCount[0].value,
      page,
      limit,
    };
  }

  async findBatches(tenantId: string, parentId: string) {
    return await this.db.query.products.findMany({
      where: and(
        eq(schema.products.tenantId, tenantId),
        eq(schema.products.parentId, parentId),
      ),
      with: {
        category: true,
      },
    });
  }

  async updateProduct(
    id: string,
    tenantId: string,
    data: UpdateProductDto,
    userId: string, // Added userId for audit
  ) {
    // Stock updates should go through InventoryService
    // UpdateProductDto does not have 'stock' field, so it won't be in 'data'
    // if ValidationPipe(whitelist: true) is on.

    return await this.db.transaction(async (tx) => {
      // 1. Fetch existing product for snapshot (WITH LOCK)
      const [oldProduct] = await tx
        .select()
        .from(schema.products)
        .where(
          and(
            eq(schema.products.id, id),
            eq(schema.products.tenantId, tenantId),
          ),
        )
        .for('update');

      if (!oldProduct) {
        throw new Error(`Product ${id} not found`);
      }

      // 2. Perform Update
      const [newProduct] = await tx
        .update(schema.products)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(schema.products.id, id))
        .returning();

      // 3. Compare & Audit
      const diff = this.auditService.calculateDiff(oldProduct, newProduct);
      if (diff) {
        await this.auditService.logChange(
          tenantId,
          userId,
          'PRODUCT',
          id,
          'UPDATE',
          diff,
          tx,
        );
      }

      return newProduct;
    });
  }

  async checkDeleteSafety(id: string, tenantId: string, _tx?: any) {
    const tx = (_tx || this.db) as NodePgDatabase<typeof schema>;

    const [orderItemsRes, movementsRes, batchesRes] = await Promise.all([
      tx
        .select({ value: count() })
        .from(schema.orderItems)
        .where(
          and(
            eq(schema.orderItems.productId, id),
            eq(schema.orderItems.tenantId, tenantId),
          ),
        ),
      tx
        .select({ value: count() })
        .from(schema.inventoryMovements)
        .where(
          and(
            eq(schema.inventoryMovements.productId, id),
            eq(schema.inventoryMovements.tenantId, tenantId),
          ),
        ),
      tx
        .select({ value: count() })
        .from(schema.products)
        .where(
          and(
            eq(schema.products.parentId, id),
            eq(schema.products.tenantId, tenantId),
          ),
        ),
    ]);

    const orderCount = orderItemsRes[0]?.value || 0;
    const movementCount = movementsRes[0]?.value || 0;
    const batchCount = batchesRes[0]?.value || 0;
    const transactionCount = orderCount + movementCount + batchCount;

    return {
      hasTransactions: transactionCount > 0,
      transactionCount,
      orderCount,
      movementCount,
      batchCount,
    };
  }

  async deleteProduct(id: string, tenantId: string, userId?: string) {
    return await this.db.transaction(async (tx) => {
      // 1. Lock the product row to prevent concurrent modifications
      const [existingProduct] = await tx
        .select()
        .from(schema.products)
        .where(
          and(
            eq(schema.products.id, id),
            eq(schema.products.tenantId, tenantId),
          ),
        )
        .for('update');

      if (!existingProduct) {
        throw new NotFoundException(`Product ${id} not found`);
      }

      // 2. Perform safety check within the same transaction lock
      const safetyCheck = await this.checkDeleteSafety(id, tenantId, tx);

      if (safetyCheck.hasTransactions) {
        // Product has transactions or child batches: soft delete (deactivate) to preserve historical logs
        await tx
          .update(schema.products)
          .set({
            isActive: false,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(schema.products.id, id),
              eq(schema.products.tenantId, tenantId),
            ),
          )
          .returning();

        await this.auditService.logChange(
          tenantId,
          userId || 'system',
          'PRODUCT',
          id,
          'DELETE',
          {
            softDeleted: true,
            reason: 'Associated with existing transactions or child batches',
            transactionCount: safetyCheck.transactionCount,
          },
          tx,
        );

        return {
          success: true,
          isSoftDeleted: true,
          message: `Product has ${safetyCheck.transactionCount} associated transaction(s) or child batch(es). It was safely soft-deleted/deactivated.`,
        };
      } else {
        // Product has no transactions: hard delete from database
        await tx
          .delete(schema.products)
          .where(
            and(
              eq(schema.products.id, id),
              eq(schema.products.tenantId, tenantId),
            ),
          );

        await this.auditService.logChange(
          tenantId,
          userId || 'system',
          'PRODUCT',
          id,
          'DELETE',
          {
            softDeleted: false,
            reason: 'No associated transactions or child batches',
          },
          tx,
        );

        return {
          success: true,
          isSoftDeleted: false,
          message: 'Product permanently deleted.',
        };
      }
    });
  }

  findAll() {
    return this.db.select().from(schema.products);
  }

  async getChangedProducts(tenantId: string, lastSync?: string) {
    const whereClause = lastSync
      ? and(
          eq(schema.products.tenantId, tenantId),
          gt(schema.products.updatedAt, new Date(lastSync)), // Get changes AFTER this time
        )
      : eq(schema.products.tenantId, tenantId); // Or get EVERYTHING if first sync

    return await this.db
      .select()
      .from(schema.products)
      .where(whereClause)
      .orderBy(schema.products.updatedAt);
  }

  async getExportData(tenantId: string, filters: ExportProductsDto) {
    const { minStock, minPrice, onlyAutoSkus, categoryId, isActive } = filters;
    const queryFilters = [eq(schema.products.tenantId, tenantId)];

    if (minStock !== undefined) {
      queryFilters.push(gte(schema.products.stock, minStock));
    }
    if (minPrice !== undefined) {
      queryFilters.push(gte(schema.products.price, minPrice));
    }
    if (onlyAutoSkus) {
      queryFilters.push(ilike(schema.products.sku, '99%'));
    }
    if (categoryId) {
      queryFilters.push(eq(schema.products.categoryId, categoryId));
    }
    if (isActive !== undefined) {
      queryFilters.push(eq(schema.products.isActive, isActive));
    }

    return await this.db.query.products.findMany({
      where: and(...queryFilters),
      limit: 10000,
      columns: {
        name: true,
        price: true,
        sku: true,
        stock: true,
      },
      orderBy: (products, { asc }) => [asc(products.sku)],
    });
  }
  /**
   * @deprecated Legacy support for desktop-pos v0.1. Use CategoriesService instead.
   */
  async getChangedCategories(tenantId: string, lastSync?: string) {
    const whereClause = lastSync
      ? and(
          eq(schema.categories.tenantId, tenantId),
          gt(schema.categories.updatedAt, new Date(lastSync)),
        )
      : eq(schema.categories.tenantId, tenantId);

    return await this.db.select().from(schema.categories).where(whereClause);
  }
}
