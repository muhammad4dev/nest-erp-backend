# Database Setup & RLS-Safe Multi-Tenant Architecture

## Quick Start

### Initial Setup (with admin credentials)

```bash
DB_ADMIN_USER=postgres \
DB_ADMIN_PASS=your_admin_password \
DB_USERNAME=erp \
DB_PASSWORD=erp_password \
DB_DATABASE=erp_db \
DB_HOST=localhost \
npm run db:setup
```

### Subsequent Updates (app credentials only)

```bash
npm run db:setup
```

## Why TypeScript Instead of Shell Scripts?

This project uses **TypeScript** for database automation because:

1. **Consistency**: Runs in Node.js context alongside the application (no shell dependency)
2. **Error Handling**: Proper async/await and typed exceptions
3. **Type Safety**: Uses TypeORM's DataSource for type-safe queries
4. **Integration**: Can be called from build scripts, migrations, or CI/CD pipelines
5. **Environment Variables**: Native `process.env` without shell escaping complexity

## Architecture: RLS-Safe Multi-Tenant Database

### Problem Statement

Database-level multi-tenancy requires **Row-Level Security (RLS)** at PostgreSQL. However, RLS has a critical limitation:

**PostgreSQL superusers and table owners bypass RLS policies regardless of FORCE ROW LEVEL SECURITY configuration.**

This means:

- ❌ Application cannot connect as `postgres` (superuser)
- ❌ Application cannot connect as the database owner
- ✅ Application must connect as a **non-superuser, non-owner role**

### Solution: Two-Phase Setup

```
Phase 1: Admin Setup (run with postgres/admin credentials)
  ├── Create non-superuser app role (e.g., 'erp')
  ├── Create database owned by admin user (not the app role)
  └── Grant minimal privileges (SELECT, INSERT, UPDATE, DELETE only)

Phase 2: Schema Setup (run with app credentials)
  ├── Install PostgreSQL extensions
  ├── Synchronize TypeORM schema
  ├── Apply Row-Level Security policies
  └── Install PL/pgSQL audit triggers
```

### Why Separate Admin & App Connections?

| User  | Purpose           | Privileges    |
| ----- | ----------------- | ------------- |
| Admin | Creates DB & role | SUPERUSER     |
| App   | Queries with RLS  | Non-superuser |

This ensures:

- App cannot bypass RLS by being a superuser
- App cannot alter table structure (no ALTER TABLE privileges)
- Audit trails capture all mutations reliably
- Tenant isolation enforced at database level, not just application code

## How Multi-Tenant Isolation Works

### Request Flow

```
1. HTTP Request arrives with x-tenant-id header
   ↓
2. TenantMiddleware extracts tenant_id → stores in TenantContext (AsyncLocalStorage)
   ↓
3. TenantSubscriber reads TenantContext → executes:
   SET LOCAL app.current_tenant_id = 'tenant-uuid';
   ↓
4. RLS Policy evaluates:
   WHERE tenant_id = current_setting('app.current_tenant_id')::uuid
   ↓
5. Database returns only rows matching current tenant
```

### Example: users Table with RLS

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Each user can only see their own tenant's data
CREATE POLICY tenant_isolation_users ON users
FOR ALL
TO public
USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

When app user queries:

```typescript
// Inside TenantContext with tenant_id = 'uuid-of-tenant-a'
const users = await userRepository.find();
// Returns only users where tenant_id = 'uuid-of-tenant-a'

// Tenant B cannot see this data, even with direct SQL:
// SELECT * FROM users;
// → RLS blocks all rows from other tenants
```

## Database Schema

### Core Tables

All tables have:

- `id` (UUID primary key)
- `tenant_id` (UUID) - referenced in RLS policy
- `created_at`, `updated_at` (timestamps)
- `version` (optimistic locking)

### RLS Policies

Configured in [rls_setup.sql](../src/database/scripts/rls_setup.sql):

- `users` - App users scoped to tenant
- `roles` - RBAC scoped to tenant
- `system_audit_logs` - Audit trail scoped to tenant
- `accounts` - Finance accounts scoped to tenant
- `journal_entries`, `journal_lines` - Finance ledger scoped to tenant
- (and all other domain tables)

### Audit Triggers

Defined in [audit_trigger.sql](../src/database/migrations/audit_trigger.sql):

- Captures INSERT, UPDATE, DELETE on all monitored tables
- Records old_data, new_data, changed_by, tenant_id
- Immutable append-only log (no deletes)
- Scoped to current tenant via `current_setting('app.current_tenant_id')`

## File Structure

```
scripts/
  setup-db.ts                    # Main RLS-safe database bootstrap (this file)
    ├── loadConfig()              # Read env vars
    ├── setupAdminConnection()    # Phase 1: Create role + DB + grants
    └── setupSchema()             # Phase 2: Extensions + migrations + RLS + triggers

src/
  common/
    middleware/
      tenant.middleware.ts        # Extract x-tenant-id header
    context/
      tenant.context.ts           # AsyncLocalStorage for tenant ID
  database/
    scripts/
      rls_setup.sql              # RLS policies for all tables
    migrations/
      audit_trigger.sql          # PL/pgSQL audit trigger function
  config/
    database.config.ts           # TypeORM config (reads .env)
```

## Environment Variables

### Required (for initial setup)

