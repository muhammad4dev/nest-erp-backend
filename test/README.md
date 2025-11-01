# Testing Guide

## Overview

This project uses a **dedicated test database** configured via `.env.test` to ensure test isolation and RLS policy verification.

## Test Database Setup

### Single Source of Truth

**All database operations use [scripts/setup-db.ts](../scripts/setup-db.ts)**:

- `setup-db.ts` - Creates database, role, schema, RLS, UUID v7, audit triggers
- `setup-db.ts teardown` - Drops database and role

Environment configuration:

- **Development**: Uses `.env` (default)
- **Testing**: Uses `.env.test` (loaded via `NODE_ENV=test`)

This ensures consistency between dev and test environments.

### Configuration

Test database credentials are in [.env.test](../.env.test):

```env
DB_ADMIN_USER=erp                    # Admin user (creates database)
DB_ADMIN_PASS=123321                 # Admin password
DB_HOST=10.0.0.11                    # Database host
DB_PORT=5432                         # Database port
DB_DATABASE=erp_test                 # Test database name
DB_USERNAME=erp_test_user            # Non-superuser app role
DB_PASSWORD=test_password_123        # App role password
JWT_SECRET=test-jwt-secret-for-testing-only-not-production
```

### Manual Database Setup

```bash
# Setup test database (create DB, role, schema, RLS)
npm run test:db:setup

# Teardown test database (drop DB and role)
npm run test:db:teardown
```

### Automatic Setup (Recommended)

E2E tests automatically setup/teardown the test database:

```bash
# Run all E2E tests (auto setup + teardown)
npm run test:e2e

# Run specific E2E test
npm run test -- test/leak.e2e-spec.ts

# Watch mode for E2E tests
npm run test:e2e:watch
```

## Test Types

### Unit Tests (`src/**/*.spec.ts`)

- **Fast**: Mock repositories, no database
- **Isolated**: Test business logic only
- **Run**: `npm run test`

Example:

```typescript
describe('FinanceService', () => {
  let service: FinanceService;
  let mockRepo: jest.Mocked<Repository<JournalEntry>>;

  beforeEach(async () => {
    mockRepo = {
      find: jest.fn(),
      save: jest.fn(),
    } as any;

    const module = await Test.createTestingModule({
      providers: [
        FinanceService,
        { provide: getRepositoryToken(JournalEntry), useValue: mockRepo },
      ],
    }).compile();

    service = module.get(FinanceService);
  });

  it('should create journal entry', async () => {
    mockRepo.save.mockResolvedValue({ id: '123' } as any);
    const result = await service.create({ ... });
    expect(result.id).toBe('123');
  });
});
```

### E2E Tests (`test/**/*.e2e-spec.ts`)

- **Realistic**: Real database with RLS policies
- **Comprehensive**: Tests full request/response flow
- **Run**: `npm run test:e2e`

Example:

```typescript
describe('Invoice API (E2E)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    dataSource = module.get(DataSource);
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  it('should create invoice', async () => {
    const response = await request(app.getHttpServer())
      .post('/invoices')
      .set('x-tenant-id', TENANT_A_ID)
      .set('Authorization', `Bearer ${token}`)
      .send({ ... })
      .expect(201);

    expect(response.body.id).toBeDefined();
  });
});
```

## Critical Test: Tenant Isolation (Leak Test)

**Purpose**: Verify RLS policies prevent cross-tenant data access.

**Location**: [test/leak.e2e-spec.ts](leak.e2e-spec.ts)

**Run**: `npm run test -- test/leak.e2e-spec.ts`

**What it tests**:

- ✅ Tenant B cannot read Tenant A data
- ✅ Tenant B cannot modify Tenant A data
- ✅ Tenant B cannot delete Tenant A data
- ✅ Audit logs are tenant-scoped
- ✅ RLS applies to all security-sensitive tables

