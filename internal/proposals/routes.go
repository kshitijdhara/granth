package proposals

import (
	"encoding/json"
	"net/http"

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
		http.Error(w, "Error fetching proposals: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(proposals)
}

func handleCreateProposal(w http.ResponseWriter, r *http.Request) {
	documentID := chi.URLParam(r, "documentID")

	var req struct {
		Title            string   `json:"title"`
		Intent           string   `json:"intent"`
		Scope            string   `json:"scope"`
		AffectedBlockIDs []string `json:"affected_block_ids"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON: "+err.Error(), http.StatusBadRequest)
		return
	}

	proposalID, err := createProposal(documentID, req.Title, req.Intent, req.Scope, req.AffectedBlockIDs, r.Context())
	if err != nil {
		http.Error(w, "Error creating proposal: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"proposal_id": proposalID})
}

func handleGetProposal(w http.ResponseWriter, r *http.Request) {
	proposalID := chi.URLParam(r, "id")
	proposal, err := getProposal(proposalID, r.Context())
	if err != nil {
		http.Error(w, "Error fetching proposal: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(proposal)
}

func handleUpdateProposal(w http.ResponseWriter, r *http.Request) {
	proposalID := chi.URLParam(r, "id")

	var req struct {
		Title            string   `json:"title"`
		Intent           string   `json:"intent"`
		Scope            string   `json:"scope"`
		AffectedBlockIDs []string `json:"affected_block_ids"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON: "+err.Error(), http.StatusBadRequest)
		return
	}

	err := updateProposal(proposalID, req.Title, req.Intent, req.Scope, req.AffectedBlockIDs, r.Context())
	if err != nil {
		http.Error(w, "Error updating proposal: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func handleDeleteProposal(w http.ResponseWriter, r *http.Request) {
	proposalID := chi.URLParam(r, "id")

	// TODO: Check permissions
	err := DeleteProposal(proposalID, r.Context())
	if err != nil {
		http.Error(w, "Error deleting proposal: "+err.Error(), http.StatusInternalServerError)
		return
	}

	err = DeleteChangesByProposal(proposalID, r.Context())
	if err != nil {
		http.Error(w, "Error deleting changes: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func handleAcceptProposal(w http.ResponseWriter, r *http.Request) {
	proposalID := chi.URLParam(r, "id")

	err := acceptProposal(proposalID, r.Context())
	if err != nil {
		http.Error(w, "Error accepting proposal: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func handleRejectProposal(w http.ResponseWriter, r *http.Request) {
	proposalID := chi.URLParam(r, "id")

	err := rejectProposal(proposalID, r.Context())
	if err != nil {
		http.Error(w, "Error rejecting proposal: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func handleGetBlockChangesForProposal(w http.ResponseWriter, r *http.Request) {
	proposalID := chi.URLParam(r, "id")
	changes, err := getBlockChangesForProposal(proposalID, r.Context())
	if err != nil {
		http.Error(w, "Error fetching changes: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(changes)
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
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON: "+err.Error(), http.StatusBadRequest)
		return
	}

	err := addBlockChangeToProposal(proposalID, req.BlockID, req.Action, req.BlockType, req.OrderPath, req.Content, r.Context())
	if err != nil {
		http.Error(w, "Error adding change: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
}
