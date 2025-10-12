# AI Agent Instructions for NestJS ERP Codebase

## Project Overview

This is a **modular monolith ERP system** built with NestJS, PostgreSQL 18+, and TypeORM. The architecture prioritizes **multi-tenant data isolation**, **audit compliance**, and **double-entry bookkeeping** in the Finance module.

**Key architectural constraint**: Security and data isolation are enforced at the **PostgreSQL level** via Row-Level Security (RLS), not just in application code.

## Critical Architecture Patterns

### 1. Multi-Tenant Isolation (Row-Level Security)

**The Problem**: Application-level tenant checks can have bugs. We trust PostgreSQL instead.

**The Solution**:

- Every security-sensitive table has a `tenant_id` column
- On every request, [TenantMiddleware](../src/common/middleware/tenant.middleware.ts) extracts the `x-tenant-id` header and stores it in `TenantContext`
- Database queries automatically scope to the current tenant via PostgreSQL RLS policies
- **Critical**: All entities must extend [BaseEntity](../src/common/entities/base.entity.ts) which enforces `tenant_id` column

**Example**: Finance tables have RLS policies like:

```sql
CREATE POLICY tenant_isolation ON general_ledger
USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
```

**Agent Task**: When adding entities, always include `tenant_id` and extend `BaseEntity`. If you add new tables to schema migrations, update RLS setup scripts in [database/scripts/rls_setup.sql](../src/database/scripts/rls_setup.sql).

### 2. Audit Logging (PL/pgSQL Triggers)

**"Never Delete" Policy**: All mutations are immutable; they're recorded in `system_audit_logs`.

- Triggers capture `INSERT`, `UPDATE`, `DELETE` with `old_data`, `new_data`, and `changed_by`
- Defined in [audit_trigger.sql](../src/database/migrations/audit_trigger.sql)
- **Recursion prevention**: The audit table itself is excluded from triggering

**Agent Task**: Don't implement application-level audit logic. Trust the triggers. If you add new tables requiring audit, they must be added to the trigger setup.

### 3. UUID v7 (Time-Ordered Primary Keys)

All primary keys use `@PrimaryGeneratedColumn('uuid')` (PostgreSQL 18+ generates UUID v7).

- **Why**: Time-sorted UUIDs improve index performance and enable efficient pagination
- PostgreSQL handles generation; no application-side generation needed

**Agent Task**: When creating entities, always use UUID primary keys. Never use surrogate `int` or `bigint`.

### 4. Double-Entry Bookkeeping (Finance Module Only)

The [FinanceService](../src/modules/finance/finance.service.ts) ensures `Debits + Credits = 0`.

- Journal entries create `JournalLine` records (debit/credit pairs)
- Database constraints enforce balance at insert time
- Each ledger is scoped to `tenant_id`

**Agent Task**: Finance operations must go through `JournalEntryService`, never directly insert ledger lines. All credit/debit operations must balance.

### 5. Modular Monolith with Global Identity Module

Modules are domain-specific (Finance, Inventory, Compliance, etc.) but communicate via services.

- [IdentityModule](../src/modules/identity/identity.module.ts) is marked `@Global()` to avoid circular dependency hell
- Provides RBAC (`User`, `Role`, `Permission`), tenant management, and audit logging
- Other modules depend on Identity (not the reverse)

**Agent Task**: When creating cross-module operations, use service injection, not direct entity access. Keep module boundaries strict: Finance doesn't know about HR, but both depend on Identity.

## Development Workflows

### Local Setup

```bash
pnpm install
# Create .env with: DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE, JWT_SECRET
pnpm db:setup          # Initialize schema, RLS, triggers
pnpm start:dev         # Run with HMR
```

### Testing & Verification

```bash
pnpm test              # Unit tests
pnpm test:e2e          # End-to-end tests
pnpm test test/leak.e2e-spec.ts  # CRITICAL: Verify cross-tenant access is blocked
pnpm lint              # ESLint (strict, no `any` types)
pnpm format            # Prettier
```

**Critical**: The "Leak Test" must pass. It attempts cross-tenant access and **must fail**. If it succeeds, there's a security vulnerability.

### Database Migrations

```bash
pnpm migration:generate -- --name FeatureName
pnpm migration:run
# To rollback: pnpm migration:revert
```

When writing migrations:

- Add RLS policies for new security-sensitive tables
- Update [rls_setup.sql](../src/database/scripts/rls_setup.sql) if adding to the trigger function
- Test with `pnpm db:setup && pnpm test test/leak.e2e-spec.ts`

