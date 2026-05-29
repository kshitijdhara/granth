-- Upgrade bare TIMESTAMP columns on documents and blocks to TIMESTAMPTZ.
-- All other tables already use TIMESTAMP WITH TIME ZONE.
ALTER TABLE documents
    ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE USING created_at AT TIME ZONE 'UTC',
    ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE USING updated_at AT TIME ZONE 'UTC';

ALTER TABLE blocks
    ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE USING created_at AT TIME ZONE 'UTC',
    ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE USING updated_at AT TIME ZONE 'UTC';

-- Attach set_updated_at() (created in migration 12) to every table with an updated_at column.
CREATE TRIGGER documents_set_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER blocks_set_updated_at
    BEFORE UPDATE ON blocks
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER proposals_set_updated_at
    BEFORE UPDATE ON proposals
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER proposal_comments_set_updated_at
    BEFORE UPDATE ON proposal_comments
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER workspaces_set_updated_at
    BEFORE UPDATE ON workspaces
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER workspace_governance_set_updated_at
    BEFORE UPDATE ON workspace_governance
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
