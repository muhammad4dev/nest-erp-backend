import { Test, TestingModule } from '@nestjs/testing';
import { SalesService } from './sales.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SalesOrder, SalesOrderStatus } from './entities/sales-order.entity';
import { SalesOrderLine } from './entities/sales-order-line.entity';
import { Invoice } from './entities/invoice.entity';
import { DataSource } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('SalesService', () => {
  let service: SalesService;
  let dataSource: DataSource;

  const mockOrderRepo = {
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    }),
    findOne: jest.fn(),
  };

  const mockLineRepo = {
    create: jest.fn(),
  };

  const mockInvoiceRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn((cb) =>
      cb({
        findOne: jest.fn(),
        save: jest.fn(),
        getRepository: (entity) => {
          if (entity === SalesOrder) return mockOrderRepo;
          if (entity === SalesOrderLine) return mockLineRepo;
          return null;
        },
      }),
    ),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesService,
        {
          provide: getRepositoryToken(SalesOrder),
          useValue: mockOrderRepo,
        },
        {
          provide: getRepositoryToken(SalesOrderLine),
          useValue: mockLineRepo,
        },
        {
          provide: getRepositoryToken(Invoice),
          useValue: mockInvoiceRepo,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<SalesService>(SalesService);
    dataSource = module.get<DataSource>(DataSource);
  });

  describe('confirmOrder', () => {
    it('should throw if order not found', async () => {
      const mockManager = {
        findOne: jest.fn().mockResolvedValue(null),
        save: jest.fn(),
      };
      jest
        .spyOn(dataSource, 'transaction')
        .mockImplementation(async (arg1: any, arg2?: any) => {
          const cb = typeof arg1 === 'function' ? arg1 : arg2;
          return cb(mockManager);
        });

      await expect(service.confirmOrder('uuid-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw if order is not in draft', async () => {
      const mockManager = {
        findOne: jest.fn().mockResolvedValue({
          id: 'uuid-1',
          status: SalesOrderStatus.CONFIRMED,
        }),
        save: jest.fn(),
      };
      jest
        .spyOn(dataSource, 'transaction')
        .mockImplementation(async (arg1: any, arg2?: any) => {
          const cb = typeof arg1 === 'function' ? arg1 : arg2;
          return cb(mockManager);
        });

      await expect(service.confirmOrder('uuid-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should confirm a draft order', async () => {
      const draftOrder = {
        id: 'uuid-1',
        status: SalesOrderStatus.DRAFT,
        lines: [],
      };
      const mockManager = {
        findOne: jest.fn().mockResolvedValue(draftOrder),
        save: jest
          .fn()
          .mockImplementation((entity, data) =>
            Promise.resolve({ ...data, status: SalesOrderStatus.CONFIRMED }),
          ),
      };
      jest
        .spyOn(dataSource, 'transaction')
        .mockImplementation(async (arg1: any, arg2?: any) => {
          const cb = typeof arg1 === 'function' ? arg1 : arg2;
          return cb(mockManager);
        });

      const result = await service.confirmOrder('uuid-1');
      expect(result.status).toBe(SalesOrderStatus.CONFIRMED);
    });
  });
});
