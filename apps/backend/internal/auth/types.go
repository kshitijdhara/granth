package auth

import "time"

type AuthResponse struct {
	UserID       string `json:"userID"`
	Username     string `json:"username"`
	AccessToken  string `json:"accessToken"`
	RefreshToken string `json:"refreshToken"`
}

type User struct {
	ID           string
	Username     string
	Email        string
	PasswordHash string
	CreatedAt    time.Time
	UpdatedAt    time.Time
}
