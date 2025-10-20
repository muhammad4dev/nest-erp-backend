import { QueryRunner } from 'typeorm';

/**
 * Ensures all UUID id columns use uuidv7() instead of gen_random_uuid()
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
    await queryRunner.query(
      `ALTER TABLE "${tablename}" ALTER COLUMN id SET DEFAULT uuidv7()`,
    );
  }

  console.log(`   → Ensured ${tables.length} table(s) use UUID v7 defaults`);
}
