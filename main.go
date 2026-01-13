package main

import (
	"database/sql"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"

	"granth/config"

	_ "github.com/lib/pq"
)

func initialiseServer() (map[string]string, *sql.DB) {
	env, err := config.Env()
	if err != nil {
		log.Fatalf("Error loading environment variables: %v", err)
	}
	psqlDB, err := config.InitPostgresDB(env["DB_URL"])
	if err != nil {
		log.Fatalf("Error connecting to the database: %v", err)
	}
	log.Println("Successfully connected to the database")
	return env, psqlDB

}

func main() {
	env, psqlDB := initialiseServer()
	router := chi.NewRouter()
	router.Use(middleware.Logger, middleware.Recoverer, middleware.RealIP)

	router.Get("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Welcome to Granth!"))
	})

	log.Println("Server starting on port " + env["SERVER_PORT"])
	if err := http.ListenAndServe(":"+env["SERVER_PORT"], router); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
	defer psqlDB.Close()
	log.Println("Server stopped")
}
