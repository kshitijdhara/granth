package proposals

import (
	"context"
	"granth/internal/config"

	"github.com/lib/pq"
)

func CreateProposal(proposal *Proposal, ctx context.Context) error {
	err := config.PostgresDB.QueryRowContext(ctx,
		"INSERT INTO proposals (document_id, affected_block_ids, title, author_id, intent, scope, state, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id",
		proposal.DocumentID, pq.Array(proposal.AffectedBlockIDs), proposal.Title, proposal.AuthorID, proposal.Intent, proposal.Scope, proposal.State, proposal.CreatedAt, proposal.UpdatedAt).Scan(&proposal.ID)
	return err
}

func GetProposalByID(id string, ctx context.Context) (*Proposal, error) {
	proposal := &Proposal{}
	var affectedBlockIDs pq.StringArray
	err := config.PostgresDB.QueryRowContext(ctx, "SELECT id, document_id, affected_block_ids, title, author_id, intent, scope, state, created_at, updated_at FROM proposals WHERE id = $1", id).Scan(
		&proposal.ID, &proposal.DocumentID, &affectedBlockIDs, &proposal.Title, &proposal.AuthorID, &proposal.Intent, &proposal.Scope, &proposal.State, &proposal.CreatedAt, &proposal.UpdatedAt)
	if err != nil {
		return nil, err
	}
	proposal.AffectedBlockIDs = []string(affectedBlockIDs)
	return proposal, nil
}

func GetProposalsByDocument(documentID string, ctx context.Context) ([]*Proposal, error) {
	rows, err := config.PostgresDB.QueryContext(ctx, "SELECT id, document_id, affected_block_ids, title, author_id, intent, scope, state, created_at, updated_at FROM proposals WHERE document_id = $1 ORDER BY created_at DESC", documentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var proposals []*Proposal
	for rows.Next() {
		proposal := &Proposal{}
		var affectedBlockIDs pq.StringArray
		if err := rows.Scan(&proposal.ID, &proposal.DocumentID, &affectedBlockIDs, &proposal.Title, &proposal.AuthorID, &proposal.Intent, &proposal.Scope, &proposal.State, &proposal.CreatedAt, &proposal.UpdatedAt); err != nil {
			return nil, err
		}
		proposal.AffectedBlockIDs = []string(affectedBlockIDs)
		proposals = append(proposals, proposal)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return proposals, nil
}

func UpdateProposal(proposal *Proposal, ctx context.Context) error {
	_, err := config.PostgresDB.ExecContext(ctx, "UPDATE proposals SET affected_block_ids = $1, title = $2, intent = $3, scope = $4, state = $5, updated_at = $6 WHERE id = $7",
		pq.Array(proposal.AffectedBlockIDs), proposal.Title, proposal.Intent, proposal.Scope, proposal.State, proposal.UpdatedAt, proposal.ID)
	return err
}

func DeleteProposal(id string, ctx context.Context) error {
	_, err := config.PostgresDB.ExecContext(ctx, "DELETE FROM proposals WHERE id = $1", id)
	return err
}

func CreateProposalBlockChange(change *ProposalBlockChange, ctx context.Context) error {
	err := config.PostgresDB.QueryRowContext(ctx,
		"INSERT INTO proposal_block_changes (proposal_id, block_id, action, block_type, order_path, content, created_by, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id",
		change.ProposalID, change.BlockID, change.Action, change.BlockType, pq.Array(change.OrderPath), change.Content, change.CreatedBy, change.CreatedAt).Scan(&change.ID)
	return err
}

func GetChangesByProposal(proposalID string, ctx context.Context) ([]*ProposalBlockChange, error) {
	rows, err := config.PostgresDB.QueryContext(ctx, "SELECT id, proposal_id, block_id, action, block_type, order_path, content, created_by, created_at FROM proposal_block_changes WHERE proposal_id = $1 ORDER BY created_at", proposalID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var changes []*ProposalBlockChange
	for rows.Next() {
		change := &ProposalBlockChange{}
		if err := rows.Scan(&change.ID, &change.ProposalID, &change.BlockID, &change.Action, &change.BlockType, &change.OrderPath, &change.Content, &change.CreatedBy, &change.CreatedAt); err != nil {
			return nil, err
		}
		changes = append(changes, change)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return changes, nil
}

func DeleteChangesByProposal(proposalID string, ctx context.Context) error {
	_, err := config.PostgresDB.ExecContext(ctx, "DELETE FROM proposal_block_changes WHERE proposal_id = $1", proposalID)
	return err
}
