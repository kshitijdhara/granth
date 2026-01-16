package api

import (
	"encoding/json"
	"io"
	"net/http"
	"time"

	"granth/internal/config"
	"granth/internal/service"
	"granth/internal/utils"

	"github.com/go-chi/chi/v5"
)

// AuthRouter builds and returns auth related routes.
func AuthRouter() http.Handler {
	r := chi.NewRouter()

	r.Post("/login", func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			Email    string `json:"email"`
			Password string `json:"password"`
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			// Log the request body for debugging
			bodyBytes, _ := io.ReadAll(r.Body)
			bodyString := string(bodyBytes)
			http.Error(w, "Invalid JSON: "+err.Error()+". Body: "+bodyString, http.StatusBadRequest)
			return
		}

		if req.Email == "" || req.Password == "" {
			http.Error(w, "Missing required fields", http.StatusBadRequest)
			return
		}

		data, err := service.Login(req.Email, req.Password)
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
	})

	r.Post("/register", func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			Name     string `json:"name"`
			Email    string `json:"email"`
			Password string `json:"password"`
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			// Log the request body for debugging
			bodyBytes, _ := io.ReadAll(r.Body)
			bodyString := string(bodyBytes)
			http.Error(w, "Invalid JSON: "+err.Error()+". Body: "+bodyString, http.StatusBadRequest)
			return
		}

		if req.Name == "" || req.Email == "" || req.Password == "" {
			http.Error(w, "Missing required fields", http.StatusBadRequest)
			return
		}

		data, err := service.RegisterUser(req.Name, req.Email, req.Password)
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
	})

	r.With(utils.AuthMiddleware).Post("/logout", func(w http.ResponseWriter, r *http.Request) {
		// Extract userID from JWT token (already validated by middleware)
		userID, ok := utils.GetUserIDFromContext(r.Context())
		if !ok {
			http.Error(w, "Unable to extract user ID from token", http.StatusInternalServerError)
			return
		}

		// Delete refresh token from Redis
		okRedis := config.RedisClient.Del(r.Context(), "refresh:"+userID)
		if okRedis.Err() != nil {
			http.Error(w, "Error deleting refresh token: "+okRedis.Err().Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"message": "Logged out successfully"})
	})

	r.Post("/refreshToken", func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			RefreshToken string `json:"refreshToken"`
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			// Log the request body for debugging
			bodyBytes, _ := io.ReadAll(r.Body)
			bodyString := string(bodyBytes)
			http.Error(w, "Invalid JSON: "+err.Error()+". Body: "+bodyString, http.StatusBadRequest)
			return
		}

		if req.RefreshToken == "" {
			http.Error(w, "Missing refresh token", http.StatusBadRequest)
			return
		}

		accessToken, newRefreshToken, err := utils.RefreshToken(req.RefreshToken)
		if err != nil {
			http.Error(w, "Token refresh failed: "+err.Error(), http.StatusUnauthorized)
			return
		}

		response := map[string]string{
			"accessToken":  accessToken,
			"refreshToken": newRefreshToken,
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	})
	return r
}
