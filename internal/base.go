package internal

import (
	"net/http"

	"granth/internal/auth"
	"granth/internal/documents"
	"granth/internal/utils"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

// BaseRouter builds and returns the application's HTTP router.
func BaseRouter() http.Handler {
	r := chi.NewRouter()

	// CORS middleware
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173", "http://localhost:3000"}, // Frontend dev servers
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300, // Maximum value not ignored by any of major browsers
	}))

	r.Use(middleware.Logger, middleware.Recoverer, middleware.RealIP, middleware.Heartbeat("/api/health"))

	r.With(utils.AuthMiddleware).Get("/api", func(w http.ResponseWriter, r *http.Request) {
		userID, _ := utils.GetUserIDFromContext(r.Context())
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"message": "Welcome to Granth, authenticated user!", "userID": "` + userID + `"}`))
	})

	r.Mount("/api/auth", auth.AuthRouter())
	r.With(utils.AuthMiddleware).Mount("/api/documents", documents.DocumentsRouter())

	return r
}
