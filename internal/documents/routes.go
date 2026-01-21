package documents

import (
	"encoding/json"
	"net/http"
	"strconv"

	"granth/internal/blocks"

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
		http.Error(w, "Error fetching documents: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	jsondata, err := json.Marshal(documents)
	if err != nil {
		http.Error(w, "Error encoding JSON: "+err.Error(), http.StatusInternalServerError)
		return
	}
	w.Write(jsondata)
}

func handleGetLatestDocuments(w http.ResponseWriter, r *http.Request) {
	limitStr := chi.URLParam(r, "limit")
	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		http.Error(w, "Invalid limit parameter: "+err.Error(), http.StatusBadRequest)
		return
	}
	documents, err := getLatestDocuments(r.Context(), limit)
	if err != nil {
		http.Error(w, "Error fetching latest documents: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	jsondata, err := json.Marshal(documents)
	if err != nil {
		http.Error(w, "Error encoding JSON: "+err.Error(), http.StatusInternalServerError)
		return
	}
	w.Write(jsondata)
}
func handleGetDocument(w http.ResponseWriter, r *http.Request) {
	documentID := chi.URLParam(r, "id")
	document, err := getDocument(documentID, r.Context())
	if err != nil {
		http.Error(w, "Error fetching document: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	jsondata, err := json.Marshal(document)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		http.Error(w, "Error encoding JSON: "+err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
	w.Write(jsondata)
}

func handleCreateDocument(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Title string `json:"title"`
	}
	// Parse JSON request body
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Invalid JSON: "+err.Error(), http.StatusBadRequest)
		return
	}
	if req.Title == "" {
		http.Error(w, "Title is required", http.StatusBadRequest)
		return
	}

	documentID, err := createNewDocument(req.Title, r.Context())
	if err != nil {
		http.Error(w, "Error creating document: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	jsondata, err := json.Marshal(map[string]string{"document_id": documentID})
	if err != nil {
		http.Error(w, "Error encoding JSON: "+err.Error(), http.StatusInternalServerError)
		return
	}
	w.Write(jsondata)
}

func handleUpdateDocument(w http.ResponseWriter, r *http.Request) {
	documentID := chi.URLParam(r, "id")
	var document Document
	err := json.NewDecoder(r.Body).Decode(&document)
	if err != nil {
		http.Error(w, "Invalid JSON: "+err.Error(), http.StatusBadRequest)
		return
	}
	document.ID = documentID

	err = updateDocumentByID(&document, r.Context())
	if err != nil {
		http.Error(w, "Error updating document: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func handleDeleteDocument(w http.ResponseWriter, r *http.Request) {
	documentID := chi.URLParam(r, "id")

	err := DeleteDocument(documentID, r.Context())
	if err != nil {
		http.Error(w, "Error deleting document: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func handleGetAllBlocksForDocument(w http.ResponseWriter, r *http.Request) {
	documentID := chi.URLParam(r, "id")
	blocks, err := getAllBlocksForDocument(documentID, r.Context())
	if err != nil {
		http.Error(w, "Error fetching blocks: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	jsondata, err := json.Marshal(blocks)
	if err != nil {
		http.Error(w, "Error encoding JSON: "+err.Error(), http.StatusInternalServerError)
		return
	}
	w.Write(jsondata)
}

func handleCreateBlockForDocument(w http.ResponseWriter, r *http.Request) {
	documentID := chi.URLParam(r, "id")
	var block blocks.Block
	err := json.NewDecoder(r.Body).Decode(&block)
	if err != nil {
		http.Error(w, "Invalid JSON: "+err.Error(), http.StatusBadRequest)
		return
	}
	block.DocumentID = documentID

	err = createBlockForDocument(&block, r.Context())
	if err != nil {
		http.Error(w, "Error creating block: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
}
func handleUpdateBlockForDocument(w http.ResponseWriter, r *http.Request) {
	var block blocks.Block
	err := json.NewDecoder(r.Body).Decode(&block)
	if err != nil {
		http.Error(w, "Invalid JSON: "+err.Error(), http.StatusBadRequest)
		return
	}

	err = blocks.UpdateBlock(&block, r.Context())
	if err != nil {
		http.Error(w, "Error updating block: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func handleDeleteBlockForDocument(w http.ResponseWriter, r *http.Request) {
	var req struct {
		BlockID string `json:"block_id"`
	}
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Invalid JSON: "+err.Error(), http.StatusBadRequest)
		return
	}
	if req.BlockID == "" {
		http.Error(w, "Block ID is required", http.StatusBadRequest)
		return
	}

	err = blocks.DeleteBlock(req.BlockID, r.Context())
	if err != nil {
		http.Error(w, "Error deleting block: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}
