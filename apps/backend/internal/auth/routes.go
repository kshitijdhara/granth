package auth

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"granth/internal/config"
	"granth/internal/utils"

	"github.com/go-chi/chi/v5"
)

// AuthRouter builds and returns auth related routes.
func AuthRouter() http.Handler {
	r := chi.NewRouter()

	r.Post("/login", handleLogin)
	r.Post("/register", handleRegister)
	r.With(utils.AuthMiddleware).Post("/logout", handleLogout)
	r.Post("/refreshToken", handleRefreshToken)
	r.With(utils.AuthMiddleware).Get("/profile", handleGetProfile)
	r.With(utils.AuthMiddleware).Put("/profile", handleUpdateProfile)

	return r
}

func handleLogin(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	contentType := r.Header.Get("Content-Type")
	if contentType == "" || !strings.HasPrefix(contentType, "application/json") {
		http.Error(w, "Content-Type must be application/json", http.StatusBadRequest)
		return
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON: "+err.Error(), http.StatusBadRequest)
		return
	}

	if req.Email == "" || req.Password == "" {
		http.Error(w, "Missing required fields", http.StatusBadRequest)
		return
	}

	data, err := login(req.Email, req.Password)
	if err != nil {
		http.Error(w, "Login failed: "+err.Error(), http.StatusUnauthorized)
		return
	}

	ok := config.RedisClient.Set(r.Context(), "refresh:"+data.UserID, data.RefreshToken, time.Hour*24)
	if ok.Err() != nil {
		http.Error(w, "Error storing refresh token: "+ok.Err().Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}

func handleRegister(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	contentType := r.Header.Get("Content-Type")
	if contentType == "" || !strings.HasPrefix(contentType, "application/json") {
		http.Error(w, "Content-Type must be application/json", http.StatusBadRequest)
		return
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON: "+err.Error(), http.StatusBadRequest)
		return
	}

	if req.Name == "" || req.Email == "" || req.Password == "" {
		http.Error(w, "Missing required fields", http.StatusBadRequest)
		return
	}

	data, err := registerUser(req.Name, req.Email, req.Password)
	if err != nil {
		http.Error(w, "Registration failed: "+err.Error(), http.StatusBadRequest)
		return
	}
	ok := config.RedisClient.Set(r.Context(), "refresh:"+data.UserID, data.RefreshToken, time.Hour*24)
	if ok.Err() != nil {
		http.Error(w, "Error storing refresh token: "+ok.Err().Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}

func handleLogout(w http.ResponseWriter, r *http.Request) {
	claims, ok := utils.GetClaimsFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	userID := claims.UserID

	// Delete refresh token from Redis
	okRedis := config.RedisClient.Del(r.Context(), "refresh:"+userID)
	if okRedis.Err() != nil {
		http.Error(w, "Error deleting refresh token: "+okRedis.Err().Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Logged out successfully"})
}

func handleGetProfile(w http.ResponseWriter, r *http.Request) {
	claims, ok := utils.GetClaimsFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	username, email, _, err := GetUserByID(claims.UserID)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"id":       claims.UserID,
		"username": username,
		"email":    email,
	})
}

func handleUpdateProfile(w http.ResponseWriter, r *http.Request) {
	claims, ok := utils.GetClaimsFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	contentType := r.Header.Get("Content-Type")
	if contentType == "" || !strings.HasPrefix(contentType, "application/json") {
		http.Error(w, "Content-Type must be application/json", http.StatusBadRequest)
		return
	}

	var req struct {
		Username string `json:"username"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON: "+err.Error(), http.StatusBadRequest)
		return
	}

	if req.Username == "" {
		http.Error(w, "Username cannot be empty", http.StatusBadRequest)
		return
	}

	if err := UpdateUsername(claims.UserID, req.Username); err != nil {
		http.Error(w, "Update failed: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"username": req.Username})
}

func handleRefreshToken(w http.ResponseWriter, r *http.Request) {
	var req struct {
		RefreshToken string `json:"refreshToken"`
	}

	contentType := r.Header.Get("Content-Type")
	if contentType == "" || !strings.HasPrefix(contentType, "application/json") {
		http.Error(w, "Content-Type must be application/json", http.StatusBadRequest)
		return
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON: "+err.Error(), http.StatusBadRequest)
		return
	}

	if req.RefreshToken == "" {
		http.Error(w, "Missing refresh token", http.StatusBadRequest)
		return
	}

	accessToken, newRefreshToken, userID, err := utils.RefreshToken(req.RefreshToken)
	if err != nil {
		http.Error(w, "Token refresh failed: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Update stored refresh token
	ok := config.RedisClient.Set(r.Context(), "refresh:"+userID, newRefreshToken, time.Hour*24)
	if ok.Err() != nil {
		http.Error(w, "Error storing new refresh token: "+ok.Err().Error(), http.StatusInternalServerError)
		return
	}

	response := map[string]string{
		"accessToken":  accessToken,
		"refreshToken": newRefreshToken,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
