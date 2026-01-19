package documents

import (
	"context"
	"fmt"
	"granth/internal/utils"
	"time"
)

func createNewDocument(title string, ctx context.Context) (string, error) {
	document, err := fetchDocumentByTitle(title, ctx)
	if err == nil && document != nil {
		return "", fmt.Errorf("Document with title '%s' already exists", title)
	}
	userId, ok := utils.GetUserIDFromContext(ctx)
	if !ok {
		return "", fmt.Errorf("User ID not found in context")
	}
	newDocument := &Document{
		Title:     title,
		Content:   "", // Empty content for new documents
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
	document, err := fetchDocumentByID(documentID, ctx)
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
	documents, err := fetchAllDocumentsByOwnerID(userId, ctx)
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
	err := updateDocument(document, ctx)
	if err != nil {
		return fmt.Errorf("Error updating document: %w", err)
	}
	return nil
}

func getAllBlocksForDocument(documentID string, ctx context.Context) ([]*Block, error) {
	blocks, err := fetchAllBlocksByDocumentID(documentID, ctx)
	if err != nil {
		return nil, fmt.Errorf("Error fetching blocks for document %s: %w", documentID, err)
	}
	return blocks, nil
}
func createBlockForDocument(block *Block, ctx context.Context) error {
	userId, ok := utils.GetUserIDFromContext(ctx)
	if !ok {
		return fmt.Errorf("User ID not found in context")
	}
	block.CreatedBy = userId
	block.CreatedAt = time.Now().UTC().Format(time.RFC3339)
	block.UpdatedAt = time.Now().UTC().Format(time.RFC3339)
	block.UpdatedBy = userId
	err := CreateBlock(block, ctx)
	if err != nil {
		return fmt.Errorf("Error creating block: %w", err)
	}
	return nil
}

func updateBlockForDocument(block *Block, ctx context.Context) error {
	userId, ok := utils.GetUserIDFromContext(ctx)
	if !ok {
		return fmt.Errorf("User ID not found in context")
	}
	block.UpdatedAt = time.Now().UTC().Format(time.RFC3339)
	block.UpdatedBy = userId
	err := UpdateBlock(block, ctx)
	if err != nil {
		return fmt.Errorf("Error updating block: %w", err)
	}
	return nil
}

func deleteBlockForDocument(blockID string, ctx context.Context) error {
	err := DeleteBlock(blockID, ctx)
	if err != nil {
		return fmt.Errorf("Error deleting block: %w", err)
	}
	return nil
}
