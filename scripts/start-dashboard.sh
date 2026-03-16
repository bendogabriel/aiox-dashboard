#!/bin/bash
# start-dashboard.sh — Unified startup script for AIOX Dashboard
# Starts Engine (Bun) and Dashboard (Vite) with port detection, logging, and flags.
#
# Usage:
#   ./scripts/start-dashboard.sh              # Start both
#   ./scripts/start-dashboard.sh --engine-only      # Engine only
#   ./scripts/start-dashboard.sh --dashboard-only   # Dashboard only
#   ./scripts/start-dashboard.sh --stop             # Stop both
#
# Environment:
#   ENGINE_PORT   (default: 4002)
#   FRONTEND_PORT (default: 5173)

set -euo pipefail

# --- Path Resolution ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENGINE_DIR="$PROJECT_DIR/engine"
LOG_DIR="$PROJECT_DIR/logs"

ENGINE_PORT="${ENGINE_PORT:-4002}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"

# --- Colors ---
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

# --- Parse Flags ---
FLAG_ENGINE_ONLY=false
FLAG_DASHBOARD_ONLY=false
FLAG_STOP=false

for arg in "$@"; do
  case "$arg" in
    --engine-only)    FLAG_ENGINE_ONLY=true ;;
    --dashboard-only) FLAG_DASHBOARD_ONLY=true ;;
    --stop)           FLAG_STOP=true ;;
    -h|--help)
      echo "Usage: $0 [--engine-only] [--dashboard-only] [--stop] [-h|--help]"
      echo ""
      echo "Flags:"
      echo "  --engine-only      Start only the Engine (port $ENGINE_PORT)"
      echo "  --dashboard-only   Start only the Dashboard (port $FRONTEND_PORT)"
      echo "  --stop             Stop both Engine and Dashboard"
      echo "  -h, --help         Show this help message"
      exit 0
      ;;
    *)
      echo -e "${RED}[aiox]${NC} Unknown flag: $arg"
      echo "Run '$0 --help' for usage."
      exit 1
      ;;
  esac
done

# --- Port Check (cross-platform: netstat on Windows/Git Bash, lsof on macOS/Linux) ---
check_port() {
  local port="$1"
  if command -v netstat &>/dev/null; then
    netstat -ano 2>/dev/null | grep -qE "[:.]${port}\s.*LISTEN"
  elif command -v lsof &>/dev/null; then
    lsof -i ":${port}" -sTCP:LISTEN &>/dev/null
  elif command -v ss &>/dev/null; then
    ss -tlnp 2>/dev/null | grep -q ":${port} "
  else
    return 1
  fi
}

# --- Get PID on port (cross-platform) ---
get_pid_on_port() {
  local port="$1"
  local pid=""
  if command -v netstat &>/dev/null; then
    pid=$(netstat -ano 2>/dev/null | grep -E "[:.]${port}\s.*LISTEN" | awk '{print $NF}' | head -1)
  elif command -v lsof &>/dev/null; then
    pid=$(lsof -ti ":${port}" -sTCP:LISTEN 2>/dev/null | head -1)
  fi
  echo "$pid"
}

# --- Kill process on port ---
kill_on_port() {
  local port="$1"
  local name="$2"
  local pid
  pid=$(get_pid_on_port "$port")
  if [ -n "$pid" ] && [ "$pid" != "0" ]; then
    echo -e "${CYAN}[aiox]${NC} Stopping $name (PID $pid) on port $port..."
    kill "$pid" 2>/dev/null || taskkill //PID "$pid" //F 2>/dev/null || true
    sleep 1
    echo -e "${GREEN}[aiox]${NC} $name stopped."
  else
    echo -e "${YELLOW}[aiox]${NC} $name not running on port $port."
  fi
}

# --- Stop Mode ---
if [ "$FLAG_STOP" = true ]; then
  echo -e "${BOLD}[aiox] Stopping AIOX Dashboard services...${NC}"
  kill_on_port "$ENGINE_PORT" "Engine"
  kill_on_port "$FRONTEND_PORT" "Dashboard"
  echo -e "${GREEN}[aiox]${NC} All services stopped."
  exit 0
fi

# --- Ensure logs directory ---
mkdir -p "$LOG_DIR"

# --- Cleanup trap ---
ENGINE_PID=""
FRONTEND_PID=""

