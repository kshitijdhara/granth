package blocks

import (
	"github.com/lib/pq"
)

type Block struct {
	ID         string        `json:"id"`
	DocumentID string        `json:"document_id"`
	Content    string        `json:"content"`
	BlockType  string        `json:"block_type"`
	OrderPath  pq.Int64Array `json:"order_path"`
	CreatedBy  string        `json:"created_by"`
	CreatedAt  string        `json:"created_at"`
	UpdatedAt  string        `json:"updated_at"`
	UpdatedBy  string        `json:"updated_by"`
}
