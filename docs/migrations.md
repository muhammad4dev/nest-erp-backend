# Database Migrations: Architecture & Best Practices

## Overview

This document explains the NestJS ERP migration strategy, the problems we solved, and best practices for maintaining database schema in a multi-tenant, RLS-protected environment.

## The Challenge

Managing database schema changes in a production environment with:

- **Multi-tenant RLS** (Row-Level Security) policies
- **Audit logging** with PL/pgSQL triggers
- **Privilege separation** (app user vs. admin user)
- **Zero-downtime deployments**

## Architecture Decision: Dual DataSource Pattern

### Problem: Single DataSource Limitations

Using a single DataSource for both runtime queries and migrations creates conflicts:

```typescript
// ❌ PROBLEMATIC APPROACH
const AppDataSource = new DataSource({
  username: 'dev', // Limited privileges
  password: 'dev123',
  synchronize: false,
  migrationsRun: true, // Tries to run migrations as 'dev' user
  // This fails: 'dev' user cannot CREATE TABLE
});
```

### Solution: Separate DataSources

We created **two** DataSources with distinct responsibilities:

#### 1. **App DataSource** (Runtime)

**File:** `src/database/data-source.ts`

```typescript
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME, // 'dev' - limited privileges
  password: process.env.DB_PASSWORD, // 'dev123'
  database: process.env.DB_DATABASE, // 'erp_dev_db'
  synchronize: false, // ✅ No auto schema changes
  migrationsRun: false, // ✅ Migrations run separately
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/database/migrations/**/*.ts'],
});
```

**Privileges of `dev` user:**

```sql
-- App role can only:
-- ✅ SELECT, INSERT, UPDATE, DELETE (respecting RLS)
-- ❌ Cannot CREATE TABLE, CREATE INDEX, ALTER TABLE
-- This enforces schema safety at database level
```

#### 2. **Admin DataSource** (Migrations Only)

**File:** `src/database/admin-data-source.ts`

```typescript
export const AdminDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_ADMIN_USER, // 'erp' - superuser
  password: process.env.DB_ADMIN_PASS, // '123321'
  database: process.env.DB_DATABASE,
  synchronize: false,
  migrationsRun: false,
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/database/migrations/**/*.ts'],
});
```

**Privileges of `erp` (admin) user:**

```sql
-- Admin role (only for migrations):
-- ✅ Full DDL: CREATE TABLE, CREATE INDEX, DROP, ALTER
-- ✅ Owns all tables and schemas
-- ❌ Never used at runtime (principle of least privilege)
```

### Benefits of Dual DataSource

| Concern                  | Single DS                          | Dual DS                        |
| ------------------------ | ---------------------------------- | ------------------------------ |
| **Runtime Security**     | App can crash DB if buggy          | App has no DDL access          |
| **Migration Control**    | Auto-runs (risky)                  | Explicit, manual runs          |
| **Audit Trail**          | No record of schema changes        | Git history tracks all changes |
| **Privilege Escalation** | App user could be elevated         | Impossible; hard boundary      |
| **CI/CD Safety**         | App might create unexpected tables | Migrations happen explicitly   |

## Migration Script Configuration

### package.json Changes

```json
{
  "scripts": {
    "typeorm": "ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli -d src/database/data-source.ts",
    "typeorm:admin": "ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli -d src/database/admin-data-source.ts",

    "migration:generate": "pnpm typeorm migration:generate",
    "migration:run": "pnpm typeorm:admin migration:run",
    "migration:revert": "pnpm typeorm:admin migration:revert"
  }
}
```

**Key insight:** All migration commands use `typeorm:admin` (superuser) instead of `typeorm` (app user).

## Migration Workflow

### Step 1: Make Entity Changes

```typescript
// src/modules/finance/entities/payment-term.entity.ts
import { BaseEntity } from '@common/entities/base.entity';
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('payment_terms')
export class PaymentTerm extends BaseEntity {
  @Column('varchar', { length: 100 })
  label: string;

  @Column('integer')
  days: number;

  @Column('varchar', { length: 500, nullable: true })
  description: string; // ← NEW COLUMN
}
```

