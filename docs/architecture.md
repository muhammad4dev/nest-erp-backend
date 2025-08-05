# Core Architecture

This document describes the foundational design principles and architectural patterns used in the NestJS ERP.

## 1. Primary Keys & Identity (UUID v7)

Following the **Senior Lead Architect** rules, all primary keys in the system are **UUID v7**.

- **Why**: UUID v7 is time-ordered (sortable), which improves database indexing performance compared to random UUIDs while maintaining global uniqueness.
- **Implementation**: Primary keys are defined using `@PrimaryGeneratedColumn('uuid')`. PostgreSQL 18+ handles the underlying storage.

## 2. Multi-Tenant Isolation (Row-Level Security)

Every security-sensitive table in the database contains a `tenant_id` column. We enforce isolation at the **Postgres level** using **Row-Level Security (RLS)**.

- **Mechanism**:
  - Every query is executed after setting a session variable: `SET app.current_tenant_id = '...'`.
  - Postgres Policies (`USING (tenant_id = current_setting('app.current_tenant_id')::uuid)`) ensure that a tenant can never see another tenant's rows, even if the application code has a bug.
- **DB role requirement**: The application must connect with a **non-superuser, non-table-owner** role. Superusers (and owners without `FORCE ROW LEVEL SECURITY`) can bypass RLS, so the app role must not be able to do that.
- **Minimal production-safe DB bootstrap** (shared DB, RLS enforced):

  ```sql
  -- 1) Create the application role (no SUPERUSER, no BYPASSRLS)
  CREATE ROLE erp_app WITH LOGIN PASSWORD '<strong-password>';

  -- 2) Create the database owned by a DBA role (e.g., postgres)
  CREATE DATABASE erp OWNER postgres;

  \c erp

  -- 3) Install required extensions
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  CREATE EXTENSION IF NOT EXISTS "pgcrypto";

  -- 4) Grant only needed privileges to the app role
  GRANT CONNECT ON DATABASE erp TO erp_app;
  GRANT USAGE ON SCHEMA public TO erp_app;
  GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO erp_app;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO erp_app;

  -- 5) Enable and force RLS on security-sensitive tables (example: users)
  ALTER TABLE users ENABLE ROW LEVEL SECURITY;
  ALTER TABLE users FORCE ROW LEVEL SECURITY;
  CREATE POLICY users_isolation ON users
    FOR ALL TO public
    USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
  ```

- **Safety**: "The Leak Test" (integrated in CI) verifies that cross-tenant access is impossible.

## 3. Audit Logging (Trigger-Based)

We follow a "Never Delete" policy. All mutations are tracked in the `system_audit_logs` table.

- **Implementation**:
  - PL/pgSQL triggers (`audit_trigger_func`) automatically capture `INSERT`, `UPDATE`, and `DELETE` events.
  - The audit log captures `old_data`, `new_data`, and the `changed_by` user ID.
  - **Recursion Prevention**: The trigger is explicitly excluded from the `system_audit_logs` table itself.

## 4. Double-Entry Bookkeeping

The Finance module follows strict accounting standards.

- **Rule**: Every ledger entry must balance to zero (`Debits + Credits = 0`).
- **Isolation**: Each ledger is scoped to a `tenant_id`.

## 5. Modular Monolith

The application is structured into domain-specific modules (Finance, Inventory, Identity, etc.).

- **Identity Module**: Promoted to `@Global()` to provide RBAC and Tenant Context to all other modules without circular dependencies.
- **Communication**: Modules interact via services. Cross-module data consistency is maintained via TypeORM transactions where necessary.
