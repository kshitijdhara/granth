package documents

import (
	"context"
	"fmt"
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

func fetchDocumentByID(id string, ctx context.Context) (*Document, error) {
	// Implementation goes here
	document := &Document{}
	err := config.PostgresDB.QueryRowContext(ctx, "SELECT id, title, content, created_by, created_at, updated_at, updated_by FROM documents WHERE id = $1", id).Scan(&document.ID, &document.Title, &document.Content, &document.CreatedBy, &document.CreatedAt, &document.UpdatedAt, &document.UpdatedBy)
	if err != nil {
		return nil, err
	}
	return document, nil
}

func fetchDocumentByTitle(title string, ctx context.Context) (*Document, error) {
	document := &Document{}
	err := config.PostgresDB.QueryRowContext(ctx, "SELECT id, title, content, created_by, created_at, updated_at, updated_by FROM documents WHERE title = $1", title).Scan(&document.ID, &document.Title, &document.Content, &document.CreatedBy, &document.CreatedAt, &document.UpdatedAt, &document.UpdatedBy)
	if err != nil {
		return nil, err
	}
	return document, nil
}

func CreateDocument(document *Document, ctx context.Context) error {
	// Implementation goes here
	err := config.PostgresDB.QueryRowContext(ctx, "INSERT INTO documents (title, content, created_by, created_at, updated_at, updated_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id", document.Title, document.Content, document.CreatedBy, document.CreatedAt, document.UpdatedAt, document.UpdatedBy).Scan(&document.ID)
	return err
}

func updateDocument(document *Document, ctx context.Context) error {
	// Implementation goes here
	_, err := config.PostgresDB.ExecContext(ctx, "UPDATE documents SET title = $1, content = $2, updated_at = $3, updated_by = $4 WHERE id = $5", document.Title, document.Content, document.UpdatedAt, document.UpdatedBy, document.ID)
	return err
}

func DeleteDocument(id string, ctx context.Context) error {
	// Implementation goes here
	_, err := config.PostgresDB.ExecContext(ctx, "DELETE FROM documents WHERE id = $1", id)
	return err
}

func fetchAllBlocksByDocumentID(documentID string, ctx context.Context) ([]*Block, error) {
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

func fetchAllDocumentsByOwnerID(ownerID string, ctx context.Context) ([]*Document, error) {
	rows, err := config.PostgresDB.QueryContext(ctx, "SELECT id, title, content, created_by, created_at, updated_at, updated_by FROM documents WHERE created_by = $1", ownerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var documents []*Document
	for rows.Next() {
		document := &Document{}
		if err := rows.Scan(&document.ID, &document.Title, &document.Content, &document.CreatedBy, &document.CreatedAt, &document.UpdatedAt, &document.UpdatedBy); err != nil {
			return nil, fmt.Errorf("scan document for owner %s: %w", ownerID, err)
		}
		documents = append(documents, document)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows error for owner %s: %w", ownerID, err)
	}
	return documents, nil
}
