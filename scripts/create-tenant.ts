/**
 * Tenant Creation & Management Script
 *
 * Usage:
 *
 * 1. Interactive Mode (Wizard):
 *    npx ts-node scripts/create-tenant.ts
 *
 * 2. Create New Tenant:
 *    npx ts-node scripts/create-tenant.ts <TENANT_NAME> <ADMIN_EMAIL> <ADMIN_PASSWORD>
 *    Example: npx ts-node scripts/create-tenant.ts "Acme Corp" "admin@acme.com" "password123"
 *
 * 3. Refresh Tenant Admin Permissions:
 *    npx ts-node scripts/create-tenant.ts <TENANT_ID_OR_NAME>
 *    Example: npx ts-node scripts/create-tenant.ts "Acme Corp"
 *
 * 4. Sync All User Permissions (Denormalization):
 *    npx ts-node scripts/create-tenant.ts sync-perms
 *
 * 5. Reset User Password (Interactive):
 *    npx ts-node scripts/create-tenant.ts reset-password
 *    - Select a tenant from the list
 *    - Select a user to reset password
 *    - Choose whether to use generated password or enter a new one
 *
 *    Optional: Pre-generate password (will still be interactive for tenant/user selection):
 *    npx ts-node scripts/create-tenant.ts reset-password "CustomPassword123"
 */

import 'dotenv/config';
import { AppDataSource } from '../src/database/data-source';
import { DataSource, QueryRunner } from 'typeorm';
import { hashPassword } from '../src/common/security/password.util';
import * as readline from 'readline';
import { User } from '../src/modules/identity/entities/user.entity';
import { Role } from '../src/modules/identity/entities/role.entity';
import { UserPermissionsService } from '../src/modules/identity/user-permissions.service';
import { PERMISSIONS } from '../src/modules/identity/constants/permissions.enum';

function generateRandomPassword(length: number): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

interface CreateInput {
  mode: 'CREATE';
  tenantName: string;
  adminEmail: string;
  adminPassword: string;
}

interface RefreshInput {
  mode: 'REFRESH';
  identifier: string;
}

interface SyncInput {
  mode: 'SYNC_PERMISSIONS';
}

interface InteractiveInput {
  mode: 'INTERACTIVE';
}

interface ResetPasswordInput {
  mode: 'RESET_PASSWORD';
  userEmail: string;
  newPassword: string;
}

type ParsedInput =
  | CreateInput
  | RefreshInput
  | SyncInput
  | InteractiveInput
  | ResetPasswordInput;

function parseArgs(): ParsedInput {
  const arg1 = process.argv[2];
  const arg2 = process.argv[3];
  const arg3 = process.argv[4];

  // Mode 1: Full creation (3 arguments)
  if (
    arg1 &&
    arg2 &&
    arg3 &&
    arg1 !== 'sync-perms' &&
    arg1 !== 'reset-password'
  ) {
    return {
      mode: 'CREATE',
      tenantName: arg1,
      adminEmail: arg2,
      adminPassword: arg3,
    };
  }

  // Mode 4: Sync Permissions (1 argument)
  if (arg1 === 'sync-perms') {
    return { mode: 'SYNC_PERMISSIONS' };
  }

  // Mode 5: Reset Password - always interactive, optional args ignored
  if (arg1 === 'reset-password') {
    const generatedPassword = arg2 || generateRandomPassword(12);
    return {
      mode: 'RESET_PASSWORD',
      userEmail: '',
      newPassword: generatedPassword,
    };
  }

  // Mode 2: Permission Refresh (1 argument)
  if (arg1) {
    return { mode: 'REFRESH', identifier: arg1 };
  }

  // Mode 3: Interactive
  return { mode: 'INTERACTIVE' };
}

function flattenPermissions(obj: Record<string, unknown>): string[] {
  const result: string[] = [];
  for (const key in obj) {
    const value = obj[key];
    if (typeof value === 'string') {
      result.push(value);
    } else if (value && typeof value === 'object') {
      result.push(...flattenPermissions(value as Record<string, unknown>));
    }
  }
  return result;
}

