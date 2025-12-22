CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
    v_old_data JSONB := NULL;
    v_new_data JSONB := NULL;
    v_tenant_id UUID;
    v_user_id UUID;
BEGIN
    -- Get tenant and user from session variables
    v_tenant_id := current_setting('app.current_tenant_id', true)::uuid;
    v_user_id := current_setting('app.current_user_id', true)::uuid;

    IF (TG_OP = 'UPDATE') THEN
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
    ELSIF (TG_OP = 'DELETE') THEN
        v_old_data := to_jsonb(OLD);
    ELSIF (TG_OP = 'INSERT') THEN
        v_new_data := to_jsonb(NEW);
    END IF;

    -- Redact sensitive fields commonly present in identity/auth tables
    IF v_old_data IS NOT NULL THEN
        v_old_data := v_old_data 
            - 'password'
            - 'passwordHash'
            - 'password_hash'
            - 'refresh_token'
            - 'access_token'
            - 'secret';
    END IF;

    IF v_new_data IS NOT NULL THEN
        v_new_data := v_new_data 
            - 'password'
            - 'passwordHash'
            - 'password_hash'
            - 'refresh_token'
            - 'access_token'
            - 'secret';
    END IF;

    INSERT INTO system_audit_logs (
        id,
        tenant_id,
        table_name,
        record_id,
        action,
        old_data,
        new_data,
        changed_by,
        created_at
    ) VALUES (
        uuidv7(),
        v_tenant_id,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id)::text,
        TG_OP,
        v_old_data,
        v_new_data,
        v_user_id,
        now()
    );

    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;
