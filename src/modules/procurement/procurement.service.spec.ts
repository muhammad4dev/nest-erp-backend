import { Test, TestingModule } from '@nestjs/testing';
import { ProcurementService } from './procurement.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  PurchaseOrder,
  PurchaseOrderStatus,
} from './entities/purchase-order.entity';
import { VendorBill } from './entities/vendor-bill.entity';
import { DataSource } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('ProcurementService', () => {
  let service: ProcurementService;
  let dataSource: DataSource;

  const mockPoRepo = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockBillRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn((cb) =>
      cb({
        findOne: jest.fn(),
        save: jest.fn(),
      }),
    ),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcurementService,
        {
          provide: getRepositoryToken(PurchaseOrder),
          useValue: mockPoRepo,
        },
        {
          provide: getRepositoryToken(VendorBill),
          useValue: mockBillRepo,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<ProcurementService>(ProcurementService);
    dataSource = module.get<DataSource>(DataSource);
  });

  describe('confirmOrder', () => {
    it('should throw if PO not found', async () => {
      const mockManager = {
        findOne: jest.fn().mockResolvedValue(null),
        save: jest.fn(),
      };
      jest
        .spyOn(dataSource, 'transaction')
        .mockImplementation(async (cb) => cb(mockManager));

      await expect(service.confirmOrder('uuid-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw if not in RFQ state', async () => {
      const mockManager = {
        findOne: jest.fn().mockResolvedValue({
          id: 'uuid-1',
          status: PurchaseOrderStatus.LOCKED,
        }),
        save: jest.fn(),
      };
      jest
        .spyOn(dataSource, 'transaction')
        .mockImplementation(async (cb) => cb(mockManager));

      await expect(service.confirmOrder('uuid-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should confirm an RFQ', async () => {
      const rfq = { id: 'uuid-1', status: PurchaseOrderStatus.RFQ };
      const mockManager = {
        findOne: jest.fn().mockResolvedValue(rfq),
        save: jest.fn().mockImplementation((entity, data) =>
          Promise.resolve({
            ...data,
            status: PurchaseOrderStatus.PURCHASE_ORDER,
          }),
        ),
      };
      jest
        .spyOn(dataSource, 'transaction')
        .mockImplementation(async (cb) => cb(mockManager));

      const result = await service.confirmOrder('uuid-1');
      expect(result.status).toBe(PurchaseOrderStatus.PURCHASE_ORDER);
    });
  });
});
