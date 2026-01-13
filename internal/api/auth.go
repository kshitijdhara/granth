package api

import (
	"encoding/json"
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

	r.Get("/login", func(w http.ResponseWriter, r *http.Request) {
		if err := r.ParseMultipartForm(32 << 20); err != nil {
			http.Error(w, "Error parsing form data: "+err.Error(), http.StatusBadRequest)
			return
		}
		email, password := r.FormValue("email"), r.FormValue("password")
		if email == "" || password == "" {
			http.Error(w, "Missing required fields", http.StatusBadRequest)
			return
		}
		data, err := service.Login(email, password)
		if err != nil {
			http.Error(w, "Login failed: "+err.Error(), http.StatusUnauthorized)
			return
		}
		ok := config.RedisClient.Set(r.Context(), "refresh:"+data.UserID, data.RefreshToken, time.Hour*24)
		if ok.Err() != nil {
			http.Error(w, "Error storing refresh token: "+ok.Err().Error(), http.StatusInternalServerError)
			return
		}
		jsonData, err := json.Marshal(data)
		if err != nil {
			http.Error(w, "Error encoding response: "+err.Error(), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(jsonData)
	})

	r.Post("/register", (func(w http.ResponseWriter, r *http.Request) {
		if err := r.ParseMultipartForm(32 << 20); err != nil {
			http.Error(w, "Error parsing form data: "+err.Error(), http.StatusBadRequest)
			return
		}
		username, email, password := r.FormValue("username"), r.FormValue("email"), r.FormValue("password")
		if username == "" || email == "" || password == "" {
			http.Error(w, "Missing required fields", http.StatusBadRequest)
			return
		}
		data, err := service.RegisterUser(username, email, password)
		if err != nil {
			http.Error(w, "Registration failed: "+err.Error(), http.StatusBadRequest)
			return
		}
		jsonData, err := json.Marshal(data)
		if err != nil {
			http.Error(w, "Error encoding response: "+err.Error(), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(jsonData)
	}))

	r.Get("/refreshToken", func(w http.ResponseWriter, r *http.Request) {
		refreshToken := r.Header.Get("Refresh-Token")
		if refreshToken == "" {
			http.Error(w, "Missing refresh token", http.StatusBadRequest)
			return
		}
		accessToken, newRefreshToken, err := utils.RefreshToken(refreshToken)
		if err != nil {
			http.Error(w, "Token refresh failed: "+err.Error(), http.StatusUnauthorized)
			return
		}
		response := map[string]string{
			"accessToken":  accessToken,
			"refreshToken": newRefreshToken,
		}
		jsonData, err := json.Marshal(response)
		if err != nil {
			http.Error(w, "Error encoding response: "+err.Error(), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(jsonData)
	})
	return r
}
