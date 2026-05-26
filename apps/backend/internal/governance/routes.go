package governance

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
)

// GovernanceRouter builds the governance routes.
// Mounted at /api/governance in base.go to avoid circular imports with
// the proposals and workspaces packages.
//
// Routes:
//   POST /governance/proposals/{id}/approve     — cast approval vote
//   GET  /governance/proposals/{id}/approvals   — get approval status
//   GET  /governance/workspaces/{id}            — get governance config
//   PUT  /governance/workspaces/{id}            — upsert governance config (admin only)
func GovernanceRouter() http.Handler {
	r := chi.NewRouter()

	r.Post("/proposals/{id}/approve", HandleApprove)
	r.Get("/proposals/{id}/approvals", HandleGetApprovals)
	r.Get("/workspaces/{id}", HandleGetGovernance)
	r.Put("/workspaces/{id}", HandleUpsertGovernance)

	return r
}

// HandleApprove handles POST /governance/proposals/{id}/approve
func HandleApprove(w http.ResponseWriter, r *http.Request) {
	proposalID := chi.URLParam(r, "id")
	status, err := castApproval(proposalID, r.Context())
	if err != nil {
		msg := err.Error()
		code := http.StatusInternalServerError
		switch {
		case strings.Contains(msg, "not open"):
			code = http.StatusBadRequest
		case strings.Contains(msg, "not a member"):
			code = http.StatusForbidden
		case strings.Contains(msg, "contributors cannot"):
			code = http.StatusForbidden
		case strings.Contains(msg, "authors cannot"):
			code = http.StatusForbidden
		case strings.Contains(msg, "already approved"):
			code = http.StatusConflict
		}
		http.Error(w, msg, code)
		return
	}
	writeJSON(w, http.StatusOK, status)
}

// HandleGetApprovals handles GET /governance/proposals/{id}/approvals
func HandleGetApprovals(w http.ResponseWriter, r *http.Request) {
	proposalID := chi.URLParam(r, "id")
	status, err := getApprovalStatus(proposalID, r.Context())
	if err != nil {
		http.Error(w, "Error fetching approval status: "+err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, status)
}

// HandleGetGovernance handles GET /governance/workspaces/{id}
func HandleGetGovernance(w http.ResponseWriter, r *http.Request) {
	workspaceID := chi.URLParam(r, "id")
	gov, err := getGovernance(workspaceID, r.Context())
	if err != nil {
		http.Error(w, "Error fetching governance: "+err.Error(), http.StatusInternalServerError)
		return
	}
	if gov == nil {
		writeJSON(w, http.StatusOK, map[string]interface{}{
			"workspace_id":        workspaceID,
			"min_reviewers":       1,
			"require_role":        nil,
			"allow_author_review": false,
			"configured":          false,
		})
		return
	}
	writeJSON(w, http.StatusOK, gov)
}

// HandleUpsertGovernance handles PUT /governance/workspaces/{id}
func HandleUpsertGovernance(w http.ResponseWriter, r *http.Request) {
	workspaceID := chi.URLParam(r, "id")

	var req Governance
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON: "+err.Error(), http.StatusBadRequest)
		return
	}

	gov, err := upsertGovernance(workspaceID, &req, r.Context())
	if err != nil {
		msg := err.Error()
		code := http.StatusInternalServerError
		if strings.Contains(msg, "only workspace admins") {
			code = http.StatusForbidden
		} else if strings.Contains(msg, "min_reviewers") {
			code = http.StatusBadRequest
		}
		http.Error(w, msg, code)
		return
	}
	writeJSON(w, http.StatusOK, gov)
}

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		http.Error(w, "error encoding JSON: "+err.Error(), http.StatusInternalServerError)
	}
}
