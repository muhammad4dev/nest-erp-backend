import { MigrationInterface, QueryRunner } from 'typeorm';
import { ensureUuidV7Defaults } from './utils/ensure-uuidv7-defaults';

/**
 * Example migration showing how to ensure UUID v7 defaults
 * when adding new tables.
 *
 * IMPORTANT: TypeORM generates DEFAULT gen_random_uuid() (UUID v4).
 * Always call ensureUuidV7Defaults() after creating tables to upgrade to v7.
 */
export class ExampleAddNewFeature1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // TypeORM-generated migration creates tables with gen_random_uuid() (v4)
    await queryRunner.query(`
      CREATE TABLE "new_feature_table" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "name" character varying NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_new_feature_table" PRIMARY KEY ("id")
      )
    `);

    // Upgrade all UUID defaults to v7 (or just the new table)
    await ensureUuidV7Defaults(queryRunner); // All tables
    // OR: await ensureUuidV7Defaults(queryRunner, 'new_feature_table'); // Specific table

    // Continue with other migration steps...
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "new_feature_table"`);
  }
}
