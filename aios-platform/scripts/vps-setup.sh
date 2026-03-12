#!/usr/bin/env bash
# ============================================================
# AIOS Platform — VPS First-Time Setup
# ============================================================
# Run on a fresh Ubuntu 22.04+ VPS:
#   curl -sSL https://raw.githubusercontent.com/.../vps-setup.sh | bash
#   — OR —
#   scp scripts/vps-setup.sh user@vps:~ && ssh user@vps 'bash vps-setup.sh'
#
# What it does:
#   1. Installs Docker + Docker Compose
#   2. Clones the repo (or uses existing)
#   3. Generates ENGINE_SECRET
#   4. Starts services
#   5. Sets up SSL with Let's Encrypt (optional)
# ============================================================

set -euo pipefail

LIME='\033[38;2;209;255;0m'
RED='\033[31m'
YELLOW='\033[33m'
DIM='\033[2m'
BOLD='\033[1m'
RESET='\033[0m'

ok()   { echo -e "  ${LIME}✓${RESET} $1"; }
fail() { echo -e "  ${RED}✗${RESET} $1"; exit 1; }
warn() { echo -e "  ${YELLOW}!${RESET} $1"; }
info() { echo -e "  ${DIM}$1${RESET}"; }
step() { echo -e "\n${BOLD}[$1] $2${RESET}"; }

echo ""
echo -e "${LIME}╔══════════════════════════════════════╗${RESET}"
echo -e "${LIME}║   AIOS PLATFORM — VPS SETUP          ║${RESET}"
echo -e "${LIME}╚══════════════════════════════════════╝${RESET}"

# ── Step 1: System dependencies ──────────────────────────

step 1 "Installing system dependencies"

if ! command -v docker &>/dev/null; then
  info "Installing Docker..."
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker "$USER"
  ok "Docker installed"
else
  ok "Docker already installed ($(docker --version | grep -oP '\d+\.\d+\.\d+'))"
fi

if ! docker compose version &>/dev/null; then
  info "Installing Docker Compose plugin..."
  sudo apt-get update -qq
  sudo apt-get install -y -qq docker-compose-plugin
  ok "Docker Compose installed"
else
  ok "Docker Compose already installed"
fi

# Ensure Docker is running
sudo systemctl enable docker
sudo systemctl start docker

# Install certbot for SSL
if ! command -v certbot &>/dev/null; then
  sudo apt-get install -y -qq certbot
  ok "Certbot installed"
else
  ok "Certbot already installed"
fi

# ── Step 2: Project setup ────────────────────────────────

step 2 "Setting up project"

INSTALL_DIR="${AIOS_INSTALL_DIR:-/opt/aios-platform}"

if [ -d "$INSTALL_DIR" ]; then
  ok "Project directory exists at $INSTALL_DIR"
  cd "$INSTALL_DIR"
else
  warn "Project directory not found at $INSTALL_DIR"
  echo ""
  echo "  Upload the project to the VPS first:"
  echo "    rsync -avz --exclude node_modules --exclude .git \\"
  echo "      . user@vps:$INSTALL_DIR/"
  echo ""
  echo "  Or clone from your repo:"
  echo "    git clone https://github.com/your-org/aios-platform.git $INSTALL_DIR"
  echo ""
  read -rp "  Press Enter after uploading, or Ctrl+C to abort... "
  cd "$INSTALL_DIR" || fail "Directory $INSTALL_DIR not found"
fi

# ── Step 3: Environment configuration ────────────────────

step 3 "Configuring environment"

if [ ! -f ".env" ]; then
  cp .env.deploy.example .env
  # Generate a real ENGINE_SECRET
  SECRET=$(openssl rand -hex 32)
  sed -i "s/CHANGE_ME_GENERATE_WITH_openssl_rand_hex_32/$SECRET/" .env
  ok "Created .env with generated ENGINE_SECRET"
  warn "Edit .env to set your DOMAIN and other settings:"
  info "  nano $INSTALL_DIR/.env"
else
  ok ".env already exists"
fi

if [ ! -f "engine/.env" ]; then
  cp engine/.env.example engine/.env
  # Use same secret
  if [ -n "${SECRET:-}" ]; then
    sed -i "s/aios-dev-secret-change-in-production/$SECRET/" engine/.env
  fi
  ok "Created engine/.env"
else
  ok "engine/.env already exists"
fi

# ── Step 4: Build & start ────────────────────────────────

step 4 "Building and starting containers"

# Load env to get DOMAIN
set -a
source .env 2>/dev/null || true
set +a

docker compose build
ok "Docker image built"

docker compose --profile production up -d
ok "Services started"

echo ""
docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || docker compose ps

# ── Step 5: SSL setup ────────────────────────────────────

step 5 "SSL Certificate"

DOMAIN="${DOMAIN:-}"
if [ -z "$DOMAIN" ] || [ "$DOMAIN" = "aios.your-domain.com" ]; then
  warn "No domain configured. Set DOMAIN in .env for SSL."
  info "After setting domain, run:"
  info "  bash scripts/ssl-setup.sh"
else
  echo ""
  read -rp "  Set up SSL for ${DOMAIN}? [Y/n] " ssl_confirm
  if [ "${ssl_confirm,,}" != "n" ]; then
    # Create webroot directory
    sudo mkdir -p /var/www/certbot

    # Get certificate
    sudo certbot certonly --webroot \
      -w /var/www/certbot \
      -d "$DOMAIN" \
      --non-interactive \
      --agree-tos \
      --email "admin@${DOMAIN}" \
      --no-eff-email && {
      ok "SSL certificate obtained for $DOMAIN"

      # Copy certs to Docker volume
      docker compose cp /etc/letsencrypt certbot:/etc/letsencrypt 2>/dev/null || {
        # Alternative: mount directly
        info "Certs at /etc/letsencrypt/live/$DOMAIN/"
      }

      warn "Now enable HTTPS in nginx.conf:"
      info "  1. Uncomment the HTTPS server block in nginx.conf"
      info "  2. Replace 'your-domain.com' with '$DOMAIN'"
      info "  3. Uncomment 'return 301' in the HTTP block"
      info "  4. Run: docker compose --profile production restart"
    } || {
      warn "SSL setup failed. You can retry later with: bash scripts/ssl-setup.sh"
    }
  fi
fi

# ── Done ─────────────────────────────────────────────────

echo ""
echo -e "${LIME}╔══════════════════════════════════════╗${RESET}"
echo -e "${LIME}║   SETUP COMPLETE                     ║${RESET}"
echo -e "${LIME}╚══════════════════════════════════════╝${RESET}"
echo ""
if [ -n "$DOMAIN" ] && [ "$DOMAIN" != "aios.your-domain.com" ]; then
  ok "Dashboard: http://$DOMAIN (port 80)"
else
  ok "Dashboard: http://$(hostname -I | awk '{print $1}'):4002"
fi
echo ""
info "Useful commands:"
info "  docker compose logs -f aios          # View engine logs"
info "  docker compose --profile production restart  # Restart all"
info "  docker compose --profile production down     # Stop all"
info "  docker compose exec aios wget -qO- http://localhost:4002/health  # Health check"
echo ""