### Step 2: Generate Migration Automatically

```bash
pnpm migration:generate -- --name AddPaymentTermDescription
```

**What TypeORM does:**

1. Compares your entity (`PaymentTerm`) with the database schema
2. Detects: new column `description`
3. Generates SQL:

```typescript
// src/database/migrations/1766506000002-AddPaymentTermDescription.ts
export class AddPaymentTermDescription1766506000002 implements MigrationInterface {
  name = 'AddPaymentTermDescription1766506000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'payment_terms',
      new TableColumn({
        name: 'description',
        type: 'varchar',
        length: '500',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('payment_terms', 'description');
  }
}
```

### Step 3: Review Generated SQL (CRITICAL!)

```bash
git diff src/database/migrations/1766506000002-AddPaymentTermDescription.ts
```

**Always ask:**

- ✅ Does it match my entity change?
- ✅ Will it preserve existing data?
- ✅ Are the data types correct?
- ✅ Do I need indexes?
- ✅ Multi-tenant: need tenant_id filtering?

### Step 4: Enhance Migration (if needed)

For multi-tenant entities, add RLS setup:

```typescript
export class AddPaymentTermDescription1766506000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'payment_terms',
      new TableColumn({
        name: 'description',
        type: 'varchar',
        length: '500',
        isNullable: true,
      }),
    );

    // Ensure RLS policy exists (if table is tenant-scoped)
    await queryRunner.query(`
      DROP POLICY IF EXISTS tenant_isolation_policy ON payment_terms;
      CREATE POLICY tenant_isolation_policy ON payment_terms
      FOR ALL TO public
      USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
      WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('payment_terms', 'description');
  }
}
```

### Step 5: Test Locally

```bash
# Reset database to clean state
pnpm db:setup

# Run migrations
pnpm migration:run

# Start app
pnpm start:dev

# Verify in Swagger UI or psql
psql -h 10.0.0.11 -U dev -d erp_dev_db
SELECT * FROM payment_terms;  -- Should include new 'description' column
```

### Step 6: Git Commit

```bash
git add src/modules/finance/entities/payment-term.entity.ts
git add src/database/migrations/1766506000002-AddPaymentTermDescription.ts
git commit -m "feat(finance): add description to payment terms"
git push origin feature/add-payment-term-description
```

### Step 7: Code Review

**Reviewer checklist:**

- ✅ Entity change matches migration SQL
- ✅ Migration is reversible (down() works)
- ✅ No data loss for existing records
- ✅ RLS policies updated if needed
- ✅ Indexes added for query performance

### Step 8: Deployment

```bash
# Production CI/CD pipeline:

# 1. Run migrations FIRST (before app code)
pnpm migration:run

# 2. Build and deploy new app
docker build -t my-app:v1.2.0 .
kubectl apply -f deployment.yaml

