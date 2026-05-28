package workspaces

import (
	"context"
	"fmt"
	"net/http"

	"granth/internal/foundation"
	"granth/internal/shared"

	"github.com/go-chi/chi/v5"
)

func WorkspacesRouter() http.Handler {
	r := chi.NewRouter()

	r.Get("/", handleListWorkspaces)
	r.Post("/", handleCreateWorkspace)
	r.Get("/{id}", handleGetWorkspace)
	r.Put("/{id}", handleUpdateWorkspace)
	r.Delete("/{id}", handleDeleteWorkspace)

	r.Get("/{id}/members", handleListMembers)
	r.Post("/{id}/members", handleAddMember)
	r.Put("/{id}/members/{uid}", handleUpdateMemberRole)
	r.Delete("/{id}/members/{uid}", handleRemoveMember)

	r.Get("/{id}/documents", handleListWorkspaceDocuments)

	return r
}

// workspaceDocument is a minimal document representation for the workspace
// documents endpoint. The full Document type lives in the documents package;
// duplicating the fields here avoids an import cycle.
type workspaceDocument struct {
	ID          string  `json:"id"`
	Title       string  `json:"title"`
	WorkspaceID *string `json:"workspace_id"`
	CreatedBy   string  `json:"created_by"`
	CreatedAt   string  `json:"created_at"`
	UpdatedAt   string  `json:"updated_at"`
}

func fetchDocumentsByWorkspaceID(workspaceID string, ctx context.Context) ([]*workspaceDocument, error) {
	rows, err := foundation.PostgresDB.QueryContext(ctx,
		`SELECT id, title, workspace_id, created_by, created_at, updated_at
		 FROM documents WHERE workspace_id = $1 ORDER BY created_at DESC`,
		workspaceID,
	)
	if err != nil {
		return nil, fmt.Errorf("error querying workspace documents: %w", err)
	}
	defer rows.Close()

	var docs []*workspaceDocument
	for rows.Next() {
		d := &workspaceDocument{}
		if err := rows.Scan(&d.ID, &d.Title, &d.WorkspaceID, &d.CreatedBy, &d.CreatedAt, &d.UpdatedAt); err != nil {
			return nil, fmt.Errorf("error scanning document: %w", err)
		}
		docs = append(docs, d)
	}
	return docs, nil
}

// ── Handlers ──────────────────────────────────────────────────────────────────

func handleListWorkspaces(w http.ResponseWriter, r *http.Request) {
	workspaces, err := getUserWorkspaces(r.Context())
	if err != nil {
		shared.WriteError(w, shared.NewAPIError(http.StatusInternalServerError, err.Error()))
		return
	}

	if workspaces == nil {
		workspaces = []*Workspace{}
	}

	shared.WriteJSON(w, http.StatusOK, workspaces)
}

func handleCreateWorkspace(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name        string `json:"name"`
		Description string `json:"description"`
	}

	if err := shared.DecodeJSON(r, &req); err != nil {
		shared.WriteError(w, err.(shared.APIError))
		return
	}

	if req.Name == "" {
		shared.WriteError(w, shared.NewAPIError(http.StatusBadRequest, "name is required"))
		return
	}

	workspace, err := createWorkspace(req.Name, req.Description, r.Context())
	if err != nil {
		shared.WriteError(w, shared.NewAPIError(http.StatusInternalServerError, err.Error()))
		return
	}

	shared.WriteJSON(w, http.StatusCreated, workspace)
}

func handleGetWorkspace(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	workspace, err := getWorkspace(id, r.Context())
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "access denied" || err.Error() == "workspace not found" {
			statusCode = http.StatusForbidden
		}
		shared.WriteError(w, shared.NewAPIError(statusCode, err.Error()))
		return
	}

	shared.WriteJSON(w, http.StatusOK, workspace)
}

func handleUpdateWorkspace(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req struct {
		Name        string `json:"name"`
		Description string `json:"description"`
	}

	if err := shared.DecodeJSON(r, &req); err != nil {
		shared.WriteError(w, err.(shared.APIError))
		return
	}

	if req.Name == "" {
		shared.WriteError(w, shared.NewAPIError(http.StatusBadRequest, "name is required"))
		return
	}

	if err := updateWorkspaceDetails(id, req.Name, req.Description, r.Context()); err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "only admins can update workspace details" {
			statusCode = http.StatusForbidden
		}
		shared.WriteError(w, shared.NewAPIError(statusCode, err.Error()))
		return
	}

	w.WriteHeader(http.StatusOK)
}

