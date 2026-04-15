package proposals

import (
	"context"
	"fmt"
	"granth/internal/config"
	"granth/internal/utils"
	"time"

	"github.com/lib/pq"
)

func createProposal(documentID string, title string, intent string, scope string, affectedBlockIDs []string, ctx context.Context) (string, error) {
	userID, ok := utils.GetUserIDFromContext(ctx)
	if !ok {
		return "", fmt.Errorf("user ID not found in context")
	}

	proposal := &Proposal{
		DocumentID:       documentID,
		AffectedBlockIDs: affectedBlockIDs,
		Title:            title,
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

func updateProposal(proposalID string, title string, intent string, scope string, affectedBlockIDs []string, ctx context.Context) error {
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

func acceptProposal(proposalID string, ctx context.Context) error {
	userID, ok := utils.GetUserIDFromContext(ctx)
	if !ok {
		return fmt.Errorf("user ID not found in context")
	}

	proposal, err := GetProposalByID(proposalID, ctx)
	if err != nil {
		return fmt.Errorf("error fetching proposal: %w", err)
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

	_, err = tx.ExecContext(ctx,
		"UPDATE proposals SET state = $1, updated_at = $2 WHERE id = $3",
		string(ProposalStatusAccepted), now, proposalID)
	if err != nil {
		return fmt.Errorf("error updating proposal state: %w", err)
	}

	return tx.Commit()
}

func rejectProposal(proposalID string, reason string, ctx context.Context) error {
	_, ok := utils.GetUserIDFromContext(ctx)
	if !ok {
		return fmt.Errorf("user ID not found in context")
	}

	proposal, err := GetProposalByID(proposalID, ctx)
	if err != nil {
		return fmt.Errorf("error fetching proposal: %w", err)
	}

	proposal.State = string(ProposalStatusRejected)
	proposal.RejectionReason = &reason
	proposal.UpdatedAt = time.Now().UTC().Format(time.RFC3339)

	err = UpdateProposal(proposal, ctx)
	if err != nil {
		return fmt.Errorf("error rejecting proposal: %w", err)
	}

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
