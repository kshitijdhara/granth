package config

import (
	"context"
	"database/sql"
	"os"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/postgres"
	"github.com/redis/go-redis/v9"

	_ "github.com/golang-migrate/migrate/v4/source/file"
	_ "github.com/lib/pq"
)

var PostgresDB *sql.DB
var RedisClient *redis.Client

func InitPostgresDB(dataSourceName string) (*sql.DB, error) {
	db, err := sql.Open("postgres", dataSourceName)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		return nil, err
	}
	PostgresDB = db
	return PostgresDB, nil
}

func InitRedisClient(addr, password string, db int) (*redis.Client, error) {
	RedisClient = redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: password,
		DB:       db,
	})
	ping := RedisClient.Ping(context.Background())
	if ping.Err() != nil {
		return nil, ping.Err()
	}
	return RedisClient, nil
}

func RunMigrations(db *sql.DB) error {
	wd, err := os.Getwd()
	if err != nil {
		return err
	}
	driver, err := postgres.WithInstance(db, &postgres.Config{})
	if err != nil {
		return err
	}
	m, err := migrate.NewWithDatabaseInstance(
		"file://"+wd+"/migrations",
		"postgres", driver)
	if err != nil {
		return err
	}
	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return err
	}
	return nil
}
