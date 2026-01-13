# Contributing to Granth

Thanks for your interest in contributing! This project follows a lightweight contribution process.

How to contribute
- Fork the repository and create a feature branch: `git checkout -b feat/your-change`
- Keep changes small and focused. Open a draft PR early for design discussion.

Coding guidelines
- Run `gofmt` (or `gofmt -w .`) before committing.
- Keep package-level APIs minimal and prefer `internal/` packages for app-only code.

Running locally
- Ensure environment variables are set (`DB_URL`, `REDIS_IP`, `REDIS_PASSWORD`, `JWT_SECRET`, `SERVER_PORT`).
- Run `go build ./...` and the server via `go run ./cmd/server`.

Testing
- Add unit tests in the same package and run `go test ./...`.

Pull request checklist
- [ ] I have run `gofmt` and `go vet` where appropriate.
- [ ] The changes are covered by tests or are trivial.
- [ ] I followed the repository's coding conventions.
