package proposals

import (
	"net/http"
	"strings"

	"granth/internal/shared"

	"github.com/go-chi/chi/v5"
)

func ProposalsRouter() http.Handler {
	r := chi.NewRouter()

	r.Get("/document/{documentID}", handleGetProposalsForDocument)
	r.Post("/document/{documentID}", handleCreateProposal)
	r.Get("/{id}", handleGetProposal)
	r.Put("/{id}", handleUpdateProposal)
	r.Delete("/{id}", handleDeleteProposal)
	r.Post("/{id}/accept", handleAcceptProposal)
	r.Post("/{id}/reject", handleRejectProposal)
	r.Get("/{id}/changes", handleGetBlockChangesForProposal)
	r.Post("/{id}/changes", handleAddBlockChangeToProposal)

	return r
}

func handleGetProposalsForDocument(w http.ResponseWriter, r *http.Request) {
	documentID := chi.URLParam(r, "documentID")
	proposals, err := getProposalsForDocument(documentID, r.Context())
	if err != nil {
		shared.WriteError(w, shared.NewAPIError(http.StatusInternalServerError, "Error fetching proposals: "+err.Error()))
		return
	}

	shared.WriteJSON(w, http.StatusOK, proposals)
}

func handleCreateProposal(w http.ResponseWriter, r *http.Request) {
	documentID := chi.URLParam(r, "documentID")

	var req struct {
		Title            string   `json:"title"`
		NewTitle         string   `json:"new_title"`
		Intent           string   `json:"intent"`
		Scope            string   `json:"scope"`
		AffectedBlockIDs []string `json:"affected_block_ids"`
	}

	if err := shared.DecodeJSON(r, &req); err != nil {
		shared.WriteError(w, err.(shared.APIError))
		return
	}

	proposalID, err := createProposal(documentID, req.Title, req.NewTitle, req.Intent, req.Scope, req.AffectedBlockIDs, r.Context())
	if err != nil {
		shared.WriteError(w, shared.NewAPIError(http.StatusInternalServerError, "Error creating proposal: "+err.Error()))
		return
	}

	shared.WriteJSON(w, http.StatusCreated, map[string]string{"proposal_id": proposalID})
}

func handleGetProposal(w http.ResponseWriter, r *http.Request) {
	proposalID := chi.URLParam(r, "id")
	proposal, err := getProposal(proposalID, r.Context())
	if err != nil {
		shared.WriteError(w, shared.NewAPIError(http.StatusInternalServerError, "Error fetching proposal: "+err.Error()))
		return
	}

	shared.WriteJSON(w, http.StatusOK, proposal)
}

func handleUpdateProposal(w http.ResponseWriter, r *http.Request) {
	proposalID := chi.URLParam(r, "id")

	var req struct {
		Title            string   `json:"title"`
		NewTitle         string   `json:"new_title"`
		Intent           string   `json:"intent"`
		Scope            string   `json:"scope"`
		AffectedBlockIDs []string `json:"affected_block_ids"`
	}

	if err := shared.DecodeJSON(r, &req); err != nil {
		shared.WriteError(w, err.(shared.APIError))
		return
	}

	if err := updateProposal(proposalID, req.Title, req.NewTitle, req.Intent, req.Scope, req.AffectedBlockIDs, r.Context()); err != nil {
		shared.WriteError(w, shared.NewAPIError(http.StatusInternalServerError, "Error updating proposal: "+err.Error()))
		return
	}

	w.WriteHeader(http.StatusOK)
}

func handleDeleteProposal(w http.ResponseWriter, r *http.Request) {
	proposalID := chi.URLParam(r, "id")

	if err := DeleteProposal(proposalID, r.Context()); err != nil {
		shared.WriteError(w, shared.NewAPIError(http.StatusInternalServerError, "Error deleting proposal: "+err.Error()))
		return
	}

	if err := DeleteChangesByProposal(proposalID, r.Context()); err != nil {
		shared.WriteError(w, shared.NewAPIError(http.StatusInternalServerError, "Error deleting changes: "+err.Error()))
		return
	}

	w.WriteHeader(http.StatusOK)
}

func handleAcceptProposal(w http.ResponseWriter, r *http.Request) {
	proposalID := chi.URLParam(r, "id")

	if err := acceptProposal(proposalID, r.Context()); err != nil {
		shared.WriteError(w, shared.NewAPIError(http.StatusInternalServerError, "Error accepting proposal: "+err.Error()))
		return
	}

	w.WriteHeader(http.StatusOK)
}

func handleRejectProposal(w http.ResponseWriter, r *http.Request) {
	proposalID := chi.URLParam(r, "id")

	var req struct {
		Reason string `json:"reason"`
	}

	if err := shared.DecodeJSON(r, &req); err != nil {
		shared.WriteError(w, err.(shared.APIError))
		return
	}

	if strings.TrimSpace(req.Reason) == "" {
		shared.WriteError(w, shared.NewAPIError(http.StatusBadRequest, "rejection_reason is required"))
		return
	}

	if err := rejectProposal(proposalID, req.Reason, r.Context()); err != nil {
		shared.WriteError(w, shared.NewAPIError(http.StatusInternalServerError, "Error rejecting proposal: "+err.Error()))
		return
	}

	w.WriteHeader(http.StatusOK)
}

func handleGetBlockChangesForProposal(w http.ResponseWriter, r *http.Request) {
	proposalID := chi.URLParam(r, "id")
	changes, err := getBlockChangesForProposal(proposalID, r.Context())
	if err != nil {
		shared.WriteError(w, shared.NewAPIError(http.StatusInternalServerError, "Error fetching changes: "+err.Error()))
		return
	}

	shared.WriteJSON(w, http.StatusOK, changes)
}

func handleAddBlockChangeToProposal(w http.ResponseWriter, r *http.Request) {
	proposalID := chi.URLParam(r, "id")

	var req struct {
		BlockID   *string `json:"block_id"`
		Action    string  `json:"action"`
		BlockType string  `json:"block_type"`
		OrderPath []int64 `json:"order_path"`
		Content   string  `json:"content"`
	}

	if err := shared.DecodeJSON(r, &req); err != nil {
		shared.WriteError(w, err.(shared.APIError))
		return
	}

	if err := addBlockChangeToProposal(proposalID, req.BlockID, req.Action, req.BlockType, req.OrderPath, req.Content, r.Context()); err != nil {
		shared.WriteError(w, shared.NewAPIError(http.StatusInternalServerError, "Error adding change: "+err.Error()))
		return
	}

	w.WriteHeader(http.StatusCreated)
}