# 3. Verify schema
psql -h prod-db -U admin -d erp_prod_db
SELECT version FROM migrations ORDER BY timestamp DESC LIMIT 1;
```

## Migration Patterns & Examples

### Pattern 1: Adding a Column (Nullable)

```typescript
export class AddInvoiceNotes1766506000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'invoices',
      new TableColumn({
        name: 'notes',
        type: 'text',
        isNullable: true, // ✅ Safe for existing rows
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('invoices', 'notes');
  }
}
```

### Pattern 2: Adding a Column with Default

```typescript
export class AddInvoiceStatus1766506000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'invoices',
      new TableColumn({
        name: 'is_paid',
        type: 'boolean',
        default: false, // ✅ Existing rows get default value
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('invoices', 'is_paid');
  }
}
```

### Pattern 3: Creating a New Table

```typescript
export class CreatePaymentTerms1766506000005 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'payment_terms',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          { name: 'tenant_id', type: 'uuid', isNullable: false },
          { name: 'label', type: 'varchar', length: '100', isNullable: false },
          { name: 'days', type: 'integer', isNullable: false },
          { name: 'created_at', type: 'timestamptz', default: 'now()' },
          { name: 'updated_at', type: 'timestamptz', default: 'now()' },
        ],
        indices: [
          { name: 'idx_payment_terms_tenant', columnNames: ['tenant_id'] },
        ],
      }),
      true, // ifNotExists flag (idempotent)
    );

    // Enable RLS
    await queryRunner.query(`
      ALTER TABLE payment_terms ENABLE ROW LEVEL SECURITY;
      CREATE POLICY tenant_isolation_policy ON payment_terms
      FOR ALL TO public
      USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
      WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('payment_terms', true);
  }
}
```

### Pattern 4: Adding an Index

```typescript
export class AddInvoiceIndexes1766506000006 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Composite index for common queries
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_invoices_tenant_status
      ON invoices (tenant_id, status)
      WHERE status != 'CANCELLED';
    `);

    // For faster sorting on list views
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_invoices_created_desc
      ON invoices (tenant_id, created_at DESC);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_invoices_created_desc`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_invoices_tenant_status`);
  }
}
```

### Pattern 5: Data Migration (Transformation)

```typescript
export class PopulateInvoiceCalculatedFields1766506000007 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new column
    await queryRunner.addColumn(
      'invoices',
      new TableColumn({
        name: 'total_with_tax',
        type: 'numeric',
        precision: 14,
        scale: 2,
        isNullable: true,
      }),
    );

    // Populate existing rows with calculated values
    await queryRunner.query(`
      UPDATE invoices
      SET total_with_tax = net_amount + tax_amount
      WHERE total_with_tax IS NULL;
    `);

    // Make column NOT NULL after population
    await queryRunner.query(`
      ALTER TABLE invoices
      ALTER COLUMN total_with_tax SET NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('invoices', 'total_with_tax');
  }
}
```

### Pattern 6: Ensuring UUID v7 Defaults

This codebase uses **UUID v7** (time-ordered) for all primary keys to improve index performance and enable efficient pagination.

**File:** `src/database/migrations/utils/uuid-v7.helper.ts`

```typescript
export async function ensureUuidV7Defaults(
  queryRunner: QueryRunner,
  specificTable?: string,
): Promise<void> {
  const tables = specificTable
    ? [specificTable]
    : await getTablesToMigrate(queryRunner);

  for (const table of tables) {
    // Check if id column exists and uses old default
    const result = await queryRunner.query(
      `
      SELECT column_default
      FROM information_schema.columns
      WHERE table_name = $1 AND column_name = 'id'
    `,
      [table],
    );

    if (result[0] && result[0].column_default !== 'gen_random_uuid()') {
      await queryRunner.query(`
        ALTER TABLE "${table}"
        ALTER COLUMN id SET DEFAULT gen_random_uuid()
      `);
    }
  }
}
```

**Usage in Migrations:**

```typescript
// ✅ Upgrade ALL tables to UUID v7 (typically in initial setup)
export class EnsureUuidV7Defaults1766506000010 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await ensureUuidV7Defaults(queryRunner); // All tables
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Down migration is typically a no-op for this
    // UUID v7 is backward compatible
  }
}

// ✅ Upgrade SPECIFIC table when creating new feature
export class CreatePaymentTermsWithUuidV71766506000011 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'payment_terms',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()', // UUID v7
          },
          // ... other columns
        ],
      }),
    );

    // Ensure this table also uses UUID v7
    await ensureUuidV7Defaults(queryRunner, 'payment_terms');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('payment_terms');
  }
}
```

**Benefits of UUID v7:**

| Feature               | UUID v4                 | UUID v7               |
| --------------------- | ----------------------- | --------------------- |
| **Time-ordered**      | ❌ Random               | ✅ Sortable           |
| **Index performance** | Slower (random inserts) | Faster (sequential)   |
| **Pagination**        | Requires seek method    | Native LIMIT/OFFSET   |
| **Readability**       | Hard to debug           | Can see creation time |
| **Database size**     | Standard UUID           | Same size             |

**When to Use:**

- ✅ **Always use UUID v7** for new tables' `id` columns
- ✅ **Migrate existing tables** to UUID v7 if experiencing slow pagination
- ✅ **Call ensureUuidV7Defaults** after schema changes to maintain consistency

## Handling Idempotency

Migrations should be safe to run multiple times:

```typescript
// ❌ BAD: Crashes if run twice
export class CreatePaymentTerms1766506000005 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE payment_terms (...)`);
    // Fails with: "relation "payment_terms" already exists"
  }
}

