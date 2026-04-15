package proposals

import (
	"github.com/lib/pq"
)

type ProposalStatus string

const (
	ProposalStatusOpen     ProposalStatus = "open"
	ProposalStatusAccepted ProposalStatus = "accepted"
	ProposalStatusRejected ProposalStatus = "rejected"
)

type Proposal struct {
	ID               string   `json:"id"`
	DocumentID       string   `json:"document_id"`
	AffectedBlockIDs []string `json:"affected_block_ids"`
	Title            string   `json:"title"`
	AuthorID         string   `json:"author_id"`
	Intent           string   `json:"intent"`
	Scope            string   `json:"scope"`
	State            string   `json:"state"`
	CreatedAt        string   `json:"created_at"`
	UpdatedAt        string   `json:"updated_at"`
}

type ProposalBlockChange struct {
	ID         string        `json:"id"`
	ProposalID string        `json:"proposal_id"`
	BlockID    *string       `json:"block_id"`
	Action     string        `json:"action"`
	BlockType  string        `json:"block_type"`
	OrderPath  pq.Int64Array `json:"order_path"`
	Content    string        `json:"content"`
	CreatedBy  string        `json:"created_by"`
	CreatedAt  string        `json:"created_at"`
}
