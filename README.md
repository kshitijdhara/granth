# Granth

Granth is a small, focused Go web service containing authentication and document features used for local development and testing.

**Features**
- HTTP API for authentication and document management
- Simple, opinionated repo layout for small services
- Docker compose for quick local environments

**Repository Layout**
- `cmd/` — application entrypoints (e.g. `cmd/server`)
- `frontend/` — web client (Vite + React/TS)
- `granth/` — collections and sample scripts
- `internal/` — application internals (auth, documents, config, utils)
- `migrations/` — SQL migrations
- `Dockerfile`, `docker-compose.yaml` — container/development helpers

Quickstart — Backend

1. Ensure Go modules are tidy:

```bash
go mod tidy
```

2. Set environment variables (example):

```bash
export SERVER_PORT=8080
export DB_URL="postgres://user:pass@localhost:5432/dbname?sslmode=disable"
export JWT_SECRET="your-secret"
```

3. Run database migrations (example using `migrate`):

```bash
#migrate -path migrations -database "$DB_URL" up
```

4. Run the server (development):

```bash
go run ./cmd/server
```

Or build and run the binary:

```bash
go build -o bin/granth ./cmd/server
./bin/granth
```

Quickstart — Frontend

1. Install dependencies and run dev server:

```bash
cd frontend
npm install
npm run dev
```

Container (Docker)

```bash
docker compose up --build
```

Contributing

See `CONTRIBUTING.md` for contribution guidelines. Keep PRs focused and run `gofmt` on Go code.

License

This project is licensed under the MIT License — see `LICENSE`.

--
Last updated: 2026-01-20