// ✅ GOOD: Idempotent
export class CreatePaymentTerms1766506000005 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('payment_terms');
    if (tableExists) return;

    await queryRunner.query(`CREATE TABLE payment_terms (...)`);
  }
}

// ✅ ALSO GOOD: Use IF NOT EXISTS
export class CreatePaymentTerms1766506000005 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS payment_terms (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        ...
      );
    `);
  }
}
```

## Testing Migrations

### Unit Test: Verify Migration Structure

```typescript
// test/migrations.spec.ts
describe('Migrations', () => {
  it('should have down() for every migration', () => {
    const migrations = getMigrationClasses();

    migrations.forEach((migration) => {
      expect(migration.prototype.down).toBeDefined();
      expect(typeof migration.prototype.down).toBe('function');
    });
  });

  it('should have unique timestamps', () => {
    const migrations = getMigrationClasses();
    const timestamps = migrations.map((m) => m.name.match(/\d+/)[0]);
    const unique = new Set(timestamps);

    expect(unique.size).toBe(timestamps.length);
  });
});
```

### E2E Test: Verify Migration Execution

```typescript
// test/migrations.e2e-spec.ts
describe('Database Migrations (E2E)', () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_TEST_HOST,
      username: process.env.DB_TEST_ADMIN_USER,
      password: process.env.DB_TEST_ADMIN_PASS,
      database: 'test_migrations_db',
      entities: ['src/**/*.entity.ts'],
      migrations: ['src/database/migrations/**/*.ts'],
      synchronize: false,
    });

    await dataSource.initialize();
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  it('should run all migrations forward and backward', async () => {
    // Run all migrations
    await dataSource.runMigrations();
    const afterUp = await getTableCount(dataSource);

    // Rollback all
    await dataSource.undoLastMigration();
    const afterDown = await getTableCount(dataSource);

    // Should restore to previous state
    expect(afterDown).toBeLessThan(afterUp);

    // Re-apply (idempotency check)
    await dataSource.runMigrations();
    const afterReRun = await getTableCount(dataSource);
    expect(afterReRun).toBe(afterUp);
  });

  it('should preserve RLS policies after migration', async () => {
    await dataSource.runMigrations();

    const policies = await dataSource.query(`
      SELECT policyname, tablename
      FROM pg_policies
      WHERE schemaname = 'public'
    `);

    expect(policies.length).toBeGreaterThan(0);
    expect(policies.map((p) => p.policyname)).toContain(
      'tenant_isolation_policy',
    );
  });
});
```

## Common Pitfalls & Solutions

### 1. Adding NOT NULL Column Without Default

```typescript
// ❌ FAILS: Existing rows have NULL
export class AddInvoiceType1766506000008 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'invoices',
      new TableColumn({
        name: 'type',
        type: 'varchar',
        isNullable: false, // ← Problem!
      }),
    );
  }
}

// ✅ WORKS: Add with default first
export class AddInvoiceType1766506000008 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Add nullable
    await queryRunner.addColumn(
      'invoices',
      new TableColumn({
        name: 'type',
        type: 'varchar',
        isNullable: true,
      }),
    );

    // Step 2: Set default for existing rows
    await queryRunner.query(`
      UPDATE invoices SET type = 'INVOICE' WHERE type IS NULL;
    `);

    // Step 3: Make NOT NULL
    await queryRunner.query(`
      ALTER TABLE invoices ALTER COLUMN type SET NOT NULL;
    `);
  }
}
```

