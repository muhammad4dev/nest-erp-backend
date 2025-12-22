import 'dotenv/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE || 'nest_erp',
  autoLoadEntities: true,
  synchronize: false, // Always false in production ERP
  // uuidExtension: 'pgcrypto' tells TypeORM to use gen_random_uuid() (native in PostgreSQL 18)
  // vs 'uuid-ossp' which would use uuid_generate_v4() (requires extension)
  uuidExtension: 'pgcrypto',
  extra: {
    // Session setting for RLS
    // Note: We need to set this per-query or per-transaction
  },
};
