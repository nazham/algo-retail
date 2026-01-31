import { Inject, Injectable } from '@nestjs/common';
import { DB_CONNECTION } from '../db/database.module';
import * as schema from '../db/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { and, eq, gt, sql, ilike, or, count } from 'drizzle-orm';
import { ProductQueryDto, UpdateProductDto } from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @Inject(DB_CONNECTION) private db: NodePgDatabase<typeof schema>,
  ) {}

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
    let { page = 1, limit = 50, search, categoryId } = query;
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

    const whereClause = and(...filters);

    const [items, totalCount] = await Promise.all([
      this.db.query.products.findMany({
        where: whereClause,
        limit,
        offset,
        with: {
          category: true,
        },
        orderBy: (products, { desc }) => [desc(products.updatedAt)],
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

  async updateProduct(id: string, tenantId: string, data: UpdateProductDto) {
    return await this.db
      .update(schema.products)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(
        and(eq(schema.products.id, id), eq(schema.products.tenantId, tenantId)),
      )
      .returning();
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
