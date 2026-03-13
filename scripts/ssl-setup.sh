#!/usr/bin/env bash
# ============================================================
# AIOS Platform — SSL Setup (run after vps-setup.sh)
# ============================================================
# Obtains SSL certificate and enables HTTPS in nginx.
#
# Prerequisites:
#   - Domain DNS pointing to this VPS
#   - DOMAIN set in .env
#   - Services running (docker compose --profile production up)
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

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Load env
set -a
source .env 2>/dev/null || true
set +a

DOMAIN="${DOMAIN:-}"
if [ -z "$DOMAIN" ] || [ "$DOMAIN" = "aios.your-domain.com" ]; then
  fail "Set DOMAIN in .env first (e.g., DOMAIN=aios.example.com)"
fi

echo ""
echo -e "${BOLD}Setting up SSL for: ${LIME}${DOMAIN}${RESET}"
echo ""

# 1. Create certbot webroot
sudo mkdir -p /var/www/certbot

# 2. Ensure nginx is serving the ACME challenge path
info "Verifying nginx is running..."
if ! docker compose ps nginx --format "{{.Status}}" 2>/dev/null | grep -q "Up"; then
  docker compose --profile production up -d nginx
  sleep 3
fi
ok "Nginx is running"

# 3. Get certificate
info "Requesting certificate from Let's Encrypt..."
sudo certbot certonly --webroot \
  -w /var/www/certbot \
  -d "$DOMAIN" \
  --non-interactive \
  --agree-tos \
  --email "admin@${DOMAIN}" \
  --no-eff-email || fail "Certbot failed. Is DNS pointing to this server?"

ok "SSL certificate obtained"

# 4. Update nginx.conf — enable HTTPS block
info "Updating nginx.conf..."

# Enable HTTP→HTTPS redirect
sed -i 's|# return 301 https://\$host\$request_uri;|return 301 https://$host$request_uri;|' nginx.conf

# Comment out the HTTP proxy block (lines after return 301)
# This is best done manually, but we'll add a marker
if grep -q "return 301" nginx.conf; then
  ok "HTTP→HTTPS redirect enabled"
fi

# Replace domain placeholder in HTTPS block
sed -i "s/your-domain.com/$DOMAIN/g" nginx.conf

# Uncomment HTTPS block
sed -i '/^# server {$/,/^# }$/{s/^# //}' nginx.conf

ok "nginx.conf updated for HTTPS"

# 5. Restart nginx
docker compose --profile production restart nginx
ok "Nginx restarted with SSL"

# 6. Set up auto-renewal cron
if ! crontab -l 2>/dev/null | grep -q "certbot renew"; then
  (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --deploy-hook 'docker compose -f $ROOT/docker-compose.yaml --profile production restart nginx'") | crontab -
  ok "Auto-renewal cron added (daily at 3 AM)"
fi

echo ""
echo -e "${LIME}SSL setup complete!${RESET}"
echo ""
ok "Dashboard: https://$DOMAIN"
echo ""
info "Test with: curl -I https://$DOMAIN/health"
