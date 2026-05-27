package proposals

import (
	"context"
	"fmt"
	"granth/internal/config"
	"granth/internal/documents"
	"granth/internal/notifications"
	"granth/internal/utils"
	"granth/internal/workspaces"
	"strings"
	"time"

	"github.com/lib/pq"
)

func createProposal(documentID string, title string, newTitle string, intent string, scope string, affectedBlockIDs []string, ctx context.Context) (string, error) {
	userID, ok := utils.GetUserIDFromContext(ctx)
	if !ok {
		return "", fmt.Errorf("user ID not found in context")
	}

	proposal := &Proposal{
		DocumentID:       documentID,
		AffectedBlockIDs: affectedBlockIDs,
		Title:            title,
		NewTitle:         newTitle,
		AuthorID:         userID,
		Intent:           intent,
		Scope:            scope,
		State:            string(ProposalStatusOpen),
		CreatedAt:        time.Now().UTC().Format(time.RFC3339),
		UpdatedAt:        time.Now().UTC().Format(time.RFC3339),
	}

	err := CreateProposal(proposal, ctx)
	if err != nil {
		return "", fmt.Errorf("error creating proposal: %w", err)
	}

	// Phase 3.1 — notify workspace reviewers + admins of the new proposal.
	doc, docErr := documents.FetchDocumentByID(documentID, ctx)
	if docErr == nil && doc.WorkspaceID != nil {
		members, _ := workspaces.FetchMembersForWorkspace(*doc.WorkspaceID, ctx)
		var recipients []string
		for _, m := range members {
			if m.UserID != userID && (m.Role == string(workspaces.RoleAdmin) || m.Role == string(workspaces.RoleReviewer)) {
				recipients = append(recipients, m.UserID)
			}
		}
		notifications.EmitToMany(notifications.KindProposalSubmitted, recipients,
			map[string]string{"proposal_id": proposal.ID, "title": title})
	}

	return proposal.ID, nil
}

func getProposal(proposalID string, ctx context.Context) (*Proposal, error) {
	proposal, err := GetProposalByID(proposalID, ctx)
	if err != nil {
		return nil, fmt.Errorf("error fetching proposal: %w", err)
	}
	return proposal, nil
}

func getProposalsForDocument(documentID string, ctx context.Context) ([]*Proposal, error) {
	proposals, err := GetProposalsByDocument(documentID, ctx)
	if err != nil {
		return nil, fmt.Errorf("error fetching proposals for document: %w", err)
	}
	return proposals, nil
}

func updateProposal(proposalID string, title string, newTitle string, intent string, scope string, affectedBlockIDs []string, ctx context.Context) error {
	userID, ok := utils.GetUserIDFromContext(ctx)
	if !ok {
		return fmt.Errorf("user ID not found in context")
	}

	proposal, err := GetProposalByID(proposalID, ctx)
	if err != nil {
		return fmt.Errorf("error fetching proposal: %w", err)
	}

	if proposal.AuthorID != userID {
		return fmt.Errorf("only author can update proposal")
	}

	proposal.Title = title
	proposal.NewTitle = newTitle
	proposal.Intent = intent
	proposal.Scope = scope
	proposal.AffectedBlockIDs = affectedBlockIDs
	proposal.UpdatedAt = time.Now().UTC().Format(time.RFC3339)

	err = UpdateProposal(proposal, ctx)
	if err != nil {
		return fmt.Errorf("error updating proposal: %w", err)
	}

	return nil
}

// checkAuthorBlock enforces the two acceptance rules for a given caller:
//
//  1. Author block (NORTHSTAR §6): the proposal author cannot accept/reject
//     their own proposal in a multi-member workspace. In a solo workspace the
//     author IS the only reviewer, so the block does not apply.
//
//  2. Role block (Phase 3.2): a workspace member with the "contributor" role
//     can never accept or reject a proposal, regardless of authorship.
//
// No workspace (legacy docs): no restrictions apply (backward compat).
func checkAuthorBlock(proposal *Proposal, userID string, ctx context.Context) error {
	doc, err := documents.FetchDocumentByID(proposal.DocumentID, ctx)
	if err != nil {
		return fmt.Errorf("error fetching document: %w", err)
	}
	if doc.WorkspaceID == nil {
		return nil // legacy doc with no workspace — no restriction
	}

	memberCount, err := workspaces.CountMembers(*doc.WorkspaceID, ctx)
	if err != nil {
		return fmt.Errorf("error checking workspace membership: %w", err)
	}

	// Author block: only applies in multi-member workspaces.
	if memberCount > 1 && proposal.AuthorID == userID {
		return fmt.Errorf("author cannot accept or reject their own proposal in a shared workspace")
	}

	// Role block: contributors can never accept or reject, regardless of authorship.
	member, err := workspaces.FetchMember(*doc.WorkspaceID, userID, ctx)
	if err != nil {
		return fmt.Errorf("error fetching workspace membership: %w", err)
	}
	if member == nil {
		return fmt.Errorf("user is not a member of this workspace")
	}
	if member.Role == string(workspaces.RoleContributor) {
		return fmt.Errorf("contributors cannot accept or reject proposals; reviewer or admin role required")
	}

	return nil
}

