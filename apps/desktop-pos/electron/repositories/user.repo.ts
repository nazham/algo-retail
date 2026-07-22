import { DB, schema } from '@algo/db-local';
import { randomUUID, scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

export class UserRepository {
  constructor(private db: DB) {}

  private async hashPin(pin: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const hashed = (await scryptAsync(pin, salt, 64)) as Buffer;
    return `${salt}:${hashed.toString('hex')}`;
  }

  private async verify(pin: string, storedPin: string): Promise<boolean> {
    const [salt, storedHash] = storedPin.split(':');
    if (!salt || !storedHash) return false;
    const hashed = (await scryptAsync(pin, salt, 64)) as Buffer;
    const storedHashBuffer = Buffer.from(storedHash, 'hex');

    if (hashed.length !== storedHashBuffer.length) {
      return false;
    }

    return timingSafeEqual(hashed, storedHashBuffer);
  }

  async seedIfEmpty() {
    const count = await this.db.select({ count: schema.users.id }).from(schema.users).limit(1);

    if (count.length === 0) {
      console.log('🔒 Seeding Default Admin User...');
      const hashedPin = await this.hashPin('1234');
      this.db
        .insert(schema.users)
        .values({
          id: randomUUID(),
          name: 'Admin User',
          pin: hashedPin, // Default PIN hashed
          role: 'ADMIN',
        })
        .run();
    }
  }

  async verifyPin(pin: string) {
    // We must fetch all users because we don't have the salt to query by hashed PIN
    const allUsers = await this.db.query.users.findMany();

    for (const user of allUsers) {
      if (await this.verify(pin, user.pin)) {
        return user;
      }
    }

    return null;
  }
}
