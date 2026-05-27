package auth

type AuthResponse struct {
	UserID       string `json:"userID"`
	Username     string `json:"username"`
	AccessToken  string `json:"accessToken"`
	RefreshToken string `json:"refreshToken"`
}
