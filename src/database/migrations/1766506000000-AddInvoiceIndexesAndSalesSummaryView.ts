import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInvoiceIndexesAndSalesSummaryView1766506000000 implements MigrationInterface {
  // Creating indexes and materialized view benefits from explicit DDL control.
  // Keep default transactional behavior (no CONCURRENTLY) for simplicity.

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ---- Invoice indexes ----
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_invoices_tenant_status ON invoices (tenant_id, status);`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_invoices_partner_created ON invoices (partner_id, created_at);`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_invoices_tenant_created ON invoices (tenant_id, created_at);`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_invoices_tenant_partner ON invoices (tenant_id, partner_id);`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_invoices_tenant_status_created ON invoices (tenant_id, status, created_at);`,
    );

    // ---- Materialized view for sales summary ----
    // Note: Include tenant_id to preserve isolation. A security-barrier view applies tenant filter.
    await queryRunner.query(
      `CREATE MATERIALIZED VIEW IF NOT EXISTS sales_summary AS
       SELECT tenant_id, partner_id, SUM(total_amount) AS revenue
       FROM invoices
       WHERE status = 'PAID'
       GROUP BY tenant_id, partner_id;`,
    );

    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_summary_tenant_partner ON sales_summary (tenant_id, partner_id);`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_sales_summary_tenant ON sales_summary (tenant_id);`,
    );

    // Security-barrier view to enforce tenant filtering when querying the summary
    await queryRunner.query(
      `CREATE OR REPLACE VIEW sales_summary_secure WITH (security_barrier) AS
       SELECT *
       FROM sales_summary
       WHERE current_setting('app.current_tenant_id', true) IS NOT NULL
         AND tenant_id = current_setting('app.current_tenant_id', true)::uuid;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP VIEW IF EXISTS sales_summary_secure;`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_sales_summary_tenant_partner;`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS idx_sales_summary_tenant;`);
    await queryRunner.query(`DROP MATERIALIZED VIEW IF EXISTS sales_summary;`);

    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_invoices_tenant_status_created;`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_invoices_tenant_partner;`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_invoices_tenant_created;`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_invoices_partner_created;`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS idx_invoices_tenant_status;`);
  }
}
