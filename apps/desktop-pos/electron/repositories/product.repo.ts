import { DB, schema } from '@algo/db-local';
import { sql } from 'drizzle-orm';

export class ProductRepository {
  constructor(private db: DB) {}

  async getAll() {
    return this.db.query.products.findMany({
      where: (products, { eq }) => eq(products.isActive, true),
      with: {
        category: true,
      },
    });
  }

  async bulkUpsert(products: any[]) {
    if (products.length === 0) return;

    // OPTIMIZED STRATEGY: Try Fast Batch Transaction First
    try {
      this.db.transaction((tx) => {
        for (const p of products) {
          tx.insert(schema.products)
            .values({
              id: p.id,
              name: p.name,
              sku: p.sku,
              price: p.price,
              stock: p.stock,
              // We only sync Catalog details. Inventory is managed locally or via Order Deductions.
              categoryId: p.categoryId || p.category || null,
              isActive: p.isActive,
              updatedAt: new Date(p.updatedAt),
            })
            .onConflictDoUpdate({
              target: schema.products.id,
              set: {
                name: sql`excluded.name` as any,
                sku: sql`excluded.sku` as any,
                price: sql`excluded.price` as any,
                stock: sql`excluded.current_stock` as any,
                categoryId: sql`excluded.category_id` as any,
                isActive: sql`excluded.is_active` as any,
                updatedAt: sql`excluded.updated_at` as any,
              },
            })
            .run();
        }
      }); // Execute transaction
    } catch (batchError) {
      console.warn('⚠️ Batch Sync Failed. Falling back to One-by-One...', batchError);

      // Fallback: One-by-One (Slow but Robust)
      for (const p of products) {
        try {
          this.db
            .insert(schema.products)
            .values({
              id: p.id,
              name: p.name,
              sku: p.sku,
              price: p.price,
              stock: p.stock,
              categoryId: p.categoryId || p.category || null,
              isActive: p.isActive,
              updatedAt: new Date(p.updatedAt),
            })
            .onConflictDoUpdate({
              target: schema.products.id,
              set: {
                name: sql`excluded.name` as any,
                sku: sql`excluded.sku` as any,
                price: sql`excluded.price` as any,
                categoryId: sql`excluded.category_id` as any,
                isActive: sql`excluded.is_active` as any,
                updatedAt: sql`excluded.updated_at` as any,
              },
            })
            .run();
        } catch (singleError) {
          console.error(`❌ Failed to sync product ${p.sku} (${p.id})`, singleError);
        }
      }
    }
  }
}
