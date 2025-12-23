import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JournalEntryService } from './journal-entry.service';
import { CreateJournalLineDto } from './dto/create-journal-entry.dto';
import { JournalEntry } from './entities/journal-entry.entity';
import { JournalLine } from './entities/journal-line.entity';
import {
  TrialBalanceQueryDto,
  TrialBalanceEntry,
  GeneralLedgerQueryDto,
  GeneralLedgerEntry,
} from './dto/finance-reports.dto';
import { PaymentTerm } from './entities/payment-term.entity';
import {
  CreatePaymentTermDto,
  UpdatePaymentTermDto,
} from './dto/payment-term.dto';
import { TenantContext } from '../../common/context/tenant.context';

@Injectable()
export class FinanceService {
  constructor(
    private readonly journalEntryService: JournalEntryService,
    @InjectRepository(JournalLine)
    private journalLineRepo: Repository<JournalLine>,
    @InjectRepository(PaymentTerm)
    private paymentTermRepo: Repository<PaymentTerm>,
  ) {}

  async createJournalEntry(
    description: string,
    date: Date,
    lines: CreateJournalLineDto[],
  ) {
    // Map DTO to Entity structure expected by JournalEntryService
    const journalEntryData = {
      reference: description,
      transactionDate: date.toISOString().split('T')[0],
      lines: lines.map((line) => ({
        accountId: line.accountId,
        debit: line.debit,
        credit: line.credit,
        description: line.description,
      })),
    };
    return this.journalEntryService.create(
      journalEntryData as unknown as Partial<JournalEntry>,
    );
  }

  // ========== PAYMENT TERMS ==========

  async createPaymentTerm(dto: CreatePaymentTermDto): Promise<PaymentTerm> {
    const term = this.paymentTermRepo.create(dto);
    return this.paymentTermRepo.save(term);
  }

  async findAllPaymentTerms(): Promise<PaymentTerm[]> {
    return this.paymentTermRepo.find({ order: { days: 'ASC' } });
  }

  async updatePaymentTerm(
    id: string,
    dto: UpdatePaymentTermDto,
  ): Promise<PaymentTerm> {
    const term = await this.paymentTermRepo.findOne({ where: { id } });
    if (!term) throw new NotFoundException('Payment term not found');
    Object.assign(term, dto);
    return this.paymentTermRepo.save(term);
  }

  async deletePaymentTerm(id: string): Promise<void> {
    const result = await this.paymentTermRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Payment term not found');
    }
  }

  async calculateDueDate(termId: string, startDate: Date): Promise<Date> {
    const term = await this.paymentTermRepo.findOne({ where: { id: termId } });
    if (!term) return startDate;
    const dueDate = new Date(startDate);
    dueDate.setDate(dueDate.getDate() + term.days);
    return dueDate;
  }

  // ========== REPORTS ==========

  async getTrialBalance(
    query: TrialBalanceQueryDto,
  ): Promise<TrialBalanceEntry[]> {
    const tenantId = TenantContext.getTenantId();
    const qb = this.journalLineRepo
      .createQueryBuilder('line')
      .leftJoinAndSelect('line.account', 'account')
      .leftJoin('line.journalEntry', 'entry')
      .select('account.id', 'accountId')
      .addSelect('account.code', 'accountCode')
      .addSelect('account.name', 'accountName')
      .addSelect('SUM(line.debit)', 'debit')
      .addSelect('SUM(line.credit)', 'credit')
      .groupBy('account.id')
      .addGroupBy('account.code')
      .addGroupBy('account.name')
      .orderBy('account.code');

    qb.where('entry.status = :status', { status: 'POSTED' });

    if (tenantId) {
      qb.andWhere('line.tenantId = :tenantId', { tenantId });
    }

    if (query.startDate) {
      qb.andWhere('entry.transactionDate >= :startDate', {
        startDate: query.startDate,
      });
    }

    if (query.endDate) {
      qb.andWhere('entry.transactionDate <= :endDate', {
        endDate: query.endDate,
      });
    }

    const results: TrialBalanceEntry[] = await qb.getRawMany();

    return results.map((row) => ({
      accountId: row.accountId,
      accountCode: row.accountCode,
      accountName: row.accountName,
      debit: Number(row.debit),
      credit: Number(row.credit),
      balance: Number(row.debit) - Number(row.credit),
    }));
  }

  async getGeneralLedger(
    query: GeneralLedgerQueryDto,
  ): Promise<GeneralLedgerEntry[]> {
    const tenantId = TenantContext.getTenantId();
    const qb = this.journalLineRepo
      .createQueryBuilder('line')
      .leftJoinAndSelect('line.account', 'account')
      .leftJoinAndSelect('line.journalEntry', 'entry')
      .where('entry.status = :status', { status: 'POSTED' });

    if (tenantId) {
      qb.andWhere('line.tenantId = :tenantId', { tenantId });
    }

    if (query.accountId) {
      qb.andWhere('line.accountId = :accountId', {
        accountId: query.accountId,
      });
    }

    if (query.startDate) {
      qb.andWhere('entry.transactionDate >= :startDate', {
        startDate: query.startDate,
      });
    }

    if (query.endDate) {
      qb.andWhere('entry.transactionDate <= :endDate', {
        endDate: query.endDate,
      });
    }

    qb.orderBy('entry.transactionDate', 'ASC');
    qb.addOrderBy('entry.createdAt', 'ASC');

    const lines = await qb.getMany();

    let balance = 0;
    return lines.map((line) => {
      const debit = Number(line.debit);
      const credit = Number(line.credit);
      balance += debit - credit;

      return {
        date: new Date(line.journalEntry.transactionDate),
        journalEntryNumber: line.journalEntry.reference,
        description: line.description,
        accountName: line.account.name,
        debit,
        credit,
        balance,
      };
    });
  }
}
