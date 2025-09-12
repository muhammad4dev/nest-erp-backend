import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account, AccountType } from './entities/account.entity';
import { CreateAccountDto, UpdateAccountDto } from './dto/account.dto';

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
  ) {}

  async create(dto: CreateAccountDto): Promise<Account> {
    const existing = await this.accountRepository.findOne({
      where: { code: dto.code },
    });

    if (existing) {
      throw new ConflictException('Account code already exists');
    }

    const account = this.accountRepository.create(dto);
    return this.accountRepository.save(account);
  }

  async findAll(type?: AccountType): Promise<Account[]> {
    const query = this.accountRepository.createQueryBuilder('a');

    if (type) {
      query.where('a.type = :type', { type });
    }

    return query.orderBy('a.code', 'ASC').getMany();
  }

  async findOne(id: string): Promise<Account> {
    const account = await this.accountRepository.findOne({ where: { id } });
    if (!account) {
      throw new NotFoundException('Account not found');
    }
    return account;
  }

  async findByCode(code: string): Promise<Account | null> {
    return this.accountRepository.findOne({ where: { code } });
  }

  async update(id: string, dto: UpdateAccountDto): Promise<Account> {
    const account = await this.findOne(id);

    if (dto.code && dto.code !== account.code) {
      const existing = await this.accountRepository.findOne({
        where: { code: dto.code },
      });
      if (existing) {
        throw new ConflictException('Account code already exists');
      }
    }

    Object.assign(account, dto);
    return this.accountRepository.save(account);
  }

  async getChartOfAccounts(): Promise<Account[]> {
    // Return hierarchical chart of accounts
    const accounts = await this.accountRepository.find({
      order: { code: 'ASC' },
    });

    return accounts;
  }

  async getAccountsByType(type: AccountType): Promise<Account[]> {
    return this.accountRepository.find({
      where: { type },
      order: { code: 'ASC' },
    });
  }
}
