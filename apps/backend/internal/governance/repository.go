package governance

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"granth/internal/foundation"
)

// ── Governance config ─────────────────────────────────────────────────────────

// FetchGovernance returns the governance config for a workspace, or nil if none is configured.
func FetchGovernance(workspaceID string, ctx context.Context) (*Governance, error) {
	g := &Governance{}
	err := foundation.PostgresDB.QueryRowContext(ctx,
		`SELECT id, workspace_id, min_reviewers, require_role, allow_author_review, created_at, updated_at
		 FROM workspace_governance
		 WHERE workspace_id = $1`,
		workspaceID,
	).Scan(&g.ID, &g.WorkspaceID, &g.MinReviewers, &g.RequireRole, &g.AllowAuthorReview, &g.CreatedAt, &g.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, nil // not configured
	}
	if err != nil {
		return nil, fmt.Errorf("error fetching governance: %w", err)
	}
	return g, nil
}

// UpsertGovernance creates or replaces the governance config for a workspace.
func UpsertGovernance(g *Governance, ctx context.Context) (*Governance, error) {
	now := time.Now().UTC().Format(time.RFC3339)
	out := &Governance{}
	err := foundation.PostgresDB.QueryRowContext(ctx,
		`INSERT INTO workspace_governance (workspace_id, min_reviewers, require_role, allow_author_review, created_at, updated_at)
		 VALUES ($1, $2, $3, $4, $5, $6)
		 ON CONFLICT (workspace_id) DO UPDATE
		   SET min_reviewers = EXCLUDED.min_reviewers,
		       require_role   = EXCLUDED.require_role,
		       allow_author_review = EXCLUDED.allow_author_review,
		       updated_at     = EXCLUDED.updated_at
		 RETURNING id, workspace_id, min_reviewers, require_role, allow_author_review, created_at, updated_at`,
		g.WorkspaceID, g.MinReviewers, g.RequireRole, g.AllowAuthorReview, now, now,
	).Scan(&out.ID, &out.WorkspaceID, &out.MinReviewers, &out.RequireRole, &out.AllowAuthorReview, &out.CreatedAt, &out.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("error upserting governance: %w", err)
	}
	return out, nil
}

// ── Approvals ─────────────────────────────────────────────────────────────────

// InsertApproval records one reviewer's approval. Returns a unique-violation error
// if the reviewer has already approved this proposal.
func InsertApproval(proposalID, reviewerID string, ctx context.Context) error {
	_, err := foundation.PostgresDB.ExecContext(ctx,
		`INSERT INTO proposal_approvals (proposal_id, reviewer_id)
		 VALUES ($1, $2)`,
		proposalID, reviewerID,
	)
	if err != nil {
		return fmt.Errorf("error inserting approval: %w", err)
	}
	return nil
}

// FetchApprovals returns all approvals for a proposal.
func FetchApprovals(proposalID string, ctx context.Context) ([]*Approval, error) {
	rows, err := foundation.PostgresDB.QueryContext(ctx,
		`SELECT id, proposal_id, reviewer_id, approved_at
		 FROM proposal_approvals
		 WHERE proposal_id = $1
		 ORDER BY approved_at ASC`,
		proposalID,
	)
	if err != nil {
		return nil, fmt.Errorf("error fetching approvals: %w", err)
	}
	defer rows.Close()

	var out []*Approval
	for rows.Next() {
		a := &Approval{}
		if err := rows.Scan(&a.ID, &a.ProposalID, &a.ReviewerID, &a.ApprovedAt); err != nil {
			return nil, fmt.Errorf("error scanning approval: %w", err)
		}
		out = append(out, a)
	}
	return out, nil
}

// CountApprovals returns the number of approvals for a proposal.
func CountApprovals(proposalID string, ctx context.Context) (int, error) {
	var count int
	err := foundation.PostgresDB.QueryRowContext(ctx,
		`SELECT COUNT(*) FROM proposal_approvals WHERE proposal_id = $1`,
		proposalID,
	).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("error counting approvals: %w", err)
	}
	return count, nil
}

// HasApproved reports whether a given reviewer has already approved a proposal.
func HasApproved(proposalID, reviewerID string, ctx context.Context) (bool, error) {
	var exists bool
	err := foundation.PostgresDB.QueryRowContext(ctx,
		`SELECT EXISTS(SELECT 1 FROM proposal_approvals WHERE proposal_id = $1 AND reviewer_id = $2)`,
		proposalID, reviewerID,
	).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("error checking approval: %w", err)
	}
	return exists, nil
}
