#!/bin/bash
# dev-full.sh — Start backend API + frontend Vite dev server
# Usage: ./scripts/dev-full.sh

BACKEND_DIR="/Users/rafaelcosta/Downloads/aios-core-meta-gpt"
BACKEND_PORT=3000
FRONTEND_PORT=5173

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

cleanup() {
  echo -e "\n${CYAN}[dev-full]${NC} Shutting down..."
  if [ -n "$BACKEND_PID" ]; then
    kill "$BACKEND_PID" 2>/dev/null
    wait "$BACKEND_PID" 2>/dev/null
    echo -e "${CYAN}[dev-full]${NC} Backend stopped (PID $BACKEND_PID)"
  fi
  if [ -n "$FRONTEND_PID" ]; then
    kill "$FRONTEND_PID" 2>/dev/null
    wait "$FRONTEND_PID" 2>/dev/null
    echo -e "${CYAN}[dev-full]${NC} Frontend stopped (PID $FRONTEND_PID)"
  fi
  exit 0
}

trap cleanup SIGINT SIGTERM

# Check if backend directory exists
if [ ! -d "$BACKEND_DIR" ]; then
  echo -e "${RED}[dev-full] Backend directory not found: $BACKEND_DIR${NC}"
  echo "Please set BACKEND_DIR in this script to the correct path."
  exit 1
fi

# Check if port 3000 is already in use
if lsof -i ":$BACKEND_PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo -e "${GREEN}[dev-full]${NC} Backend already running on port $BACKEND_PORT"
else
  echo -e "${CYAN}[dev-full]${NC} Starting backend API on port $BACKEND_PORT..."
  cd "$BACKEND_DIR" && node src/server.js &
  BACKEND_PID=$!

  # Wait for backend to be ready
  for i in $(seq 1 30); do
    if curl -s "http://localhost:$BACKEND_PORT/health" >/dev/null 2>&1; then
      echo -e "${GREEN}[dev-full]${NC} Backend ready on port $BACKEND_PORT"
      break
    fi
    if [ $i -eq 30 ]; then
      echo -e "${RED}[dev-full] Backend failed to start after 30s${NC}"
      cleanup
      exit 1
    fi
    sleep 1
  done
fi

# Start frontend
SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
echo -e "${CYAN}[dev-full]${NC} Starting frontend on port $FRONTEND_PORT..."
cd "$SCRIPT_DIR" && npx vite --port $FRONTEND_PORT &
FRONTEND_PID=$!

echo -e "${GREEN}[dev-full]${NC} Both servers running:"
echo -e "  Backend:  http://localhost:$BACKEND_PORT"
echo -e "  Frontend: http://localhost:$FRONTEND_PORT"
echo -e "  Docs:     http://localhost:$BACKEND_PORT/docs"
echo ""

# Wait for either process to exit
wait
