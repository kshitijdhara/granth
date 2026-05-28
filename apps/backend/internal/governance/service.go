package governance

import (
	"context"
	"fmt"
	"strings"

	"granth/internal/documents"
	"granth/internal/notifications"
	"granth/internal/proposals"
	"granth/internal/foundation"
	"granth/internal/workspaces"
)

// castApproval records a reviewer's approval vote and auto-accepts the proposal
// if the workspace governance threshold is met.
func castApproval(proposalID string, ctx context.Context) (*ApprovalStatus, error) {
	userID, ok := foundation.GetUserIDFromContext(ctx)
	if !ok {
		return nil, fmt.Errorf("user ID not found in context")
	}

	// Load the proposal.
	proposal, err := proposals.GetProposal(proposalID, ctx)
	if err != nil {
		return nil, fmt.Errorf("error fetching proposal: %w", err)
	}
	if proposal.State != "open" {
		return nil, fmt.Errorf("cannot approve a proposal that is not open")
	}

	// Load the document to get the workspace.
	doc, err := documents.FetchDocumentByID(proposal.DocumentID, ctx)
	if err != nil {
		return nil, fmt.Errorf("error fetching document: %w", err)
	}

	// Determine required approvals and governance rules.
	minReviewers := 1
	var gov *Governance

	if doc.WorkspaceID != nil {
		// Role check: contributors cannot approve.
		member, err := workspaces.FetchMember(*doc.WorkspaceID, userID, ctx)
		if err != nil {
			return nil, fmt.Errorf("error fetching workspace membership: %w", err)
		}
		if member == nil {
			return nil, fmt.Errorf("user is not a member of this workspace")
		}
		if member.Role == string(workspaces.RoleContributor) {
			return nil, fmt.Errorf("contributors cannot approve proposals; reviewer or admin role required")
		}

		gov, err = FetchGovernance(*doc.WorkspaceID, ctx)
		if err != nil {
			return nil, fmt.Errorf("error fetching governance config: %w", err)
		}
		if gov != nil {
			minReviewers = gov.MinReviewers
			// Author-review block when governance config explicitly disallows it.
			if !gov.AllowAuthorReview && proposal.AuthorID == userID {
				return nil, fmt.Errorf("proposal authors cannot approve their own proposals")
			}
		} else {
			// No governance config: default author block (multi-member workspaces).
			memberCount, _ := workspaces.CountMembers(*doc.WorkspaceID, ctx)
			if memberCount > 1 && proposal.AuthorID == userID {
				return nil, fmt.Errorf("proposal authors cannot approve their own proposals in a shared workspace")
			}
		}
	}

	// Idempotency guard.
	already, err := HasApproved(proposalID, userID, ctx)
	if err != nil {
		return nil, fmt.Errorf("error checking existing approval: %w", err)
	}
	if already {
		return nil, fmt.Errorf("you have already approved this proposal")
	}

	// Record the approval.
	if err := InsertApproval(proposalID, userID, ctx); err != nil {
		if strings.Contains(err.Error(), "unique") || strings.Contains(err.Error(), "duplicate") {
			return nil, fmt.Errorf("you have already approved this proposal")
		}
		return nil, err
	}

	// Check threshold — auto-accept if met.
	count, err := CountApprovals(proposalID, ctx)
	if err != nil {
		return nil, fmt.Errorf("error counting approvals: %w", err)
	}

	if count >= minReviewers {
		if err := proposals.AcceptProposal(proposalID, ctx); err != nil {
			return nil, fmt.Errorf("approval threshold reached but accept failed: %w", err)
		}
	} else {
		// Notify proposal author that someone approved (threshold not yet met).
		notifications.Emit(notifications.KindApprovalCast, proposal.AuthorID,
			map[string]string{
				"proposal_id":    proposalID,
				"title":          proposal.Title,
				"approval_count": fmt.Sprintf("%d", count),
				"required_count": fmt.Sprintf("%d", minReviewers),
			})
	}

	approvals, _ := FetchApprovals(proposalID, ctx)
	if approvals == nil {
		approvals = []*Approval{}
	}

	return &ApprovalStatus{
		Approvals:        approvals,
		ApprovalCount:    count,
		RequiredCount:    minReviewers,
		ThresholdReached: count >= minReviewers,
	}, nil
}

// getApprovalStatus returns the current approval state of a proposal without modifying it.
func getApprovalStatus(proposalID string, ctx context.Context) (*ApprovalStatus, error) {
	proposal, err := proposals.GetProposal(proposalID, ctx)
	if err != nil {
		return nil, fmt.Errorf("error fetching proposal: %w", err)
	}

	doc, err := documents.FetchDocumentByID(proposal.DocumentID, ctx)
	if err != nil {
		return nil, fmt.Errorf("error fetching document: %w", err)
	}

	minReviewers := 1
	if doc.WorkspaceID != nil {
		gov, err := FetchGovernance(*doc.WorkspaceID, ctx)
		if err != nil {
			return nil, fmt.Errorf("error fetching governance config: %w", err)
		}
		if gov != nil {
			minReviewers = gov.MinReviewers
		}
	}

	approvals, err := FetchApprovals(proposalID, ctx)
	if err != nil {
		return nil, fmt.Errorf("error fetching approvals: %w", err)
	}
	if approvals == nil {
		approvals = []*Approval{}
	}

	count := len(approvals)
	return &ApprovalStatus{
		Approvals:        approvals,
		ApprovalCount:    count,
		RequiredCount:    minReviewers,
		ThresholdReached: count >= minReviewers,
	}, nil
}

// getGovernance returns the governance config for a workspace.
func getGovernance(workspaceID string, ctx context.Context) (*Governance, error) {
	gov, err := FetchGovernance(workspaceID, ctx)
	if err != nil {
		return nil, fmt.Errorf("error fetching governance: %w", err)
	}
	return gov, nil
}

// upsertGovernance creates or replaces the governance foundation.
// Only workspace admins may call this.
func upsertGovernance(workspaceID string, req *Governance, ctx context.Context) (*Governance, error) {
	userID, ok := foundation.GetUserIDFromContext(ctx)
	if !ok {
		return nil, fmt.Errorf("user ID not found in context")
	}

	// Admin check.
	member, err := workspaces.FetchMember(workspaceID, userID, ctx)
	if err != nil {
		return nil, fmt.Errorf("error checking membership: %w", err)
	}
	if member == nil || member.Role != string(workspaces.RoleAdmin) {
		return nil, fmt.Errorf("only workspace admins can configure review policy")
	}

	if req.MinReviewers < 1 {
		return nil, fmt.Errorf("min_reviewers must be at least 1")
	}

	req.WorkspaceID = workspaceID
	return UpsertGovernance(req, ctx)
}
