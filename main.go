package main

import (
	"net/http"

	"granth/config"
	"granth/routes"

	"github.com/joho/godotenv"
)

func main() {
	// initialize global logger first
	config.InitLogger()

	env, err := godotenv.Read()
	if err != nil {
		config.Logger.Fatalf("Error loading environment variables: %v", err)
	}

	// initialize DB
	psqlDB, err := config.InitPostgresDB(env["DB_URL"])
	if err != nil {
		config.Logger.Fatalf("Error connecting to the database: %v", err)
	}
	defer psqlDB.Close()
	config.Logger.Println("Successfully connected to the database")

	// create router from routes package
	router := routes.BaseRouter()

	addr := ":" + env["SERVER_PORT"]
	config.Logger.Println("Server starting on port " + env["SERVER_PORT"])
	if err := http.ListenAndServe(addr, router); err != nil {
		config.Logger.Fatalf("Server failed to start: %v", err)
	}
	config.Logger.Println("Server stopped")
}
