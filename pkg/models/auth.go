package models

import "github.com/golang-jwt/jwt/v5"

type AuthResponse struct {
	UserID       string `json:"userID"`
	Username     string `json:"username"`
	AccessToken  string `json:"accessToken"`
	RefreshToken string `json:"refreshToken"`
}

type Claims struct {
	UserID     string `json:"user_id"`
	Authorized bool   `json:"authorized"`
	TokenType  string `json:"token_type"`
	jwt.RegisteredClaims
}
