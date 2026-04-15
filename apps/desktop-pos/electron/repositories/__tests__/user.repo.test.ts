import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserRepository } from '../user.repo';

describe('UserRepository', () => {
  let db: any;
  let repo: UserRepository;

  beforeEach(() => {
    db = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      run: vi.fn(),
      query: {
        users: {
          findMany: vi.fn(),
        },
      },
    };
    repo = new UserRepository(db);
  });

  it('should seed with a hashed pin if empty', async () => {
    db.limit.mockResolvedValue([]);
    await repo.seedIfEmpty();

    expect(db.insert).toHaveBeenCalled();
    const insertedValues = db.values.mock.calls[0][0];
    expect(insertedValues.pin).toContain(':');
    expect(insertedValues.pin).not.toBe('1234');
  });

  it('should not seed if not empty', async () => {
    db.limit.mockResolvedValue([{ count: 1 }]);
    await repo.seedIfEmpty();

    expect(db.insert).not.toHaveBeenCalled();
  });

  it('should verify a correct pin', async () => {
    const salt = 'abcd';
    // Hashed '1234' with salt 'abcd' using scrypt 64 bytes
    // I will use the repo itself to generate a valid hash for the test
    const hashedPin = await (repo as any).hashPin('1234');

    db.query.users.findMany.mockResolvedValue([
      { id: '1', name: 'User 1', pin: hashedPin, role: 'ADMIN' }
    ]);

    const user = await repo.verifyPin('1234');
    expect(user).not.toBeNull();
    expect(user?.name).toBe('User 1');
  });

  it('should not verify an incorrect pin', async () => {
    const hashedPin = await (repo as any).hashPin('1234');

    db.query.users.findMany.mockResolvedValue([
      { id: '1', name: 'User 1', pin: hashedPin, role: 'ADMIN' }
    ]);

    const user = await repo.verifyPin('4321');
    expect(user).toBeNull();
  });

  it('should return null if no users exist', async () => {
    db.query.users.findMany.mockResolvedValue([]);

    const user = await repo.verifyPin('1234');
    expect(user).toBeNull();
  });
});
