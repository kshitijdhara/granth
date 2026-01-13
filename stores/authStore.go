package stores

import (
	"fmt"
	"granth/config"
)

func CreateUser(username, email, passwordHash string) error {

	_, err := config.PostgresDB.Exec("INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3)", username, email, passwordHash)
	if err != nil {
		return fmt.Errorf("createUser exec: %w", err)
	}
	return nil
}

func GetUserByEmail(email string) (string, string, string, error) {
	var id, username, passwordHash string
	err := config.PostgresDB.QueryRow("SELECT id, username, password_hash FROM users WHERE email = $1", email).Scan(&id, &username, &passwordHash)
	if err != nil {
		return "", "", "", fmt.Errorf("getUserByEmail query: %w", err)
	}
	return id, username, passwordHash, nil
}

func GetUserByID(id string) (string, string, string, error) {
	var username, email, passwordHash string
	err := config.PostgresDB.QueryRow("SELECT username, email, password_hash FROM users WHERE id = $1", id).Scan(&username, &email, &passwordHash)
	if err != nil {
		return "", "", "", fmt.Errorf("getUserByID query: %w", err)
	}
	return username, email, passwordHash, nil
}

func UpdateUserPassword(id, newPasswordHash string) error {
	_, err := config.PostgresDB.Exec("UPDATE users SET password_hash = $1 WHERE id = $2", newPasswordHash, id)
	if err != nil {
		return fmt.Errorf("updateUserPassword exec: %w", err)
	}
	return nil
}

func DeleteUser(id string) error {
	_, err := config.PostgresDB.Exec("DELETE FROM users WHERE id = $1", id)
	if err != nil {
		return fmt.Errorf("deleteUser exec: %w", err)
	}
	return nil
}
