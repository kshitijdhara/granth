-- workspace_governance: per-workspace review policy.
-- Configures the minimum number of distinct approvals required before a proposal
-- is auto-accepted, and whether authors may self-approve in solo workspaces.
CREATE TABLE workspace_governance (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id        UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE UNIQUE,
    min_reviewers       INT NOT NULL DEFAULT 1,
    require_role        TEXT CHECK (require_role IN ('reviewer', 'admin') OR require_role IS NULL),
    allow_author_review BOOLEAN NOT NULL DEFAULT false,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- proposal_approvals: individual reviewer approvals (one row per reviewer per proposal).
-- When the count of rows for a proposal_id >= workspace_governance.min_reviewers,
-- the proposal is automatically transitioned to accepted.
CREATE TABLE proposal_approvals (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id  UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
    reviewer_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    approved_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(proposal_id, reviewer_id)
);

CREATE INDEX idx_proposal_approvals_proposal ON proposal_approvals(proposal_id);
