package documents

import (
	"net/http"
	"strconv"

	"granth/internal/blocks"
	"granth/internal/foundation"
	"granth/internal/shared"
	"granth/internal/workspaces"

	"github.com/go-chi/chi/v5"
)

func DocumentsRouter() http.Handler {
	r := chi.NewRouter()

	r.Get("/{id}", handleGetDocument)
	r.Get("/all", handleGetAllDocuments)
	r.Post("/create", handleCreateDocument)
	r.Put("/{id}", handleUpdateDocument)
	r.Delete("/{id}", handleDeleteDocument)
	r.Get("/latest", handleGetLatestDocuments)

	r.Get("/{id}/blocks", handleGetAllBlocksForDocument)
	r.Post("/{id}/blocks/create", handleCreateBlockForDocument)
	r.Put("/{id}/blocks/update", handleUpdateBlockForDocument)
	r.Delete("/{id}/blocks/delete", handleDeleteBlockForDocument)

	return r
}

func handleGetAllDocuments(w http.ResponseWriter, r *http.Request) {
	documents, err := getAllDocuments(r.Context())
	if err != nil {
		shared.WriteError(w, shared.NewAPIError(http.StatusInternalServerError, "Error fetching documents: "+err.Error()))
		return
	}

	shared.WriteJSON(w, http.StatusOK, documents)
}

func handleGetLatestDocuments(w http.ResponseWriter, r *http.Request) {
	limitStr := chi.URLParam(r, "limit")
	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		shared.WriteError(w, shared.NewAPIError(http.StatusBadRequest, "Invalid limit parameter: "+err.Error()))
		return
	}

	documents, err := getLatestDocuments(r.Context(), limit)
	if err != nil {
		shared.WriteError(w, shared.NewAPIError(http.StatusInternalServerError, "Error fetching latest documents: "+err.Error()))
		return
	}

	shared.WriteJSON(w, http.StatusOK, documents)
}

func handleGetDocument(w http.ResponseWriter, r *http.Request) {
	documentID := chi.URLParam(r, "id")
	document, err := getDocument(documentID, r.Context())
	if err != nil {
		shared.WriteError(w, shared.NewAPIError(http.StatusInternalServerError, "Error fetching document: "+err.Error()))
		return
	}

	shared.WriteJSON(w, http.StatusOK, document)
}

func handleCreateDocument(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Title       string  `json:"title"`
		WorkspaceID *string `json:"workspace_id"`
	}

	if err := shared.DecodeJSON(r, &req); err != nil {
		shared.WriteError(w, err.(shared.APIError))
		return
	}

	if req.Title == "" {
		shared.WriteError(w, shared.NewAPIError(http.StatusBadRequest, "Title is required"))
		return
	}

	if req.WorkspaceID == nil || *req.WorkspaceID == "" {
		shared.WriteError(w, shared.NewAPIError(http.StatusBadRequest, "workspace_id is required"))
		return
	}

	userID, ok := foundation.GetUserIDFromContext(r.Context())
	if !ok {
		shared.WriteError(w, shared.NewAPIError(http.StatusUnauthorized, "User ID not found in context"))
		return
	}

	member, err := workspaces.FetchMember(*req.WorkspaceID, userID, r.Context())
	if err != nil {
		shared.WriteError(w, shared.NewAPIError(http.StatusInternalServerError, "Error checking workspace membership: "+err.Error()))
		return
	}
	if member == nil {
		shared.WriteError(w, shared.NewAPIError(http.StatusForbidden, "You are not a member of this workspace"))
		return
	}

	documentID, err := createNewDocument(req.Title, req.WorkspaceID, r.Context())
	if err != nil {
		shared.WriteError(w, shared.NewAPIError(http.StatusInternalServerError, "Error creating document: "+err.Error()))
		return
	}

	shared.WriteJSON(w, http.StatusCreated, map[string]string{"document_id": documentID})
}

func handleUpdateDocument(w http.ResponseWriter, r *http.Request) {
	documentID := chi.URLParam(r, "id")
	var document Document

	if err := shared.DecodeJSON(r, &document); err != nil {
		shared.WriteError(w, err.(shared.APIError))
		return
	}

	document.ID = documentID

	if err := updateDocumentByID(&document, r.Context()); err != nil {
		shared.WriteError(w, shared.NewAPIError(http.StatusInternalServerError, "Error updating document: "+err.Error()))
		return
	}

	w.WriteHeader(http.StatusOK)
}

func handleDeleteDocument(w http.ResponseWriter, r *http.Request) {
	documentID := chi.URLParam(r, "id")

	if err := DeleteDocument(documentID, r.Context()); err != nil {
		shared.WriteError(w, shared.NewAPIError(http.StatusInternalServerError, "Error deleting document: "+err.Error()))
		return
	}

	w.WriteHeader(http.StatusOK)
}

func handleGetAllBlocksForDocument(w http.ResponseWriter, r *http.Request) {
	documentID := chi.URLParam(r, "id")
	blocks, err := getAllBlocksForDocument(documentID, r.Context())
	if err != nil {
		shared.WriteError(w, shared.NewAPIError(http.StatusInternalServerError, "Error fetching blocks: "+err.Error()))
		return
	}

	shared.WriteJSON(w, http.StatusOK, blocks)
}

func handleCreateBlockForDocument(w http.ResponseWriter, r *http.Request) {
	documentID := chi.URLParam(r, "id")
	var block blocks.Block

	if err := shared.DecodeJSON(r, &block); err != nil {
		shared.WriteError(w, err.(shared.APIError))
		return
	}

	block.DocumentID = documentID

	if err := createBlockForDocument(&block, r.Context()); err != nil {
		shared.WriteError(w, shared.NewAPIError(http.StatusInternalServerError, "Error creating block: "+err.Error()))
		return
	}

	w.WriteHeader(http.StatusCreated)
}

func handleUpdateBlockForDocument(w http.ResponseWriter, r *http.Request) {
	var block blocks.Block

	if err := shared.DecodeJSON(r, &block); err != nil {
		shared.WriteError(w, err.(shared.APIError))
		return
	}

	if err := blocks.UpdateBlock(&block, r.Context()); err != nil {
		shared.WriteError(w, shared.NewAPIError(http.StatusInternalServerError, "Error updating block: "+err.Error()))
		return
	}

	w.WriteHeader(http.StatusOK)
}

func handleDeleteBlockForDocument(w http.ResponseWriter, r *http.Request) {
	var req struct {
		BlockID string `json:"block_id"`
	}

	if err := shared.DecodeJSON(r, &req); err != nil {
		shared.WriteError(w, err.(shared.APIError))
		return
	}

	if req.BlockID == "" {
		shared.WriteError(w, shared.NewAPIError(http.StatusBadRequest, "Block ID is required"))
		return
	}

	if err := blocks.DeleteBlock(req.BlockID, r.Context()); err != nil {
		shared.WriteError(w, shared.NewAPIError(http.StatusInternalServerError, "Error deleting block: "+err.Error()))
		return
	}

	w.WriteHeader(http.StatusOK)
}