## Testing & Quality Assurance

### Test Strategy Overview

Tests are organized into three categories, each with distinct responsibilities:

1. **Unit Tests** (`src/**/*.spec.ts`): Isolated business logic, mocked dependencies
2. **Integration Tests** (`test/**/*.spec.ts`): Real database, RLS policies, cross-module interactions
3. **E2E Tests** (`test/**/*.e2e-spec.ts`): Full HTTP stack, realistic request/response flows

**Coverage Goal**: >85% for core modules (Auth, Finance, Identity); >75% for others. Run `pnpm test:cov` to verify.

### Unit Test Patterns

#### 1. Mock Repositories with Factory Functions

```typescript
// Create reusable mock factories for consistent test data
const createMockUserRepository = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

const createMockJournalLineRepository = () => ({
  find: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(),
    getMany: jest.fn(),
  })),
});

describe('FinanceService', () => {
  let service: FinanceService;
  let mockLineRepo: ReturnType<typeof createMockJournalLineRepository>;

  beforeEach(async () => {
    mockLineRepo = createMockJournalLineRepository();
    const module = await Test.createTestingModule({
      providers: [
        FinanceService,
        { provide: getRepositoryToken(JournalLine), useValue: mockLineRepo },
      ],
    }).compile();
    service = module.get<FinanceService>(FinanceService);
  });
});
```

#### 2. Test Tenant Isolation at Service Layer

Always verify that services enforce tenant boundaries via mocked context:

```typescript
describe('FinanceService - Tenant Isolation', () => {
  it('should scope queries to current tenant via TenantContext', async () => {
    // Mock TenantContext.getStore() to return a specific tenant
    jest
      .spyOn(TenantContext, 'getStore')
      .mockReturnValue({ tenantId: 'tenant-a' });

    mockLineRepo.find.mockResolvedValue([
      { id: 'j1', tenantId: 'tenant-a', debit: 100 },
    ]);

    const results = await service.getTrialBalance({
      startDate: null,
      endDate: null,
    });

    // Verify repository was called (service should construct query with tenant filtering)
    expect(mockLineRepo.find).toHaveBeenCalled();
  });

  it('should throw UnauthorizedException if tenant context missing', async () => {
    jest.spyOn(TenantContext, 'getStore').mockReturnValue(null);

    await expect(service.getTrialBalance({})).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
```

#### 3. Test Error Cases and Validation

```typescript
describe('FinanceService - Error Handling', () => {
  it('should throw NotFoundException when payment term not found', async () => {
    mockPaymentTermRepo.findOne.mockResolvedValue(null);

    await expect(
      service.updatePaymentTerm('invalid-id', { days: 30 }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw BadRequestException on invalid debit/credit balance', async () => {
    const unbalancedLines = [
      { accountId: 'acc1', debit: 100, credit: 50 }, // Unbalanced
    ];

    await expect(
      service.createJournalEntry('desc', new Date(), unbalancedLines),
    ).rejects.toThrow(BadRequestException);
  });

  it('should validate DTO fields before processing', async () => {
    const invalidDto = { accountId: 'not-a-uuid', debit: 'not-a-number' };

    // Assume controller validates DTOs; service receives clean data
    // This test verifies service doesn't crash on unexpected shapes
    expect(() => service.validateLineDto(invalidDto)).toThrow();
  });
});
```

#### 4. Test Cross-Module Service Interactions

```typescript
describe('SalesService - Finance Integration', () => {
  let salesService: SalesService;
  let mockFinanceService: any;

  beforeEach(async () => {
    mockFinanceService = {
      createJournalEntry: jest.fn().mockResolvedValue({ id: 'je1' }),
    };

    const module = await Test.createTestingModule({
      providers: [
        SalesService,
        { provide: FinanceService, useValue: mockFinanceService },
      ],
    }).compile();
    salesService = module.get<SalesService>(SalesService);
  });

  it('should create journal entry when invoice is posted', async () => {
    await salesService.postInvoice({ id: 'inv1', amount: 1000 });

    expect(mockFinanceService.createJournalEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        lines: expect.arrayContaining([
          expect.objectContaining({ debit: 1000 }),
          expect.objectContaining({ credit: 1000 }),
        ]),
      }),
    );
  });

  it('should handle FinanceService failures gracefully', async () => {
    mockFinanceService.createJournalEntry.mockRejectedValue(
      new BadRequestException('Unbalanced entry'),
    );

    await expect(salesService.postInvoice({ id: 'inv1' })).rejects.toThrow(
      BadRequestException,
    );
  });
});
```

