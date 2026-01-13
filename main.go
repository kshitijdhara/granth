package main

import (
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"

	"granth/config"
)

func main() {
	env, err := config.Env()
	if err != nil {
		log.Fatalf("Error loading environment variables: %v", err)
	}

	router := chi.NewRouter()
	router.Use(middleware.Logger, middleware.Recoverer, middleware.RealIP)

	router.Get("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Welcome to Granth!"))
	})

	log.Println("Server starting on port " + env["SERVER_PORT"])
	if err := http.ListenAndServe(":"+env["SERVER_PORT"], router); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
