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
		Status:    "canonical",
		OwnerID:   userId,
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