### E2E & Integration Test Patterns

#### Critical Leak Test: Cross-Tenant Isolation

The leak test is the **most important security test**. It must comprehensively verify RLS policies:

```typescript
describe('Leak Test - Tenant Isolation (E2E)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  const tenantA = 'uuid-tenant-a';
  const tenantB = 'uuid-tenant-b';
  let userA: User;
  let userB: User;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
    dataSource = moduleFixture.get<DataSource>(DataSource);
  });

  beforeEach(async () => {
    // Seed Tenant A user
    userA = await dataSource.manager.save(User, {
      email: 'user@tenant-a.com',
      passwordHash: await bcrypt.hash('password', 10),
      tenantId: tenantA,
      isActive: true,
    });

    // Seed Tenant B user
    userB = await dataSource.manager.save(User, {
      email: 'user@tenant-b.com',
      passwordHash: await bcrypt.hash('password', 10),
      tenantId: tenantB,
      isActive: true,
    });
  });

  afterEach(async () => {
    await dataSource.manager.clear(User);
  });

  it('Tenant B CANNOT read Tenant A user data via GET', async () => {
    // Tenant B logs in
    const tokenB = await getAuthToken(app, 'user@tenant-b.com', 'password');

    // Attempt to read Tenant A user
    const response = await request(app.getHttpServer())
      .get(`/users/${userA.id}`)
      .set('x-tenant-id', tenantB)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(404); // RLS blocks the query; user not found

    expect(response.body).not.toContain(userA.email);
  });

  it('Tenant B CANNOT list Tenant A users', async () => {
    const tokenB = await getAuthToken(app, 'user@tenant-b.com', 'password');

    const response = await request(app.getHttpServer())
      .get('/users')
      .set('x-tenant-id', tenantB)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(200);

    // Response should be empty (RLS filtered out Tenant A users)
    expect(response.body).toHaveLength(1);
    expect(response.body[0].id).toBe(userB.id);
    expect(response.body).not.toContainEqual(
      expect.objectContaining({ id: userA.id }),
    );
  });

  it('Tenant B CANNOT modify Tenant A data via PATCH', async () => {
    const tokenB = await getAuthToken(app, 'user@tenant-b.com', 'password');

    await request(app.getHttpServer())
      .patch(`/users/${userA.id}`)
      .set('x-tenant-id', tenantB)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ isActive: false })
      .expect(404); // RLS denies access; treated as not found
  });

  it('Finance: Tenant B CANNOT see Tenant A ledger entries', async () => {
    // Create ledger for Tenant A
    const journalA = await dataSource.manager.save(JournalEntry, {
      reference: 'JE-001',
      transactionDate: new Date(),
      tenantId: tenantA,
    });

    const tokenB = await getAuthToken(app, 'user@tenant-b.com', 'password');

    const response = await request(app.getHttpServer())
      .get(`/finance/journal-entries/${journalA.id}`)
      .set('x-tenant-id', tenantB)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(404);
  });

  it('Audit: Tenant B CANNOT access audit logs for Tenant A operations', async () => {
    // Tenant A performs an operation
    const tokenA = await getAuthToken(app, 'user@tenant-a.com', 'password');
    await request(app.getHttpServer())
      .patch(`/users/${userA.id}`)
      .set('x-tenant-id', tenantA)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ isActive: false });

    // Tenant B tries to access the audit log
    const tokenB = await getAuthToken(app, 'user@tenant-b.com', 'password');
    const response = await request(app.getHttpServer())
      .get('/audit-logs')
      .set('x-tenant-id', tenantB)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(200);

    // Should be empty or contain only Tenant B's audit logs
    expect(response.body.some((log) => log.tenantId === tenantA)).toBe(false);
  });

  it('RBAC: Tenant A user with limited role CANNOT access admin endpoints', async () => {
    // Create user with limited role (non-admin)
    const limitedUser = await dataSource.manager.save(User, {
      email: 'limited@tenant-a.com',
      passwordHash: await bcrypt.hash('password', 10),
      tenantId: tenantA,
      isActive: true,
      roles: ['viewer'], // Limited role
    });

    const token = await getAuthToken(app, 'limited@tenant-a.com', 'password');

    await request(app.getHttpServer())
      .delete(`/users/${userA.id}`)
      .set('x-tenant-id', tenantA)
      .set('Authorization', `Bearer ${token}`)
      .expect(403); // Forbidden: insufficient permissions
  });
});

// Helper to obtain auth token for E2E tests
async function getAuthToken(
  app: INestApplication,
  email: string,
  password: string,
): Promise<string> {
  const response = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password })
    .expect(200);
  return response.body.access_token;
}
```

