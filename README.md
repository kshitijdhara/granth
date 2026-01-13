# Granth

Simple Go web service.

Run locally

1. Ensure dependencies are tidy:

```bash
go mod tidy
```

2. Set environment variables (example):

```bash
export SERVER_PORT=8080
export DB_URL="postgres://user:pass@localhost:5432/dbname?sslmode=disable"
```

3. Run the server (development):

```bash
go run ./cmd/server
```

Or build and run the binary:

```bash
go build -o bin/granth ./cmd/server
./bin/granth
```

Notes

- For local development with Postgres that doesn't use SSL, include `?sslmode=disable` in `DB_URL`.
- Move additional startup logic into `cmd/server/main.go` as needed.
