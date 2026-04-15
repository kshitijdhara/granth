package documents

import (
	"context"
	"fmt"
	"granth/internal/config"
)

func FetchDocumentByID(id string, ctx context.Context) (*Document, error) {
	// Implementation goes here
	document := &Document{}
	err := config.PostgresDB.QueryRowContext(ctx, "SELECT id, title, created_by, created_at, updated_at, updated_by FROM documents WHERE id = $1", id).Scan(&document.ID, &document.Title, &document.CreatedBy, &document.CreatedAt, &document.UpdatedAt, &document.UpdatedBy)
	if err != nil {
		return nil, err
	}
	return document, nil
}

func FetchDocumentByTitle(title string, ctx context.Context) (*Document, error) {
	document := &Document{}
	err := config.PostgresDB.QueryRowContext(ctx, "SELECT id, title, created_by, created_at, updated_at, updated_by FROM documents WHERE title = $1", title).Scan(&document.ID, &document.Title, &document.CreatedBy, &document.CreatedAt, &document.UpdatedAt, &document.UpdatedBy)
	if err != nil {
		return nil, err
	}
	return document, nil
}

func CreateDocument(document *Document, ctx context.Context) error {
	// Implementation goes here
	err := config.PostgresDB.QueryRowContext(ctx, "INSERT INTO documents (title, created_by, created_at, updated_at, updated_by) VALUES ($1, $2, $3, $4, $5) RETURNING id", document.Title, document.CreatedBy, document.CreatedAt, document.UpdatedAt, document.UpdatedBy).Scan(&document.ID)
	return err
}

func UpdateDocument(document *Document, ctx context.Context) error {
	// Implementation goes here
	_, err := config.PostgresDB.ExecContext(ctx, "UPDATE documents SET title = $1, updated_at = $2, updated_by = $3 WHERE id = $4", document.Title, document.UpdatedAt, document.UpdatedBy, document.ID)
	return err
}

func DeleteDocument(id string, ctx context.Context) error {
	// Implementation goes here
	_, err := config.PostgresDB.ExecContext(ctx, "DELETE FROM documents WHERE id = $1", id)
	return err
}

func FetchAllDocumentsByOwnerID(ownerID string, ctx context.Context) ([]*Document, error) {
	rows, err := config.PostgresDB.QueryContext(ctx, "SELECT id, title, created_by, created_at, updated_at, updated_by FROM documents WHERE created_by = $1", ownerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var documents []*Document
	for rows.Next() {
		document := &Document{}
		if err := rows.Scan(&document.ID, &document.Title, &document.CreatedBy, &document.CreatedAt, &document.UpdatedAt, &document.UpdatedBy); err != nil {
			return nil, fmt.Errorf("scan document for owner %s: %w", ownerID, err)
		}
		documents = append(documents, document)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows error for owner %s: %w", ownerID, err)
	}
	return documents, nil
}

func fetchLatestDocuments(limit int, userid string, ctx context.Context) ([]*Document, error) {
	rows, err := config.PostgresDB.QueryContext(ctx, "SELECT id, title, created_by, created_at, updated_at, updated_by FROM documents WHERE id ==$1 ORDER BY created_at DESC LIMIT $2", userid, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var documents []*Document
	for rows.Next() {
		document := &Document{}
		if err := rows.Scan(&document.ID, &document.Title, &document.CreatedBy, &document.CreatedAt, &document.UpdatedAt, &document.UpdatedBy); err != nil {
			return nil, fmt.Errorf("scan latest document: %w", err)
		}
		documents = append(documents, document)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows error for latest documents: %w", err)
	}
	return documents, nil
}
