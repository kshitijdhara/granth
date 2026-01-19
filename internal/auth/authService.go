package auth

import (
	"database/sql"
	"fmt"

	"granth/internal/utils"

	"golang.org/x/crypto/bcrypt"
)

func RegisterUser(username, email, passwordHash string) (AuthResponse, error) {
	_, existingUsername, _, err := GetUserByEmail(email)
	if err == nil {
		// email already exists
		if existingUsername == username {
			return AuthResponse{}, fmt.Errorf("username already in use")
		}
		return AuthResponse{}, fmt.Errorf("email already in use")
	}
	if err != sql.ErrNoRows {
		return AuthResponse{}, fmt.Errorf("error checking existing user: %w", err)
	}

	passwordHashBytes, err := bcrypt.GenerateFromPassword([]byte(passwordHash), bcrypt.DefaultCost)
	if err != nil {
		return AuthResponse{}, fmt.Errorf("error hashing password: %w", err)
	}
	passwordHash = string(passwordHashBytes)

	id, username, err := CreateUser(username, email, passwordHash)
	if err != nil {
		return AuthResponse{}, fmt.Errorf("error creating user: %w", err)
	}

	accessToken, err := utils.CreateUserToken(id)
	if err != nil {
		return AuthResponse{}, fmt.Errorf("error creating access token: %w", err)
	}

	refreshToken, err := utils.CreateRefreshToken(id)
	if err != nil {
		return AuthResponse{}, fmt.Errorf("error creating refresh token: %w", err)
	}
	return AuthResponse{
		UserID:       id,
		Username:     username,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}, nil
}

func Login(email, password string) (AuthResponse, error) {
	id, username, passwordHash, err := GetUserByEmail(email)
	if err != nil {
		return AuthResponse{}, fmt.Errorf("Error during login: %w", err)
	}
	err = bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(password))
	if err != nil {
		return AuthResponse{}, fmt.Errorf("Invalid Password")
	}
	accessToken, err := utils.CreateUserToken(id)
	if err != nil {
		return AuthResponse{}, fmt.Errorf("error creating access token: %w", err)
	}

	refreshToken, err := utils.CreateRefreshToken(id)
	if err != nil {
		return AuthResponse{}, fmt.Errorf("error creating refresh token: %w", err)
	}
	return AuthResponse{
		UserID:       id,
		Username:     username,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}, nil
}
