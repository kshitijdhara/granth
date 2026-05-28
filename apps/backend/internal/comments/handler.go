package comments

import (
	"net/http"
	"strings"

	"granth/internal/shared"

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
		shared.WriteError(w, shared.NewAPIError(http.StatusBadRequest, "proposal_id query parameter is required"))
		return
	}

	comments, err := listComments(proposalID, r.Context())
	if err != nil {
		shared.WriteError(w, shared.NewAPIError(http.StatusInternalServerError, "Error fetching comments: "+err.Error()))
		return
	}

	// Return empty array rather than null when there are no comments.
	if comments == nil {
		comments = []*Comment{}
	}

	shared.WriteJSON(w, http.StatusOK, comments)
}

func handleCreateComment(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ProposalID string  `json:"proposal_id"`
		ParentID   *string `json:"parent_id"`
		Body       string  `json:"body"`
	}

	if err := shared.DecodeJSON(r, &req); err != nil {
		shared.WriteError(w, err.(shared.APIError))
		return
	}

	if req.ProposalID == "" {
		shared.WriteError(w, shared.NewAPIError(http.StatusBadRequest, "proposal_id is required"))
		return
	}

	comment, err := createComment(req.ProposalID, req.ParentID, req.Body, r.Context())
	if err != nil {
		writeCommentError(w, err)
		return
	}

	shared.WriteJSON(w, http.StatusCreated, comment)
}

func handleEditComment(w http.ResponseWriter, r *http.Request) {
	commentID := chi.URLParam(r, "id")

	var req struct {
		Body string `json:"body"`
	}

	if err := shared.DecodeJSON(r, &req); err != nil {
		shared.WriteError(w, err.(shared.APIError))
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
	var statusCode int
	switch {
	case strings.Contains(msg, "deliberation is sealed"):
		statusCode = http.StatusBadRequest
	case strings.Contains(msg, "only the comment author"):
		statusCode = http.StatusForbidden
	case strings.Contains(msg, "cannot delete a comment that has replies"):
		statusCode = http.StatusConflict
	case strings.Contains(msg, "comment body cannot be empty"):
		statusCode = http.StatusBadRequest
	case strings.Contains(msg, "not found"):
		statusCode = http.StatusNotFound
	default:
		statusCode = http.StatusInternalServerError
	}
	shared.WriteError(w, shared.NewAPIError(statusCode, msg))
}
