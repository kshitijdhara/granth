package documents

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
)

func DocumentsRouter() http.Handler {
	r := chi.NewRouter()

	r.Get("/:id", handleGetDocument)
	r.Get("/all", handleGetAllDocuments)
	r.Post("/create", handleCreateDocument)

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
		http.Error(w, "Error encoding JSON: "+err.Error(), http.StatusInternalServerError)
		return
	}
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