#### Finance Module Integration Test

```typescript
describe('Finance Module - Integration', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  const tenantId = 'tenant-finance-test';

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
    dataSource = moduleFixture.get<DataSource>(DataSource);
  });

  it('should enforce double-entry bookkeeping (debits = credits)', async () => {
    const unbalancedPayload = {
      reference: 'JE-001',
      transactionDate: new Date().toISOString(),
      lines: [
        { accountId: 'acc1', debit: 100, credit: 0, description: 'Debit' },
        { accountId: 'acc2', debit: 0, credit: 50, description: 'Credit' }, // Unbalanced
      ],
    };

    await request(app.getHttpServer())
      .post('/finance/journal-entries')
      .set('x-tenant-id', tenantId)
      .set('Authorization', `Bearer ${token}`)
      .send(unbalancedPayload)
      .expect(400); // BadRequest: not balanced
  });

  it('should calculate trial balance correctly', async () => {
    // Create balanced entries for the tenant
    const balancedPayload = {
      reference: 'JE-002',
      transactionDate: new Date().toISOString(),
      lines: [
        { accountId: 'cash', debit: 1000, credit: 0 },
        { accountId: 'revenue', debit: 0, credit: 1000 },
      ],
    };

    await request(app.getHttpServer())
      .post('/finance/journal-entries')
      .set('x-tenant-id', tenantId)
      .set('Authorization', `Bearer ${token}`)
      .send(balancedPayload)
      .expect(201);

    const response = await request(app.getHttpServer())
      .get('/finance/trial-balance')
      .set('x-tenant-id', tenantId)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toContainEqual(
      expect.objectContaining({ accountId: 'cash', debit: 1000, credit: 0 }),
    );
    expect(response.body).toContainEqual(
      expect.objectContaining({ accountId: 'revenue', debit: 0, credit: 1000 }),
    );
  });

  it('should record all mutations in system_audit_logs', async () => {
    const balancedPayload = {
      reference: 'JE-003',
      transactionDate: new Date().toISOString(),
      lines: [
        { accountId: 'cash', debit: 500, credit: 0 },
        { accountId: 'revenue', debit: 0, credit: 500 },
      ],
    };

    const response = await request(app.getHttpServer())
      .post('/finance/journal-entries')
      .set('x-tenant-id', tenantId)
      .set('Authorization', `Bearer ${token}`)
      .send(balancedPayload)
      .expect(201);

    const journalId = response.body.id;

    // Query audit logs for this operation
    const auditLogs = await dataSource.manager.find(SystemAuditLog, {
      where: { recordId: journalId, tenantId },
    });

    expect(auditLogs.length).toBeGreaterThan(0);
    expect(auditLogs[0].action).toBe('INSERT');
    expect(auditLogs[0].newData).toContainEqual(
      expect.objectContaining({ reference: 'JE-003' }),
    );
  });
});
```

#### DTO Validation Test

```typescript
describe('DTO Validation', () => {
  it('CreateJournalLineDto should reject invalid UUID', async () => {
    const dto = new CreateJournalLineDto();
    dto.accountId = 'not-a-uuid'; // Invalid
    dto.debit = 100;
    dto.credit = 0;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('accountId');
  });

  it('CreatePaymentTermDto should enforce positive days', async () => {
    const dto = new CreatePaymentTermDto();
    dto.days = -5; // Invalid
    dto.label = 'Net -5';

    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'days')).toBe(true);
  });

  it('CreateUserDto should enforce email format', async () => {
    const dto = new CreateUserDto();
    dto.email = 'invalid-email'; // Invalid
    dto.password = 'password123';
    dto.tenantId = 'valid-uuid';

    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'email')).toBe(true);
  });
});
```

### Test Data Fixtures and Helpers

Create `test/fixtures/` for reusable test entity factories:

