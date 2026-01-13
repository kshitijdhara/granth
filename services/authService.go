package services

import (
	"fmt"
	"granth/stores"

	"golang.org/x/crypto/bcrypt"
)

func RegisterUser(username, email, passwordHash string) error {
	fetchedUserName, fetchedEmail, _, err := stores.GetUserByEmail(email)
	if err == nil {
		if username == fetchedUserName {
			return fmt.Errorf("username already in use")
		} else if email == fetchedEmail {
			return fmt.Errorf("email already in use")
		}
	} else {
		passwordHashBytes, err := bcrypt.GenerateFromPassword([]byte(passwordHash), bcrypt.DefaultCost)
		if err != nil {
			return fmt.Errorf("error hashing password: %w", err)
		}
		passwordHash := string(passwordHashBytes)
		return stores.CreateUser(username, email, passwordHash)
	}
	return nil
}

func Login(email, password string) (string, string, error) {
	id, username, passwordHash, err := stores.GetUserByEmail(email)
	if err != nil {
		return "", "", fmt.Errorf("Error during login: %w", err)
	}
	err = bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(password))
	if err != nil {
		return "", "", fmt.Errorf("Invalid Password")
	}
	return id, username, nil
}
