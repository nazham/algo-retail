import { DB, schema } from '@algo/db-local';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto'; // Native Node module

export class ProductRepository {
  constructor(private db: DB) {}

  async getAll() {
    return this.db.select().from(schema.products).all();
  }

  // A helper to seed data if empty
  async seedIfEmpty() {
    const existing = await this.getAll();
    if (existing.length > 0) return;

    console.log('Seeding dummy products...');
    const dummyProducts = [
      {
        id: randomUUID(),
        name: 'Munchee Super Cream Cracker',
        sku: 'MC-001',
        price: 15000,
        stock: 50,
      }, // 150.00
      {
        id: randomUUID(),
        name: 'Anchor Full Cream 400g',
        sku: 'AN-400',
        price: 125000,
        stock: 20,
      }, // 1250.00
      {
        id: randomUUID(),
        name: 'Sunlight Soap',
        sku: 'SL-01',
        price: 8500,
        stock: 100,
      }, // 85.00
      {
        id: randomUUID(),
        name: 'Keeris Samba (1kg)',
        sku: 'RICE-01',
        price: 26000,
        stock: 500,
      }, // 260.00
    ];

    await this.db.insert(schema.products).values(dummyProducts);
    console.log('Seeding complete!');
  }
}
