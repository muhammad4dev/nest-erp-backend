import 'dotenv/config';
import { AppDataSource } from '../src/database/data-source';
import { DataSource, QueryRunner } from 'typeorm';
import { hashPassword } from '../src/common/security/password.util';
import * as readline from 'readline';

interface Input {
  tenantName: string;
  adminEmail: string;
  adminPassword: string;
}

function parseArgs() {
  const arg1 = process.argv[2];
  const arg2 = process.argv[3];
  const arg3 = process.argv[4];

  // Mode 1: Full creation (3 arguments)
  if (arg1 && arg2 && arg3) {
    return {
      mode: 'CREATE',
      tenantName: arg1,
      adminEmail: arg2,
      adminPassword: arg3,
    };
  }

  // Mode 2: Permission Refresh (1 argument)
  if (arg1) {
    return { mode: 'REFRESH', identifier: arg1 };
  }

  // Mode 3: Interactive
  return { mode: 'INTERACTIVE' };
}

/**
 * Ensures the 'admin' role exists for a tenant and has ALL permissions.
 */
async function syncAdminPermissions(qr: QueryRunner, tenantId: string) {
  // 1. Ensure 'admin' role exists
  let roleId: string;
  const existingRole = await qr.query(
    `SELECT id FROM roles WHERE tenant_id = $1 AND name = 'admin'`,
    [tenantId],
  );

  if (existingRole.length > 0) {
    roleId = existingRole[0].id;
    console.log(`  ✓ Found existing 'admin' role: ${roleId}`);
  } else {
    console.log(`  ✓ Creating 'admin' role...`);
    const insertRole = await qr.query(
      `INSERT INTO roles (tenant_id, name, description, created_at, updated_at, version)
       VALUES ($1, 'admin', 'Tenant administrator', now(), now(), 0)
       RETURNING id`,
      [tenantId],
    );
    roleId = insertRole[0].id;
  }

  // 2. Grant ALL permissions to this role
  console.log(`  ✓ Syncing all permissions to 'admin' role...`);
  await qr.query(
    `INSERT INTO role_permissions (role_id, permission_id)
     SELECT $1, p.id
     FROM permissions p
     WHERE NOT EXISTS (
         SELECT 1 FROM role_permissions rp WHERE rp.role_id = $1 AND rp.permission_id = p.id
     )`,
    [roleId],
  );

  console.log(`  ✓ Permissions sync complete.`);
  return roleId;
}

async function createTenantAndAdmin(ds: DataSource, input: any) {
  const qr = ds.createQueryRunner();
  await qr.connect();

  try {
    const tableInfo = await qr.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name='tenants' AND column_name IN ('is_active')
    `);
    const hasIsActive = tableInfo.length > 0;

    await qr.startTransaction();

    let tenantId: string;
    if (hasIsActive) {
      const tenantInsert = await qr.query(
        `INSERT INTO tenants (name, created_at, is_active) VALUES ($1, now(), true) RETURNING id`,
        [input.tenantName],
      );
      tenantId = tenantInsert[0].id;
    } else {
      const tenantInsert = await qr.query(
        `INSERT INTO tenants (name, created_at) VALUES ($1, now()) RETURNING id`,
        [input.tenantName],
      );
      tenantId = tenantInsert[0].id;
    }

    await qr.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [
      tenantId,
    ]);

    const roleId = await syncAdminPermissions(qr, tenantId);
    const passwordHash = await hashPassword(input.adminPassword);

    const userInsert = await qr.query(
      `INSERT INTO users (tenant_id, email, password_hash, is_active, created_at, updated_at, version)
       VALUES ($1, $2, $3, true, now(), now(), 0)
       RETURNING id`,
      [tenantId, input.adminEmail, passwordHash],
    );
    const userId = userInsert[0].id;

    await qr.query(
      `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [userId, roleId],
    );

    await qr.commitTransaction();
    console.log('\n✅ Tenant and Admin User created successfully.');
  } catch (err) {
    await qr.rollbackTransaction();
    throw err;
  } finally {
    await qr.release();
  }
}

async function askQuestion(
  rl: readline.Interface,
  question: string,
): Promise<string> {
  return new Promise((resolve) =>
    rl.question(question, (answer) => resolve(answer.trim())),
  );
}

async function handleInteractive(ds: DataSource) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  try {
    const qr = ds.createQueryRunner();
    await qr.connect();

    const tenants = await qr.query(
      'SELECT id, name FROM tenants ORDER BY created_at DESC',
    );
    if (tenants.length === 0) {
      console.log('No tenants found.');
      return;
    }

    console.log('\nAvailable Tenants:');
    tenants.forEach((t: any, i: number) =>
      console.log(`[${i + 1}] ${t.name} (${t.id})`),
    );

    const choice = await askQuestion(
      rl,
      '\nSelect Tenant to refresh admin permissions (number): ',
    );
    const index = parseInt(choice) - 1;

    if (isNaN(index) || index < 0 || index >= tenants.length) {
      console.error('Invalid selection.');
      return;
    }

    const tenant = tenants[index];
    console.log(`\nRefreshing permissions for tenant: ${tenant.name}...`);

    await qr.startTransaction();
    try {
      await qr.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [
        tenant.id,
      ]);
      const roleId = await syncAdminPermissions(qr, tenant.id);

      const users = await qr.query(
        'SELECT id, email FROM users WHERE tenant_id = $1',
        [tenant.id],
      );
      if (users.length > 0) {
        console.log(`\nFound ${users.length} users in this tenant.`);
        const confirm = await askQuestion(
          rl,
          'Assign admin role to a specific user? (y/n): ',
        );

        if (confirm.toLowerCase() === 'y') {
          users.forEach((u: any, i: number) =>
            console.log(`[${i + 1}] ${u.email}`),
          );
          const uChoice = await askQuestion(rl, 'Select user number: ');
          const uIndex = parseInt(uChoice) - 1;
          if (users[uIndex]) {
            await qr.query(
              `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
              [users[uIndex].id, roleId],
            );
            console.log(`  ✓ Admin role assigned to ${users[uIndex].email}`);
          }
        }
      }

      await qr.commitTransaction();
      console.log('\n✅ Success!');
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  } finally {
    rl.close();
  }
}

async function handleRefresh(ds: DataSource, identifier: string) {
  const qr = ds.createQueryRunner();
  await qr.connect();
  try {
    const tenants = await qr.query(
      `SELECT id, name FROM tenants WHERE id::text = $1 OR name = $1 LIMIT 1`,
      [identifier],
    );

    if (tenants.length === 0) {
      console.error(`❌ Tenant not found with ID or Name: ${identifier}`);
      return;
    }

    const tenant = tenants[0];
    console.log(
      `\nRefreshing admin permissions for tenant: ${tenant.name} (${tenant.id})`,
    );

    await qr.startTransaction();
    try {
      await qr.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [
        tenant.id,
      ]);
      await syncAdminPermissions(qr, tenant.id);
      await qr.commitTransaction();
      console.log('\n✅ Done.');
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    }
  } finally {
    await qr.release();
  }
}

async function bootstrap() {
  const input = parseArgs();
  await AppDataSource.initialize();
  try {
    switch (input.mode) {
      case 'CREATE':
        await createTenantAndAdmin(AppDataSource, input);
        break;
      case 'REFRESH':
        await handleRefresh(AppDataSource, input.identifier!);
        break;
      case 'INTERACTIVE':
        await handleInteractive(AppDataSource);
        break;
    }
  } catch (err) {
    console.error('\n❌ Operation failed:');
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
  }
}

void bootstrap();
