# Granth

A document collaboration platform built on the principle that change is a first-class citizen — not an afterthought.

> See [docs/NORTHSTAR.md](docs/NORTHSTAR.md) for the product philosophy.

---

## Project Structure

```
granth/
├── apps/
│   ├── backend/        # Go API (chi, PostgreSQL, Redis, JWT)
│   └── frontend/       # React + TypeScript (Bun, SCSS)
├── infrastructure/
│   └── docker-compose.yaml
├── api/                # Bruno API collection for manual testing
├── scripts/
│   └── dev.sh          # Local dev runner (backend + frontend)
├── docs/               # Architecture, contributing, changelog
├── .env.example        # Environment variable template
└── CLAUDE.md           # AI assistant guidelines
```

---

## Prerequisites

| Tool | Version |
|---|---|
| Go | 1.25+ |
| Bun | Latest |
| Docker + Compose | v2+ |

---

## Quick Start

### Option A — Local (no Docker for app code)

**1. Configure environment**
```bash
cp .env.example .env
# Edit .env with your local DB/Redis connection details
```

**2. Start infrastructure**
```bash
# Start only postgres and redis
docker compose -f infrastructure/docker-compose.yaml up postgres redis -d
```

**3. Run database migrations**
```bash
cd apps/backend
# Requires golang-migrate CLI (brew install golang-migrate)
migrate -path migrations -database "$DB_URL" up
```

**4. Start both services**
```bash
bash scripts/dev.sh
```

Services:
- Backend API: http://localhost:8080
- Frontend: http://localhost:3000
- Health check: http://localhost:8080/api/health

---

### Option B — Full Docker

```bash
docker compose -f infrastructure/docker-compose.yaml up --build
```

Starts postgres, redis, backend, and frontend in containers.

---

## Development

### Backend (Go)

```bash
cd apps/backend
go run ./cmd/server/main.go
go vet ./...
go test ./...
```

### Frontend (Bun)

```bash
cd apps/frontend
bun install
bun run dev        # Dev server on :3000
bun run typecheck  # TypeScript check
bun run lint       # Biome lint
bun run build      # Production build → dist/
```

---

## API Collection

The `api/` directory contains a [Bruno](https://www.usebruno.com/) collection covering auth and document endpoints. Open it in Bruno and select the `local` environment.

---

## Logs

When running via `scripts/dev.sh`, logs are written to `logs/` (gitignored):
- `logs/backend.log`
- `logs/frontend.log`

---

## Contributing

See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md).

## License

MIT — see [LICENSE](LICENSE).
