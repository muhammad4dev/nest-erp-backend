# Test Fixtures & Helpers

This directory contains reusable test fixture factories for creating consistent, repeatable test data across the codebase.

## Overview

Test fixtures provide standardized methods for seeding database entities with proper tenant context and relationships. This ensures:

- **Isolation**: All fixtures respect RLS policies and tenant boundaries
- **Consistency**: Standardized test data across different test suites
- **Reusability**: Avoid duplicating entity creation logic
- **Maintainability**: Centralized, easy-to-update factory methods

## Available Fixtures

### UserFixture

Used for creating test users with role assignments and tenant context.

**Location**: `test/fixtures/user.fixture.ts`

#### Common Methods

```typescript
// Create a basic user
const user = await UserFixture.createUser(dataSource, tenantId);

// Create multiple users
const users = await UserFixture.createUsers(dataSource, tenantId, 5);

// Create user with specific roles
const admin = await UserFixture.createAdminUser(dataSource, tenantId);
const financeOfficer = await UserFixture.createFinanceOfficer(
  dataSource,
  tenantId,
);
const viewer = await UserFixture.createViewerUser(dataSource, tenantId);

// Create user with custom roles
const customUser = await UserFixture.createUserWithRoles(
  dataSource,
  tenantId,
  ['custom_role_1', 'custom_role_2'],
  { email: 'custom@example.com' },
);

// Find user by email
const found = await UserFixture.findUserByEmail(
  dataSource,
  tenantId,
  'user@example.com',
);

// Delete user
await UserFixture.deleteUser(dataSource, tenantId, userId);
```

#### Example Usage in Tests

```typescript
describe('UserService', () => {
  let dataSource: DataSource;
  const tenantId = 'test-tenant-a';

  beforeEach(async () => {
    // ... module setup ...
    dataSource = module.get<DataSource>(DataSource);
  });

  it('should find user by email', async () => {
    // Arrange: Create test user
    const user = await UserFixture.createUser(dataSource, tenantId);

    // Act
    const found = await userService.findByEmail(user.email);

    // Assert
    expect(found?.id).toBe(user.id);
  });

  it('should enforce role-based access', async () => {
    // Arrange: Create users with different roles
    const admin = await UserFixture.createAdminUser(dataSource, tenantId);
    const viewer = await UserFixture.createViewerUser(dataSource, tenantId);

    // Act & Assert
    expect(admin.roles[0].name).toBe('admin');
    expect(viewer.roles[0].name).toBe('viewer');
  });
});
```

### FinanceFixture

Used for creating Finance module test data (accounts, journal entries, ledger lines).

**Location**: `test/fixtures/finance.fixture.ts`

#### Common Methods

```typescript
// Create a single account
const account = await FinanceFixture.createAccount(dataSource, tenantId, {
  code: '1000',
  name: 'Cash',
  type: 'asset',
});

// Create standard chart of accounts
const accounts = await FinanceFixture.createChartOfAccounts(
  dataSource,
  tenantId,
);
// Returns: { '1000': cash, '2000': payable, '4000': revenue, ... }

// Create balanced journal entry
const entry = await FinanceFixture.createBalancedJournalEntry(
  dataSource,
  tenantId,
  [
    { accountId: account1.id, debit: 1000, description: 'Cash receipt' },
    { accountId: account2.id, credit: 1000, description: 'Sales revenue' },
  ],
);

// Create simple 2-line journal entry
const simpleEntry = await FinanceFixture.createSimpleJournalEntry(
  dataSource,
  tenantId,
  debitAccountId,
  creditAccountId,
  1000,
  'Invoice payment',
);

// Create unbalanced entry (for testing error handling)
const unbalanced = await FinanceFixture.createUnbalancedJournalEntry(
  dataSource,
  tenantId,
  accountA.id,
  accountB.id,
  1000,
  500, // Unbalanced: 1000 vs 500
);

// Get trial balance
const trialBalance = await FinanceFixture.getTrialBalance(dataSource, tenantId);
// Returns: [{ accountId, accountCode, accountName, debit, credit, balance }, ...]

// Verify entry is balanced
const isBalanced = await FinanceFixture.isJournalEntryBalanced(
  dataSource,
  tenantId,
  entryId,
);

// Cleanup
await FinanceFixture.deleteJournalEntry(dataSource, tenantId, entryId);
```

#### Example Usage in Tests

