import { DataSource } from 'typeorm';
import {
  JournalEntry,
  JournalStatus,
} from '../../src/modules/finance/entities/journal-entry.entity';
import { JournalLine } from '../../src/modules/finance/entities/journal-line.entity';
import {
  Account,
  AccountType,
} from '../../src/modules/finance/entities/account.entity';

/**
 * Finance Fixture Factory
 *
 * Provides standardized methods for creating Finance module test data
 * (accounts, journal entries, ledger lines) with proper tenant context.
 */
export class FinanceFixture {
  /**
   * Create a chart of accounts entry (account)
   */
  static async createAccount(
    dataSource: DataSource,
    tenantId: string,
    overrides?: Partial<Account>,
  ): Promise<Account> {
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.query(
        `SET LOCAL app.current_tenant_id = '${tenantId}'`,
      );

      const account = queryRunner.manager.create(Account, {
        code: `${Math.random().toString().substring(2, 6)}`,
        name: `Test Account ${Date.now()}`,
        type: AccountType.ASSET,
        tenantId,
        ...overrides,
      });

      const saved = await queryRunner.manager.save(account);
      await queryRunner.commitTransaction();
      return saved;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Create multiple accounts for a chart of accounts
   */
  static async createChartOfAccounts(
    dataSource: DataSource,
    tenantId: string,
  ): Promise<{ [key: string]: Account }> {
    const accounts: { [key: string]: Account } = {};

    const accountsData: Array<Partial<Account>> = [
      { code: '1000', name: 'Cash', type: AccountType.ASSET },
      { code: '1100', name: 'Accounts Receivable', type: AccountType.ASSET },
      { code: '2000', name: 'Accounts Payable', type: AccountType.LIABILITY },
      { code: '3000', name: 'Owner Equity', type: AccountType.EQUITY },
      { code: '4000', name: 'Sales Revenue', type: AccountType.INCOME },
      { code: '5000', name: 'Cost of Goods Sold', type: AccountType.EXPENSE },
    ];

    for (const data of accountsData) {
      const account = await this.createAccount(dataSource, tenantId, data);
      accounts[account.code] = account;
    }

    return accounts;
  }

  /**
   * Create a journal entry with balanced debit/credit lines
   */
  static async createBalancedJournalEntry(
    dataSource: DataSource,
    tenantId: string,
    lines: Array<{
      accountId: string;
      debit?: number;
      credit?: number;
      description?: string;
    }>,
    overrides?: Partial<JournalEntry>,
  ): Promise<JournalEntry> {
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.query(
        `SET LOCAL app.current_tenant_id = '${tenantId}'`,
      );

      // Create journal entry header
      const entry = queryRunner.manager.create(JournalEntry, {
        reference: `JE-${Date.now()}`,
        transactionDate: new Date().toISOString().split('T')[0],
        status: JournalStatus.POSTED,
        tenantId,
        ...overrides,
      });

      const savedEntry = await queryRunner.manager.save(entry);

      // Create journal lines
      for (const line of lines) {
        const journalLine = queryRunner.manager.create(JournalLine, {
          journalEntryId: savedEntry.id,
          accountId: line.accountId,
          debit: line.debit || 0,
          credit: line.credit || 0,
          description: line.description || '',
          tenantId,
        });
        await queryRunner.manager.save(journalLine);
      }

      await queryRunner.commitTransaction();
      return savedEntry;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Create an unbalanced journal entry (for testing error handling)
   */
  static async createUnbalancedJournalEntry(
    dataSource: DataSource,
    tenantId: string,
    accountIdDebit: string,
    accountIdCredit: string,
    debitAmount: number,
    creditAmount: number,
    overrides?: Partial<JournalEntry>,
  ): Promise<JournalEntry> {
    return this.createBalancedJournalEntry(
      dataSource,
      tenantId,
      [
        {
          accountId: accountIdDebit,
          debit: debitAmount,
          description: 'Debit entry',
        },
        {
          accountId: accountIdCredit,
          credit: creditAmount,
          description: 'Credit entry',
        },
      ],
      overrides,
    );
  }

  /**
   * Create a simple two-line journal entry (standard double-entry)
   */
  static async createSimpleJournalEntry(
    dataSource: DataSource,
    tenantId: string,
    debitAccountId: string,
    creditAccountId: string,
    amount: number,
    description?: string,
  ): Promise<JournalEntry> {
    return this.createBalancedJournalEntry(dataSource, tenantId, [
      {
        accountId: debitAccountId,
        debit: amount,
        description: description || 'Debit',
      },
      {
        accountId: creditAccountId,
        credit: amount,
        description: description || 'Credit',
      },
    ]);
  }

  /**
   * Get trial balance for a tenant (query accounts with totals)
   */
  static async getTrialBalance(
    dataSource: DataSource,
    tenantId: string,
  ): Promise<
    Array<{
      accountId: string;
      accountCode: string;
      accountName: string;
      debit: number;
      credit: number;
      balance: number;
    }>
  > {
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.query(
        `SET LOCAL app.current_tenant_id = '${tenantId}'`,
      );

      const results = await queryRunner.manager.query(`
        SELECT
          a.id as "accountId",
          a.code as "accountCode",
          a.name as "accountName",
          COALESCE(SUM(jl.debit), 0) as debit,
          COALESCE(SUM(jl.credit), 0) as credit,
          (COALESCE(SUM(jl.debit), 0) - COALESCE(SUM(jl.credit), 0)) as balance
        FROM accounts a
        LEFT JOIN journal_lines jl ON a.id = jl.account_id AND a.tenant_id = jl.tenant_id
        LEFT JOIN journal_entries je ON jl.journal_entry_id = je.id
        WHERE a.tenant_id = '${tenantId}' AND (je.status = 'POSTED' OR je.status IS NULL)
        GROUP BY a.id, a.code, a.name
        ORDER BY a.code
      `);

      const normalized = results.map((r: any) => ({
        accountId: r.accountId,
        accountCode: r.accountCode,
        accountName: r.accountName,
        debit: parseFloat(String(r.debit ?? '0')),
        credit: parseFloat(String(r.credit ?? '0')),
        balance: parseFloat(String(r.balance ?? '0')),
      }));

      await queryRunner.commitTransaction();
      return normalized;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Verify journal entry is balanced (debits = credits)
   */
  static async isJournalEntryBalanced(
    dataSource: DataSource,
    tenantId: string,
    journalEntryId: string,
  ): Promise<boolean> {
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.query(
        `SET LOCAL app.current_tenant_id = '${tenantId}'`,
      );

      const result = await queryRunner.manager.query(
        `
          SELECT
            SUM(debit) as total_debit,
            SUM(credit) as total_credit
          FROM journal_lines
          WHERE journal_entry_id = $1 AND tenant_id = $2
        `,
        [journalEntryId, tenantId],
      );

      if (result.length === 0) return true;

      const totalDebit = parseFloat(String(result[0]?.total_debit ?? '0'));
      const totalCredit = parseFloat(String(result[0]?.total_credit ?? '0'));

      const balanced = Math.abs(totalDebit - totalCredit) < 0.01; // Allow for floating-point rounding
      await queryRunner.commitTransaction();
      return balanced;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Delete journal entry and its lines (cleanup)
   */
  static async deleteJournalEntry(
    dataSource: DataSource,
    tenantId: string,
    journalEntryId: string,
  ): Promise<void> {
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.query(
        `SET LOCAL app.current_tenant_id = '${tenantId}'`,
      );
      await queryRunner.manager.delete(JournalLine, {
        journalEntryId,
        tenantId,
      });
      await queryRunner.manager.delete(JournalEntry, {
        id: journalEntryId,
        tenantId,
      });
      await queryRunner.commitTransaction();
    } finally {
      await queryRunner.release();
    }
  }
}
