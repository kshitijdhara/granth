package auth

import (
	"database/sql"
	"fmt"

	"granth/internal/utils"

	"golang.org/x/crypto/bcrypt"
)

func registerUser(username, email, passwordHash string) (AuthResponse, error) {
	user, err := GetUserByEmail(email)
	if err == nil {
		// email already exists
		if user.Username == username {
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

func login(email, password string) (AuthResponse, error) {
	user, err := GetUserByEmail(email)
	if err != nil {
		return AuthResponse{}, fmt.Errorf("Error during login: %w", err)
	}
	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password))
	if err != nil {
		return AuthResponse{}, fmt.Errorf("Invalid Password")
	}
	accessToken, err := utils.CreateUserToken(user.ID)
	if err != nil {
		return AuthResponse{}, fmt.Errorf("error creating access token: %w", err)
	}

	refreshToken, err := utils.CreateRefreshToken(user.ID)
	if err != nil {
		return AuthResponse{}, fmt.Errorf("error creating refresh token: %w", err)
	}
	return AuthResponse{
		UserID:       user.ID,
		Username:     user.Username,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}, nil
}