```typescript
describe('FinanceService - Trial Balance', () => {
  let dataSource: DataSource;
  const tenantId = 'finance-test-tenant';

  beforeEach(async () => {
    dataSource = module.get<DataSource>(DataSource);
  });

  it('should calculate trial balance correctly', async () => {
    // Arrange: Create chart of accounts
    const accounts = await FinanceFixture.createChartOfAccounts(
      dataSource,
      tenantId,
    );

    // Create balanced journal entries
    await FinanceFixture.createSimpleJournalEntry(
      dataSource,
      tenantId,
      accounts['1000'].id, // Cash
      accounts['4000'].id, // Revenue
      1000,
    );

    // Act
    const trialBalance = await FinanceFixture.getTrialBalance(
      dataSource,
      tenantId,
    );

    // Assert
    expect(trialBalance).toContainEqual(
      expect.objectContaining({
        accountCode: '1000',
        debit: 1000,
        balance: 1000,
      }),
    );
    expect(trialBalance).toContainEqual(
      expect.objectContaining({
        accountCode: '4000',
        credit: 1000,
        balance: -1000,
      }),
    );
  });

  it('should prevent unbalanced journal entries', async () => {
    const accounts = await FinanceFixture.createChartOfAccounts(
      dataSource,
      tenantId,
    );

    // Attempting to create unbalanced entry should fail or be caught
    await expect(
      FinanceFixture.createUnbalancedJournalEntry(
        dataSource,
        tenantId,
        accounts['1000'].id,
        accounts['2000'].id,
        1000,
        500, // Unbalanced
      ),
    ).rejects.toThrow(); // Depends on validation layer
  });
});
```

## Best Practices

### 1. Tenant Context Always Required

All fixtures require an explicit `tenantId` parameter. This ensures proper RLS context:

```typescript
// ✅ Good: Explicit tenant
const user = await UserFixture.createUser(dataSource, tenantId);

// ❌ Bad: Don't omit tenant
const user = await UserFixture.createUser(dataSource); // Type error
```

### 2. Use Overrides Sparingly

Keep test data simple. Only override fields you're testing:

```typescript
// ✅ Good: Override only what's relevant
const user = await UserFixture.createUser(dataSource, tenantId, {
  email: 'special@case.com',
});

// ❌ Bad: Overriding everything
const user = await UserFixture.createUser(dataSource, tenantId, {
  email: 'x@y.com',
  isActive: true,
  tenantId, // Don't override tenantId—it's already set
  passwordHash: '...', // Fixture handles this
});
```

### 3. Cleanup in afterEach

Always clean up test data to avoid cross-test pollution:

```typescript
afterEach(async () => {
  await UserFixture.deleteUser(dataSource, tenantId, user.id);
});
```

### 4. Use Factory Methods for Role-Specific Tests

Create specialized user types when testing RBAC:

```typescript
// ✅ Better readability
const admin = await UserFixture.createAdminUser(dataSource, tenantId);
const officer = await UserFixture.createFinanceOfficer(dataSource, tenantId);

// ❌ Less clear
const admin = await UserFixture.createUserWithRoles(dataSource, tenantId, [
  'admin',
]);
```

### 5. Pre-Seed Complex Hierarchies

For tests requiring multiple entities, use setup helpers:

```typescript
beforeEach(async () => {
  // Setup complete chart of accounts once
  accounts = await FinanceFixture.createChartOfAccounts(dataSource, tenantId);

  // Reuse across multiple tests
});

it('test 1', async () => {
  const entry = await FinanceFixture.createSimpleJournalEntry(
    dataSource,
    tenantId,
    accounts['1000'].id,
    accounts['4000'].id,
    1000,
  );
  // ...
});

it('test 2', async () => {
  const entry = await FinanceFixture.createSimpleJournalEntry(
    dataSource,
    tenantId,
    accounts['1100'].id,
    accounts['4000'].id,
    500,
  );
  // ...
});
```

## Adding New Fixtures

When adding support for a new module, create a fixture file following this pattern:

1. **File**: `test/fixtures/{module}.fixture.ts`
2. **Export**: Export a `{Module}Fixture` class
3. **Methods**: Static async methods for entity creation
4. **Context**: Always set RLS context via `SET LOCAL app.current_tenant_id`
5. **Cleanup**: Include delete/cleanup helpers

Example template:

```typescript
import { DataSource } from 'typeorm';
import { MyEntity } from '../../src/modules/mymodule/entities/my-entity.entity';

export class MyModuleFixture {
  static async createEntity(
    dataSource: DataSource,
    tenantId: string,
    overrides?: Partial<MyEntity>,
  ): Promise<MyEntity> {
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.query(
        `SET LOCAL app.current_tenant_id = '${tenantId}'`,
      );

      const entity = queryRunner.manager.create(MyEntity, {
        // default values
        tenantId,
        ...overrides,
      });

      const saved = await queryRunner.manager.save(entity);
      await queryRunner.commitTransaction();
      return saved;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
```

## Debugging Fixture Issues

### "RLS policy violation" errors

Ensure tenant context is being set:

```typescript
await queryRunner.query(`SET LOCAL app.current_tenant_id = '${tenantId}'`);
```

### "Entity not found after save"

Clear the transaction properly and return the saved entity:

```typescript
const saved = await queryRunner.manager.save(entity);
await queryRunner.commitTransaction();
return saved; // Return AFTER commit
```

### Data not visible in next test

Always clean up in `afterEach` and use fresh `queryRunner` instances for each operation.

---

**Documentation**: See `.github/copilot-instructions.md` for comprehensive testing guidelines.
