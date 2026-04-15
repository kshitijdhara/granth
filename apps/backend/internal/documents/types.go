package documents

type Document struct {
	ID        string `json:"id"`
	Title     string `json:"title"`
	CreatedBy string `json:"created_by"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
	UpdatedBy string `json:"updated_by"`
}