```typescript
// test/fixtures/user.fixture.ts
export class UserFixture {
  static async createTenant(dataSource: DataSource): Promise<Tenant> {
    return dataSource.manager.save(Tenant, {
      name: `Tenant-${Date.now()}`,
      isActive: true,
    });
  }

  static async createUser(
    dataSource: DataSource,
    overrides?: Partial<User>,
  ): Promise<User> {
    const tenant = await this.createTenant(dataSource);
    return dataSource.manager.save(User, {
      email: `user-${Date.now()}@example.com`,
      passwordHash: await bcrypt.hash('password123', 10),
      tenantId: tenant.id,
      isActive: true,
      ...overrides,
    });
  }

  static async createUserWithRole(
    dataSource: DataSource,
    role: string,
  ): Promise<User> {
    const user = await this.createUser(dataSource);
    const roleEntity = await dataSource.manager.save(Role, {
      name: role,
      tenantId: user.tenantId,
    });
    user.roles = [roleEntity];
    return dataSource.manager.save(user);
  }
}

// test/fixtures/finance.fixture.ts
export class FinanceFixture {
  static async createAccount(
    dataSource: DataSource,
    tenantId: string,
    overrides?: Partial<Account>,
  ): Promise<Account> {
    return dataSource.manager.save(Account, {
      code: `ACC-${Date.now()}`,
      name: 'Test Account',
      type: 'asset',
      tenantId,
      ...overrides,
    });
  }

  static async createJournalEntry(
    dataSource: DataSource,
    tenantId: string,
    lines: Partial<JournalLine>[],
  ): Promise<JournalEntry> {
    const entry = await dataSource.manager.save(JournalEntry, {
      reference: `JE-${Date.now()}`,
      transactionDate: new Date(),
      tenantId,
    });

    for (const line of lines) {
      await dataSource.manager.save(JournalLine, {
        journalEntryId: entry.id,
        tenantId,
        ...line,
      });
    }

    return entry;
  }
}
```

### Running Tests

```bash
# Unit tests (fast, no DB)
pnpm test

# Unit tests with coverage
pnpm test:cov

# E2E tests (slow, requires running DB)
pnpm test:e2e

# Leak test only (critical for security)
pnpm test test/leak.e2e-spec.ts

# Watch mode for development
pnpm test:watch

# Single test file
pnpm test src/modules/finance/finance.service.spec.ts
```

### Coverage Requirements

| Module    | Target | Rationale                                |
| --------- | ------ | ---------------------------------------- |
| Auth      | 85%+   | Security-critical; must verify all paths |
| Finance   | 85%+   | Double-entry rules; no exceptions        |
| Identity  | 85%+   | RBAC and tenant isolation                |
| Inventory | 75%+   | Core business; less critical than above  |
| Sales     | 75%+   | Business logic; audit trail validates    |
| Other     | 70%+   | Lower risk modules                       |

## Code Patterns & Conventions

### 1. Service Structure (Dependency Injection)

```typescript
// Always use @Injectable() and inject repositories
@Injectable()
export class MyService {
  constructor(
    @InjectRepository(MyEntity)
    private repo: Repository<MyEntity>,
    private otherService: OtherService,
  ) {}
}
```

### 2. DTO Validation

```typescript
// DTOs use class-validator decorators
export class CreateMyEntityDto {
  @IsUUID()
  @IsNotEmpty()
  tenantId: string;

  @IsString()
  @Length(1, 255)
  name: string;
}
```

### 3. Error Handling

- Use NestJS exceptions: `NotFoundException`, `BadRequestException`, `UnauthorizedException`
- Include meaningful error messages; avoid leaking tenant data

### 4. Tenant Context (When Needed Outside Middleware)

```typescript
// Access current tenant from AsyncLocalStorage
import { TenantContext } from '@common/context/tenant.context';
const { tenantId } = TenantContext.getStore();
```

## File Organization

```
src/
  app.module.ts              # Root module, imports all feature modules
  auth/                      # JWT auth, guards, strategies (not part of Identity module)
  common/
    middleware/              # TenantMiddleware extracts x-tenant-id
    entities/                # BaseEntity (all entities extend this)
    context/                 # TenantContext (AsyncLocalStorage)
  config/                    # Database config, environment
  database/
    data-source.ts           # TypeORM configuration
    migrations/              # Timestamped migrations + SQL files
    scripts/                 # rls_setup.sql (RLS policies)
    subscribers/             # TypeORM event listeners (e.g., tenant subscriber)
  modules/
    identity/                # @Global() - RBAC, users, tenants
    finance/                 # General Ledger, Journals, Accounts
    inventory/               # Stock, warehouses, UOM
    sales/                   # Quotes, invoices, customers
    procurement/             # RFQ, POs, vendors
    hrms/                    # Employees, payroll
    pos/                     # Point of Sale (offline-first sync)
    i18n/                    # Translations
    compliance/              # ETA eInvoicing, tax compliance
```