async function syncEnumPermissions(qr: QueryRunner) {
  console.log('  ✓ Syncing Enum permissions to database...');
  const flatPermissions = flattenPermissions(
    PERMISSIONS as unknown as Record<string, unknown>,
  );
  let syncedCount = 0;

  for (const perm of flatPermissions) {
    const parts = perm.split(':');
    if (parts.length < 2) {
      console.warn(`  ⚠ Invalid permission format: ${perm}`);
      continue;
    }
    const [action, resource] = parts;

    // Check if permission exists globally (system tenant 0000...) or just by action/resource
    // We assume permissions are global.
    const existing = (await qr.query(
      `SELECT 1 FROM permissions WHERE action = $1 AND resource = $2`,
      [action, resource],
    )) as Array<{ '?column?': number }>;

    if (existing.length === 0) {
      await qr.query(
        `INSERT INTO permissions (tenant_id, action, resource, description, created_at, updated_at, version)
         VALUES ('00000000-0000-0000-0000-000000000000', $1, $2, $3, now(), now(), 0)`,
        [action, resource, `Auto-synced: ${action} ${resource}`],
      );
      syncedCount++;
    }
  }
  if (syncedCount > 0) {
    console.log(`  ✓ Added ${syncedCount} new permissions from Enum.`);
  } else {
    console.log(`  ✓ All permissions already synced.`);
  }
}

/**
 * Ensures the 'admin' role exists for a tenant and has ALL permissions.
 */
