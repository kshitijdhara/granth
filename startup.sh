#!/bin/bash

# Granth Startup Script
# Starts both backend (Go server) and frontend (Bun dev server)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting Granth services...${NC}"

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | xargs)
else
    echo -e "${RED}Error: .env file not found${NC}"
    exit 1
fi

# Check for required tools
if ! command -v go &> /dev/null; then
    echo -e "${RED}Error: Go is not installed${NC}"
    exit 1
fi

if ! command -v bun &> /dev/null; then
    echo -e "${RED}Error: Bun is not installed${NC}"
    exit 1
fi

# Create logs directory if it doesn't exist
mkdir -p logs

# Start backend server
echo -e "${YELLOW}Starting backend server on port ${SERVER_PORT:-8080}...${NC}"
go run ./cmd/server/main.go > logs/backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}Backend started (PID: $BACKEND_PID)${NC}"

# Wait a moment for backend to initialize
sleep 2

# Start frontend dev server
echo -e "${YELLOW}Starting frontend server on port ${FRONTEND_PORT:-3000}...${NC}"
cd frontend
bun run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..
echo -e "${GREEN}Frontend started (PID: $FRONTEND_PID)${NC}"

# Create a cleanup function
cleanup() {
    echo -e "${YELLOW}Shutting down services...${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo -e "${GREEN}Services stopped${NC}"
    exit 0
}

# Register cleanup on script exit
trap cleanup SIGINT SIGTERM

# Display service info
echo ""
echo -e "${GREEN}=== Granth Services Running ===${NC}"
echo -e "Backend:  http://localhost:${SERVER_PORT:-8080}"
echo -e "Frontend: http://localhost:${FRONTEND_PORT:-3000}"
echo -e "API Base: ${VITE_API_BASE_URL}"
echo ""
echo -e "${YELLOW}Logs:${NC}"
echo -e "  Backend:  logs/backend.log"
echo -e "  Frontend: logs/frontend.log"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Wait for both processes
wait
