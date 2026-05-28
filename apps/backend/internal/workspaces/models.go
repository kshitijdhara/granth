package workspaces

type WorkspaceRole string

const (
	RoleAdmin       WorkspaceRole = "admin"
	RoleReviewer    WorkspaceRole = "reviewer"
	RoleContributor WorkspaceRole = "contributor"
)

type Workspace struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	OwnerID     string `json:"owner_id"`
	CreatedAt   string `json:"created_at"`
	UpdatedAt   string `json:"updated_at"`
}

type WorkspaceMember struct {
	ID          string  `json:"id"`
	WorkspaceID string  `json:"workspace_id"`
	UserID      string  `json:"user_id"`
	Username    string  `json:"username"`
	Role        string  `json:"role"`
	InvitedBy   *string `json:"invited_by,omitempty"`
	JoinedAt    string  `json:"joined_at"`
}
