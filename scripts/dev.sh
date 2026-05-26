#!/bin/bash

# Granth Dev Script
# Starts both backend (Go server) and frontend (Bun dev server)
# Output is shown in terminal (with color-coded labels) and written to logs/

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

echo -e "${YELLOW}Starting Granth services...${NC}"

# Load environment variables
if [ -f .env ]; then
	set -a
	# shellcheck source=/dev/null
	. .env
	set +a
else
	echo -e "${RED}Error: .env file not found. Copy .env.example to .env and fill in values.${NC}"
	exit 1
fi

# Check for required tools
if ! command -v go >/dev/null 2>&1; then
	echo -e "${RED}Error: Go is not installed${NC}"
	exit 1
fi

if ! command -v bun >/dev/null 2>&1; then
	echo -e "${RED}Error: Bun is not installed${NC}"
	exit 1
fi

# Create logs directory
mkdir -p logs

# Cleanup on exit
cleanup() {
	echo ""
	echo -e "${YELLOW}Shutting down services...${NC}"
	# Kill the entire process group to catch any child pipelines
	kill -- -"$$" 2>/dev/null || true
	echo -e "${GREEN}Services stopped${NC}"
	exit 0
}
trap cleanup SIGINT SIGTERM

# Start backend — output goes to terminal (cyan-labeled) AND logs/backend.log
echo -e "${YELLOW}Starting backend server on port ${SERVER_PORT:-8080}...${NC}"
(
  cd apps/backend && go run . 2>&1 \
  | awk -v label="${CYAN}[backend]${NC} " '{print label $0; fflush()}'  \
  | tee -a "$ROOT_DIR/logs/backend.log"
) &

sleep 2

# Start frontend — output goes to terminal (magenta-labeled) AND logs/frontend.log
echo -e "${YELLOW}Starting frontend server on port ${FRONTEND_PORT:-3000}...${NC}"
(
  cd apps/frontend && bun run dev 2>&1 \
  | awk -v label="${MAGENTA}[frontend]${NC} " '{print label $0; fflush()}' \
  | tee -a "$ROOT_DIR/logs/frontend.log"
) &

echo ""
echo -e "${GREEN}=== Granth Services Running ===${NC}"
echo -e "Backend:  http://localhost:${SERVER_PORT:-8080}"
echo -e "Frontend: http://localhost:${FRONTEND_PORT:-3000}"
echo ""
echo -e "${CYAN}[backend]${NC}  logs → logs/backend.log"
echo -e "${MAGENTA}[frontend]${NC} logs → logs/frontend.log"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

wait
