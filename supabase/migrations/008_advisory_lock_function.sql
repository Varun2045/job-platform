-- 008_advisory_lock_function.sql - Add atomic advisory lock function

-- Create a function that atomically tries to acquire an advisory lock
CREATE OR REPLACE FUNCTION try_advisory_lock(lock_key BIGINT)
RETURNS BOOLEAN AS $$
BEGIN
    -- pg_try_advisory_lock returns true if lock was acquired, false if already held
    RETURN pg_try_advisory_lock(lock_key);
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to the service role
GRANT EXECUTE ON FUNCTION try_advisory_lock TO service_role;