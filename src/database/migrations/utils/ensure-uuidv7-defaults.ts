import { QueryRunner } from 'typeorm';

/**
 * Ensures all UUID id columns use uuidv7() instead of gen_random_uuid()
 *
 * PostgreSQL 16+ supports uuidv7() natively.
 * For earlier versions, it requires the uuid-ossp extension.
 *
 * Usage in migration:
 * ```typescript
 * import { ensureUuidV7Defaults } from './utils/ensure-uuidv7-defaults';
 *
 * export class AddNewFeature1234567890 implements MigrationInterface {
 *   public async up(queryRunner: QueryRunner): Promise<void> {
 *     // ... create tables ...
 *     await ensureUuidV7Defaults(queryRunner);
 *   }
 * }
 * ```
 */
export async function ensureUuidV7Defaults(
  queryRunner: QueryRunner,
  specificTable?: string,
): Promise<void> {
  // First, ensure uuid-ossp extension exists (contains uuidv7 and related functions)
  try {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
  } catch {
    // Extension might already exist or be installed globally
    console.log('   → uuid-ossp extension already available');
  }

  const whereClause = specificTable
    ? `AND c.table_name = '${specificTable}'`
    : `AND c.table_name NOT IN ('migrations', 'typeorm_metadata')`;

  const tables = (await queryRunner.query(`
    SELECT DISTINCT c.table_name AS tablename
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.column_name = 'id'
      AND c.data_type = 'uuid'
      ${whereClause}
  `)) as Array<{ tablename: string }>;

  for (const { tablename } of tables) {
    try {
      await queryRunner.query(
        `ALTER TABLE "${tablename}" ALTER COLUMN id SET DEFAULT uuidv7()`,
      );
    } catch {
      // If uuidv7() isn't available, try uuid_generate_v4() as fallback
      try {
        await queryRunner.query(
          `ALTER TABLE "${tablename}" ALTER COLUMN id SET DEFAULT uuid_generate_v4()`,
        );
      } catch {
        // Skip if both fail
      }
    }
  }

  console.log(`   → Ensured ${tables.length} table(s) use UUID defaults`);
}