func handleDeleteWorkspace(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	if err := deleteWorkspaceByID(id, r.Context()); err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "only the workspace owner can delete it" {
			statusCode = http.StatusForbidden
		}
		shared.WriteError(w, shared.NewAPIError(statusCode, err.Error()))
		return
	}

	w.WriteHeader(http.StatusOK)
}

func handleListMembers(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	members, err := getWorkspaceMembers(id, r.Context())
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "access denied" {
			statusCode = http.StatusForbidden
		}
		shared.WriteError(w, shared.NewAPIError(statusCode, err.Error()))
		return
	}

	if members == nil {
		members = []*WorkspaceMember{}
	}

	shared.WriteJSON(w, http.StatusOK, members)
}

func handleAddMember(w http.ResponseWriter, r *http.Request) {
	workspaceID := chi.URLParam(r, "id")
	var req struct {
		UserID string `json:"user_id"`
		Role   string `json:"role"`
	}

	if err := shared.DecodeJSON(r, &req); err != nil {
		shared.WriteError(w, err.(shared.APIError))
		return
	}

	if req.UserID == "" || req.Role == "" {
		shared.WriteError(w, shared.NewAPIError(http.StatusBadRequest, "user_id and role are required"))
		return
	}

	member, err := addMember(workspaceID, req.UserID, req.Role, r.Context())
	if err != nil {
		statusCode := http.StatusBadRequest
		if err.Error() == "only admins can add members" {
			statusCode = http.StatusForbidden
		}
		shared.WriteError(w, shared.NewAPIError(statusCode, err.Error()))
		return
	}

	shared.WriteJSON(w, http.StatusCreated, member)
}

func handleUpdateMemberRole(w http.ResponseWriter, r *http.Request) {
	workspaceID := chi.URLParam(r, "id")
	targetUID := chi.URLParam(r, "uid")
	var req struct {
		Role string `json:"role"`
	}

	if err := shared.DecodeJSON(r, &req); err != nil {
		shared.WriteError(w, err.(shared.APIError))
		return
	}

	if req.Role == "" {
		shared.WriteError(w, shared.NewAPIError(http.StatusBadRequest, "role is required"))
		return
	}

	if err := updateMember(workspaceID, targetUID, req.Role, r.Context()); err != nil {
		statusCode := http.StatusBadRequest
		if err.Error() == "only admins can change member roles" || err.Error() == "cannot demote the last admin" {
			statusCode = http.StatusForbidden
		}
		shared.WriteError(w, shared.NewAPIError(statusCode, err.Error()))
		return
	}

	w.WriteHeader(http.StatusOK)
}

func handleRemoveMember(w http.ResponseWriter, r *http.Request) {
	workspaceID := chi.URLParam(r, "id")
	targetUID := chi.URLParam(r, "uid")

	if err := removeMemberFromWorkspace(workspaceID, targetUID, r.Context()); err != nil {
		statusCode := http.StatusBadRequest
		if err.Error() == "only admins can remove members" || err.Error() == "cannot remove the last admin" {
			statusCode = http.StatusForbidden
		}
		shared.WriteError(w, shared.NewAPIError(statusCode, err.Error()))
		return
	}

	w.WriteHeader(http.StatusOK)
}

func handleListWorkspaceDocuments(w http.ResponseWriter, r *http.Request) {
	workspaceID := chi.URLParam(r, "id")

	isMember, err := IsMember(workspaceID, r.Context())
	if err != nil {
		shared.WriteError(w, shared.NewAPIError(http.StatusInternalServerError, err.Error()))
		return
	}

	if !isMember {
		shared.WriteError(w, shared.NewAPIError(http.StatusForbidden, "access denied"))
		return
	}

	docs, err := fetchDocumentsByWorkspaceID(workspaceID, r.Context())
	if err != nil {
		shared.WriteError(w, shared.NewAPIError(http.StatusInternalServerError, err.Error()))
		return
	}

	if docs == nil {
		docs = []*workspaceDocument{}
	}

	shared.WriteJSON(w, http.StatusOK, docs)
}
