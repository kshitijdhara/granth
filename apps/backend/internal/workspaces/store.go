package workspaces

import (
	"context"
	"database/sql"
	"fmt"
	"granth/internal/config"
	"time"
)

// ── Workspaces ────────────────────────────────────────────────────────────────

func createWorkspaceInTx(w *Workspace, memberID string, ctx context.Context) error {
	tx, err := config.PostgresDB.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("error starting transaction: %w", err)
	}
	defer tx.Rollback()

	err = tx.QueryRowContext(ctx,
		`INSERT INTO workspaces (name, description, owner_id, created_at, updated_at)
		 VALUES ($1, $2, $3, $4, $5) RETURNING id`,
		w.Name, w.Description, w.OwnerID, w.CreatedAt, w.UpdatedAt,
	).Scan(&w.ID)
	if err != nil {
		return fmt.Errorf("error inserting workspace: %w", err)
	}

	_, err = tx.ExecContext(ctx,
		`INSERT INTO workspace_members (workspace_id, user_id, role, joined_at)
		 VALUES ($1, $2, $3, $4)`,
		w.ID, memberID, string(RoleAdmin), time.Now().UTC().Format(time.RFC3339),
	)
	if err != nil {
		return fmt.Errorf("error inserting workspace owner as member: %w", err)
	}

	return tx.Commit()
}

func fetchWorkspaceByID(id string, ctx context.Context) (*Workspace, error) {
	w := &Workspace{}
	err := config.PostgresDB.QueryRowContext(ctx,
		`SELECT id, name, COALESCE(description, ''), owner_id, created_at, updated_at
		 FROM workspaces WHERE id = $1`, id,
	).Scan(&w.ID, &w.Name, &w.Description, &w.OwnerID, &w.CreatedAt, &w.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("workspace not found")
	}
	if err != nil {
		return nil, fmt.Errorf("error fetching workspace: %w", err)
	}
	return w, nil
}

func fetchWorkspacesForUser(userID string, ctx context.Context) ([]*Workspace, error) {
	rows, err := config.PostgresDB.QueryContext(ctx,
		`SELECT w.id, w.name, COALESCE(w.description, ''), w.owner_id, w.created_at, w.updated_at
		 FROM workspaces w
		 INNER JOIN workspace_members wm ON wm.workspace_id = w.id
		 WHERE wm.user_id = $1
		 ORDER BY w.created_at DESC`, userID,
	)
	if err != nil {
		return nil, fmt.Errorf("error querying workspaces: %w", err)
	}
	defer rows.Close()

	var workspaces []*Workspace
	for rows.Next() {
		w := &Workspace{}
		if err := rows.Scan(&w.ID, &w.Name, &w.Description, &w.OwnerID, &w.CreatedAt, &w.UpdatedAt); err != nil {
			return nil, fmt.Errorf("error scanning workspace: %w", err)
		}
		workspaces = append(workspaces, w)
	}
	return workspaces, nil
}

func updateWorkspace(w *Workspace, ctx context.Context) error {
	_, err := config.PostgresDB.ExecContext(ctx,
		`UPDATE workspaces SET name = $1, description = $2, updated_at = $3 WHERE id = $4`,
		w.Name, w.Description, w.UpdatedAt, w.ID,
	)
	if err != nil {
		return fmt.Errorf("error updating workspace: %w", err)
	}
	return nil
}

func deleteWorkspace(id string, ctx context.Context) error {
	_, err := config.PostgresDB.ExecContext(ctx, `DELETE FROM workspaces WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("error deleting workspace: %w", err)
	}
	return nil
}

// ── Members ───────────────────────────────────────────────────────────────────

func fetchMember(workspaceID, userID string, ctx context.Context) (*WorkspaceMember, error) {
	m := &WorkspaceMember{}
	err := config.PostgresDB.QueryRowContext(ctx,
		`SELECT wm.id, wm.workspace_id, wm.user_id, u.username, wm.role, wm.invited_by, wm.joined_at
		 FROM workspace_members wm
		 INNER JOIN users u ON u.id = wm.user_id
		 WHERE wm.workspace_id = $1 AND wm.user_id = $2`,
		workspaceID, userID,
	).Scan(&m.ID, &m.WorkspaceID, &m.UserID, &m.Username, &m.Role, &m.InvitedBy, &m.JoinedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("error fetching member: %w", err)
	}
	return m, nil
}

func fetchMembersForWorkspace(workspaceID string, ctx context.Context) ([]*WorkspaceMember, error) {
	rows, err := config.PostgresDB.QueryContext(ctx,
		`SELECT wm.id, wm.workspace_id, wm.user_id, u.username, wm.role, wm.invited_by, wm.joined_at
		 FROM workspace_members wm
		 INNER JOIN users u ON u.id = wm.user_id
		 WHERE wm.workspace_id = $1
		 ORDER BY wm.joined_at ASC`,
		workspaceID,
	)
	if err != nil {
		return nil, fmt.Errorf("error querying members: %w", err)
	}
	defer rows.Close()

	var members []*WorkspaceMember
	for rows.Next() {
		m := &WorkspaceMember{}
		if err := rows.Scan(&m.ID, &m.WorkspaceID, &m.UserID, &m.Username, &m.Role, &m.InvitedBy, &m.JoinedAt); err != nil {
			return nil, fmt.Errorf("error scanning member: %w", err)
		}
		members = append(members, m)
	}
	return members, nil
}

func insertMember(m *WorkspaceMember, ctx context.Context) error {
	err := config.PostgresDB.QueryRowContext(ctx,
		`INSERT INTO workspace_members (workspace_id, user_id, role, invited_by, joined_at)
		 VALUES ($1, $2, $3, $4, $5) RETURNING id`,
		m.WorkspaceID, m.UserID, m.Role, m.InvitedBy, m.JoinedAt,
	).Scan(&m.ID)
	if err != nil {
		return fmt.Errorf("error inserting member: %w", err)
	}
	return nil
}

func updateMemberRole(workspaceID, userID, role string, ctx context.Context) error {
	_, err := config.PostgresDB.ExecContext(ctx,
		`UPDATE workspace_members SET role = $1 WHERE workspace_id = $2 AND user_id = $3`,
		role, workspaceID, userID,
	)
	if err != nil {
		return fmt.Errorf("error updating member role: %w", err)
	}
	return nil
}

func removeMember(workspaceID, userID string, ctx context.Context) error {
	_, err := config.PostgresDB.ExecContext(ctx,
		`DELETE FROM workspace_members WHERE workspace_id = $1 AND user_id = $2`,
		workspaceID, userID,
	)
	if err != nil {
		return fmt.Errorf("error removing member: %w", err)
	}
	return nil
}

func countAdmins(workspaceID string, ctx context.Context) (int, error) {
	var count int
	err := config.PostgresDB.QueryRowContext(ctx,
		`SELECT COUNT(*) FROM workspace_members WHERE workspace_id = $1 AND role = 'admin'`,
		workspaceID,
	).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("error counting admins: %w", err)
	}
	return count, nil
}
