package workspaces

import (
	"context"
	"fmt"
	"granth/internal/utils"
	"time"
)

func createWorkspace(name, description string, ctx context.Context) (*Workspace, error) {
	userID, ok := utils.GetUserIDFromContext(ctx)
	if !ok {
		return nil, fmt.Errorf("user ID not found in context")
	}

	now := time.Now().UTC().Format(time.RFC3339)
	w := &Workspace{
		Name:        name,
		Description: description,
		OwnerID:     userID,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	if err := createWorkspaceInTx(w, userID, ctx); err != nil {
		return nil, fmt.Errorf("error creating workspace: %w", err)
	}
	return w, nil
}

func getWorkspace(id string, ctx context.Context) (*Workspace, error) {
	userID, ok := utils.GetUserIDFromContext(ctx)
	if !ok {
		return nil, fmt.Errorf("user ID not found in context")
	}

	w, err := fetchWorkspaceByID(id, ctx)
	if err != nil {
		return nil, err
	}

	member, err := fetchMember(id, userID, ctx)
	if err != nil {
		return nil, fmt.Errorf("error checking membership: %w", err)
	}
	if member == nil {
		return nil, fmt.Errorf("access denied")
	}

	return w, nil
}

func getUserWorkspaces(ctx context.Context) ([]*Workspace, error) {
	userID, ok := utils.GetUserIDFromContext(ctx)
	if !ok {
		return nil, fmt.Errorf("user ID not found in context")
	}
	return fetchWorkspacesForUser(userID, ctx)
}

func updateWorkspaceDetails(id, name, description string, ctx context.Context) error {
	userID, ok := utils.GetUserIDFromContext(ctx)
	if !ok {
		return fmt.Errorf("user ID not found in context")
	}

	member, err := fetchMember(id, userID, ctx)
	if err != nil {
		return fmt.Errorf("error checking membership: %w", err)
	}
	if member == nil || member.Role != string(RoleAdmin) {
		return fmt.Errorf("only admins can update workspace details")
	}

	w := &Workspace{
		ID:          id,
		Name:        name,
		Description: description,
		UpdatedAt:   time.Now().UTC().Format(time.RFC3339),
	}
	return updateWorkspace(w, ctx)
}

func deleteWorkspaceByID(id string, ctx context.Context) error {
	userID, ok := utils.GetUserIDFromContext(ctx)
	if !ok {
		return fmt.Errorf("user ID not found in context")
	}

	w, err := fetchWorkspaceByID(id, ctx)
	if err != nil {
		return err
	}
	if w.OwnerID != userID {
		return fmt.Errorf("only the workspace owner can delete it")
	}

	return deleteWorkspace(id, ctx)
}

func getWorkspaceMembers(workspaceID string, ctx context.Context) ([]*WorkspaceMember, error) {
	userID, ok := utils.GetUserIDFromContext(ctx)
	if !ok {
		return nil, fmt.Errorf("user ID not found in context")
	}

	member, err := fetchMember(workspaceID, userID, ctx)
	if err != nil {
		return nil, fmt.Errorf("error checking membership: %w", err)
	}
	if member == nil {
		return nil, fmt.Errorf("access denied")
	}

	return fetchMembersForWorkspace(workspaceID, ctx)
}

func addMember(workspaceID, targetUserID, role string, ctx context.Context) (*WorkspaceMember, error) {
	userID, ok := utils.GetUserIDFromContext(ctx)
	if !ok {
		return nil, fmt.Errorf("user ID not found in context")
	}

	if role != string(RoleAdmin) && role != string(RoleReviewer) && role != string(RoleContributor) {
		return nil, fmt.Errorf("invalid role: must be admin, reviewer, or contributor")
	}

	caller, err := fetchMember(workspaceID, userID, ctx)
	if err != nil {
		return nil, fmt.Errorf("error checking caller membership: %w", err)
	}
	if caller == nil || caller.Role != string(RoleAdmin) {
		return nil, fmt.Errorf("only admins can add members")
	}

	existing, err := fetchMember(workspaceID, targetUserID, ctx)
	if err != nil {
		return nil, fmt.Errorf("error checking existing membership: %w", err)
	}
	if existing != nil {
		return nil, fmt.Errorf("user is already a member of this workspace")
	}

	m := &WorkspaceMember{
		WorkspaceID: workspaceID,
		UserID:      targetUserID,
		Role:        role,
		InvitedBy:   &userID,
		JoinedAt:    time.Now().UTC().Format(time.RFC3339),
	}
	if err := insertMember(m, ctx); err != nil {
		return nil, err
	}
	return m, nil
}

func updateMember(workspaceID, targetUserID, role string, ctx context.Context) error {
	userID, ok := utils.GetUserIDFromContext(ctx)
	if !ok {
		return fmt.Errorf("user ID not found in context")
	}

	if role != string(RoleAdmin) && role != string(RoleReviewer) && role != string(RoleContributor) {
		return fmt.Errorf("invalid role: must be admin, reviewer, or contributor")
	}

	caller, err := fetchMember(workspaceID, userID, ctx)
	if err != nil {
		return fmt.Errorf("error checking caller membership: %w", err)
	}
	if caller == nil || caller.Role != string(RoleAdmin) {
		return fmt.Errorf("only admins can change member roles")
	}

	// Prevent demoting the last admin
	if role != string(RoleAdmin) {
		target, err := fetchMember(workspaceID, targetUserID, ctx)
		if err != nil {
			return fmt.Errorf("error fetching target member: %w", err)
		}
		if target != nil && target.Role == string(RoleAdmin) {
			adminCount, err := countAdmins(workspaceID, ctx)
			if err != nil {
				return err
			}
			if adminCount <= 1 {
				return fmt.Errorf("cannot demote the last admin")
			}
		}
	}

	return updateMemberRole(workspaceID, targetUserID, role, ctx)
}

func removeMemberFromWorkspace(workspaceID, targetUserID string, ctx context.Context) error {
	userID, ok := utils.GetUserIDFromContext(ctx)
	if !ok {
		return fmt.Errorf("user ID not found in context")
	}

	caller, err := fetchMember(workspaceID, userID, ctx)
	if err != nil {
		return fmt.Errorf("error checking caller membership: %w", err)
	}
	if caller == nil || caller.Role != string(RoleAdmin) {
		return fmt.Errorf("only admins can remove members")
	}

	target, err := fetchMember(workspaceID, targetUserID, ctx)
	if err != nil {
		return fmt.Errorf("error fetching target member: %w", err)
	}
	if target == nil {
		return fmt.Errorf("user is not a member of this workspace")
	}

	if target.Role == string(RoleAdmin) {
		adminCount, err := countAdmins(workspaceID, ctx)
		if err != nil {
			return err
		}
		if adminCount <= 1 {
			return fmt.Errorf("cannot remove the last admin")
		}
	}

	return removeMember(workspaceID, targetUserID, ctx)
}

// IsMember returns whether the requesting user is a member of the given workspace.
// This is exported for use by other packages (e.g., documents).
func IsMember(workspaceID string, ctx context.Context) (bool, error) {
	userID, ok := utils.GetUserIDFromContext(ctx)
	if !ok {
		return false, fmt.Errorf("user ID not found in context")
	}
	m, err := fetchMember(workspaceID, userID, ctx)
	if err != nil {
		return false, err
	}
	return m != nil, nil
}
