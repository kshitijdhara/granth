-- Remove any orphan documents (no workspace assigned) before adding constraint
DELETE FROM documents WHERE workspace_id IS NULL;

-- Make workspace_id NOT NULL — all documents must belong to a workspace
ALTER TABLE documents ALTER COLUMN workspace_id SET NOT NULL;
