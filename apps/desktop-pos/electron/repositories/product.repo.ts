import { DB, schema } from '@algo/db-local';

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
    return this.db.select().from(schema.products).all();
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
          },
          {
            id: PRODUCT_IDS.ANCHOR,
            name: 'Anchor Full Cream 400g',
            sku: 'AN-400',
            price: 125000, // Rs. 1250.00
            stock: 20,
          },
          {
            id: PRODUCT_IDS.SUNLIGHT,
            name: 'Sunlight Soap',
            sku: 'SL-01',
            price: 8500, // Rs. 85.00
            stock: 100,
          },
          {
            id: PRODUCT_IDS.RICE,
            name: 'Keeris Samba (1kg)',
            sku: 'RICE-01',
            price: 26000, // Rs. 260.00
            stock: 500,
          },
        ])
        .run();
    }
  }
}
