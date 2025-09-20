import { Test, TestingModule } from '@nestjs/testing';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { JournalEntryService } from './journal-entry.service';
import { FiscalPeriodService } from './fiscal-period.service';
import { PermissionsGuard } from '../identity/guards/permissions.guard';
import { AccountService } from './account.service';

describe('FinanceController', () => {
  let controller: FinanceController;

  const mockFinanceService = {};
  const mockJournalEntryService = {};
  const mockFiscalPeriodService = {};
  const mockAccountService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FinanceController],
      providers: [
        { provide: FinanceService, useValue: mockFinanceService },
        { provide: JournalEntryService, useValue: mockJournalEntryService },
        { provide: FiscalPeriodService, useValue: mockFiscalPeriodService },
        { provide: AccountService, useValue: mockAccountService },
      ],
    })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<FinanceController>(FinanceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
