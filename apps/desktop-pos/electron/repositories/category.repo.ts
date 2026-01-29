import { DB, schema } from '@algo/db-local';
import { sql } from 'drizzle-orm';

export class CategoryRepository {
  constructor(private db: DB) {}

  async getAll() {
    return this.db.select().from(schema.categories).all();
  }

  async bulkUpsert(categories: any[]) {
    if (categories.length === 0) return;

    return this.db.transaction((tx) => {
      for (const c of categories) {
        tx.insert(schema.categories)
          .values({
            id: c.id,
            name: c.name,
            tenantId: c.tenantId,
          })
          .onConflictDoUpdate({
            target: schema.categories.id,
            set: {
              name: sql`excluded.name` as any,
              tenantId: sql`excluded.tenant_id` as any,
            },
          })
          .run();
      }
    });
  }
}