async function syncAdminPermissions(qr: QueryRunner, tenantId: string) {
  // 0. Sync Enum permissions to DB first to ensure we have everything
  await syncEnumPermissions(qr);

  // 1. Ensure 'admin' role exists
  let roleId: string;
  const existingRole = (await qr.query(
    `SELECT id FROM roles WHERE tenant_id = $1 AND name = 'admin'`,
    [tenantId],
  )) as Array<{ id: string }>;

  if (existingRole.length > 0) {
    roleId = existingRole[0].id;
    console.log(`  ✓ Found existing 'admin' role: ${roleId}`);
  } else {
    console.log(`  ✓ Creating 'admin' role...`);
    const insertRole = (await qr.query(
      `INSERT INTO roles (tenant_id, name, description, created_at, updated_at, version)
       VALUES ($1, 'admin', 'Tenant administrator', now(), now(), 0)
       RETURNING id`,
      [tenantId],
    )) as Array<{ id: string }>;
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

async function createTenantAndAdmin(ds: DataSource, input: CreateInput) {
  // Validate input
  if (!input.tenantName || !input.tenantName.trim()) {
    throw new Error('Tenant name is required and cannot be empty.');
  }
  if (!input.adminEmail || !input.adminEmail.trim()) {
    throw new Error('Admin email is required and cannot be empty.');
  }
  if (!input.adminPassword || input.adminPassword.length < 8) {
    throw new Error(
      'Admin password is required and must be at least 8 characters.',
    );
  }

  const qr = ds.createQueryRunner();
  await qr.connect();

  try {
    const tableInfo = (await qr.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name='tenants' AND column_name IN ('is_active')
    `)) as Array<{ column_name: string }>;
    const hasIsActive = tableInfo.length > 0;

    await qr.startTransaction();

    let tenantId: string;
    if (hasIsActive) {
      const tenantInsert = (await qr.query(
        `INSERT INTO tenants (name, created_at, is_active) VALUES ($1, now(), true) RETURNING id`,
        [input.tenantName],
      )) as Array<{ id: string }>;
      tenantId = tenantInsert[0].id;
    } else {
      const tenantInsert = (await qr.query(
        `INSERT INTO tenants (name, created_at) VALUES ($1, now()) RETURNING id`,
        [input.tenantName],
      )) as Array<{ id: string }>;
      tenantId = tenantInsert[0].id;
    }

    await qr.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [
      tenantId,
    ]);

    const roleId = await syncAdminPermissions(qr, tenantId);
    const passwordHash = await hashPassword(input.adminPassword);

    const userInsert = (await qr.query(
      `INSERT INTO users (tenant_id, email, password_hash, is_active, created_at, updated_at, version)
       VALUES ($1, $2, $3, true, now(), now(), 0)
       RETURNING id`,
      [tenantId, input.adminEmail, passwordHash],
    )) as Array<{ id: string }>;
    const userId = userInsert[0].id;

    await qr.query(
      `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [userId, roleId],
    );

    // Sync denormalized permissions cache on users.permissions
    const txUserRepo = qr.manager.getRepository(User);
    const txRoleRepo = qr.manager.getRepository(Role);
    const txPermissionService = new UserPermissionsService(
      txUserRepo,
      txRoleRepo,
    );
    await txPermissionService.syncUserPermissions(userId);

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

    const tenants = (await qr.query(
      'SELECT id, name FROM tenants ORDER BY created_at DESC',
    )) as Array<{ id: string; name: string }>;
    if (tenants.length === 0) {
      console.log('No tenants found.');
      return;
    }

    console.log('\nAvailable Tenants:');
    tenants.forEach((t, i: number) =>
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

      const users = (await qr.query(
        'SELECT id, email FROM users WHERE tenant_id = $1',
        [tenant.id],
      )) as Array<{ id: string; email: string }>;
      if (users.length > 0) {
        console.log(`\nFound ${users.length} users in this tenant.`);
        const confirm = await askQuestion(
          rl,
          'Assign admin role to a specific user? (y/n): ',
        );

        if (confirm.toLowerCase() === 'y') {
          users.forEach((u, i: number) => console.log(`[${i + 1}] ${u.email}`));
          const uChoice = await askQuestion(rl, 'Select user number: ');
          const uIndex = parseInt(uChoice) - 1;
          if (users[uIndex]) {
            await qr.query(
              `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
              [users[uIndex].id, roleId],
            );

            // Sync denormalized permissions cache on users.permissions
            const txUserRepo = qr.manager.getRepository(User);
            const txRoleRepo = qr.manager.getRepository(Role);
            const txPermissionService = new UserPermissionsService(
              txUserRepo,
              txRoleRepo,
            );
            await txPermissionService.syncUserPermissions(users[uIndex].id);

            console.log(`  ✓ Admin role assigned to ${users[uIndex].email}`);
          }
        }
      }

      await qr.commitTransaction();
      console.log('\n✅ Success!');
    } catch (err) {
      await qr.rollbackTransaction();
      console.error(
        '  ❌ Error during permission refresh:',
        err instanceof Error ? err.message : err,
      );
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
    const tenants = (await qr.query(
      `SELECT id, name FROM tenants WHERE id::text = $1 OR name = $1 LIMIT 1`,
      [identifier],
    )) as Array<{ id: string; name: string }>;

    if (tenants.length === 0) {
      console.error(`❌ Tenant not found with ID or Name: ${identifier}`);
      process.exit(1);
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
      console.error(
        '  ❌ Error during permission refresh:',
        err instanceof Error ? err.message : err,
      );
      throw err;
    }
  } finally {
    await qr.release();
  }
}

async function handleSyncPermissions(ds: DataSource) {
  console.log('\nRunning manual permission sync for all users...');

  const qr = ds.createQueryRunner();
  await qr.connect();

  try {
    // 1. Get all tenants
    // We assume 'tenants' table is visible (common usage pattern)
    const tenants = (await qr.query('SELECT id, name FROM tenants')) as Array<{
      id: string;
      name: string;
    }>;
    console.log(`Found ${tenants.length} tenants. Iterating...`);

    if (tenants.length === 0) {
      console.log('  No tenants found. Exiting.');
      return;
    }

    let totalSynced = 0;

    for (const tenant of tenants) {
      console.log(`\nTenant: ${tenant.name} (${tenant.id})`);

      await qr.startTransaction();
      try {
        // 2. Set Tenant Context
        await qr.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [
          tenant.id,
        ]);

        // 3. Find users in this tenant
        // We query the DB directly to get IDs, then let the service sync them one by one.
        // The service uses 'userRepoBase' which will respect the RLS context we just set.
        const users = (await qr.query(
          'SELECT id, email FROM users WHERE tenant_id = $1',
          [tenant.id],
        )) as Array<{ id: string; email: string }>;

        if (users.length === 0) {
          console.log('  No users found.');
        } else {
          console.log(`  Syncing ${users.length} users...`);

          // Instantiate service with TRANSACTIONAL repositories
          // This ensures it shares the same connection where we set the tenant_id
          const txUserRepo = qr.manager.getRepository(User);
          const txRoleRepo = qr.manager.getRepository(Role);
          const txPermissionService = new UserPermissionsService(
            txUserRepo,
            txRoleRepo,
          );

          for (const u of users) {
            try {
              await txPermissionService.syncUserPermissions(u.id);
            } catch (userErr) {
              console.warn(
                `    ⚠ Failed to sync user ${u.email}:`,
                userErr instanceof Error ? userErr.message : userErr,
              );
            }
          }
          totalSynced += users.length;
        }

        await qr.commitTransaction();
      } catch (err) {
        console.error(
          `  ❌ Failed to sync tenant ${tenant.name}:`,
          err instanceof Error ? err.message : err,
        );
        await qr.rollbackTransaction();
      }
    }

    console.log(
      `\n✅ Permission sync complete. Total users synced: ${totalSynced}`,
    );
  } finally {
    await qr.release();
  }
}

async function handleResetPassword(ds: DataSource, input: ResetPasswordInput) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const qr = ds.createQueryRunner();
    await qr.connect();

    // Step 1: Select tenant
    const tenants = (await qr.query(
      'SELECT id, name FROM tenants ORDER BY created_at DESC',
    )) as Array<{ id: string; name: string }>;

    if (tenants.length === 0) {
      console.log('No tenants found.');
      return;
    }

    console.log('\nAvailable Tenants:');
    tenants.forEach((t, i: number) =>
      console.log(`[${i + 1}] ${t.name} (${t.id})`),
    );

    const tenantChoice = await askQuestion(rl, '\nSelect Tenant (number): ');
    const tenantIndex = parseInt(tenantChoice) - 1;

    if (
      isNaN(tenantIndex) ||
      tenantIndex < 0 ||
      tenantIndex >= tenants.length
    ) {
      console.error('Invalid tenant selection.');
      return;
    }

    const tenant = tenants[tenantIndex];
    console.log(`\nSelected Tenant: ${tenant.name}`);

    // Step 2: Set tenant context and get users
    await qr.query(`SELECT set_config('app.current_tenant_id', $1, false)`, [
      tenant.id,
    ]);

    // Query users - bypass RLS by setting it to null temporarily
    const users = (await qr.query(
      `SELECT id, email FROM users WHERE tenant_id = $1 ORDER BY email`,
      [tenant.id],
    )) as Array<{ id: string; email: string }>;

    if (users.length === 0) {
      console.log(`No users found in tenant: ${tenant.name}`);
      console.log('Please create users for this tenant first using:');
      console.log(
        `  npm run create:tenant "${tenant.name}" <email> <password>`,
      );
      await qr.release();
      return;
    }

    // Step 3: Select user
    console.log('\nAvailable Users:');
    users.forEach((u, i: number) => console.log(`[${i + 1}] ${u.email}`));

    const userChoice = await askQuestion(
      rl,
      '\nSelect User to reset password (number): ',
    );
    const userIndex = parseInt(userChoice) - 1;

    if (isNaN(userIndex) || userIndex < 0 || userIndex >= users.length) {
      console.error('Invalid user selection.');
      await qr.release();
      return;
    }

    const user = users[userIndex];

    // Step 4: Determine password
    let newPassword = input.newPassword;
    const useGenerated = await askQuestion(
      rl,
      `\nUse provided password: "${newPassword}"? (y/n): `,
    );

    if (useGenerated.toLowerCase() !== 'y') {
      newPassword = await askQuestion(rl, 'Enter new password: ');
      if (!newPassword || newPassword.length < 8) {
        console.error('Password must be at least 8 characters.');
        await qr.release();
        return;
      }
    }

    console.log(`\nResetting password for user: ${user.email}`);

    const passwordHash = await hashPassword(newPassword);

    await qr.startTransaction();
    try {
      const updated = (await qr.query(
        `UPDATE users SET password_hash = $1, version = version + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND tenant_id = $3 RETURNING id`,
        [passwordHash, user.id, tenant.id],
      )) as Array<{ id: string }>;

      if (updated.length === 0) {
        throw new Error('Failed to update user password');
      }

      await qr.commitTransaction();
      console.log('\n✅ Password reset successfully.');
      console.log(`\n📝 New password: ${newPassword}`);
      console.log('⚠️  Please share this password securely with the user.');
    } catch (err) {
      await qr.rollbackTransaction();
      console.error(
        '  ❌ Error during password reset:',
        err instanceof Error ? err.message : err,
      );
      throw err;
    } finally {
      await qr.release();
    }
  } finally {
    rl.close();
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
        await handleRefresh(AppDataSource, input.identifier);
        break;
      case 'INTERACTIVE':
        await handleInteractive(AppDataSource);
        break;
      case 'SYNC_PERMISSIONS':
        await handleSyncPermissions(AppDataSource);
        break;
      case 'RESET_PASSWORD':
        await handleResetPassword(AppDataSource, input);
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
