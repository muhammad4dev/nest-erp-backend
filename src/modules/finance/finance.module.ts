import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { JournalEntryService } from './journal-entry.service';
import { FiscalPeriodService } from './fiscal-period.service';
import { AccountService } from './account.service';
import { JournalEntry } from './entities/journal-entry.entity';
import { JournalLine } from './entities/journal-line.entity';
import { FiscalPeriod } from './entities/fiscal-period.entity';
import { Account } from './entities/account.entity';
import { PaymentTerm } from './entities/payment-term.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      JournalEntry,
      JournalLine,
      FiscalPeriod,
      Account,
      PaymentTerm,
    ]),
  ],
  providers: [
    FinanceService,
    JournalEntryService,
    FiscalPeriodService,
    AccountService,
  ],
  controllers: [FinanceController],
  exports: [
    FinanceService,
    JournalEntryService,
    FiscalPeriodService,
    AccountService,
  ],
})
export class FinanceModule {}
