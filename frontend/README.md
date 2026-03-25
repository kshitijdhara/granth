# Granth Frontend

React + TypeScript frontend for Granth, built on [Bun](https://bun.sh) as the runtime, bundler, package manager, and test runner.

## Stack

- **Runtime / Bundler**: Bun
- **UI**: React 19 + TypeScript 5 (strict)
- **Routing**: React Router v7
- **Styles**: SCSS (compiled via custom Bun SASS plugin)
- **Icons**: Heroicons
- **Linting / Formatting**: Biome

## Getting started

```sh
bun install
bun dev        # dev server at http://localhost:3000
```

## Scripts

| Command | Description |
|---|---|
| `bun dev` | Start dev server with live reload |
| `bun build` | Typecheck + production build → `dist/` |
| `bun preview` | Serve the `dist/` build locally |
| `bun test` | Run tests |
| `bun typecheck` | TypeScript type check only |
| `bun lint` | Biome lint |
| `bun format` | Biome format |
| `bun check` | Biome check (lint + format + imports) |
| `bun check:write` | Biome check with auto-fix |

## Project structure

```
src/
  features/
    auth/          # Login, register, auth context & API
    documents/     # Document list, detail, editor, blocks & API
    proposals/     # Proposals view & API
    user/          # Profile page
  layouts/         # Main layout, document layout
  lib/             # http client (native fetch wrapper)
  pages/           # Home page
  ui/              # Shared components (Button, Card, Input, Sidebar)
  styles/          # Global SCSS
scripts/
  build.ts         # Production build
  dev.ts           # Dev server with SSE live reload
  preview.ts       # Preview server
  sass-plugin.ts   # Bun plugin for SCSS
```

## Environment

| Variable | Default | Description |
|---|---|---|
| `API_BASE_URL` | `http://localhost:8080` | Backend API base URL |
