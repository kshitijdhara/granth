package utils

import (
	"os"
	"time"

	"granth/pkg/models"

	"github.com/golang-jwt/jwt/v5"
)

var secretKey, _ = os.LookupEnv("JWT_SECRET")

func CreateUserToken(userID string) (string, error) {
	claims := models.Claims{
		UserID:     userID,
		Authorized: true,
		TokenType:  "access",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(1 * time.Minute)),
			Issuer:    "granth",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secretKey))
}

func CreateRefreshToken(userID string) (string, error) {
	claims := models.Claims{
		UserID:     userID,
		Authorized: true,
		TokenType:  "refresh",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(1 * 24 * time.Hour)),
			Issuer:    "granth",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secretKey))
}

func ValidateToken(token string) (*models.Claims, error) {
	parsedToken, err := jwt.ParseWithClaims(token, &models.Claims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, jwt.ErrTokenMalformed
		}
		return []byte(secretKey), nil
	})
	if err != nil {
		return nil, err
	}

	claims, ok := parsedToken.Claims.(*models.Claims)
	if !ok || !parsedToken.Valid {
		return nil, jwt.ErrTokenInvalidClaims
	}

	return claims, nil
}

func RefreshToken(token string) (string, string, string, error) {
	claims, err := ValidateToken(token)
	if err != nil {
		return "", "", "", err
	}

	// Ensure this is a refresh token
	if claims.TokenType != "refresh" {
		return "", "", "", jwt.ErrTokenInvalidClaims
	}

	userID := claims.UserID

	accessToken, err := CreateUserToken(userID)
	if err != nil {
		return "", "", "", err
	}

	refreshToken, err := CreateRefreshToken(userID)
	if err != nil {
		return "", "", "", err
	}

	return accessToken, refreshToken, userID, nil
}
