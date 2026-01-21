package documents

import (
	"context"
	"fmt"
	"granth/internal/blocks"
	"granth/internal/utils"
	"time"
)

func createNewDocument(title string, ctx context.Context) (string, error) {
	document, err := FetchDocumentByTitle(title, ctx)
	if err == nil && document != nil {
		return "", fmt.Errorf("Document with title '%s' already exists", title)
	}
	userId, ok := utils.GetUserIDFromContext(ctx)
	if !ok {
		return "", fmt.Errorf("User ID not found in context")
	}
	newDocument := &Document{
		Title:     title,
		CreatedBy: userId,
		CreatedAt: time.Now().UTC().Format(time.RFC3339),
		UpdatedAt: time.Now().UTC().Format(time.RFC3339),
		UpdatedBy: userId,
	}
	err = CreateDocument(newDocument, ctx)
	if err != nil {
		return "", fmt.Errorf("Error creating document: %w", err)
	}
	return newDocument.ID, nil
}

func getDocument(documentID string, ctx context.Context) (*Document, error) {
	document, err := FetchDocumentByID(documentID, ctx)
	if err != nil {
		return nil, fmt.Errorf("Error fetching document: %w", err)
	}
	return document, nil
}

func getAllDocuments(ctx context.Context) ([]*Document, error) {
	userId, ok := utils.GetUserIDFromContext(ctx)
	if !ok {
		return nil, fmt.Errorf("User ID not found in context")
	}
	documents, err := FetchAllDocumentsByOwnerID(userId, ctx)
	if err != nil {
		return nil, fmt.Errorf("Error fetching documents: %w", err)
	}
	return documents, nil
}

func updateDocumentByID(document *Document, ctx context.Context) error {
	userId, ok := utils.GetUserIDFromContext(ctx)
	if !ok {
		return fmt.Errorf("User ID not found in context")
	}
	document.UpdatedAt = time.Now().UTC().Format(time.RFC3339)
	document.UpdatedBy = userId
	err := UpdateDocument(document, ctx)
	if err != nil {
		return fmt.Errorf("Error updating document: %w", err)
	}
	return nil
}

func getAllBlocksForDocument(documentID string, ctx context.Context) ([]*blocks.Block, error) {
	blocks, err := blocks.FetchAllBlocksByDocumentID(documentID, ctx)
	if err != nil {
		return nil, fmt.Errorf("Error fetching blocks for document %s: %w", documentID, err)
	}
	return blocks, nil
}
func createBlockForDocument(block *blocks.Block, ctx context.Context) error {
	userId, ok := utils.GetUserIDFromContext(ctx)
	if !ok {
		return fmt.Errorf("User ID not found in context")
	}
	block.CreatedBy = userId
	block.CreatedAt = time.Now().UTC().Format(time.RFC3339)
	block.UpdatedAt = time.Now().UTC().Format(time.RFC3339)
	block.UpdatedBy = userId
	err := blocks.CreateBlock(block, ctx)
	if err != nil {
		return fmt.Errorf("Error creating block: %w", err)
	}
	return nil
}

func updateBlockForDocument(block *blocks.Block, ctx context.Context) error {
	userId, ok := utils.GetUserIDFromContext(ctx)
	if !ok {
		return fmt.Errorf("User ID not found in context")
	}
	block.UpdatedAt = time.Now().UTC().Format(time.RFC3339)
	block.UpdatedBy = userId
	err := blocks.UpdateBlock(block, ctx)
	if err != nil {
		return fmt.Errorf("Error updating block: %w", err)
	}
	return nil
}

func deleteBlockForDocument(blockID string, ctx context.Context) error {
	err := blocks.DeleteBlock(blockID, ctx)
	if err != nil {
		return fmt.Errorf("Error deleting block: %w", err)
	}
	return nil
}
