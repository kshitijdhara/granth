-- Align the users table with the current User model.
--
-- Changes:
--   1. Upgrade created_at to TIMESTAMP WITH TIME ZONE (consistent with all other tables)
--   2. Add updated_at TIMESTAMP WITH TIME ZONE, backfilled from created_at
--   3. Add properties JSONB for arbitrary per-user metadata

ALTER TABLE users
    ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE
        USING created_at AT TIME ZONE 'UTC';

ALTER TABLE users
    ALTER COLUMN created_at SET NOT NULL,
    ALTER COLUMN created_at SET DEFAULT now();

ALTER TABLE users
    ADD COLUMN updated_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    ADD COLUMN properties   JSONB NOT NULL DEFAULT '{}';

-- Backfill updated_at for existing rows
UPDATE users SET updated_at = created_at;

-- Trigger: keep updated_at current automatically on every UPDATE
CREATE OR REPLACE FUNCTION set_updated_at()
    RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_set_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