**CRITICAL**: If ANY leak test passes (doesn't throw error), there is a security vulnerability.

## Test Database Lifecycle

### Global Setup (Once Before All Tests)

1. **Load `.env.test`**: Configure test database
2. **Drop existing test DB**: Clean slate
3. **Create test role**: Non-superuser for RLS enforcement
4. **Create test database**: Admin-owned
5. **Run migrations**: Apply schema, RLS, audit triggers
6. **Ensure UUID v7**: Override TypeORM defaults

### Per-Test Setup

- Each test suite gets fresh application instance
- Database persists between tests in same run
- Use `beforeEach` to seed test data

### Global Teardown (Once After All Tests)

1. **Terminate connections**: Close all DB connections
2. **Drop test database**: Remove test DB
3. **Drop test role**: Remove test user

## Best Practices

### 1. **Always Use Test Database**

```typescript
// ❌ Don't use dev database for tests
DB_DATABASE = erp_dev_db;

// ✅ Use dedicated test database
DB_DATABASE = erp_test;
```

### 2. **Non-Superuser for RLS Verification**

```typescript
// ❌ Superuser bypasses RLS (tests would pass incorrectly)
DB_USERNAME = postgres;

// ✅ Non-superuser enforces RLS
DB_USERNAME = erp_test_user;
```

### 3. **Clean Test Data**

```typescript
beforeEach(async () => {
  // Clear test data between tests
  await dataSource.manager.clear(Invoice);
  await dataSource.manager.clear(User);
});
```

### 4. **Use Fixtures for Reusable Test Data**

```typescript
import { UserFixture } from './fixtures/user.fixture';

const tenant = await UserFixture.createTenant(dataSource);
const user = await UserFixture.createUser(dataSource, { tenantId: tenant.id });
```

### 5. **Test Error Cases**

```typescript
it('should throw NotFoundException when invoice not found', async () => {
  await expect(service.findOne('invalid-id')).rejects.toThrow(
    NotFoundException,
  );
});

it('should throw BadRequestException on unbalanced journal entry', async () => {
  const unbalanced = { debit: 100, credit: 50 };
  await expect(service.create(unbalanced)).rejects.toThrow(BadRequestException);
});
```

## Coverage Requirements

Run: `npm run test:cov`

| Module    | Target | Reason                    |
| --------- | ------ | ------------------------- |
| Auth      | 85%+   | Security-critical         |
| Finance   | 85%+   | Double-entry compliance   |
| Identity  | 85%+   | RBAC and tenant isolation |
| Inventory | 75%+   | Core business logic       |
| Sales     | 75%+   | Business transactions     |
| Other     | 70%+   | Lower-risk modules        |

## Debugging Tests

### Enable SQL Logging

```typescript
// src/config/database.config.ts
logging: process.env.NODE_ENV === 'test' ? ['query', 'error'] : false,
```

### Inspect Database During Tests

```bash
# Connect to test database
psql -h 10.0.0.11 -U erp_test_user -d erp_test

# Check RLS policies
SELECT * FROM pg_policies WHERE schemaname = 'public';

# Check table ownership
SELECT tablename, tableowner FROM pg_tables WHERE schemaname = 'public';
```

### Keep Test Database After Run

```typescript
// Comment out teardown in test/global-teardown.ts
// Then manually inspect after test run
```

## CI/CD Integration

```yaml
# .github/workflows/test.yml
jobs:
  test:
    services:
      postgres:
        image: postgres:18
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s

    steps:
      - name: Setup test database
        run: npm run test:db:setup

      - name: Run unit tests
        run: npm run test

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Cleanup
        run: npm run test:db:teardown
```

## Troubleshooting

### "Database does not exist"

```bash
# Ensure test database is created
npm run test:db:setup
```

### "Role already exists"

```bash
# Teardown first, then setup
npm run test:db:teardown
npm run test:db:setup
```

### "RLS policies not working"

```bash
# Verify non-superuser in .env.test
DB_USERNAME=erp_test_user  # NOT postgres

# Check role privileges
psql -c "SELECT rolsuper, rolbypassrls FROM pg_roles WHERE rolname = 'erp_test_user';"
# Should show: f | f (false | false)
```

### "Leak test passes (security issue!)"

```bash
# Check table ownership - tables owned by app user bypass RLS
psql -c "SELECT tablename, tableowner FROM pg_tables WHERE schemaname = 'public';"
# tableowner should be 'erp' (admin), NOT 'erp_test_user'

# Fix: Recreate database with admin ownership
npm run test:db:teardown
npm run test:db:setup
```

## Quick Reference

```bash
# Setup test database
npm run test:db:setup

# Run all E2E tests
npm run test:e2e

# Run specific test
npm run test -- test/leak.e2e-spec.ts

# Run unit tests
npm run test

# Coverage report
npm run test:cov

# Teardown test database
npm run test:db:teardown
```
