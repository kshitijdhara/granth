package documents

import "time"

type Document struct {
	ID          string    `json:"id"`
	Title       string    `json:"title"`
	WorkspaceID *string   `json:"workspace_id,omitempty"`
	CreatedBy   string    `json:"created_by"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	UpdatedBy   string    `json:"updated_by"`
}
