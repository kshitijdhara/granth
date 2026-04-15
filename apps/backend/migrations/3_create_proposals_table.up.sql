-- create proposals
CREATE TABLE IF NOT EXISTS proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  affected_block_ids UUID[], -- array of block IDs affected by this proposal
  title TEXT,
  author_id TEXT NOT NULL,
  intent TEXT,
  scope TEXT,
  state TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- create proposal block changes
CREATE TABLE IF NOT EXISTS proposal_block_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  block_id UUID NULL,
  action TEXT NOT NULL,
  block_type TEXT,
  order_path BIGINT[],
  content TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_proposals_document_id ON proposals(document_id);
CREATE INDEX IF NOT EXISTS idx_proposals_affected_blocks ON proposals USING GIN(affected_block_ids); -- for efficient querying by block ID
CREATE INDEX IF NOT EXISTS idx_pbc_proposal_id ON proposal_block_changes(proposal_id);

ALTER TABLE proposals
ADD CONSTRAINT chk_proposal_state CHECK (state IN ('open', 'accepted', 'rejected'));

ALTER TABLE proposal_block_changes
ADD CONSTRAINT chk_pbc_action CHECK (action IN ('create', 'update', 'delete'));

ALTER TABLE documents
ADD COLUMN IF NOT EXISTS proposal_count INT NOT NULL DEFAULT 0; -- track number of proposals per document

ALTER TABLE documents DROP COLUMN IF EXISTS content;