## Guardrails & Gotchas

### DO:

- ✅ Always test with `pnpm test test/leak.e2e-spec.ts` after auth/tenant changes
- ✅ Extend `BaseEntity` for all domain entities
- ✅ Use strict TypeScript types (no `any`)
- ✅ Inject repositories via `@InjectRepository()`
- ✅ Run `pnpm lint` before committing
- ✅ Write DTOs with class-validator for input validation
- ✅ Write unit tests with mocked repositories and service layer tenant isolation checks
- ✅ Write E2E tests that exercise real RLS policies and verify cross-tenant access is blocked
- ✅ Use test fixtures/factories to seed consistent test data (see `test/fixtures/`)
- ✅ Test error cases: invalid inputs, missing records, permission denied, balance failures
- ✅ Mock external services (APIs, third-party integrations); never call real endpoints in tests

### DON'T:

- ❌ Bypass tenant checks with raw SQL queries
- ❌ Create entities without `tenant_id` column
- ❌ Implement application-level audit logging (trust PL/pgSQL triggers)
- ❌ Use `npm` or `yarn` (only `pnpm` is supported)
- ❌ Query across tenants even for reporting (RLS will block it)
- ❌ Add `any` types to pass linting
- ❌ Test only happy-path scenarios; always include error cases
- ❌ Use `jest.mock()` at module level for services you inject; use `useValue` in TestingModule instead
- ❌ Write E2E tests that depend on specific test data order; use fixtures to seed independently
- ❌ Mock RLS behavior in unit tests without verifying real RLS in E2E tests
- ❌ Assume a service respects tenant isolation; always test it explicitly

## External Integration Points

- **PostgreSQL 18+**: Required for UUID v7 and RLS
- **TypeORM**: ORM layer; migrations are TypeScript files
- **Swagger/OpenAPI**: Auto-generated from controllers via `@nestjs/swagger`
- **Passport.js + JWT**: Authentication in [auth/](../src/auth/) module
- **pnpm**: Workspace package manager (see `pnpm-workspace.yaml`)

## Adding a New Feature

1. **Create a feature module** in `src/modules/{feature}/`
   - `{feature}.module.ts` (@Module decorator)
   - `{feature}.service.ts` (business logic)
   - `{feature}.controller.ts` (HTTP endpoints)
   - `entities/` (TypeORM entities extending BaseEntity)
   - `dto/` (input/output validation)

2. **Add database entities** in the new module's `entities/` folder
   - Extend `BaseEntity` (gives id, tenantId, createdAt, updatedAt, version)
   - Use decorators: `@Entity()`, `@Column()`, `@ManyToOne()`, etc.

3. **Generate & run migration**:

   ```bash
   pnpm migration:generate -- --name Add{Feature}Tables
   pnpm migration:run
   ```

4. **Import module** in [src/app.module.ts](../src/app.module.ts)

5. **Test for tenant leaks**:
   ```bash
   pnpm test test/leak.e2e-spec.ts
   ```

## Debugging Tips

- **Tenant issues**: Check that middleware sets `x-tenant-id` header in requests
- **RLS blocks query**: Verify the entity has `tenant_id` column and the migration added a policy
- **Type errors**: Use strict TypeScript; run `pnpm lint` to catch issues
- **Database connection**: Check `.env` DB\_\* variables match PostgreSQL instance
- **Tests failing**: Ensure `pnpm db:setup` ran; it initializes RLS and triggers

## Quick Reference

| Task               | Command                                               |
| ------------------ | ----------------------------------------------------- |
| Start dev          | `pnpm start:dev`                                      |
| Run tests          | `pnpm test`                                           |
| Run Leak Test      | `pnpm test test/leak.e2e-spec.ts`                     |
| Generate migration | `pnpm migration:generate -- --name Name`              |
| Lint & format      | `pnpm lint && pnpm format`                            |
| API docs           | Open http://localhost:3000/api after `pnpm start:dev` |
| Init database      | `pnpm db:setup`                                       |

---

**Last Updated**: December 2025  
**For more details**: See the root [docs/](../docs/) folder (architecture.md, development.md, operations.md)
