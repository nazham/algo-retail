import { Inject, Injectable } from '@nestjs/common';
import { DB_CONNECTION } from '../db/database.module';
import * as schema from '../db/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';

@Injectable()
export class ProductsService {
  constructor(
    @Inject(DB_CONNECTION) private db: NodePgDatabase<typeof schema>,
  ) {}

  // MVP SEED: Hardcoded Tenant ID
  private MVP_TENANT_ID = '00000000-0000-0000-0000-000000000001';

  async seed(productsData: any[]) {
    // We use "ON CONFLICT DO UPDATE" so we can run this multiple times safely
    return await this.db
      .insert(schema.products)
      .values(
        productsData.map((p) => ({
          id: p.id, // KEEP the Desktop ID
          tenantId: this.MVP_TENANT_ID,
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

  findAll() {
    return this.db.select().from(schema.products);
  }
}
