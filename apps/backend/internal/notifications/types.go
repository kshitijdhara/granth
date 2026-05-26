package notifications

import "encoding/json"

// Notification is a single event in a user's activity feed.
type Notification struct {
	ID        string          `json:"id"`
	UserID    string          `json:"user_id"`
	Kind      string          `json:"kind"`
	Payload   json.RawMessage `json:"payload"`
	Read      bool            `json:"read"`
	CreatedAt string          `json:"created_at"`
}

// Notification kind constants.
const (
	KindProposalSubmitted = "proposal_submitted"
	KindProposalAccepted  = "proposal_accepted"
	KindProposalRejected  = "proposal_rejected"
	KindCommentPosted     = "comment_posted"
	KindConflictDetected  = "conflict_detected"
	KindApprovalCast      = "approval_cast"
)
