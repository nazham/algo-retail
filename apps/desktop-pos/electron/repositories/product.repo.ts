import { DB, schema } from '@algo/db-local';
import { sql } from 'drizzle-orm';

// HARDCODED UUIDs (The "Golden Keys")
// These must match exactly what we send to the Cloud.
const PRODUCT_IDS = {
  MUNCHEE: '11111111-1111-1111-1111-111111111111',
  ANCHOR: '22222222-2222-2222-2222-222222222222',
  SUNLIGHT: '33333333-3333-3333-3333-333333333333',
  RICE: '44444444-4444-4444-4444-444444444444',
};

export class ProductRepository {
  constructor(private db: DB) {}

  async getAll() {
    // Use Drizzle's relational query to include category data
    return this.db.query.products.findMany({
      with: {
        category: true,
      },
    });
  }

  // A helper to seed data if empty
  async seedIfEmpty() {
    const count = await this.db
      .select({ count: schema.products.id })
      .from(schema.products)
      .limit(1);

    if (count.length === 0) {
      console.log('Seeding Database with Fixed IDs...');

      this.db
        .insert(schema.products)
        .values([
          {
            id: PRODUCT_IDS.MUNCHEE,
            name: 'Munchee Super Cream Cracker',
            sku: 'MC-001',
            price: 15000, // Rs. 150.00
            stock: 50,
            categoryId: 'cat-snacks',
          },
          {
            id: PRODUCT_IDS.ANCHOR,
            name: 'Anchor Full Cream 400g',
            sku: 'AN-400',
            price: 125000, // Rs. 1250.00
            stock: 20,
            categoryId: 'cat-groceries',
          },
          {
            id: PRODUCT_IDS.SUNLIGHT,
            name: 'Sunlight Soap',
            sku: 'SL-01',
            price: 8500, // Rs. 85.00
            stock: 100,
            categoryId: 'cat-household',
          },
          {
            id: PRODUCT_IDS.RICE,
            name: 'Keeris Samba (1kg)',
            sku: 'RICE-01',
            price: 26000, // Rs. 260.00
            stock: 500,
            categoryId: 'cat-groceries',
          },
        ])
        .run();
    }
  }

  async bulkUpsert(products: any[]) {
    if (products.length === 0) return;

    return this.db.transaction((tx) => {
      for (const p of products) {
        tx.insert(schema.products)
          .values({
            id: p.id,
            name: p.name,
            sku: p.sku,
            price: p.price,
            stock: p.stock, // Be careful: Cloud stock might overwrite local stock!
            // ⚠️ DECISION: usually you only sync Price/Name down, not Stock
            // if the Desktop is the stock master.
            // For now, we sync everything.
            categoryId: p.categoryId || p.category || null,
            updatedAt: new Date(p.updatedAt),
          })
          .onConflictDoUpdate({
            target: schema.products.id,
            set: {
              name: sql`excluded.name` as any,
              sku: sql`excluded.sku` as any,
              price: sql`excluded.price` as any,
              stock: sql`excluded.stock` as any,
              categoryId: sql`excluded.category_id` as any,
              updatedAt: sql`excluded.updated_at` as any,
            },
          })
          .run();
      }
    });
  }
}
