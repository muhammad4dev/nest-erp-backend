import { DataSource } from 'typeorm';
import 'dotenv/config';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'postgres',
  synchronize: false,
  logging: process.env.TYPEORM_LOGGING
    ? process.env.TYPEORM_LOGGING === 'true'
    : process.env.NODE_ENV !== 'production',
  entities: ['src/modules/**/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
  subscribers: ['src/database/subscribers/*.ts'],
  // uuidExtension: 'pgcrypto' → TypeORM uses gen_random_uuid() (native in PostgreSQL 18)
  uuidExtension: 'pgcrypto',
  ssl:
    process.env.DB_SSL === 'true'
      ? {
          rejectUnauthorized:
            process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
        }
      : undefined,
});
