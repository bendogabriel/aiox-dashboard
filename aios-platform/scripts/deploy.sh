#!/usr/bin/env bash
# ============================================================
# AIOS Platform — One-Click Deploy
# ============================================================
# Usage:
#   npm run deploy              # Build + validate
#   npm run deploy -- --docker  # Build + Docker Compose up
#   npm run deploy -- --full    # Build + Docker with all profiles
#   npm run deploy -- --preview # Build + local preview
# ============================================================

set -euo pipefail

LIME='\033[38;2;209;255;0m'
RED='\033[31m'
YELLOW='\033[33m'
DIM='\033[2m'
BOLD='\033[1m'
RESET='\033[0m'

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# ── Helpers ────────────────────────────────────────────────

ok()   { echo -e "  ${LIME}✓${RESET} $1"; }
fail() { echo -e "  ${RED}✗${RESET} $1"; [ -n "${2:-}" ] && echo -e "    ${DIM}→ $2${RESET}"; }
warn() { echo -e "  ${YELLOW}!${RESET} $1"; }
info() { echo -e "  ${DIM}$1${RESET}"; }

step=0
step() {
  step=$((step + 1))
  echo ""
  echo -e "${BOLD}[$step] $1${RESET}"
}

# ── Parse args ─────────────────────────────────────────────

MODE="build"  # build | docker | full | preview
for arg in "$@"; do
  case "$arg" in
    --docker)  MODE="docker" ;;
    --full)    MODE="full" ;;
    --preview) MODE="preview" ;;
    --help|-h)
      echo "Usage: npm run deploy [-- --docker|--full|--preview]"
      echo ""
      echo "  (default)  Build + validate"
      echo "  --docker   Build + docker compose up"
      echo "  --full     Build + docker compose --profile full up"
      echo "  --preview  Build + vite preview (local)"
      exit 0
      ;;
  esac
done

echo ""
echo -e "${LIME}╔══════════════════════════════════════╗${RESET}"
echo -e "${LIME}║   AIOS PLATFORM — DEPLOY             ║${RESET}"
echo -e "${LIME}╚══════════════════════════════════════╝${RESET}"
echo -e "${DIM}Mode: ${MODE}${RESET}"

# ── Step 1: Validate environment ──────────────────────────

step "Validating environment"

ERRORS=0

# Check Node
if command -v node &>/dev/null; then
  ok "Node.js $(node -v)"
else
  fail "Node.js not found" "Install Node.js 18+"
  ERRORS=$((ERRORS + 1))
fi

# Check npm
if command -v npm &>/dev/null; then
  ok "npm $(npm -v)"
else
  fail "npm not found"
  ERRORS=$((ERRORS + 1))
fi

# Check .env
if [ -f ".env.development" ] || [ -f ".env" ] || [ -f ".env.production" ]; then
  ok "Environment file found"
else
  warn "No .env file found — using defaults"
  info "Run: cp .env.example .env.development"
fi

# Check engine .env
if [ -f "engine/.env" ]; then
  ok "Engine .env found"
else
  warn "Engine .env missing — engine may not start"
  info "Run: cp engine/.env.example engine/.env"
fi

# Check node_modules
if [ -d "node_modules" ]; then
  ok "Dependencies installed"
else
  fail "node_modules missing" "Run: npm install"
  ERRORS=$((ERRORS + 1))
fi

# Docker check (only for docker modes)
if [ "$MODE" = "docker" ] || [ "$MODE" = "full" ]; then
  if command -v docker &>/dev/null; then
    ok "Docker $(docker --version | grep -oP '\d+\.\d+\.\d+')"
    if docker compose version &>/dev/null; then
      ok "Docker Compose available"
    else
      fail "Docker Compose not found"
      ERRORS=$((ERRORS + 1))
    fi
  else
    fail "Docker not found" "Install Docker Desktop"
    ERRORS=$((ERRORS + 1))
  fi
fi

if [ $ERRORS -gt 0 ]; then
  echo ""
  fail "Validation failed ($ERRORS errors). Fix issues above and retry."
  exit 1
fi

# ── Step 2: Install dependencies ──────────────────────────

step "Installing dependencies"

npm ci --loglevel=error 2>/dev/null && ok "npm packages installed" || {
  warn "npm ci failed, trying npm install"
  npm install --loglevel=error && ok "npm packages installed" || {
    fail "Failed to install dependencies"
    exit 1
  }
}

if [ -d "engine" ] && command -v bun &>/dev/null; then
  (cd engine && bun install --silent) && ok "Engine dependencies installed" || warn "Engine deps failed (bun not available?)"
else
  info "Skipping engine deps (no bun or engine/ dir)"
fi

# ── Step 3: Type check ────────────────────────────────────

step "Type checking"

if npx tsc --noEmit 2>/dev/null; then
  ok "TypeScript — zero errors"
else
  warn "TypeScript errors found (build may still succeed)"
fi

# ── Step 4: Build ─────────────────────────────────────────

step "Building production bundle"

if npm run build; then
  ok "Build complete"
  # Show bundle size
  if [ -d "dist" ]; then
    SIZE=$(du -sh dist | cut -f1)
    info "Output: dist/ ($SIZE)"
    FILES=$(find dist -name '*.js' -o -name '*.css' | wc -l | tr -d ' ')
    info "Assets: $FILES files"
  fi
else
  fail "Build failed"
  exit 1
fi

# ── Step 5: Deploy ────────────────────────────────────────

case "$MODE" in
  build)
    step "Done"
    ok "Production build ready in dist/"
    echo ""
    info "Next steps:"
    info "  npm run preview        # Preview locally"
    info "  npm run deploy --docker  # Deploy with Docker"
    ;;

  preview)
    step "Starting preview server"
    ok "Preview server starting..."
    echo ""
    npx vite preview --port 4173
    ;;

  docker)
    step "Starting Docker containers"
    docker compose build && ok "Docker image built"
    docker compose up -d && ok "Containers started"
    echo ""
    info "Services:"
    docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || docker compose ps
    echo ""
    ok "Dashboard: http://localhost:4002"
    ;;

  full)
    step "Starting Docker containers (full profile)"
    docker compose --profile full build && ok "Docker images built"
    docker compose --profile full up -d && ok "All containers started"
    echo ""
    info "Services:"
    docker compose --profile full ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || docker compose --profile full ps
    echo ""
    ok "Dashboard: http://localhost:4002"
    ok "Nginx proxy: http://localhost:80"
    ;;
esac

echo ""
echo -e "${LIME}Deploy complete.${RESET}"
