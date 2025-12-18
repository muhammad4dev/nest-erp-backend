import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { FinanceFixture } from './fixtures/finance.fixture';

/**
 * Finance Reports & Isolation E2E
 *
 * Validates:
 * - Double-entry bookkeeping: debits = credits
 * - Trial balance correctness per tenant
 * - RLS isolation across tenants for finance data
 */
describe('Finance Reports & Isolation (E2E)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  // Stable tenant IDs (no actual Tenant rows required)
  const TENANT_A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const TENANT_B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
    if (app) {
      await app.close();
    }
  });

  it('calculates tenant-specific trial balance for posted entries', async () => {
    // Create accounts for Tenant A
    const accounts = await FinanceFixture.createChartOfAccounts(
      dataSource,
      TENANT_A,
    );

    // Create a simple journal entry: Debit Cash (1000), Credit Revenue (4000)
    const je = await FinanceFixture.createSimpleJournalEntry(
      dataSource,
      TENANT_A,
      accounts['1000'].id,
      accounts['4000'].id,
      1000,
      'Sale of goods',
    );

    // Trial balance for Tenant A
    const tbA = await FinanceFixture.getTrialBalance(dataSource, TENANT_A);
    const cash = tbA.find((r) => r.accountCode === '1000');
    const revenue = tbA.find((r) => r.accountCode === '4000');

    expect(cash).toBeDefined();
    expect(cash?.debit).toBe(1000);
    expect(cash?.credit).toBe(0);
    expect(cash?.balance).toBe(1000);

    expect(revenue).toBeDefined();
    expect(revenue?.debit).toBe(0);
    expect(revenue?.credit).toBe(1000);
    expect(revenue?.balance).toBe(-1000);

    // Verify double-entry is balanced
    const balanced = await FinanceFixture.isJournalEntryBalanced(
      dataSource,
      TENANT_A,
      je.id,
    );
    expect(balanced).toBe(true);
  });

  it('enforces RLS: Tenant B cannot see Tenant A finance data', async () => {
    const accountsA = await FinanceFixture.createChartOfAccounts(
      dataSource,
      TENANT_A,
    );

    await FinanceFixture.createSimpleJournalEntry(
      dataSource,
      TENANT_A,
      accountsA['1000'].id,
      accountsA['4000'].id,
      250,
      'Another sale',
    );

    const tbB = await FinanceFixture.getTrialBalance(dataSource, TENANT_B);

    // Tenant B trial balance must not include Tenant A accounts
    const hasCashA = tbB.some((r) => r.accountCode === '1000');
    const hasRevenueA = tbB.some((r) => r.accountCode === '4000');
    expect(hasCashA).toBe(false);
    expect(hasRevenueA).toBe(false);
  });

  it('detects unbalanced journal entry (no DB constraints via fixtures)', async () => {
    const accounts = await FinanceFixture.createChartOfAccounts(
      dataSource,
      TENANT_A,
    );

    // Create unbalanced entry directly via fixtures (bypasses service/db checks)
    const unbalanced = await FinanceFixture.createUnbalancedJournalEntry(
      dataSource,
      TENANT_A,
      accounts['1000'].id,
      accounts['4000'].id,
      500, // debit
      400, // credit (unbalanced)
      { reference: 'UNBAL-TEST' },
    );

    const isBalanced = await FinanceFixture.isJournalEntryBalanced(
      dataSource,
      TENANT_A,
      unbalanced.id,
    );
    expect(isBalanced).toBe(false);
  });
});
