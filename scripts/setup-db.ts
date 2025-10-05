import * as dotenv from 'dotenv';
import * as path from 'path';

// Load appropriate .env file based on NODE_ENV
if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: path.resolve(__dirname, '../.env.test') });
} else {
  dotenv.config();
}

import { DataSource, DataSourceOptions } from 'typeorm';
import * as fs from 'fs';
import { databaseConfig } from '../src/config/database.config';
import { ensureUuidV7Defaults } from '../src/database/migrations/utils/ensure-uuidv7-defaults';

/**
 * RLS-Safe Database Setup Script
 *
 * This script automates the creation of a secure multi-tenant database using:
 * - Non-superuser app role (prevents RLS bypass)
 * - Admin-owned database (not app-owned)
 * - Row-Level Security (RLS) policies
 * - PL/pgSQL audit triggers
 *
 * Usage:
 *   # Initial setup with admin credentials
 *   DB_ADMIN_USER=postgres DB_ADMIN_PASS=... pnpm db:setup
 *
 *   # Subsequent runs (app credentials only)
 *   pnpm db:setup
 */

interface SetupConfig {
  adminUser: string;
  adminPass: string;
  appUser: string;
  appPass: string;
  dbName: string;
  dbHost: string;
  dbPort: number;
}

function loadConfig(): SetupConfig {
  const adminUser = process.env.DB_ADMIN_USER || process.env.DB_USERNAME || '';
  const adminPass = process.env.DB_ADMIN_PASS || process.env.DB_PASSWORD || '';
  const appUser = process.env.DB_USERNAME || '';
  const appPass = process.env.DB_PASSWORD || '';
  const dbName = process.env.DB_DATABASE || '';
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = parseInt(process.env.DB_PORT || '5432', 10);

  return { adminUser, adminPass, appUser, appPass, dbName, dbHost, dbPort };
}

async function setupAdminConnection(config: SetupConfig): Promise<void> {
  const { adminUser, adminPass, appUser, appPass, dbName, dbHost, dbPort } =
    config;

  if (!adminUser || !adminPass || !appUser || !appPass || !dbName) {
    console.warn(
      '⚠️  Skipping admin setup: missing DB_ADMIN_USER, DB_ADMIN_PASS, DB_USERNAME, DB_PASSWORD, or DB_DATABASE',
    );
    console.warn('   (This is OK if database already exists)');
    return;
  }

  const adminDataSource = new DataSource({
    type: 'postgres',
    host: dbHost,
    port: dbPort,
    username: adminUser,
    password: adminPass,
    database: 'postgres',
  });

  try {
    await adminDataSource.initialize();
    const adminQueryRunner = adminDataSource.createQueryRunner();
    await adminQueryRunner.connect();

    try {
      console.log('🔐 Setting up RLS-safe multi-tenant database...');

      console.log(`  ✓ Creating non-superuser app role '${appUser}'...`);
      // Check if role exists first
      const roleCheck = (await adminQueryRunner.query(
        `SELECT 1 FROM pg_roles WHERE rolname = '${appUser}'`,
      )) as Array<{ [key: string]: unknown }>;
      if (roleCheck.length === 0) {
        await adminQueryRunner.query(
          `CREATE ROLE ${appUser} WITH LOGIN PASSWORD '${appPass}'`,
        );
      }

      console.log(`  ✓ Creating database '${dbName}' (admin-owned)...`);
      // Check if database exists first (must query from postgres database)
      const dbCheck = (await adminQueryRunner.query(
        `SELECT 1 FROM pg_database WHERE datname = '${dbName}'`,
      )) as Array<{ [key: string]: unknown }>;
      if (dbCheck.length === 0) {
        await adminQueryRunner.query(
          `CREATE DATABASE ${dbName} OWNER ${adminUser}`,
        );
      }

      console.log(`  ✓ Granting minimal privileges to app role...`);
      const targetDataSource = new DataSource({
        type: 'postgres',
        host: dbHost,
        port: dbPort,
        username: adminUser,
        password: adminPass,
        database: dbName,
      });
      await targetDataSource.initialize();
      const targetRunner = targetDataSource.createQueryRunner();
      await targetRunner.connect();

      try {
        // PostgreSQL 18 has native gen_random_uuid() - no extension needed
        // TypeORM's uuidExtension: 'pgcrypto' option uses gen_random_uuid() (not uuid_generate_v4)

        const queries = [
          `GRANT CONNECT ON DATABASE ${dbName} TO ${appUser};`,
          `GRANT USAGE ON SCHEMA public TO ${appUser};`,
          `GRANT CREATE ON SCHEMA public TO ${appUser};`,
          `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${appUser};`,
          `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${appUser};`,
          `GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${appUser};`,
          `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO ${appUser};`,
        ];

        for (const query of queries) {
          await targetRunner.query(query);
        }

        console.log(
          '  ✓ Admin setup complete. Database ready for schema initialization.',
        );
      } finally {
        await targetRunner.release();
        await targetDataSource.destroy();
      }
    } finally {
      await adminQueryRunner.release();
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes('already exists')) {
      console.log('  ℹ️  Database already exists; skipping creation.');
    } else {
      console.error('  ❌ Admin setup error:', err);
      throw err;
    }
  } finally {
    await adminDataSource.destroy();
  }
}

