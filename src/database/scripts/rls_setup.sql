-- RLS Setup for Multi-Tenant Security
-- This script enables Row-Level Security on ALL tables with tenant_id column
-- and creates policies to enforce tenant isolation

-- Enable RLS on all tables with tenant_id column (except system-wide shared tables)
DO $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT DISTINCT c.table_name
        FROM information_schema.columns c
        WHERE c.table_schema = 'public'
          AND c.column_name = 'tenant_id'
          AND c.table_name NOT IN (
            'migrations', 
            'typeorm_metadata',
            'permissions'  -- System-wide permissions shared across all tenants
          )
    LOOP
        -- Enable RLS
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_record.table_name);
        
        -- Force RLS even for table owner (critical for security)
        EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', table_record.table_name);
        
        -- Drop existing policy if it exists
        EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_policy ON %I', table_record.table_name);
        
        -- Create tenant isolation policy
        EXECUTE format('
            CREATE POLICY tenant_isolation_policy ON %I
            FOR ALL
            TO public
            USING (tenant_id = current_setting(''app.current_tenant_id'', true)::uuid)
            WITH CHECK (tenant_id = current_setting(''app.current_tenant_id'', true)::uuid)
        ', table_record.table_name);
        
        RAISE NOTICE 'Applied RLS policy to table: %', table_record.table_name;
    END LOOP;
END $$;

-- Function to set the tenant_id automatically on insert
CREATE OR REPLACE FUNCTION set_tenant_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tenant_id := current_setting('app.current_tenant_id')::uuid;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
