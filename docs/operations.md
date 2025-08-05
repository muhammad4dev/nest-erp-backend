# Operations & Maintenance

This document covers database management, maintenance routines, and system-level operations.

## 1. Database Migrations

We use TypeORM CLI for all schema changes. **Manual SQL changes in production are strictly forbidden.**

| Command                   | Description                                            |
| :------------------------ | :----------------------------------------------------- |
| `npm run migration:generate` | Generate a new migration file based on entity changes. |
| `npm run migration:run`      | Apply all pending migrations.                          |
| `npm run migration:revert`   | Revert the last executed migration.                    |

- **Data Source**: The CLI uses `src/database/data-source.ts`.
- **Triggers/RLS**: These are integrated into the migration flow. See `DatabaseTriggersAndRLS` migration for implementation details.

## 2. Permission Synchronization

The system automatically synchronizes code-defined permissions with the database on application bootstrap.

- **Service**: `PermissionSyncService`
- **Source**: `src/modules/identity/constants/permissions.enum.ts`
- **Automatic Upsert**: New permissions added to the code will be created in the database during the next startup.

## 3. Audit Trails

Audit logs are stored in `system_audit_logs`.

- **Retention**: Periodic archiving of old logs should be managed via Postgres table partitioning (Future Work).
- **Querying**: Administrators can view logs via the `AuditLog` entity in the Identity module.

## 4. Disaster Recovery

- **Backup**: Use `pg_dump` for daily backups.
- **RLS Safety**: If RLS fails, the system defaults to "Deny All".
