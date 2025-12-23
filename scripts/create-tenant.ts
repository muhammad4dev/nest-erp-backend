import 'dotenv/config';
import { AppDataSource } from '../src/database/data-source';
import { DataSource, QueryRunner } from 'typeorm';
import { hashPassword } from '../src/common/security/password.util';

interface Input {
  tenantName: string;
  adminEmail: string;
  adminPassword: string;
}

function parseArgs(): Input {
  const tenantName = process.argv[2];
  const adminEmail = process.argv[3];
  const adminPassword = process.argv[4];

  if (!tenantName || !adminEmail || !adminPassword) {
    console.error(
      'Usage: pnpm ts-node -r tsconfig-paths/register scripts/create-tenant.ts <tenantName> <adminEmail> <adminPassword>',
    );
    process.exit(1);
  }

  return { tenantName, adminEmail, adminPassword };
}

async function createTenantAdminRole(
  qr: QueryRunner,
  tenantId: string,
): Promise<string> {
  const insertRole = (await qr.query(
    `INSERT INTO roles (tenant_id, name, description, created_at, updated_at, version)
     VALUES ($1, 'admin', 'Tenant administrator', now(), now(), 0)
     RETURNING id`,
    [tenantId],
  )) as Array<{ id: string }>;
  const roleId = insertRole[0].id;

  // Grant all permissions to the tenant admin role
  await qr.query(
    `INSERT INTO role_permissions (role_id, permission_id)
     SELECT $1, p.id
     FROM permissions p
     WHERE NOT EXISTS (
         SELECT 1 FROM role_permissions rp WHERE rp.role_id = $1 AND rp.permission_id = p.id
       )`,
    [roleId],
  );

  return roleId;
}

async function createTenantAndAdmin(ds: DataSource, input: Input) {
  const qr = ds.createQueryRunner();
  await qr.connect();

  try {
    // First, determine which columns exist in tenants table
    const tableInfo = (await qr.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name='tenants' AND column_name IN ('is_active')
    `)) as Array<{ column_name: string }>;
    const hasIsActive = tableInfo.length > 0;

    await qr.startTransaction();

    // Insert tenant with appropriate columns (DB generates UUID v7)
    let tenantId: string;
    if (hasIsActive) {
      const tenantInsert = (await qr.query(
        `INSERT INTO tenants (name, created_at, is_active)
         VALUES ($1, now(), true)
         RETURNING id`,
        [input.tenantName],
      )) as Array<{ id: string }>;
      tenantId = tenantInsert[0].id;
    } else {
      const tenantInsert = (await qr.query(
        `INSERT INTO tenants (name, created_at)
         VALUES ($1, now())
         RETURNING id`,
        [input.tenantName],
      )) as Array<{ id: string }>;
      tenantId = tenantInsert[0].id;
    }

    // Ensure RLS policies see the correct tenant context during role/user inserts.
    await qr.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [
      tenantId,
    ]);

    const roleId = await createTenantAdminRole(qr, tenantId);

    const passwordHash = await hashPassword(input.adminPassword);

    const userInsert = (await qr.query(
      `INSERT INTO users (tenant_id, email, password_hash, is_active, created_at, updated_at, version)
       VALUES ($1, $2, $3, true, now(), now(), 0)
       RETURNING id`,
      [tenantId, input.adminEmail, passwordHash],
    )) as Array<{ id: string }>;
    const userId = userInsert[0].id;

    await qr.query(
      `INSERT INTO user_roles (user_id, role_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [userId, roleId],
    );

    await qr.commitTransaction();

    console.log('✅ Tenant created');
    console.log(`  Tenant ID: ${tenantId}`);
    console.log('✅ Admin user created');
    console.log(`  Admin user ID: ${userId}`);
    console.log(`  Admin email: ${input.adminEmail}`);
    console.log('  (Password was provided via CLI input)');
  } catch (err) {
    await qr.rollbackTransaction();
    console.error('❌ Failed to create tenant/admin:');
    if (err instanceof Error) {
      console.error(`  Message: ${err.message}`);
      console.error(`  Stack: ${err.stack}`);
    } else {
      console.error(`  Error:`, err);
    }
    process.exit(1);
  } finally {
    await qr.release();
  }
}

async function bootstrap() {
  const input = parseArgs();
  await AppDataSource.initialize();
  try {
    await createTenantAndAdmin(AppDataSource, input);
  } finally {
    await AppDataSource.destroy();
  }
}

void bootstrap();
