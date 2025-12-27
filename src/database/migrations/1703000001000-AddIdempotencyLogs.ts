import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIdempotencyLogs1766000001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE idempotency_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        idempotency_key VARCHAR(255) NOT NULL,
        endpoint VARCHAR(255) NOT NULL,
        method VARCHAR(10) NOT NULL,
        request_body JSONB NOT NULL,
        response_body JSONB NOT NULL,
        status_code INT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMPTZ NOT NULL,
        CONSTRAINT unique_idempotency_key UNIQUE (idempotency_key),
        CONSTRAINT fk_idempotency_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
      );

      CREATE INDEX idx_idempotency_tenant_key ON idempotency_logs(tenant_id, idempotency_key);
      CREATE INDEX idx_idempotency_expires_at ON idempotency_logs(expires_at);
    `);

    // Enable RLS on idempotency_logs
    await queryRunner.query(
      `ALTER TABLE idempotency_logs ENABLE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(
      `ALTER TABLE idempotency_logs FORCE ROW LEVEL SECURITY`,
    );

    // RLS policy for idempotency_logs
    await queryRunner.query(`
      CREATE POLICY tenant_isolation_policy ON idempotency_logs
      FOR ALL
      TO public
      USING (
        CASE 
          WHEN current_setting('app.current_tenant_id', true) IS NULL THEN false
          WHEN current_setting('app.current_tenant_id', true) = '' THEN false
          WHEN current_setting('app.current_tenant_id', true) !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN false
          ELSE tenant_id = current_setting('app.current_tenant_id', true)::uuid
        END
      )
      WITH CHECK (
        CASE 
          WHEN current_setting('app.current_tenant_id', true) IS NULL THEN false
          WHEN current_setting('app.current_tenant_id', true) = '' THEN false
          WHEN current_setting('app.current_tenant_id', true) !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN false
          ELSE tenant_id = current_setting('app.current_tenant_id', true)::uuid
        END
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE idempotency_logs`);
  }
}
