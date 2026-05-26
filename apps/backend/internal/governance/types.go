package governance

// Governance holds the review policy for a workspace.
type Governance struct {
	ID                string  `json:"id"`
	WorkspaceID       string  `json:"workspace_id"`
	MinReviewers      int     `json:"min_reviewers"`
	RequireRole       *string `json:"require_role"`
	AllowAuthorReview bool    `json:"allow_author_review"`
	CreatedAt         string  `json:"created_at"`
	UpdatedAt         string  `json:"updated_at"`
}

// Approval is one reviewer's approval vote on a proposal.
type Approval struct {
	ID         string `json:"id"`
	ProposalID string `json:"proposal_id"`
	ReviewerID string `json:"reviewer_id"`
	ApprovedAt string `json:"approved_at"`
}

// ApprovalStatus is the current approval state of a proposal.
type ApprovalStatus struct {
	Approvals        []*Approval `json:"approvals"`
	ApprovalCount    int         `json:"approval_count"`
	RequiredCount    int         `json:"required_count"`
	ThresholdReached bool        `json:"threshold_reached"`
}
