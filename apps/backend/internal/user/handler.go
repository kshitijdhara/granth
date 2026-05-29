package user

import (
	"net/http"

	"granth/internal/foundation"
	"granth/internal/shared"

	"github.com/go-chi/chi/v5"
)

// AuthRouter builds and returns auth related routes.
func AuthRouter() http.Handler {
	r := chi.NewRouter()

	r.Post("/login", handleLogin)
	r.Post("/register", handleRegister)
	r.Post("/refreshToken", handleRefreshToken)
	r.With(foundation.AuthMiddleware).Patch("/updatePassword", handleUpdatePassword)
	r.With(foundation.AuthMiddleware).Post("/logout", handleLogout)
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

	data, err := login(req.Email, req.Password, r.Context())
	if err != nil {
		shared.WriteError(w, shared.NewAPIError(http.StatusUnauthorized, "Login failed: "+err.Error()))
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

	data, err := registerUser(req.Name, req.Email, req.Password, r.Context())
	if err != nil {
		shared.WriteError(w, shared.NewAPIError(http.StatusBadRequest, "Registration failed: "+err.Error()))
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

	if err := logout(claims.UserID, r.Context()); err != nil {
		shared.WriteError(w, shared.NewAPIError(http.StatusInternalServerError, "Logout failed: "+err.Error()))
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

func handleUpdatePassword(w http.ResponseWriter, r *http.Request) {
	claims, ok := foundation.GetClaimsFromContext(r.Context())
	if !ok {
		shared.WriteError(w, shared.ErrUnauthorized)
		return
	}

	var req struct {
		CurrentPassword string `json:"currentPassword"`
		NewPassword     string `json:"newPassword"`
	}

	if err := shared.DecodeJSON(r, &req); err != nil {
		shared.WriteError(w, err.(shared.APIError))
		return
	}
	if err := updatePassword(claims.UserID, req.CurrentPassword, req.NewPassword); err != nil {
		shared.WriteError(w, shared.NewAPIError(http.StatusInternalServerError, "Password update failed: "+err.Error()))
		return
	}

	shared.WriteJSON(w, http.StatusOK, map[string]string{"message": "Password updated successfully"})
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

	data, err := refreshAccessToken(req.RefreshToken, r.Context())
	if err != nil {
		shared.WriteError(w, shared.NewAPIError(http.StatusInternalServerError, "Token refresh failed: "+err.Error()))
		return
	}

	shared.WriteJSON(w, http.StatusOK, data)
}
