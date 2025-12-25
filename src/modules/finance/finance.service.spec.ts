import { Test, TestingModule } from '@nestjs/testing';
import { FinanceService } from './finance.service';
import { JournalEntryService } from './journal-entry.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JournalLine } from './entities/journal-line.entity';
import { PaymentTerm } from './entities/payment-term.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { TenantContext } from '../../common/context/tenant.context';

describe('FinanceService', () => {
  let service: FinanceService;
  let mockQueryBuilder: any;

  // Mock repositories
  const mockJournalLineRepo = {
    createQueryBuilder: jest.fn(),
  };

  const mockPaymentTermRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockJournalEntryService = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    // Mock TenantContext for all tests
    jest.spyOn(TenantContext, 'getTenantId').mockReturnValue('test-tenant-id');
    jest
      .spyOn(TenantContext, 'requireTenantId')
      .mockReturnValue('test-tenant-id');

    // Create a fresh query builder mock for each test
    mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      getRawMany: jest.fn(),
      getMany: jest.fn(),
    };

    mockJournalLineRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinanceService,
        {
          provide: JournalEntryService,
          useValue: mockJournalEntryService,
        },
        {
          provide: getRepositoryToken(JournalLine),
          useValue: mockJournalLineRepo,
        },
        {
          provide: getRepositoryToken(PaymentTerm),
          useValue: mockPaymentTermRepo,
        },
      ],
    }).compile();

    service = module.get<FinanceService>(FinanceService);
    jest.clearAllMocks();
  });

  describe('Journal Entry Creation', () => {
    it('should create a journal entry with balanced lines', async () => {
      const lines = [
        { accountId: 'a1', debit: 100, credit: 0, description: 'Cash in' },
        { accountId: 'a2', debit: 0, credit: 100, description: 'Revenue' },
      ];

      mockJournalEntryService.create.mockResolvedValue({
        id: 'je-001',
        reference: 'JE-001',
        transactionDate: new Date(),
      });

      const result = await service.createJournalEntry(
        'JE-001',
        new Date(),
        lines,
      );

      expect(result.id).toBe('je-001');
      expect(mockJournalEntryService.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException for unbalanced journal entry', async () => {
      const unbalancedLines = [
        { accountId: 'a1', debit: 100, credit: 0, description: 'Debit' },
        { accountId: 'a2', debit: 0, credit: 50, description: 'Credit' }, // Unbalanced
      ];

      mockJournalEntryService.create.mockRejectedValue(
        new BadRequestException('Debits do not equal credits'),
      );

      await expect(
        service.createJournalEntry('JE-002', new Date(), unbalancedLines),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow zero-line journal entries (reserved for corrections)', async () => {
      mockJournalEntryService.create.mockResolvedValue({
        id: 'je-correction',
        lines: [],
      });

      const result = await service.createJournalEntry(
        'CORRECTION',
        new Date(),
        [],
      );
      expect(result).toBeDefined();
    });
  });

  describe('Payment Terms Management', () => {
    it('should create a new payment term', async () => {
      const dto = { days: 30, label: 'Net 30' };
      const createdTerm = { id: 'pt-1', ...dto, tenantId: 'tenant-a' };

      mockPaymentTermRepo.create.mockReturnValue(createdTerm);
      mockPaymentTermRepo.save.mockResolvedValue(createdTerm);

      const result = await service.createPaymentTerm(dto as any);

      expect(result.id).toBe('pt-1');
      expect(result.days).toBe(30);
      expect(mockPaymentTermRepo.save).toHaveBeenCalled();
    });

    it('should find all payment terms ordered by days', async () => {
      const terms = [
        { id: 'pt-1', days: 0, label: 'Due on receipt' },
        { id: 'pt-2', days: 30, label: 'Net 30' },
        { id: 'pt-3', days: 60, label: 'Net 60' },
      ];

      mockPaymentTermRepo.find.mockResolvedValue(terms);

      const result = await service.findAllPaymentTerms();

      expect(result).toHaveLength(3);
      expect(result[0].days).toBeLessThanOrEqual(result[1].days);
      expect(mockPaymentTermRepo.find).toHaveBeenCalledWith({
        order: { days: 'ASC' },
      });
    });

    it('should update an existing payment term', async () => {
      const existingTerm = { id: 'pt-1', days: 30, label: 'Net 30' };
      const updates = { days: 45, label: 'Net 45' };

      mockPaymentTermRepo.findOne.mockResolvedValue(existingTerm);
      mockPaymentTermRepo.save.mockResolvedValue({
        ...existingTerm,
        ...updates,
      });

      const result = await service.updatePaymentTerm('pt-1', updates as any);

      expect(result.days).toBe(45);
      expect(mockPaymentTermRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when updating non-existent term', async () => {
      mockPaymentTermRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updatePaymentTerm('invalid-id', { days: 30 } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should delete a payment term', async () => {
      mockPaymentTermRepo.delete.mockResolvedValue({ affected: 1 });

      await service.deletePaymentTerm('pt-1');

      expect(mockPaymentTermRepo.delete).toHaveBeenCalledWith('pt-1');
    });

    it('should throw NotFoundException when deleting non-existent term', async () => {
      mockPaymentTermRepo.delete.mockResolvedValue({ affected: 0 });

      await expect(service.deletePaymentTerm('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('Trial Balance Report', () => {
    it('should calculate trial balance with no date filters', async () => {
      const mockData = [
        {
          accountId: 'cash',
          accountCode: '1000',
          accountName: 'Cash',
          debit: '1000',
          credit: '0',
        },
        {
          accountId: 'revenue',
          accountCode: '4000',
          accountName: 'Revenue',
          debit: '0',
          credit: '1000',
        },
      ];

      mockQueryBuilder.getRawMany.mockResolvedValue(mockData);

      const result = await service.getTrialBalance({
        startDate: null,
        endDate: null,
      });

      expect(result).toHaveLength(2);
      expect(result[0].balance).toBe(1000);
      expect(result[1].balance).toBe(-1000);
    });

    it('should filter trial balance by start date', async () => {
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      const startDate = new Date('2025-01-01');
      await service.getTrialBalance({ startDate, endDate: null });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'entry.transactionDate >= :startDate',
        expect.any(Object),
      );
    });

    it('should filter trial balance by end date', async () => {
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      const endDate = new Date('2025-12-31');
      await service.getTrialBalance({ startDate: null, endDate });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'entry.transactionDate <= :endDate',
        expect.any(Object),
      );
    });

    it('should return empty trial balance for accounts with no entries', async () => {
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      const result = await service.getTrialBalance({});

      expect(result).toEqual([]);
    });
  });

  describe('Due Date Calculation', () => {
    it('should calculate correct due date based on payment term', async () => {
      const term = { id: 'pt-30', days: 30 };
      const invoiceDate = new Date('2025-01-01');

      mockPaymentTermRepo.findOne.mockResolvedValue(term);

      const dueDate = await service.calculateDueDate('pt-30', invoiceDate);

      expect(dueDate.getDate()).toBe(31); // 30 days from Jan 1 = Jan 31
      expect(dueDate.getMonth()).toBe(0); // Same month
    });

    it('should handle missing term gracefully (return original date)', async () => {
      mockPaymentTermRepo.findOne.mockResolvedValue(null);

      const invoiceDate = new Date('2025-01-15');
      const dueDate = await service.calculateDueDate('invalid-id', invoiceDate);

      expect(dueDate).toEqual(invoiceDate);
    });

    it('should calculate due date across month boundaries', async () => {
      const term = { id: 'pt-60', days: 60 };
      const invoiceDate = new Date('2025-01-15');

      mockPaymentTermRepo.findOne.mockResolvedValue(term);

      const dueDate = await service.calculateDueDate('pt-60', invoiceDate);

      expect(dueDate.getMonth()).toBe(2); // March
      expect(dueDate.getDate()).toBe(16);
    });

    it('should handle leap year correctly', async () => {
      const term = { id: 'pt-30', days: 30 };
      const invoiceDate = new Date('2024-01-31'); // Leap year

      mockPaymentTermRepo.findOne.mockResolvedValue(term);

      const dueDate = await service.calculateDueDate('pt-30', invoiceDate);

      // Jan 31 + 30 days = March 1, 2024 (JavaScript Date handles this correctly)
      expect(dueDate.getMonth()).toBe(2); // March (0-indexed)
      expect(dueDate.getDate()).toBe(1);
    });
  });

  describe('Error Handling and Validation', () => {
    it('should propagate repository errors', async () => {
      const dbError = new Error('Database connection lost');
      mockPaymentTermRepo.find.mockRejectedValue(dbError);

      await expect(service.findAllPaymentTerms()).rejects.toThrow(
        'Database connection lost',
      );
    });

    it('should handle null/undefined results gracefully', async () => {
      mockPaymentTermRepo.find.mockResolvedValue(null);

      const result = await service.findAllPaymentTerms();
      expect(result).toBeNull();
    });
  });
});
