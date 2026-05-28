package main

import (
	"net/http"

	"granth/internal"
	"granth/internal/foundation"

	"github.com/joho/godotenv"
)

func main() {
	// initialize global logger first
	foundation.InitLogger()

	env, err := godotenv.Read()
	if err != nil {
		foundation.Logger.Fatalf("Error loading environment variables: %v", err)
	}

	// initialize DB
	psqlDB, err := foundation.InitPostgresDB(env["DB_URL"])
	if err != nil {
		foundation.Logger.Fatalf("Error connecting to the database: %v", err)
	}
	defer psqlDB.Close()

	// perform any pending migrations
	foundation.Logger.Println("Running database migrations...")
	err = foundation.RunMigrations(psqlDB)
	if err != nil {
		foundation.Logger.Fatalf("Error running database migrations: %v", err)
	}
	foundation.Logger.Println("Successfully connected to the database")

	// initialize Redis
	redisClient, err := foundation.InitRedisClient(env["REDIS_IP"], env["REDIS_PASSWORD"], 1)
	if err != nil {
		foundation.Logger.Fatalf("Error connecting to Redis: %v", err)
	}
	defer redisClient.Close()
	foundation.Logger.Println("Successfully connected to Redis")

	// create router from api package
	router := internal.BaseRouter()

	addr := ":" + env["SERVER_PORT"]
	foundation.Logger.Println("Server starting on port " + env["SERVER_PORT"])
	if err := http.ListenAndServe(addr, router); err != nil {
		foundation.Logger.Fatalf("Server failed to start: %v", err)
	}
	foundation.Logger.Println("Server stopped")
}
