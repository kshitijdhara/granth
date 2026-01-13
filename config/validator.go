package config

import (
	"github.com/joho/godotenv"
)

func Env() (map[string]string, error) {
	return godotenv.Read()
}
