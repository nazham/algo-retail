import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { DB_CONNECTION } from '../db/database.module';
import * as schema from '../db/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { and, eq, gt, ilike, count } from 'drizzle-orm';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryQueryDto,
} from './dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @Inject(DB_CONNECTION) private db: NodePgDatabase<typeof schema>,
  ) {}

  async findAll(tenantId: string, query?: CategoryQueryDto) {
    let { page = 1, limit = 50, search } = query || {};
    page = Number(page) || 1;
    limit = Number(limit) || 50;
    const offset = (page - 1) * limit;

    const filters = [eq(schema.categories.tenantId, tenantId)];
    if (search) {
      filters.push(ilike(schema.categories.name, `%${search}%`));
    }

    const whereClause = and(...filters);

    const [items, totalCount] = await Promise.all([
      this.db.query.categories.findMany({
        where: whereClause,
        limit,
        offset,
        orderBy: (categories, { asc }) => [asc(categories.name)],
      }),
      this.db
        .select({ value: count() })
        .from(schema.categories)
        .where(whereClause),
    ]);

    return {
      items,
      total: totalCount[0].value,
      page,
      limit,
    };
  }

  async create(tenantId: string, data: CreateCategoryDto) {
    const [category] = await this.db
      .insert(schema.categories)
      .values({
        tenantId,
        name: data.name,
      })
      .returning();
    return category;
  }

  async update(id: string, tenantId: string, data: UpdateCategoryDto) {
    const [category] = await this.db
      .update(schema.categories)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.categories.id, id),
          eq(schema.categories.tenantId, tenantId),
        ),
      )
      .returning();
    return category;
  }

  async delete(id: string, tenantId: string) {
    try {
      // Attempt hard delete directly.
      // If products exist, DB will throw Foreign Key Violation (code 23503)
      const [category] = await this.db
        .delete(schema.categories)
        .where(
          and(
            eq(schema.categories.id, id),
            eq(schema.categories.tenantId, tenantId),
          ),
        )
        .returning();

      return category;
    } catch (error: any) {
      if (error?.code === '23503') {
        throw new BadRequestException(
          'Cannot delete category: Products are still associated with it.',
        );
      }
      throw error;
    }
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
