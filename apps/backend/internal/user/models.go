package user

import "time"

type AuthResponse struct {
	UserID       string `json:"userID"`
	Username     string `json:"username"`
	AccessToken  string `json:"accessToken"`
	RefreshToken string `json:"refreshToken"`
}

type User struct {
	ID           string                 `json:"id"`
	Username     string                 `json:"username"`
	Email        string                 `json:"email"`
	PasswordHash string                 `json:"-"`
	CreatedAt    time.Time              `json:"createdAt"`
	UpdatedAt    time.Time              `json:"updatedAt"`
	Properties   map[string]interface{} `json:"properties,omitempty"`
}
