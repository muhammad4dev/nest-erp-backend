# RLS-Safe Multi-Tenant Database Setup - Visual Architecture

## Request-to-Database Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ HTTP Request                                                     │
│ Headers: { x-tenant-id: "uuid-tenant-a" }                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────┐
        │  TenantMiddleware              │
        │  Extract x-tenant-id header    │
        │  Store in TenantContext        │
        └────────────────┬───────────────┘
                         │
                         ▼
        ┌────────────────────────────────┐
        │  TenantContext (AsyncLocal)    │
        │  tenantId = "uuid-tenant-a"    │
        │  Available throughout request  │
        └────────────────┬───────────────┘
                         │
                         ▼
        ┌────────────────────────────────────┐
        │  Controller Handler                │
        │  Calls Service.getUsers()          │
        └────────────────┬───────────────────┘
                         │
                         ▼
        ┌────────────────────────────────┐
        │  Service Layer                 │
        │  Reads TenantContext           │
        │  Executes TypeORM query        │
        └────────────────┬───────────────┘
                         │
                         ▼
        ┌────────────────────────────────────────┐
        │  TenantSubscriber                      │
        │  Intercepts database query             │
        │  Executes: SET LOCAL                   │
        │    app.current_tenant_id = 'uuid-...  │
        └────────────────┬───────────────────────┘
                         │
                         ▼
   ┌─────────────────────────────────────────────┐
   │ PostgreSQL Database                         │
   │ ┌─────────────────────────────────────────┐ │
   │ │ Query with Session Variable Set:        │ │
   │ │ app.current_tenant_id = "uuid-tenant-a" │ │
   │ └─────────────────────────────────────────┘ │
   │                                              │
   │ ┌─────────────────────────────────────────┐ │
   │ │ RLS Policy Evaluation:                  │ │
   │ │ SELECT * FROM users                     │ │
   │ │ WHERE tenant_id = current_setting(...)  │ │
   │ └─────────────────────────────────────────┘ │
   │                                              │
   │ ┌─────────────────────────────────────────┐ │
   │ │ Return Results:                         │ │
   │ │ Only rows where tenant_id = "uuid-...   │ │
   │ │ All other tenant data blocked           │ │
   │ └─────────────────────────────────────────┘ │
   └────────────────┬────────────────────────────┘
                    │
                    ▼
        ┌──────────────────────────┐
        │ Response                 │
        │ [user1, user2, ...]      │
        │ (Only tenant-a users)    │
        └──────────────────────────┘
```

## Two-Phase Database Setup Architecture

```
┌────────────────────────────────────────────────────────────────┐
│ Application Startup: npm run db:setup                              │
└────────────────┬─────────────────────────────────────────────────┘
                 │
         ┌───────▼────────┐
         │ Load Config    │
         │ from .env      │
         └───────┬────────┘
                 │
    ┌────────────┴────────────┐
    │                         │
    ▼                         ▼
┌─────────────────┐   ┌──────────────────┐
│ PHASE 1: ADMIN  │   │ PHASE 2: SCHEMA  │
│ Setup           │   │ Initialization   │
└────────┬────────┘   └─────────┬────────┘
         │                      │
         │ (if DB_ADMIN_USER)   │ (always runs)
         │                      │
         ▼                      ▼
    Connect as              Connect as
    postgres/admin          erp/app_pass
         │                      │
         ├─ CREATE ROLE         ├─ CREATE EXTENSION
         │  erp (non-super)     │  uuid-ossp, pgcrypto
         │                      │
         ├─ CREATE DATABASE     ├─ Synchronize Schema
         │  erp_db OWNER        │  (TypeORM)
         │  postgres            │
         │                      ├─ Apply RLS Policies
         └─ GRANT Privileges    │  (from rls_setup.sql)
            SELECT              │
            INSERT              └─ Install Audit Triggers
            UPDATE                 (from audit_trigger.sql)
            DELETE
            ON ALL TABLES
