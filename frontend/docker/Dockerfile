FROM oven/bun:latest AS builder

ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

WORKDIR /app

COPY package.json bunfig.toml ./
RUN bun install

COPY . .
RUN bun run scripts/build.ts

FROM oven/bun:latest

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/scripts/preview.ts ./scripts/preview.ts

EXPOSE 3000

ENTRYPOINT ["bun", "run", "scripts/preview.ts"]
