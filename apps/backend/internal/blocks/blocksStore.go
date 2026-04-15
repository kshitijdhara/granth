package blocks

import (
	"context"
	"granth/internal/config"

	"github.com/lib/pq"
)

func FetchBlockByID(id string, ctx context.Context) (*Block, error) {
	// Implementation goes here
	block := &Block{}
	err := config.PostgresDB.QueryRowContext(ctx, "SELECT id, document_id, content, created_by, created_at, updated_at, updated_by FROM blocks WHERE id = $1", id).Scan(&block.ID, &block.DocumentID, &block.Content, &block.CreatedBy, &block.CreatedAt, &block.UpdatedAt, &block.UpdatedBy)
	if err != nil {
		return nil, err
	}
	return block, nil
}

func CreateBlock(block *Block, ctx context.Context) error {
	err := config.PostgresDB.QueryRowContext(ctx,
		"INSERT INTO blocks (document_id, order_path, type, content, created_by, created_at, updated_at, updated_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id",
		block.DocumentID, pq.Array(block.OrderPath), block.BlockType, block.Content, block.CreatedBy, block.CreatedAt, block.UpdatedAt, block.UpdatedBy).Scan(&block.ID)
	return err
}

func UpdateBlock(block *Block, ctx context.Context) error {
	_, err := config.PostgresDB.ExecContext(ctx, "UPDATE blocks SET document_id = $1, order_path = $2, type = $3, content = $4, updated_at = $5, updated_by = $6 WHERE id = $7", block.DocumentID, pq.Array(block.OrderPath), block.BlockType, block.Content, block.UpdatedAt, block.UpdatedBy, block.ID)
	return err
}

func DeleteBlock(id string, ctx context.Context) error {
	// Implementation goes here
	_, err := config.PostgresDB.ExecContext(ctx, "DELETE FROM blocks WHERE id = $1", id)
	return err
}

func FetchAllBlocksByDocumentID(documentID string, ctx context.Context) ([]*Block, error) {
	// Implementation goes here
	rows, err := config.PostgresDB.QueryContext(ctx, "SELECT id, document_id, order_path, type, content, created_by, created_at, updated_at, updated_by FROM blocks WHERE document_id = $1 ORDER BY order_path", documentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var blocks []*Block
	for rows.Next() {
		block := &Block{}
		if err := rows.Scan(&block.ID, &block.DocumentID, &block.OrderPath, &block.BlockType, &block.Content, &block.CreatedBy, &block.CreatedAt, &block.UpdatedAt, &block.UpdatedBy); err != nil {
			return nil, err
		}
		blocks = append(blocks, block)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return blocks, nil
}
