import { DataSource } from 'typeorm';
import 'dotenv/config';

/**
 * Admin DataSource for running migrations with superuser privileges.
 * Migrations need CREATE TABLE rights; use this for migration:run and migration:revert.
 * The app itself connects via the non-superuser 'dev' role for RLS enforcement.
 */
export const AdminDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_ADMIN_USER || 'erp',
  password: process.env.DB_ADMIN_PASS || process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE || 'erp_dev_db',
  synchronize: false,
  logging: process.env.TYPEORM_LOGGING
    ? process.env.TYPEORM_LOGGING === 'true'
    : process.env.NODE_ENV !== 'production',
  entities: ['src/modules/**/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
  subscribers: ['src/database/subscribers/*.ts'],
  uuidExtension: 'pgcrypto',
  ssl:
    process.env.DB_SSL === 'true'
      ? {
          rejectUnauthorized:
            process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
        }
      : undefined,
});
