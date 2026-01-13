# Granth

Granth is a small Go HTTP service focused on authentication. The repository follows a clean, minimal single-repo layout inspired by Apple's emphasis on small focused components and clear package boundaries.

This README explains the purpose of each top-level folder and the basic steps to get started.

Repository layout and purpose
- `cmd/` : application entrypoints. Each subfolder under `cmd/` is a runnable program. Keep `main` packages here.
- `internal/api/` : HTTP handlers and router setup. Contains the application's public HTTP surface. Not for reuse by external projects.
- `internal/service/` : business logic and application use-cases. Services orchestrate store, utils, and config layers.
- `internal/store/` : database access layer (SQL queries, repository functions). Keeps DB concerns isolated.
- `internal/config/` : configuration, DB/Redis initialization and environment wiring.
- `internal/utils/` : small helper utilities (JWT helpers, common helpers). Keep them focused and minimal.
- `pkg/models/` : public, versioned types that could be consumed by external packages or SDKs. Use carefully — prefer internal packages for app-only types.
- `migrations/` : SQL migration files used by the migration tool.
- `docker-compose.yaml`, `Dockerfile` : container & local dev orchestration.

Why this layout
- Clear separation of concerns makes the code easier to review, test, and evolve.
- `internal/` prevents accidental reuse of internal packages by consumers — encouraging a single source of truth for your service implementation.
- Small packages follow the single responsibility principle and map well to future extraction into microservices if needed.

Quickstart (local)
1. Copy `.env` or set required environment variables: `DB_URL`, `REDIS_IP`, `REDIS_PASSWORD`, `JWT_SECRET`, `SERVER_PORT`.
2. Run database migrations (requires `migrate` and Postgres):

```bash
# example, ensure DATABASE_URL or DB_URL set
make migrate-up || migrate -path migrations -database "$DB_URL" up
```

3. Build and run:

```bash
go build ./cmd/server
./server
```

4. Endpoints
- `GET /` — health / welcome
- `POST /auth/register` — register (form values: `username`, `email`, `password`)
- `GET /auth/login` — login (form values: `email`, `password`)
- `GET /auth/refreshToken` — refresh access token (header `Refresh-Token`)

Contributing
Please read `CONTRIBUTING.md` for how to open issues and submit PRs. Follow `gofmt` and keep changes small and focused.

License
This project is licensed under the MIT License — see `LICENSE`.
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
