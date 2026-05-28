package governance

import (
	"net/http"
	"strings"

	"granth/internal/shared"

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
		writeGovernanceError(w, err)
		return
	}
	shared.WriteJSON(w, http.StatusOK, status)
}

// HandleGetApprovals handles GET /governance/proposals/{id}/approvals
func HandleGetApprovals(w http.ResponseWriter, r *http.Request) {
	proposalID := chi.URLParam(r, "id")
	status, err := getApprovalStatus(proposalID, r.Context())
	if err != nil {
		shared.WriteError(w, shared.NewAPIError(http.StatusInternalServerError, "Error fetching approval status: "+err.Error()))
		return
	}
	shared.WriteJSON(w, http.StatusOK, status)
}

// HandleGetGovernance handles GET /governance/workspaces/{id}
func HandleGetGovernance(w http.ResponseWriter, r *http.Request) {
	workspaceID := chi.URLParam(r, "id")
	gov, err := getGovernance(workspaceID, r.Context())
	if err != nil {
		shared.WriteError(w, shared.NewAPIError(http.StatusInternalServerError, "Error fetching governance: "+err.Error()))
		return
	}

	if gov == nil {
		shared.WriteJSON(w, http.StatusOK, map[string]interface{}{
			"workspace_id":        workspaceID,
			"min_reviewers":       1,
			"require_role":        nil,
			"allow_author_review": false,
			"configured":          false,
		})
		return
	}

	shared.WriteJSON(w, http.StatusOK, gov)
}

// HandleUpsertGovernance handles PUT /governance/workspaces/{id}
func HandleUpsertGovernance(w http.ResponseWriter, r *http.Request) {
	workspaceID := chi.URLParam(r, "id")

	var req Governance
	if err := shared.DecodeJSON(r, &req); err != nil {
		shared.WriteError(w, err.(shared.APIError))
		return
	}

	gov, err := upsertGovernance(workspaceID, &req, r.Context())
	if err != nil {
		writeGovernanceError(w, err)
		return
	}

	shared.WriteJSON(w, http.StatusOK, gov)
}

// writeGovernanceError maps service-layer error messages to appropriate HTTP status codes.
func writeGovernanceError(w http.ResponseWriter, err error) {
	msg := err.Error()
	var statusCode int
	switch {
	case strings.Contains(msg, "not open"):
		statusCode = http.StatusBadRequest
	case strings.Contains(msg, "not a member"):
		statusCode = http.StatusForbidden
	case strings.Contains(msg, "contributors cannot"):
		statusCode = http.StatusForbidden
	case strings.Contains(msg, "authors cannot"):
		statusCode = http.StatusForbidden
	case strings.Contains(msg, "already approved"):
		statusCode = http.StatusConflict
	case strings.Contains(msg, "only workspace admins"):
		statusCode = http.StatusForbidden
	case strings.Contains(msg, "min_reviewers"):
		statusCode = http.StatusBadRequest
	default:
		statusCode = http.StatusInternalServerError
	}
	shared.WriteError(w, shared.NewAPIError(statusCode, msg))
}
