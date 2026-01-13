package config

import (
	"database/sql"

	_ "github.com/lib/pq"
)

var PostgresDB *sql.DB

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