func acceptProposal(proposalID string, ctx context.Context) error {
	userID, ok := utils.GetUserIDFromContext(ctx)
	if !ok {
		return fmt.Errorf("user ID not found in context")
	}

	proposal, err := GetProposalByID(proposalID, ctx)
	if err != nil {
		return fmt.Errorf("error fetching proposal: %w", err)
	}

	// Phase 1.1 + 3.2 — membership-aware author block + role enforcement
	if err := checkAuthorBlock(proposal, userID, ctx); err != nil {
		return err
	}

	// Phase 1.3 — backend conflict enforcement
	if len(proposal.AffectedBlockIDs) > 0 {
		conflicts, err := GetOpenConflictingProposals(proposalID, proposal.AffectedBlockIDs, ctx)
		if err != nil {
			return fmt.Errorf("error checking for conflicts: %w", err)
		}
		if len(conflicts) > 0 {
			ids := make([]string, len(conflicts))
			for i, c := range conflicts {
				ids[i] = c.ID
			}
			return fmt.Errorf("proposal conflicts with %d open proposal(s): %s",
				len(conflicts), strings.Join(ids, ", "))
		}
	}

	changes, err := GetChangesByProposal(proposalID, ctx)
	if err != nil {
		return fmt.Errorf("error fetching block changes: %w", err)
	}

	tx, err := config.PostgresDB.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("error starting transaction: %w", err)
	}
	defer tx.Rollback()

	now := time.Now().UTC().Format(time.RFC3339)

	for _, change := range changes {
		switch change.Action {
		case "create":
			_, err = tx.ExecContext(ctx,
				"INSERT INTO blocks (document_id, order_path, type, content, created_by, created_at, updated_at, updated_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
				proposal.DocumentID, pq.Array(change.OrderPath), change.BlockType, change.Content, userID, now, now, userID)
		case "update":
			if change.BlockID == nil {
				continue
			}
			_, err = tx.ExecContext(ctx,
				"UPDATE blocks SET type = $1, content = $2, updated_at = $3, updated_by = $4 WHERE id = $5",
				change.BlockType, change.Content, now, userID, *change.BlockID)
		case "delete":
			if change.BlockID == nil {
				continue
			}
			_, err = tx.ExecContext(ctx, "DELETE FROM blocks WHERE id = $1", *change.BlockID)
		default:
			return fmt.Errorf("unknown block change action: %s", change.Action)
		}
		if err != nil {
			return fmt.Errorf("error applying block change (%s): %w", change.Action, err)
		}
	}

	// Apply document title rename if the proposal carries one.
	if proposal.NewTitle != "" {
		_, err = tx.ExecContext(ctx,
			"UPDATE documents SET title = $1, updated_at = $2, updated_by = $3 WHERE id = $4",
			proposal.NewTitle, now, userID, proposal.DocumentID)
		if err != nil {
			return fmt.Errorf("error applying document title rename: %w", err)
		}
	}

	_, err = tx.ExecContext(ctx,
		"UPDATE proposals SET state = $1, updated_at = $2 WHERE id = $3",
		string(ProposalStatusAccepted), now, proposalID)
	if err != nil {
		return fmt.Errorf("error updating proposal state: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return err
	}

	// Phase 3.1 — notify proposal author that their proposal was accepted.
	notifications.Emit(notifications.KindProposalAccepted, proposal.AuthorID,
		map[string]string{"proposal_id": proposalID, "title": proposal.Title})

	return nil
}

func rejectProposal(proposalID string, reason string, ctx context.Context) error {
	userID, ok := utils.GetUserIDFromContext(ctx) // was `_, ok` — now enforced
	if !ok {
		return fmt.Errorf("user ID not found in context")
	}

	proposal, err := GetProposalByID(proposalID, ctx)
	if err != nil {
		return fmt.Errorf("error fetching proposal: %w", err)
	}

	// Phase 1.1 + 3.2 — membership-aware author block + role enforcement
	if err := checkAuthorBlock(proposal, userID, ctx); err != nil {
		return err
	}

	proposal.State = string(ProposalStatusRejected)
	proposal.RejectionReason = &reason
	proposal.UpdatedAt = time.Now().UTC().Format(time.RFC3339)

	if err = UpdateProposal(proposal, ctx); err != nil {
		return fmt.Errorf("error rejecting proposal: %w", err)
	}

	// Phase 3.1 — notify proposal author that their proposal was rejected.
	notifications.Emit(notifications.KindProposalRejected, proposal.AuthorID,
		map[string]string{"proposal_id": proposalID, "title": proposal.Title, "reason": reason})

	return nil
}

func addBlockChangeToProposal(proposalID string, blockID *string, action string, blockType string, orderPath []int64, content string, ctx context.Context) error {
	userID, ok := utils.GetUserIDFromContext(ctx)
	if !ok {
		return fmt.Errorf("user ID not found in context")
	}

	change := &ProposalBlockChange{
		ProposalID: proposalID,
		BlockID:    blockID,
		Action:     action,
		BlockType:  blockType,
		OrderPath:  orderPath,
		Content:    content,
		CreatedBy:  userID,
		CreatedAt:  time.Now().UTC().Format(time.RFC3339),
	}

	err := CreateProposalBlockChange(change, ctx)
	if err != nil {
		return fmt.Errorf("error adding block change: %w", err)
	}

	return nil
}

func getBlockChangesForProposal(proposalID string, ctx context.Context) ([]*ProposalBlockChange, error) {
	changes, err := GetChangesByProposal(proposalID, ctx)
	if err != nil {
		return nil, fmt.Errorf("error fetching block changes: %w", err)
	}
	return changes, nil
}

// ── Exported wrappers for cross-package use (governance) ──────────────────────

// AcceptProposal is the exported wrapper around acceptProposal.
// Used by the governance package to trigger auto-accept when approval threshold is met.
func AcceptProposal(proposalID string, ctx context.Context) error {
	return acceptProposal(proposalID, ctx)
}

// GetProposal is the exported service-level wrapper around getProposal.
// Used by the governance package.
func GetProposal(proposalID string, ctx context.Context) (*Proposal, error) {
	return getProposal(proposalID, ctx)
}