### 2. Migration Filename Conflicts

```bash
# ❌ Two developers create migrations at same time
# Both name: 1766506000008-AddFeature.ts
# Git merge conflict!

# ✅ SOLUTION: Use timestamp prefix (auto on generate)
# 1766506000008-AddFeatureA.ts (created by Dev A)
# 1766506000009-AddFeatureB.ts (created by Dev B)
# TypeORM runs in order, no conflicts
```

### 3. Down Migration Incompleteness

```typescript
// ❌ BAD: down() doesn't fully reverse up()
export class AddInvoiceIndexes1766506000009 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn('invoices', new TableColumn({ name: 'type', ... }));
    await queryRunner.query(`CREATE INDEX idx_invoices_type ON invoices (type)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ❌ Only drops index, column still exists!
    await queryRunner.query(`DROP INDEX idx_invoices_type`);
  }
}

// ✅ GOOD: Fully reverse all changes
export class AddInvoiceIndexes1766506000009 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn('invoices', new TableColumn({ name: 'type', ... }));
    await queryRunner.query(`CREATE INDEX idx_invoices_type ON invoices (type)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX idx_invoices_type`);
    await queryRunner.dropColumn('invoices', 'type');
  }
}
```

### 4. Synchronize Enabled in Production

```typescript
// ❌ DANGEROUS
export const AppDataSource = new DataSource({
  synchronize: true, // ← Auto-creates tables!
  // Can silently drop columns, alter indexes, etc.
});

// ✅ SAFE
export const AppDataSource = new DataSource({
  synchronize: false, // ← Explicit control only
  // Schema changes only via migrations
});
```

## Emergency Procedures

### Rollback Last Migration

```bash
pnpm migration:revert
```

This runs the `down()` method of the last executed migration.

### Rollback Specific Migration

```bash
# Manually revert to specific point
psql -h 10.0.0.11 -U erp -d erp_dev_db
DELETE FROM migrations WHERE name = 'AddInvoiceIndexes1766506000009';

# Then revert in code
pnpm migration:revert
```

### Full Cleanup (Development Only)

```bash
# WARNING: Deletes all data!
pnpm db:reset

# Recreates from db:setup, then runs all migrations
pnpm migration:run
```

## Deployment Checklist

Before deploying a new app version with migrations:

- [ ] All migrations generated and committed to Git
- [ ] Migration down() methods tested locally
- [ ] Data migration scripts tested on staging environment
- [ ] Estimated migration time < maintenance window
- [ ] Backup taken before migration run
- [ ] Rollback plan documented (if needed)
- [ ] RLS policies reviewed (multi-tenant impact)
- [ ] Audit triggers still active post-migration
- [ ] Indexes created for new columns
- [ ] App version is compatible with old + new schema

## Summary: The Right Way

```bash
# 1. Make entity change
# Edit src/modules/*/entities/*.entity.ts

# 2. Generate migration (TypeORM auto-detects changes)
pnpm migration:generate -- --name DescribeYourChange

# 3. Review the SQL
git diff src/database/migrations/

# 4. Test locally
pnpm db:reset && pnpm migration:run && pnpm start:dev

# 5. Commit both entity and migration
git add src/modules/*/entities/*.entity.ts
git add src/database/migrations/*.ts
git commit -m "feat: describe change (auto-generated migration)"

# 6. In CI/CD: Run migrations before deploying app
pnpm migration:run
docker deploy my-app:v1.2.0

# 7. Monitor in production
# - Check logs for migration errors
# - Verify audit_logs records the schema changes
# - Test app functionality with new schema
```

---

**Last Updated:** December 2025  
**Related Docs:** [Architecture](./architecture.md) | [Development](./development.md) | [Testing](./testing.md)
