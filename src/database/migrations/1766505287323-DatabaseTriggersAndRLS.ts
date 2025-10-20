import { MigrationInterface, QueryRunner } from 'typeorm';

export class DatabaseTriggersAndRLS1766505287323 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create Functions
    await queryRunner.query(`
            CREATE OR REPLACE FUNCTION set_tenant_id()
            RETURNS TRIGGER AS $$
            BEGIN
                IF current_setting('app.current_tenant_id', true) IS NOT NULL AND current_setting('app.current_tenant_id', true) <> '' THEN
                    NEW.tenant_id := current_setting('app.current_tenant_id')::uuid;
                END IF;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);

    await queryRunner.query(`
            CREATE OR REPLACE FUNCTION audit_trigger_func()
            RETURNS TRIGGER AS $$
            DECLARE
                v_old_data JSONB := NULL;
                v_new_data JSONB := NULL;
                v_tenant_id UUID;
                v_user_id UUID;
            BEGIN
                v_tenant_id := NULLIF(current_setting('app.current_tenant_id', true), '')::uuid;
                v_user_id := NULLIF(current_setting('app.current_user_id', true), '')::uuid;

                IF (TG_OP = 'UPDATE') THEN
                    v_old_data := to_jsonb(OLD);
                    v_new_data := to_jsonb(NEW);
                ELSIF (TG_OP = 'DELETE') THEN
                    v_old_data := to_jsonb(OLD);
                ELSIF (TG_OP = 'INSERT') THEN
                    v_new_data := to_jsonb(NEW);
                END IF;

                INSERT INTO system_audit_logs (
                    id, tenant_id, table_name, record_id, action, old_data, new_data, changed_by, created_at
                ) VALUES (
                    gen_random_uuid(), COALESCE(v_tenant_id, (NEW.tenant_id)), TG_TABLE_NAME, COALESCE(NEW.id, OLD.id)::text, TG_OP, v_old_data, v_new_data, v_user_id, now()
                );

                IF (TG_OP = 'DELETE') THEN RETURN OLD; ELSE RETURN NEW; END IF;
            END;
            $$ LANGUAGE plpgsql;
        `);

    // 2. List of tables to apply RLS and Auditing
    // CRITICAL: We EXCLUDE 'system_audit_logs' from auditing to prevent infinite trigger recursion.
    const tables = [
      'partners',
      'product_translations',
      'product_categories',
      'product_attributes',
      'product_attribute_values',
      'product_variants',
      'sales_order_lines',
      'sales_orders',
      'invoice_lines',
      'invoices',
      'purchase_order_lines',
      'purchase_orders',
      'vendor_bill_lines',
      'vendor_bills',
      'product_uoms',
      'refresh_tokens',
      'branches',
      'employees',
      'employment_contracts',
      'partner_balances',
      'users',
      'roles',
      'permissions',
    ];

    for (const table of tables) {
      // Enable RLS
      await queryRunner.query(
        `ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`,
      );
      await queryRunner.query(`
                DROP POLICY IF EXISTS tenant_isolation_policy ON "${table}";
                CREATE POLICY tenant_isolation_policy ON "${table}"
                FOR ALL TO public
                USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
                WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
            `);

      // Apply set_tenant_id trigger
      await queryRunner.query(`
                DROP TRIGGER IF EXISTS trg_set_tenant_id ON "${table}";
                CREATE TRIGGER trg_set_tenant_id
                BEFORE INSERT ON "${table}"
                FOR EACH ROW EXECUTE FUNCTION set_tenant_id();
            `);

      // Apply audit trigger
      await queryRunner.query(`
                DROP TRIGGER IF EXISTS trg_audit ON "${table}";
                CREATE TRIGGER trg_audit
                AFTER INSERT OR UPDATE OR DELETE ON "${table}"
                FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
            `);
    }

    // Specially handle RLS for audit logs (No audit trigger here)
    await queryRunner.query(
      `ALTER TABLE "system_audit_logs" ENABLE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(`
        DROP POLICY IF EXISTS tenant_isolation_policy ON "system_audit_logs";
        CREATE POLICY tenant_isolation_policy ON "system_audit_logs"
        FOR ALL TO public
        USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
        WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tables = [
      'partners',
      'product_translations',
      'product_categories',
      'product_attributes',
      'product_attribute_values',
      'product_variants',
      'sales_order_lines',
      'sales_orders',
      'invoice_lines',
      'invoices',
      'purchase_order_lines',
      'purchase_orders',
      'vendor_bill_lines',
      'vendor_bills',
      'product_uoms',
      'refresh_tokens',
      'branches',
      'employees',
      'employment_contracts',
      'partner_balances',
      'users',
      'roles',
      'permissions',
      'system_audit_logs',
    ];

    for (const table of tables) {
      await queryRunner.query(`DROP TRIGGER IF EXISTS trg_audit ON "${table}"`);
      await queryRunner.query(
        `DROP TRIGGER IF EXISTS trg_set_tenant_id ON "${table}"`,
      );
      await queryRunner.query(
        `DROP POLICY IF EXISTS tenant_isolation_policy ON "${table}"`,
      );
      await queryRunner.query(
        `ALTER TABLE "${table}" DISABLE ROW LEVEL SECURITY`,
      );
    }

    await queryRunner.query(`DROP FUNCTION IF EXISTS audit_trigger_func()`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS set_tenant_id()`);
  }
}
