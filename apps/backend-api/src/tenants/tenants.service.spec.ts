import { Test, TestingModule } from '@nestjs/testing';
import { TenantsService } from './tenants.service';
import { DB_CONNECTION } from '../db/database.module';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('TenantsService', () => {
  let service: TenantsService;
  let mockDb: any;

  beforeEach(async () => {
    mockDb = {
      select: jest.fn(),
      transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantsService,
        {
          provide: DB_CONNECTION,
          useValue: mockDb,
        },
      ],
    }).compile();

    service = module.get<TenantsService>(TenantsService);
  });

  describe('wipeTenant', () => {
    it('should throw BadRequestException if tenantId is missing', async () => {
      await expect(service.wipeTenant('')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if tenant does not exist', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(service.wipeTenant('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should wipe tenant data in a transaction when tenant exists', async () => {
      const tenantId = '00000000-0000-0000-0000-000000000001';

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ id: tenantId }]),
          }),
        }),
      });

      const mockTx = {
        delete: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined),
        }),
        select: jest.fn().mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([{ id: 1, currentValue: 10 }]),
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          set: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue(undefined),
          }),
        }),
        insert: jest.fn().mockReturnValue({
          values: jest.fn().mockResolvedValue(undefined),
        }),
      };

      mockDb.transaction.mockImplementation(async (cb: any) => cb(mockTx));

      const result = await service.wipeTenant(tenantId);

      expect(result.success).toBe(true);
      expect(result.message).toContain('wiped successfully');
      expect(mockTx.delete).toHaveBeenCalledTimes(6); // auditLogs, inventoryMovements, orderItems, orders, products, categories
      expect(mockTx.update).toHaveBeenCalledTimes(1); // skuSequence reset
    });
  });
});
