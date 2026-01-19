package documents

import (
	"context"
	"granth/internal/config"
)

func FetchBlockByID(id string, ctx context.Context) (*Block, error) {
	// Implementation goes here
	block := &Block{}
	err := config.PostgresDB.QueryRowContext(ctx, "SELECT id, document_id, content, owner_id, created_at, updated_at FROM documents WHERE id = $1", id).Scan(&block.ID, &block.DocumentID, &block.Content, &block.OwnerID, &block.CreatedAt, &block.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return block, nil
}

func CreateBlock(block *Block, ctx context.Context) error {
	// Implementation goes here
	_, err := config.PostgresDB.ExecContext(ctx, "INSERT INTO documents (id, document_id, content, owner_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6)", block.ID, block.DocumentID, block.Content, block.OwnerID, block.CreatedAt, block.UpdatedAt)
	return err
}

func UpdateBlock(block *Block, ctx context.Context) error {
	// Implementation goes here
	_, err := config.PostgresDB.ExecContext(ctx, "UPDATE documents SET document_id = $1, content = $2, updated_at = $3 WHERE id = $4", block.DocumentID, block.Content, block.UpdatedAt, block.ID)
	return err
}
func DeleteBlock(id string, ctx context.Context) error {
	// Implementation goes here
	_, err := config.PostgresDB.ExecContext(ctx, "DELETE FROM documents WHERE id = $1", id)
	return err
}

func FetchDocumentByID(id string, ctx context.Context) (*Document, error) {
	// Implementation goes here
	document := &Document{}
	err := config.PostgresDB.QueryRowContext(ctx, "SELECT id, title, status, owner_id, created_at, updated_at FROM documents WHERE id = $1", id).Scan(&document.ID, &document.Title, &document.Status, &document.OwnerID, &document.CreatedAt, &document.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return document, nil
}

func CreateDocument(document *Document, ctx context.Context) error {
	// Implementation goes here
	_, err := config.PostgresDB.ExecContext(ctx, "INSERT INTO documents (id, title, status, owner_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6)", document.ID, document.Title, document.Status, document.OwnerID, document.CreatedAt, document.UpdatedAt)
	return err
}

func UpdateDocument(document *Document, ctx context.Context) error {
	// Implementation goes here
	_, err := config.PostgresDB.ExecContext(ctx, "UPDATE documents SET title = $1, status = $2, updated_at = $3 WHERE id = $4", document.Title, document.Status, document.UpdatedAt, document.ID)
	return err
}

func DeleteDocument(id string, ctx context.Context) error {
	// Implementation goes here
	_, err := config.PostgresDB.ExecContext(ctx, "DELETE FROM documents WHERE id = $1", id)
	return err
}

func FetchAllBlocksByDocumentID(documentID string, ctx context.Context) ([]*Block, error) {
	// Implementation goes here
	rows, err := config.PostgresDB.QueryContext(ctx, "SELECT id, document_id, content, owner_id, created_at, updated_at FROM blocks WHERE document_id = $1 ORDER BY order", documentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var blocks []*Block
	for rows.Next() {
		block := &Block{}
		if err := rows.Scan(&block.ID, &block.DocumentID, &block.Content, &block.OwnerID, &block.CreatedAt, &block.UpdatedAt); err != nil {
			return nil, err
		}
		blocks = append(blocks, block)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return blocks, nil
}

func FetchAllDocumentsByOwnerID(ownerID string, ctx context.Context) ([]*Document, error) {
	rows, err := config.PostgresDB.QueryContext(ctx, "SELECT id, title, status, owner_id, created_at, updated_at FROM documents WHERE owner_id = $1", ownerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var documents []*Document
	for rows.Next() {
		document := &Document{}
		if err := rows.Scan(&document.ID, &document.Title, &document.Status, &document.OwnerID, &document.CreatedAt, &document.UpdatedAt); err != nil {
			return nil, err
		}
		documents = append(documents, document)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return documents, nil
}
