package documents

type Block struct {
	ID         string  `json:"id"`
	DocumentID string  `json:"document_id"`
	Content    string  `json:"content"`
	BlockType  string  `json:"block_type"`
	Order      float64 `json:"order"`
	OwnerID    string  `json:"owner_id"`
	CreatedAt  string  `json:"created_at"`
	UpdatedAt  string  `json:"updated_at"`
}

type Document struct {
	ID        string `json:"id"`
	Title     string `json:"title"`
	Status    string `json:"status"`
	OwnerID   string `json:"owner_id"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
	UpdatedBy string `json:"updated_by"`
}
