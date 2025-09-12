import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { FiscalPeriod } from './entities/fiscal-period.entity';
import { JournalEntry, JournalStatus } from './entities/journal-entry.entity';
import {
  CreateFiscalPeriodDto,
  UpdateFiscalPeriodDto,
} from './dto/fiscal-period.dto';

@Injectable()
export class FiscalPeriodService {
  constructor(
    @InjectRepository(FiscalPeriod)
    private periodRepository: Repository<FiscalPeriod>,
    @InjectRepository(JournalEntry)
    private journalRepository: Repository<JournalEntry>,
  ) {}

  async create(dto: CreateFiscalPeriodDto): Promise<FiscalPeriod> {
    // Check for overlapping periods
    const overlapping = await this.periodRepository
      .createQueryBuilder('p')
      .where('p.startDate <= :endDate AND p.endDate >= :startDate', {
        startDate: dto.startDate,
        endDate: dto.endDate,
      })
      .getOne();

    if (overlapping) {
      throw new BadRequestException(
        `Period overlaps with existing period: ${overlapping.name}`,
      );
    }

    const period = this.periodRepository.create(dto);
    return this.periodRepository.save(period);
  }

  async findAll(): Promise<FiscalPeriod[]> {
    return this.periodRepository.find({
      order: { startDate: 'DESC' },
    });
  }

  async findOne(id: string): Promise<FiscalPeriod> {
    const period = await this.periodRepository.findOne({ where: { id } });
    if (!period) {
      throw new NotFoundException('Fiscal period not found');
    }
    return period;
  }

  async findByDate(date: string): Promise<FiscalPeriod | null> {
    return this.periodRepository.findOne({
      where: {
        startDate: LessThanOrEqual(date),
        endDate: MoreThanOrEqual(date),
      },
    });
  }

  async update(id: string, dto: UpdateFiscalPeriodDto): Promise<FiscalPeriod> {
    const period = await this.findOne(id);

    if (period.isClosed) {
      throw new BadRequestException('Cannot modify a closed period');
    }

    Object.assign(period, dto);
    return this.periodRepository.save(period);
  }

  async closePeriod(id: string, force = false): Promise<FiscalPeriod> {
    const period = await this.findOne(id);

    if (period.isClosed) {
      throw new BadRequestException('Period is already closed');
    }

    // Check for unposted journal entries in this period
    if (!force) {
      const unpostedCount = await this.journalRepository
        .createQueryBuilder('je')
        .where('je.status = :status', { status: JournalStatus.DRAFT })
        .andWhere('je.transactionDate >= :start', { start: period.startDate })
        .andWhere('je.transactionDate <= :end', { end: period.endDate })
        .getCount();

      if (unpostedCount > 0) {
        throw new BadRequestException(
          `Cannot close period: ${unpostedCount} unposted entries exist. Use force=true to override.`,
        );
      }
    }

    period.isClosed = true;
    return this.periodRepository.save(period);
  }

  async reopenPeriod(id: string): Promise<FiscalPeriod> {
    const period = await this.findOne(id);

    if (!period.isClosed) {
      throw new BadRequestException('Period is not closed');
    }

    period.isClosed = false;
    return this.periodRepository.save(period);
  }

  async getCurrentPeriod(): Promise<FiscalPeriod | null> {
    const today = new Date().toISOString().split('T')[0];
    return this.findByDate(today);
  }
}
