import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { DB_CONNECTION } from '../db/database.module';
import { InventoryService } from '../inventory/inventory.service';
import { CreateOrderDto } from '@algo/types';
import { BadRequestException } from '@nestjs/common';

describe('OrdersService', () => {
  let service: OrdersService;
  let mockDb: any;
  let mockInventoryService: any;

  beforeEach(async () => {
    mockDb = {
      query: {
        orders: {
          findFirst: jest.fn(),
        },
      },
      transaction: jest.fn(async (cb) => {
        const tx = {
          insert: jest.fn().mockReturnThis(),
          values: jest.fn().mockResolvedValue({}),
        };
        return cb(tx);
      }),
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockResolvedValue({}),
    };

    mockInventoryService = {
      recordSale: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: DB_CONNECTION,
          useValue: mockDb,
        },
        {
          provide: InventoryService,
          useValue: mockInventoryService,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const validDto: CreateOrderDto = {
      id: 'order-123',
      orderNumber: 'INV-2026-001',
      createdAt: new Date().toISOString(),
      subtotal: 10000, // 100 Rs (10000 cents)
      taxTotal: 0,
      discountTotal: 2000, // 20 Rs (2000 cents)
      grandTotal: 8000, // 80 Rs (8000 cents)
      paymentMethod: 'CASH',
      items: [
        {
          productId: 'prod-1',
          productName: 'Keerthi Samba',
          quantity: 2,
          price: 5000, // 50 Rs unit price (5000 cents)
          costPrice: 3000,
          discountAmount: 1000, // 10 Rs per-unit discount (1000 cents)
          discountType: 'MANUAL',
        },
      ],
    };

    it('should successfully create order and call inventory service', async () => {
      mockDb.query.orders.findFirst.mockResolvedValue(null);

      const result = await service.create('tenant-1', validDto);

      expect(result).toEqual({
        orderId: 'order-123',
        orderNumber: 'INV-2026-001',
      });
      expect(mockDb.query.orders.findFirst).toHaveBeenCalled();
      expect(mockDb.transaction).toHaveBeenCalled();
      expect(mockInventoryService.recordSale).toHaveBeenCalledWith(
        'tenant-1',
        'prod-1',
        2,
        'order-123',
        3000,
        expect.any(Object),
      );
    });

    it('should skip creating if order already exists (idempotency)', async () => {
      mockDb.query.orders.findFirst.mockResolvedValue({ id: 'order-123' });

      const result = await service.create('tenant-1', validDto);

      expect(result).toEqual({
        orderId: 'order-123',
        orderNumber: 'INV-2026-001',
      });
      expect(mockDb.transaction).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if tenantId is missing', async () => {
      await expect(service.create('', validDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException on subtotal mismatch (worst-case)', async () => {
      mockDb.query.orders.findFirst.mockResolvedValue(null);
      const invalidDto = { ...validDto, subtotal: 9000 }; // mismatch (real calculated is 10000)

      await expect(service.create('tenant-1', invalidDto)).rejects.toThrow(
        /Subtotal mismatch/,
      );
    });

    it('should throw BadRequestException on discount mismatch (worst-case)', async () => {
      mockDb.query.orders.findFirst.mockResolvedValue(null);
      const invalidDto = { ...validDto, discountTotal: 3000 }; // mismatch (real discount is 1000 * 2 = 2000)

      await expect(service.create('tenant-1', invalidDto)).rejects.toThrow(
        /Discount mismatch/,
      );
    });

    it('should throw BadRequestException on grandTotal mismatch (worst-case)', async () => {
      mockDb.query.orders.findFirst.mockResolvedValue(null);
      const invalidDto = { ...validDto, grandTotal: 9000 }; // mismatch (calculated grand is 10000 + 0 - 2000 = 8000)

      await expect(service.create('tenant-1', invalidDto)).rejects.toThrow(
        /GrandTotal mismatch/,
      );
    });
  });
});
