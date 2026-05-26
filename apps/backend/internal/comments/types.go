package comments

// Comment represents a single entry in the reasoning layer.
// AuthorUsername is populated at query time via JOIN — it is not a stored column.
type Comment struct {
	ID             string  `json:"id"`
	ProposalID     string  `json:"proposal_id"`
	AuthorID       string  `json:"author_id"`
	AuthorUsername string  `json:"author_username"`
	ParentID       *string `json:"parent_id"`
	Body           string  `json:"body"`
	CreatedAt      string  `json:"created_at"`
	UpdatedAt      string  `json:"updated_at"`
}
