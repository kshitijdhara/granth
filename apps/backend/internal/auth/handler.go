package auth

import (
	"net/http"
	"time"

	"granth/internal/foundation"
	"granth/internal/shared"

	"github.com/go-chi/chi/v5"
)

// AuthRouter builds and returns auth related routes.
func AuthRouter() http.Handler {
	r := chi.NewRouter()

	r.Post("/login", handleLogin)
	r.Post("/register", handleRegister)
	r.With(foundation.AuthMiddleware).Post("/logout", handleLogout)
	r.Post("/refreshToken", handleRefreshToken)
	r.With(foundation.AuthMiddleware).Get("/profile", handleGetProfile)
	r.With(foundation.AuthMiddleware).Put("/profile", handleUpdateProfile)
	r.With(foundation.AuthMiddleware).Get("/users/{id}", handleGetUserByID)

	return r
}

func handleLogin(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := shared.DecodeJSON(r, &req); err != nil {
		shared.WriteError(w, err.(shared.APIError))
		return
	}

	if req.Email == "" || req.Password == "" {
		shared.WriteError(w, shared.NewAPIError(http.StatusBadRequest, "Missing required fields"))
		return
	}

	data, err := login(req.Email, req.Password)
	if err != nil {
		shared.WriteError(w, shared.NewAPIError(http.StatusUnauthorized, "Login failed: "+err.Error()))
		return
	}

	ok := foundation.RedisClient.Set(r.Context(), "refresh:"+data.UserID, data.RefreshToken, time.Hour*24)
	if ok.Err() != nil {
		shared.WriteError(w, shared.NewAPIError(http.StatusInternalServerError, "Error storing refresh token: "+ok.Err().Error()))
		return
	}

	shared.WriteJSON(w, http.StatusOK, data)
}

func handleRegister(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := shared.DecodeJSON(r, &req); err != nil {
		shared.WriteError(w, err.(shared.APIError))
		return
	}

	if req.Name == "" || req.Email == "" || req.Password == "" {
		shared.WriteError(w, shared.NewAPIError(http.StatusBadRequest, "Missing required fields"))
		return
	}

	data, err := registerUser(req.Name, req.Email, req.Password)
	if err != nil {
		shared.WriteError(w, shared.NewAPIError(http.StatusBadRequest, "Registration failed: "+err.Error()))
		return
	}

	ok := foundation.RedisClient.Set(r.Context(), "refresh:"+data.UserID, data.RefreshToken, time.Hour*24)
	if ok.Err() != nil {
		shared.WriteError(w, shared.NewAPIError(http.StatusInternalServerError, "Error storing refresh token: "+ok.Err().Error()))
		return
	}

	shared.WriteJSON(w, http.StatusCreated, data)
}

func handleLogout(w http.ResponseWriter, r *http.Request) {
	claims, ok := foundation.GetClaimsFromContext(r.Context())
	if !ok {
		shared.WriteError(w, shared.ErrUnauthorized)
		return
	}

	userID := claims.UserID

	okRedis := foundation.RedisClient.Del(r.Context(), "refresh:"+userID)
	if okRedis.Err() != nil {
		shared.WriteError(w, shared.NewAPIError(http.StatusInternalServerError, "Error deleting refresh token: "+okRedis.Err().Error()))
		return
	}

	shared.WriteJSON(w, http.StatusOK, map[string]string{"message": "Logged out successfully"})
}

func handleGetProfile(w http.ResponseWriter, r *http.Request) {
	claims, ok := foundation.GetClaimsFromContext(r.Context())
	if !ok {
		shared.WriteError(w, shared.ErrUnauthorized)
		return
	}

	user, err := GetUserByID(claims.UserID)
	if err != nil {
		shared.WriteError(w, shared.ErrNotFound)
		return
	}

	shared.WriteJSON(w, http.StatusOK, map[string]string{
		"id":       claims.UserID,
		"username": user.Username,
		"email":    user.Email,
	})
}

func handleUpdateProfile(w http.ResponseWriter, r *http.Request) {
	claims, ok := foundation.GetClaimsFromContext(r.Context())
	if !ok {
		shared.WriteError(w, shared.ErrUnauthorized)
		return
	}

	var req struct {
		Username string `json:"username"`
	}

	if err := shared.DecodeJSON(r, &req); err != nil {
		shared.WriteError(w, err.(shared.APIError))
		return
	}

	if req.Username == "" {
		shared.WriteError(w, shared.NewAPIError(http.StatusBadRequest, "Username cannot be empty"))
		return
	}

	if err := UpdateUsername(claims.UserID, req.Username); err != nil {
		shared.WriteError(w, shared.NewAPIError(http.StatusInternalServerError, "Update failed: "+err.Error()))
		return
	}

	shared.WriteJSON(w, http.StatusOK, map[string]string{"username": req.Username})
}

func handleGetUserByID(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	user, err := GetUserByID(id)
	if err != nil {
		shared.WriteError(w, shared.ErrNotFound)
		return
	}

	shared.WriteJSON(w, http.StatusOK, map[string]string{
		"id":       user.ID,
		"username": user.Username,
		"email":    user.Email,
	})
}

func handleRefreshToken(w http.ResponseWriter, r *http.Request) {
	var req struct {
		RefreshToken string `json:"refreshToken"`
	}

	if err := shared.DecodeJSON(r, &req); err != nil {
		shared.WriteError(w, err.(shared.APIError))
		return
	}

	if req.RefreshToken == "" {
		shared.WriteError(w, shared.NewAPIError(http.StatusBadRequest, "Missing refresh token"))
		return
	}

	accessToken, newRefreshToken, userID, err := foundation.RefreshToken(req.RefreshToken)
	if err != nil {
		shared.WriteError(w, shared.NewAPIError(http.StatusInternalServerError, "Token refresh failed: "+err.Error()))
		return
	}

	ok := foundation.RedisClient.Set(r.Context(), "refresh:"+userID, newRefreshToken, time.Hour*24)
	if ok.Err() != nil {
		shared.WriteError(w, shared.NewAPIError(http.StatusInternalServerError, "Error storing new refresh token: "+ok.Err().Error()))
		return
	}

	response := map[string]string{
		"accessToken":  accessToken,
		"refreshToken": newRefreshToken,
	}

	shared.WriteJSON(w, http.StatusOK, response)
}
