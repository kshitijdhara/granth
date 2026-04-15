package proposals

import (
	"context"
	"fmt"
	"granth/internal/utils"
	"time"
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

	if proposal.AuthorID != userID {
		return fmt.Errorf("only author can accept proposal")
	}

	// TODO: Apply changes to blocks (merge to canonical layer)
	// For now, just update state
	proposal.State = string(ProposalStatusAccepted)
	proposal.UpdatedAt = time.Now().UTC().Format(time.RFC3339)

	err = UpdateProposal(proposal, ctx)
	if err != nil {
		return fmt.Errorf("error accepting proposal: %w", err)
	}

	return nil
}

func rejectProposal(proposalID string, ctx context.Context) error {
	userID, ok := utils.GetUserIDFromContext(ctx)
	if !ok {
		return fmt.Errorf("user ID not found in context")
	}

	proposal, err := GetProposalByID(proposalID, ctx)
	if err != nil {
		return fmt.Errorf("error fetching proposal: %w", err)
	}

	if proposal.AuthorID != userID {
		return fmt.Errorf("only author can reject proposal")
	}

	proposal.State = string(ProposalStatusRejected)
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