async function setupSchema(): Promise<void> {
  const config = loadConfig();

  // CRITICAL: Create tables as admin user, NOT app user
  // If tables are owned by app user, RLS policies won't apply to that user
  const adminDataSource = new DataSource({
    type: 'postgres',
    host: config.dbHost,
    port: config.dbPort,
    username: config.adminUser,
    password: config.adminPass,
    database: config.dbName,
    entities: [path.join(__dirname, '../src/**/*.entity.ts')],
    synchronize: false,
    logging: false,
  } as DataSourceOptions);

  await adminDataSource.initialize();
  const queryRunner = adminDataSource.createQueryRunner();
  await queryRunner.connect();

  try {
    console.log('\n📋 Initializing schema and security...');

    console.log('  ✓ Synchronizing database schema (as admin)...');
    await adminDataSource.synchronize(true);

    console.log('  ✓ Migrating UUID defaults to v7 (time-ordered)...');
    await ensureUuidV7Defaults(queryRunner);

    console.log('  ✓ Applying Row-Level Security policies...');
    const rlsSql = fs.readFileSync(
      path.join(__dirname, '../src/database/scripts/rls_setup.sql'),
      'utf8',
    );
    await queryRunner.query(rlsSql);

    console.log('  ✓ Installing audit trigger function...');
    const auditSql = fs.readFileSync(
      path.join(__dirname, '../src/database/migrations/audit_trigger.sql'),
      'utf8',
    );
    await queryRunner.query(auditSql);

    const policiesResult = (await queryRunner.query(
      "SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public' LIMIT 5",
    )) as Array<{ policyname: string }>;

    if (policiesResult && policiesResult.length > 0) {
      console.log(
        `  ✓ RLS policies active: ${policiesResult.length} policy(ies) found`,
      );
    }

    console.log(
      '✅ Database setup complete! RLS-safe multi-tenant system ready.',
    );
  } catch (err) {
    console.error('❌ Error during schema setup:', err);
    throw err;
  } finally {
    await queryRunner.release();
    await adminDataSource.destroy();
  }
}

async function teardownDatabase(): Promise<void> {
  const config = loadConfig();
  const { adminUser, adminPass, appUser, dbName, dbHost, dbPort } = config;

  if (!adminUser || !adminPass || !dbName) {
    console.error('❌ Missing DB_ADMIN_USER, DB_ADMIN_PASS, or DB_DATABASE');
    process.exit(1);
  }

  console.log('🧹 Tearing down database...');

  const adminDataSource = new DataSource({
    type: 'postgres',
    host: dbHost,
    port: dbPort,
    username: adminUser,
    password: adminPass,
    database: 'postgres',
  });

  try {
    await adminDataSource.initialize();
    const adminQueryRunner = adminDataSource.createQueryRunner();
    await adminQueryRunner.connect();

    try {
      // Terminate all connections to database
      await adminQueryRunner.query(`
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = '${dbName}' AND pid <> pg_backend_pid();
      `);

      console.log(`  ✓ Dropping database '${dbName}'...`);
      await adminQueryRunner.query(`DROP DATABASE IF EXISTS ${dbName};`);

      if (appUser) {
        console.log(`  ✓ Dropping role '${appUser}'...`);
        await adminQueryRunner.query(`DROP ROLE IF EXISTS ${appUser};`);
      }

      console.log('✅ Database teardown complete!');
    } finally {
      await adminQueryRunner.release();
    }
  } catch (err) {
    console.error('❌ Error during teardown:', err);
    throw err;
  } finally {
    await adminDataSource.destroy();
  }
}

async function bootstrap(): Promise<void> {
  const command = process.argv[2];

  try {
    if (command === 'teardown') {
      await teardownDatabase();
    } else {
      const config = loadConfig();
      await setupAdminConnection(config);
      await setupSchema();
    }
  } catch (err) {
    console.error('Fatal error during database operation:', err);
    process.exit(1);
  }
}

void bootstrap();
