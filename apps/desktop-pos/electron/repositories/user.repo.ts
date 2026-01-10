import { DB, schema } from '@algo/db-local';
import { randomUUID } from 'crypto';

export class UserRepository {
  constructor(private db: DB) {}

  async seedIfEmpty() {
    const count = await this.db.select({ count: schema.users.id }).from(schema.users).limit(1);

    if (count.length === 0) {
      console.log('🔒 Seeding Default Admin User...');
      this.db
        .insert(schema.users)
        .values({
          id: randomUUID(),
          name: 'Admin User',
          pin: '1234', // Default PIN
          role: 'ADMIN',
        })
        .run();
    }
  }

  async verifyPin(pin: string) {
    // In production, we would hash this. For MVP local POS, direct comparison is acceptable.
    const user = this.db.query.users.findFirst({
      where: (users, { eq }) => eq(users.pin, pin),
    });
    return user || null;
  }
}
