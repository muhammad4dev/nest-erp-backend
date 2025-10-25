import { Test, TestingModule } from '@nestjs/testing';
import { JournalEntryService } from './journal-entry.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JournalEntry, JournalStatus } from './entities/journal-entry.entity';
import { FiscalPeriod } from './entities/fiscal-period.entity';
import { DataSource } from 'typeorm';
import { BadRequestException } from '@nestjs/common';

describe('JournalEntryService', () => {
  let service: JournalEntryService;

  const mockJournalRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockPeriodRepo = {
    createQueryBuilder: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn((cb) =>
      cb({
        getRepository: (entity) => {
          if (entity === JournalEntry) return mockJournalRepo;
          if (entity === FiscalPeriod) return mockPeriodRepo;
          return null; // Handle other entities if needed
        },
      }),
    ),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JournalEntryService,
        {
          provide: getRepositoryToken(JournalEntry),
          useValue: mockJournalRepo,
        },
        {
          provide: getRepositoryToken(FiscalPeriod),
          useValue: mockPeriodRepo,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<JournalEntryService>(JournalEntryService);
  });

  it('should prevent posting unbalanced entries', async () => {
    const unbalancedEntry = {
      id: 'uuid-1',
      status: JournalStatus.DRAFT,
      lines: [
        { debit: 100, credit: 0 },
        { debit: 0, credit: 90 }, // Unbalanced: 100 != 90
      ],
      transactionDate: '2025-01-01',
      tenantId: 'tenant-1',
    } as any;

    mockJournalRepo.findOne.mockResolvedValue(unbalancedEntry);

    await expect(service.post('uuid-1')).rejects.toThrow(BadRequestException);
  });

  it('should post balanced entries in an open period', async () => {
    const balancedEntry = {
      id: 'uuid-1',
      status: JournalStatus.DRAFT,
      lines: [
        { debit: 100, credit: 0 },
        { debit: 0, credit: 100 },
      ],
      transactionDate: '2025-01-01',
      tenantId: 'tenant-1',
    } as any;

    mockJournalRepo.findOne.mockResolvedValue(balancedEntry);

    // Mock open period finding
    const mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue({ isClosed: false }),
    };
    mockPeriodRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

    mockJournalRepo.save.mockResolvedValue({
      ...balancedEntry,
      status: JournalStatus.POSTED,
    });

    const result = await service.post('uuid-1');
    expect(result.status).toBe(JournalStatus.POSTED);
  });
});