```

## Multi-Tenant Data Isolation

```
┌─────────────────────────────────────────────────────────────┐
│ PostgreSQL Database Instance (Shared)                        │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Public Schema                                         │ │
│  │                                                       │ │
│  │ ┌──────────────────────────────────────────────────┐ │ │
│  │ │ users table (with RLS enabled)                   │ │ │
│  │ ├──────────────────────────────────────────────────┤ │ │
│  │ │ id            │ tenant_id         │ email        │ │ │
│  │ ├────────────────────────────────────────────────────┤ │ │
│  │ │ uuid-user-1   │ uuid-tenant-a ✓   │ alice@... ✓  │ │ │
│  │ │ uuid-user-2   │ uuid-tenant-a ✓   │ bob@...   ✓  │ │ │
│  │ │ uuid-user-3   │ uuid-tenant-b ✗   │ charlie@..✗ │ │ │
│  │ │ uuid-user-4   │ uuid-tenant-b ✗   │ diana@...  ✗ │ │ │
│  │ └──────────────────────────────────────────────────┘ │ │
│  │                                                       │ │
│  │ Policy: WHERE tenant_id = current_setting(...'::uuid│ │
│  └───────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘

REQUEST FROM TENANT A                REQUEST FROM TENANT B
(x-tenant-id: uuid-tenant-a)        (x-tenant-id: uuid-tenant-b)

SET LOCAL                           SET LOCAL
app.current_tenant_id =             app.current_tenant_id =
"uuid-tenant-a";                    "uuid-tenant-b";

SELECT * FROM users;                SELECT * FROM users;

RETURNS:                            RETURNS:
✓ alice@...                         ✓ charlie@...
✓ bob@...                           ✓ diana@...
✗ charlie@... (blocked by RLS)     ✗ alice@... (blocked by RLS)
✗ diana@... (blocked by RLS)       ✗ bob@... (blocked by RLS)
```

## Security Layers

```
┌───────────────────────────────────────────────────────────────┐
│ Layer 1: PostgreSQL Role Privileges                            │
│ ┌─────────────────────────────────────────────────────────────┐
│ │ ✅ App role is NON-SUPERUSER (cannot bypass RLS)            │
│ │ ✅ App role is NOT table owner (cannot alter schema)        │
│ │ ✅ App role has minimal privileges (SELECT, INSERT, etc)    │
│ └─────────────────────────────────────────────────────────────┘
│
│ Layer 2: PostgreSQL RLS Policies                               │
│ ┌─────────────────────────────────────────────────────────────┐
│ │ ✅ Every security-sensitive table has RLS enabled           │
│ │ ✅ Policies use session variable: current_setting(...)      │
│ │ ✅ Policies use USING/WITH CHECK clauses                    │
│ └─────────────────────────────────────────────────────────────┘
│
│ Layer 3: Session Variable Control                              │
│ ┌─────────────────────────────────────────────────────────────┐
│ │ ✅ Set by TenantSubscriber (TypeORM hook)                   │
│ │ ✅ Read from TenantContext (AsyncLocalStorage)              │
│ │ ✅ Set with SET LOCAL (transaction-scoped)                  │
│ └─────────────────────────────────────────────────────────────┘
│
│ Layer 4: Application-Level Checks                              │
│ ┌─────────────────────────────────────────────────────────────┐
│ │ ✅ TenantMiddleware enforces x-tenant-id header             │
│ │ ✅ TenantContext validates tenant ID before queries         │
│ │ ✅ Services check permissions (RBAC)                        │
│ └─────────────────────────────────────────────────────────────┘
│
└───────────────────────────────────────────────────────────────┘

RESULT: Tenant isolation enforced at PostgreSQL level
        (application bugs cannot cause data leakage)
```

## Connection Management

```
┌──────────────────────────────────────────────────────────────┐
│ Initial Setup (One-Time)                                      │
│                                                               │
│ Admin Connection (postgres/superuser)                         │
│ ├─ CREATE ROLE erp WITH LOGIN PASSWORD '...'                │
│ ├─ CREATE DATABASE erp_db OWNER postgres                    │
│ └─ GRANT privileges TO erp                                  │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ Runtime (Application Active)                                  │
│                                                               │
│ App Connection Pool (erp/app_password)                       │
│ ├─ Pool Size: 5-20 connections                              │
│ ├─ Each query sets: SET LOCAL app.current_tenant_id = ...   │
│ ├─ RLS policies filter data per tenant                       │
│ └─ Transaction scoped (resets after commit/rollback)        │
└──────────────────────────────────────────────────────────────┘

Key Point: Separate admin and app roles
           Admin role: Trusted, setup-only
           App role: Limited privileges, multi-tenant safe
```

## File Structure

```
nest-erp/
│
├── scripts/
│   └── setup-db.ts                    # 220+ lines of RLS-safe bootstrap
│       ├── loadConfig()                # Read .env variables
│       ├── setupAdminConnection()     # Phase 1: Create role/DB
│       └── setupSchema()               # Phase 2: Migrations/RLS/Triggers
│
├── src/
│   ├── database/
│   │   ├── scripts/
│   │   │   └── rls_setup.sql          # RLS policies for all tables
│   │   ├── migrations/
│   │   │   └── audit_trigger.sql      # PL/pgSQL audit function
│   │   └── data-source.ts             # TypeORM configuration
│   │
│   ├── common/
│   │   ├── middleware/
│   │   │   └── tenant.middleware.ts   # Extract x-tenant-id header
│   │   └── context/
│   │       └── tenant.context.ts      # AsyncLocalStorage for tenant ID
│   │
│   └── database/
│       └── subscribers/
│           └── tenant.subscriber.ts   # Set session variable for RLS
│
└── docs/
    ├── db-setup.md                    # Comprehensive setup guide
    ├── architecture.md                # Multi-tenant design
    └── testing.md                     # How to test RLS
```

## Environment Variables

```bash
# Phase 1 Only (Initial Setup with Admin)
DB_ADMIN_USER=postgres              # Admin username (superuser)
DB_ADMIN_PASS=admin_password        # Admin password

# Both Phases (Always Required)
DB_USERNAME=erp                     # App role username
DB_PASSWORD=erp_password            # App role password
DB_DATABASE=erp_db                  # Database name
DB_HOST=localhost                   # PostgreSQL host
DB_PORT=5432                        # PostgreSQL port

# Usage:
# Initial:  DB_ADMIN_USER=... DB_ADMIN_PASS=... npm run db:setup
# Update:   DB_USERNAME=... DB_PASSWORD=... npm run db:setup
```

## Security Guarantees Matrix

```
Threat                          Mitigation                  Level
─────────────────────────────────────────────────────────────
Cross-tenant data access        RLS policies                DATABASE
App bug exposes data            Non-superuser app role      DATABASE
DML attack (INSERT cross-tenant) RLS WITH CHECK clause      DATABASE
DDL attack (ALTER schema)       App has no ALTER privilege  DATABASE
Audit log tampering             PL/pgSQL triggers           DATABASE
Password exposure                Separate admin/app creds    OPERATIONAL
Direct SQL injection             Parameterized queries       APPLICATION
Unauthorized operations          RBAC guards                 APPLICATION
```
