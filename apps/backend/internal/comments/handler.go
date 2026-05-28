package comments

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
)

// CommentsRouter returns the HTTP handler for the comments API.
// Mounted at /api/comments by base.go (behind AuthMiddleware).
func CommentsRouter() http.Handler {
	r := chi.NewRouter()

	r.Get("/", handleListComments)       // GET  /api/comments?proposal_id={id}
	r.Post("/", handleCreateComment)     // POST /api/comments
	r.Put("/{id}", handleEditComment)    // PUT  /api/comments/{id}
	r.Delete("/{id}", handleDeleteComment) // DELETE /api/comments/{id}

	return r
}

func handleListComments(w http.ResponseWriter, r *http.Request) {
	proposalID := r.URL.Query().Get("proposal_id")
	if proposalID == "" {
		http.Error(w, "proposal_id query parameter is required", http.StatusBadRequest)
		return
	}

	comments, err := listComments(proposalID, r.Context())
	if err != nil {
		http.Error(w, "Error fetching comments: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Return empty array rather than null when there are no comments.
	if comments == nil {
		comments = []*Comment{}
	}

	writeJSON(w, http.StatusOK, comments)
}

func handleCreateComment(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ProposalID string  `json:"proposal_id"`
		ParentID   *string `json:"parent_id"`
		Body       string  `json:"body"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON: "+err.Error(), http.StatusBadRequest)
		return
	}

	if req.ProposalID == "" {
		http.Error(w, "proposal_id is required", http.StatusBadRequest)
		return
	}

	comment, err := createComment(req.ProposalID, req.ParentID, req.Body, r.Context())
	if err != nil {
		writeCommentError(w, err)
		return
	}

	writeJSON(w, http.StatusCreated, comment)
}

func handleEditComment(w http.ResponseWriter, r *http.Request) {
	commentID := chi.URLParam(r, "id")

	var req struct {
		Body string `json:"body"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON: "+err.Error(), http.StatusBadRequest)
		return
	}

	if err := editComment(commentID, req.Body, r.Context()); err != nil {
		writeCommentError(w, err)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func handleDeleteComment(w http.ResponseWriter, r *http.Request) {
	commentID := chi.URLParam(r, "id")

	if err := deleteComment(commentID, r.Context()); err != nil {
		writeCommentError(w, err)
		return
	}

	w.WriteHeader(http.StatusOK)
}

// writeCommentError maps service-layer error messages to appropriate HTTP status codes.
func writeCommentError(w http.ResponseWriter, err error) {
	msg := err.Error()
	switch {
	case strings.Contains(msg, "deliberation is sealed"):
		http.Error(w, msg, http.StatusBadRequest)
	case strings.Contains(msg, "only the comment author"):
		http.Error(w, msg, http.StatusForbidden)
	case strings.Contains(msg, "cannot delete a comment that has replies"):
		http.Error(w, msg, http.StatusConflict)
	case strings.Contains(msg, "comment body cannot be empty"):
		http.Error(w, msg, http.StatusBadRequest)
	case strings.Contains(msg, "not found"):
		http.Error(w, msg, http.StatusNotFound)
	default:
		http.Error(w, msg, http.StatusInternalServerError)
	}
}

// writeJSON is a minimal JSON response helper.
func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}
