package workspaces

import (
	"context"
	"encoding/json"
	"fmt"
	"granth/internal/config"
	"net/http"

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
	rows, err := config.PostgresDB.QueryContext(ctx,
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
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if workspaces == nil {
		workspaces = []*Workspace{}
	}
	writeJSON(w, http.StatusOK, workspaces)
}

func handleCreateWorkspace(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name        string `json:"name"`
		Description string `json:"description"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid JSON: "+err.Error(), http.StatusBadRequest)
		return
	}
	if req.Name == "" {
		http.Error(w, "name is required", http.StatusBadRequest)
		return
	}

	workspace, err := createWorkspace(req.Name, req.Description, r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusCreated, workspace)
}

func handleGetWorkspace(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	workspace, err := getWorkspace(id, r.Context())
	if err != nil {
		if err.Error() == "access denied" || err.Error() == "workspace not found" {
			http.Error(w, err.Error(), http.StatusForbidden)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, workspace)
}

func handleUpdateWorkspace(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req struct {
		Name        string `json:"name"`
		Description string `json:"description"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid JSON: "+err.Error(), http.StatusBadRequest)
		return
	}
	if req.Name == "" {
		http.Error(w, "name is required", http.StatusBadRequest)
		return
	}

	if err := updateWorkspaceDetails(id, req.Name, req.Description, r.Context()); err != nil {
		if err.Error() == "only admins can update workspace details" {
			http.Error(w, err.Error(), http.StatusForbidden)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func handleDeleteWorkspace(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := deleteWorkspaceByID(id, r.Context()); err != nil {
		if err.Error() == "only the workspace owner can delete it" {
			http.Error(w, err.Error(), http.StatusForbidden)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func handleListMembers(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	members, err := getWorkspaceMembers(id, r.Context())
	if err != nil {
		if err.Error() == "access denied" {
			http.Error(w, err.Error(), http.StatusForbidden)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if members == nil {
		members = []*WorkspaceMember{}
	}
	writeJSON(w, http.StatusOK, members)
}

func handleAddMember(w http.ResponseWriter, r *http.Request) {
	workspaceID := chi.URLParam(r, "id")
	var req struct {
		UserID string `json:"user_id"`
		Role   string `json:"role"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid JSON: "+err.Error(), http.StatusBadRequest)
		return
	}
	if req.UserID == "" || req.Role == "" {
		http.Error(w, "user_id and role are required", http.StatusBadRequest)
		return
	}

	member, err := addMember(workspaceID, req.UserID, req.Role, r.Context())
	if err != nil {
		if err.Error() == "only admins can add members" {
			http.Error(w, err.Error(), http.StatusForbidden)
			return
		}
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	writeJSON(w, http.StatusCreated, member)
}

func handleUpdateMemberRole(w http.ResponseWriter, r *http.Request) {
	workspaceID := chi.URLParam(r, "id")
	targetUID := chi.URLParam(r, "uid")
	var req struct {
		Role string `json:"role"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid JSON: "+err.Error(), http.StatusBadRequest)
		return
	}
	if req.Role == "" {
		http.Error(w, "role is required", http.StatusBadRequest)
		return
	}

	if err := updateMember(workspaceID, targetUID, req.Role, r.Context()); err != nil {
		if err.Error() == "only admins can change member roles" || err.Error() == "cannot demote the last admin" {
			http.Error(w, err.Error(), http.StatusForbidden)
			return
		}
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func handleRemoveMember(w http.ResponseWriter, r *http.Request) {
	workspaceID := chi.URLParam(r, "id")
	targetUID := chi.URLParam(r, "uid")

	if err := removeMemberFromWorkspace(workspaceID, targetUID, r.Context()); err != nil {
		if err.Error() == "only admins can remove members" || err.Error() == "cannot remove the last admin" {
			http.Error(w, err.Error(), http.StatusForbidden)
			return
		}
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func handleListWorkspaceDocuments(w http.ResponseWriter, r *http.Request) {
	workspaceID := chi.URLParam(r, "id")

	isMember, err := IsMember(workspaceID, r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if !isMember {
		http.Error(w, "access denied", http.StatusForbidden)
		return
	}

	docs, err := fetchDocumentsByWorkspaceID(workspaceID, r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if docs == nil {
		docs = []*workspaceDocument{}
	}
	writeJSON(w, http.StatusOK, docs)
}

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		http.Error(w, "error encoding JSON: "+err.Error(), http.StatusInternalServerError)
	}
}
