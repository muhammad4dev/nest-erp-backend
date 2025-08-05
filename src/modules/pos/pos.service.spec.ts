import { Test, TestingModule } from '@nestjs/testing';
import { PosService } from './pos.service';
import { DataSource } from 'typeorm';
import { SyncOrderDto } from './dto/sync-order.dto';

describe('PosService', () => {
  let service: PosService;

  const mockManager = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: mockManager,
  };

  const mockDataSource = {
    createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PosService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<PosService>(PosService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('syncOrders', () => {
    it('should sync a new order successfully', async () => {
      mockManager.findOne.mockResolvedValue(null); // No existing order

      const orderDto: SyncOrderDto = {
        id: 'uuid-1',
        partnerId: 'p-1',
        orderDate: '2023-01-01',
        lines: [
          { productId: 'prod-1', quantity: 2, unitPrice: 10, discountRate: 0 },
        ],
      };

      const result = await service.syncOrders([orderDto]);

      expect(result.synced).toBe(1);
      expect(result.failed).toBe(0);
      expect(mockManager.save).toHaveBeenCalledTimes(2); // Header + (Header with Lines)
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('should skip existing orders (idempotency)', async () => {
      mockManager.findOne.mockResolvedValue({ id: 'uuid-1' }); // Exists

      const orderDto: SyncOrderDto = {
        id: 'uuid-1',
        partnerId: 'p-1',
        orderDate: '2023-01-01',
        lines: [],
      };

      const result = await service.syncOrders([orderDto]);

      expect(result.synced).toBe(1); // Considered synced if it exists
      expect(mockManager.save).not.toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled(); // We rolled back in loop for idempotency path or just 'continue' but code rolls back
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });
});
