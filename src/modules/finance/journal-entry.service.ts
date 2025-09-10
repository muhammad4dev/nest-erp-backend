import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { JournalEntry, JournalStatus } from './entities/journal-entry.entity';
import { JournalLine } from './entities/journal-line.entity';
import { FiscalPeriod } from './entities/fiscal-period.entity';

@Injectable()
export class JournalEntryService {
  constructor(
    @InjectRepository(JournalEntry)
    private journalRepository: Repository<JournalEntry>,
    @InjectRepository(FiscalPeriod)
    private periodRepository: Repository<FiscalPeriod>,
    private dataSource: DataSource,
  ) {}

  async create(data: Partial<JournalEntry>): Promise<JournalEntry> {
    const entry = this.journalRepository.create({
      ...data,
      status: JournalStatus.DRAFT,
    });
    return this.journalRepository.save(entry);
  }

  async post(id: string): Promise<JournalEntry> {
    return this.dataSource.transaction(async (manager) => {
      const entryRepo = manager.getRepository(JournalEntry);

      const entry = await entryRepo.findOne({
        where: { id },
        relations: ['lines'],
      });

      if (!entry) {
        throw new NotFoundException('Journal Entry not found');
      }

      if (entry.status === JournalStatus.POSTED) {
        throw new BadRequestException('Entry is already posted');
      }

      // 1. Validation: Debits must equal Credits
      const lines = entry.lines as unknown as JournalLine[];
      const totalDebit = lines.reduce(
        (sum, line) => sum + Number(line.debit),
        0,
      );
      const totalCredit = lines.reduce(
        (sum, line) => sum + Number(line.credit),
        0,
      );

      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        // Floating point tolerance
        throw new BadRequestException(
          `Entry is unbalanced: Debit ${totalDebit} != Credit ${totalCredit}`,
        );
      }

      // 2. Validation: Check Fiscal Period
      const period = await manager
        .getRepository(FiscalPeriod)
        .createQueryBuilder('period')
        .where('period.startDate <= :date', { date: entry.transactionDate })
        .andWhere('period.endDate >= :date', { date: entry.transactionDate })
        .andWhere('period.tenantId = :tenantId', { tenantId: entry.tenantId })
        .getOne();

      if (!period) {
        throw new BadRequestException('No Fiscal Period found for this date');
      }

      if (period.isClosed) {
        throw new BadRequestException('Fiscal Period is closed');
      }

      // 3. Post
      entry.status = JournalStatus.POSTED;
      return entryRepo.save(entry);
    });
  }
}
