package auth

import (
	"context"
	"database/sql"
	"fmt"

	"granth/internal/foundation"

	"golang.org/x/crypto/bcrypt"
)

func registerUser(username, email, password string, ctx context.Context) (AuthResponse, error) {
	dbuser, err := GetUserByEmail(email)
	if err == nil {
		// email already exists
		if dbuser.Username == username {
			return AuthResponse{}, fmt.Errorf("username already in use")
		}
		return AuthResponse{}, fmt.Errorf("email already in use")
	}
	if err != sql.ErrNoRows {
		return AuthResponse{}, fmt.Errorf("error checking existing user: %w", err)
	}

	passwordHashBytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return AuthResponse{}, fmt.Errorf("error hashing password: %w", err)
	}

	user, err := CreateUser(username, email, string(passwordHashBytes))
	if err != nil {
		return AuthResponse{}, fmt.Errorf("error creating user: %w", err)
	}

	accessToken, err := foundation.CreateUserToken(user.ID)
	if err != nil {
		return AuthResponse{}, fmt.Errorf("error creating access token: %w", err)
	}

	refreshToken, err := foundation.CreateRefreshToken(user.ID)
	if err != nil {
		return AuthResponse{}, fmt.Errorf("error creating refresh token: %w", err)
	}

	// Store refresh token in Redis
	if err := foundation.RedisClient.Set(ctx, "refresh:"+user.ID, refreshToken, foundation.RefreshTokenTTL).Err(); err != nil {
		return AuthResponse{}, fmt.Errorf("error storing refresh token: %w", err)
	}

	return AuthResponse{
		UserID:       user.ID,
		Username:     user.Username,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}, nil
}

func login(email, password string, ctx context.Context) (AuthResponse, error) {
	user, err := GetUserByEmail(email)
	if err != nil {
		return AuthResponse{}, fmt.Errorf("error during login: %w", err)
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return AuthResponse{}, fmt.Errorf("invalid password")
	}

	accessToken, err := foundation.CreateUserToken(user.ID)
	if err != nil {
		return AuthResponse{}, fmt.Errorf("error creating access token: %w", err)
	}

	refreshToken, err := foundation.CreateRefreshToken(user.ID)
	if err != nil {
		return AuthResponse{}, fmt.Errorf("error creating refresh token: %w", err)
	}

	// Store refresh token in Redis
	if err := foundation.RedisClient.Set(ctx, "refresh:"+user.ID, refreshToken, foundation.RefreshTokenTTL).Err(); err != nil {
		return AuthResponse{}, fmt.Errorf("error storing refresh token: %w", err)
	}

	return AuthResponse{
		UserID:       user.ID,
		Username:     user.Username,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}, nil
}

func logout(userID string, ctx context.Context) error {
	if err := foundation.RedisClient.Del(ctx, "refresh:"+userID).Err(); err != nil {
		return fmt.Errorf("error deleting refresh token: %w", err)
	}
	return nil
}

func refreshAccessToken(refreshToken string, ctx context.Context) (AuthResponse, error) {
	accessToken, newRefreshToken, userID, err := foundation.RefreshToken(refreshToken)
	if err != nil {
		return AuthResponse{}, fmt.Errorf("error refreshing token: %w", err)
	}

	// Update stored refresh token in Redis
	if err := foundation.RedisClient.Set(ctx, "refresh:"+userID, newRefreshToken, foundation.RefreshTokenTTL).Err(); err != nil {
		return AuthResponse{}, fmt.Errorf("error storing new refresh token: %w", err)
	}

	return AuthResponse{
		UserID:       userID,
		AccessToken:  accessToken,
		RefreshToken: newRefreshToken,
	}, nil
}

func updatePassword(userID, currentPassword, newPassword string) error {
	user, err := GetUserByID(userID)
	if err != nil {
		return fmt.Errorf("error fetching user: %w", err)
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(currentPassword)); err != nil {
		return fmt.Errorf("current password is incorrect")
	}

	newPasswordHashBytes, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("error hashing new password: %w", err)
	}

	if err := UpdateUserPassword(userID, string(newPasswordHashBytes)); err != nil {
		return fmt.Errorf("error updating password: %w", err)
	}

	return nil
}
