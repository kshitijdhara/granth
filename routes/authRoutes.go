package routes

import (
	"granth/services"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

// NewRouter builds and returns the application's HTTP router.
func AuthRouter() http.Handler {
	r := chi.NewRouter()
	r.Use(middleware.Logger, middleware.Recoverer, middleware.RealIP)

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
		id, username, err := services.Login(email, password)
		if err != nil {
			http.Error(w, "Login failed: "+err.Error(), http.StatusUnauthorized)
			return
		}
		w.Write([]byte("Login successful! UserID: " + id + ", Username: " + username))
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
		err := services.RegisterUser(username, email, password)
		if err != nil {
			http.Error(w, "Registration failed: "+err.Error(), http.StatusBadRequest)
			return
		}
		w.Write([]byte("Registration successful!"))
	}))
	return r
}