```bash
# Admin credentials (only needed for initial setup)
DB_ADMIN_USER=postgres           # Superuser for creating role/DB
DB_ADMIN_PASS=admin_password     # Admin password

# App credentials (needed for all runs)
DB_USERNAME=erp                  # Non-superuser app role
DB_PASSWORD=erp_password         # App password
DB_DATABASE=erp_db               # Database name
DB_HOST=localhost                # PostgreSQL host
DB_PORT=5432                     # PostgreSQL port
```

### Optional

```bash
# If not provided, db:setup assumes database already exists
# (useful for development where you manually created the database)
```

## Usage Examples

### Development: Fresh Setup

```bash
# 1. Start PostgreSQL (if using Docker)
docker run --name postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:18

# 2. Create the ERP database with RLS-safe setup
DB_ADMIN_USER=postgres \
DB_ADMIN_PASS=postgres \
DB_USERNAME=erp \
DB_PASSWORD=erp_password \
DB_DATABASE=erp_db \
npm run db:setup

# 3. Start the application
npm run start:dev
```

### Development: With Existing Database

```bash
# If you already have the database but need schema sync
DB_USERNAME=erp \
DB_PASSWORD=erp_password \
DB_DATABASE=erp_db \
npm run db:setup
```

### Production Deployment

```bash
# Use strong passwords and secure .env handling
export DB_ADMIN_USER=prod_admin
export DB_ADMIN_PASS=$(aws secretsmanager get-secret-value --secret-id db-admin-pass --query SecretString --output text)
export DB_USERNAME=prod_app
export DB_PASSWORD=$(aws secretsmanager get-secret-value --secret-id db-app-pass --query SecretString --output text)
export DB_DATABASE=erp_prod
export DB_HOST=prod-db.example.com

npm run db:setup
npm run start:prod
```

### CI/CD Pipeline

```yaml
# GitHub Actions example
- name: Setup Database
  run: npm run db:setup
  env:
    DB_ADMIN_USER: postgres
    DB_ADMIN_PASS: ${{ secrets.DB_ADMIN_PASS }}
    DB_USERNAME: erp_ci
    DB_PASSWORD: ${{ secrets.DB_APP_PASS }}
    DB_DATABASE: erp_test_ci
    DB_HOST: localhost
```

## Verification

### Check RLS Policies Are Active

```sql
-- Connect as the app role
psql -U erp -h localhost -d erp_db

-- List all policies
SELECT schemaname, tablename, policyname FROM pg_policies;

-- Should show policies for: users, roles, accounts, journal_entries, etc.
```

### Test Tenant Isolation

```sql
-- As app user (erp), set tenant context
SET LOCAL app.current_tenant_id = '00000000-0000-0000-0000-000000000001';

-- Create test data
INSERT INTO users (id, tenant_id, email, ...)
VALUES ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'user1@test.com', ...);

-- This succeeds (data belongs to current tenant)
SELECT * FROM users;
-- Returns: 1 row

-- Now switch tenant context
SET LOCAL app.current_tenant_id = '00000000-0000-0000-0000-000000000002';

-- RLS blocks access to first tenant's data
SELECT * FROM users;
-- Returns: 0 rows (empty)
```

## Troubleshooting

### "RLS Policy not found" error

**Cause**: `rls_setup.sql` not loaded during schema setup

**Solution**: Ensure file exists at `src/database/scripts/rls_setup.sql` and is properly formatted

```bash
npm run db:setup  # Re-run setup to apply policies
```

### "Permission denied" on INSERT/UPDATE/DELETE

**Cause**: Grants not applied to app role

**Solution**: Re-run setup with admin credentials

```bash
DB_ADMIN_USER=postgres DB_ADMIN_PASS=... npm run db:setup
```

### "Insufficient privilege for ALTER TABLE"

**Cause**: App role has ALTER TABLE privilege (incorrect setup)

**Solution**: This is intentional! App should not modify schema directly. Use migrations:

```bash
npm run migration:generate -- --name FeatureName
npm run migration:run
```

### Cannot connect with app credentials

**Cause**: Role doesn't exist or password wrong

**Solution**: Re-run admin setup phase

```bash
DB_ADMIN_USER=postgres DB_ADMIN_PASS=... npm run db:setup
```

## Key Differences from Naive Multi-Tenancy

| Aspect           | Naive (Bad)          | RLS-Safe (Good)                  |
| ---------------- | -------------------- | -------------------------------- |
| Isolation Level  | Application code     | PostgreSQL RLS policies          |
| Superuser Risk   | ❌ Bypasses checks   | ✅ Enforced at DB level          |
| Schema Ownership | App user owns tables | Admin owns tables, app accesses  |
| Privilege Check  | Runtime, error-prone | Declarative, deterministic       |
| Audit Trail      | Application-logged   | PL/pgSQL trigger (immutable)     |
| Testing          | Hard to verify leaks | E2E tests verify RLS enforcement |

## Related Files

- [Architecture Documentation](./architecture.md) - Complete multi-tenant design
- [Testing Guide](./testing.md) - How to test RLS isolation
- [RLS Policies](../src/database/scripts/rls_setup.sql) - SQL policy definitions
- [Audit Triggers](../src/database/migrations/audit_trigger.sql) - Trigger implementation
- [TenantMiddleware](../src/common/middleware/tenant.middleware.ts) - Request-scoped context
