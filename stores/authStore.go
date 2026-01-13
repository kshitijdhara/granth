package stores

import (
	"fmt"

	"granth/config"
)

func createUser(username, email, passwordHash string) error {
	db := config.PostgresDB
	if db == nil {
		return fmt.Errorf("database not initialized")
	}

	_, err := db.Exec("INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3)", username, email, passwordHash)
	if err != nil {
		return fmt.Errorf("createUser exec: %w", err)
	}
	return nil
}
