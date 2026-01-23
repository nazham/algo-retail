import { DB, schema } from '@algo/db-local';

// Predefined category IDs (consistent across all installations)
const CATEGORY_IDS = {
  GROCERIES: 'cat-groceries',
  BEVERAGES: 'cat-beverages',
  SNACKS: 'cat-snacks',
  PERSONAL_CARE: 'cat-personal-care',
  HOUSEHOLD: 'cat-household',
};

export class CategoryRepository {
  constructor(private db: DB) {}

  async getAll() {
    return this.db.select().from(schema.categories).all();
  }

  // Seed default categories if empty
  async seedIfEmpty() {
    const count = await this.db
      .select({ count: schema.categories.id })
      .from(schema.categories)
      .limit(1);

    if (count.length === 0) {
      console.log('Seeding Categories...');

      this.db
        .insert(schema.categories)
        .values([
          { id: CATEGORY_IDS.GROCERIES, name: 'Groceries' },
          { id: CATEGORY_IDS.BEVERAGES, name: 'Beverages' },
          { id: CATEGORY_IDS.SNACKS, name: 'Snacks' },
          { id: CATEGORY_IDS.PERSONAL_CARE, name: 'Personal Care' },
          { id: CATEGORY_IDS.HOUSEHOLD, name: 'Household' },
        ])
        .run();
    }
  }
}
