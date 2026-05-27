package auth

import (
	"database/sql"
	"fmt"
	"granth/internal/config"
)

func CreateUser(username, email, passwordHash string) (string, string, error) {
	var id, returnedUsername string
	err := config.PostgresDB.QueryRow(
		"INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username",
		username, email, passwordHash,
	).Scan(&id, &returnedUsername)
	if err != nil {
		return "", "", fmt.Errorf("createUser query: %w", err)
	}
	return id, returnedUsername, nil
}

func GetUserByEmail(email string) (*User, error) {
	var user User
	err := config.PostgresDB.QueryRow("SELECT id, username, email, password_hash, created_at, updated_at FROM users WHERE email = $1", email).Scan(&user.ID, &user.Username, &user.Email, &user.PasswordHash, &user.CreatedAt, &user.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, sql.ErrNoRows
	}
	if err != nil {
		return nil, fmt.Errorf("getUserByEmail query: %w", err)
	}
	return &user, nil
}

func GetUserByID(id string) (*User, error) {
	var user User
	err := config.PostgresDB.QueryRow("SELECT id, username, email, password_hash, created_at, updated_at FROM users WHERE id = $1", id).Scan(&user.ID, &user.Username, &user.Email, &user.PasswordHash, &user.CreatedAt, &user.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, sql.ErrNoRows
	}
	if err != nil {
		return nil, fmt.Errorf("getUserByID query: %w", err)
	}
	return &user, nil
}

func UpdateUserPassword(id, newPasswordHash string) error {
	_, err := config.PostgresDB.Exec("UPDATE users SET password_hash = $1 WHERE id = $2", newPasswordHash, id)
	if err != nil {
		return fmt.Errorf("updateUserPassword exec: %w", err)
	}
	return nil
}

func UpdateUsername(id, newUsername string) error {
	_, err := config.PostgresDB.Exec("UPDATE users SET username = $1 WHERE id = $2", newUsername, id)
	if err != nil {
		return fmt.Errorf("updateUsername exec: %w", err)
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
