package utils

import (
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var secretKey, _ = os.LookupEnv("JWT_SECRET")

func CreateUserToken(userID string) (string, error) {
	claims := jwt.MapClaims{}
	claims["user_id"] = userID
	claims["authorized"] = true
	claims["token_type"] = "access"
	claims["exp"] = jwt.NewNumericDate(time.Now().Add(15 * time.Minute)) // 15 minutes
	claims["iss"] = "granth_app"

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secretKey))
}

func CreateRefreshToken(userID string) (string, error) {
	claims := jwt.MapClaims{}
	claims["user_id"] = userID
	claims["authorized"] = true
	claims["token_type"] = "refresh"
	claims["exp"] = jwt.NewNumericDate(time.Now().Add(1 * 24 * time.Hour)) // 1 day
	claims["iss"] = "granth_app"

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secretKey))
}

func ValidateToken(token string) (*jwt.Token, error) {
	return jwt.Parse(token, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, jwt.ErrTokenMalformed
		}
		return []byte(secretKey), nil
	})
}

func RefreshToken(token string) (string, string, error) {
	parsedToken, err := ValidateToken(token)
	if err != nil {
		return "", "", err
	}

	claims, ok := parsedToken.Claims.(jwt.MapClaims)
	if !ok || !parsedToken.Valid {
		return "", "", jwt.ErrTokenInvalidClaims
	}

	// Ensure this is a refresh token
	if tt, ok := claims["token_type"].(string); !ok || tt != "refresh" {
		return "", "", jwt.ErrTokenInvalidClaims
	}

	userID, ok := claims["user_id"].(string)
	if !ok {
		return "", "", jwt.ErrTokenInvalidClaims
	}

	accessToken, err := CreateUserToken(userID)
	if err != nil {
		return "", "", err
	}

	refreshToken, err := CreateRefreshToken(userID)
	if err != nil {
		return "", "", err
	}

	return accessToken, refreshToken, nil
}