cleanup() {
  echo ""
  echo -e "${CYAN}[aiox]${NC} Shutting down..."
  if [ -n "$ENGINE_PID" ]; then
    kill "$ENGINE_PID" 2>/dev/null || true
    wait "$ENGINE_PID" 2>/dev/null || true
    echo -e "${CYAN}[aiox]${NC} Engine stopped (PID $ENGINE_PID)"
  fi
  if [ -n "$FRONTEND_PID" ]; then
    kill "$FRONTEND_PID" 2>/dev/null || true
    wait "$FRONTEND_PID" 2>/dev/null || true
    echo -e "${CYAN}[aiox]${NC} Dashboard stopped (PID $FRONTEND_PID)"
  fi
  exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# --- Banner ---
echo -e "${BOLD}╔═══════════════════════════════════╗${NC}"
echo -e "${BOLD}║${NC}  AIOX Dashboard — Startup         ${BOLD}║${NC}"
echo -e "${BOLD}╚═══════════════════════════════════╝${NC}"
echo ""

# --- Start Engine ---
start_engine() {
  if check_port "$ENGINE_PORT"; then
    local existing_pid
    existing_pid=$(get_pid_on_port "$ENGINE_PORT")
    echo -e "${GREEN}[aiox]${NC} Engine already running on port $ENGINE_PORT (PID ${existing_pid:-unknown}) — skipping."
  else
    echo -e "${CYAN}[aiox]${NC} Starting Engine on port $ENGINE_PORT..."
    cd "$ENGINE_DIR" && bun --watch src/index.ts >> "$LOG_DIR/engine.log" 2>&1 &
    ENGINE_PID=$!
    echo -e "${GREEN}[aiox]${NC} Engine started (PID $ENGINE_PID) — logs: logs/engine.log"

    # Wait up to 15s for engine to be ready
    for i in $(seq 1 15); do
      if check_port "$ENGINE_PORT"; then
        echo -e "${GREEN}[aiox]${NC} Engine ready."
        break
      fi
      if [ "$i" -eq 15 ]; then
        echo -e "${RED}[aiox]${NC} Engine did not start within 15s. Check logs/engine.log"
      fi
      sleep 1
    done
  fi
}

# --- Start Dashboard ---
start_dashboard() {
  if check_port "$FRONTEND_PORT"; then
    local existing_pid
    existing_pid=$(get_pid_on_port "$FRONTEND_PORT")
    echo -e "${GREEN}[aiox]${NC} Dashboard already running on port $FRONTEND_PORT (PID ${existing_pid:-unknown}) — skipping."
  else
    echo -e "${CYAN}[aiox]${NC} Starting Dashboard on port $FRONTEND_PORT..."
    cd "$PROJECT_DIR" && npx vite --port "$FRONTEND_PORT" >> "$LOG_DIR/dashboard.log" 2>&1 &
    FRONTEND_PID=$!
    echo -e "${GREEN}[aiox]${NC} Dashboard started (PID $FRONTEND_PID) — logs: logs/dashboard.log"
  fi
}

# --- Execute based on flags ---
if [ "$FLAG_ENGINE_ONLY" = true ]; then
  start_engine
elif [ "$FLAG_DASHBOARD_ONLY" = true ]; then
  start_dashboard
else
  start_engine
  start_dashboard
fi

# --- Status Summary ---
echo ""
echo -e "${BOLD}[aiox] Status:${NC}"
if [ "$FLAG_DASHBOARD_ONLY" != true ]; then
  echo -e "  Engine:    http://localhost:$ENGINE_PORT"
  [ -n "$ENGINE_PID" ] && echo -e "  Engine PID: $ENGINE_PID"
fi
if [ "$FLAG_ENGINE_ONLY" != true ]; then
  echo -e "  Dashboard: http://localhost:$FRONTEND_PORT"
  [ -n "$FRONTEND_PID" ] && echo -e "  Dashboard PID: $FRONTEND_PID"
fi
echo -e "  Logs:      $LOG_DIR/"
echo ""

# --- Keep alive ---
if [ -n "$ENGINE_PID" ] || [ -n "$FRONTEND_PID" ]; then
  echo -e "${CYAN}[aiox]${NC} Press Ctrl+C to stop all services."
  wait
fi
