-- proposal_comments: threaded deliberation attached to proposals.
-- This is the reasoning layer (NORTHSTAR §4).
-- Comments attach to proposals, NOT to raw blocks.
-- The deliberation record is sealed when a proposal is accepted or rejected.
CREATE TABLE proposal_comments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
    author_id   UUID NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
    parent_id   UUID REFERENCES proposal_comments(id) ON DELETE CASCADE,
    body        TEXT NOT NULL CHECK (char_length(trim(body)) > 0),
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_proposal_comments_proposal_id ON proposal_comments(proposal_id);
CREATE INDEX idx_proposal_comments_parent_id   ON proposal_comments(parent_id);
