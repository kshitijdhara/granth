package routes

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

// NewRouter builds and returns the application's HTTP router.
func NewRouter() http.Handler {
	r := chi.NewRouter()
	r.Use(middleware.Logger, middleware.Recoverer, middleware.RealIP)

	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Welcome to Granth!"))
	})

	return r
}
