#!/usr/bin/env bash
set -euo pipefail

# ── maimai DX Discord Bot GCP Auto Setup ──────────────────────────────────
# Usage:
#   1. SSH into fresh GCP VM (Ubuntu 24.04)
#   2. curl -fsSL https://raw.githubusercontent.com/BitByte08/maimaiDISCORD/master/setup.sh | bash
#   3. Follow prompts
#
#   Or with env vars:
#   DISCORD_TOKEN=xxx DISCORD_CLIENT_ID=xxx DOMAIN=maimai.example.com CF_TUNNEL_TOKEN=xxx bash setup.sh

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
BOLD='\033[1m'

info()  { echo -e "${BLUE}[*]${NC} $1"; }
ok()    { echo -e "${GREEN}[✓]${NC} $1"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1"; }
err()   { echo -e "${RED}[✗]${NC} $1"; }

echo -e "\n${BOLD}╔══════════════════════════════════════╗${NC}"
echo -e "${BOLD}║   maimai DX Discord Bot Setup        ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════╝${NC}\n"

# ── 1. Docker ─────────────────────────────────────────────────────────────
info "Step 1/5: Docker 설치..."
if command -v docker &>/dev/null; then
    ok "Docker 이미 설치됨 ($(docker --version))"
else
    sudo apt-get update -qq
    sudo apt-get install -y -qq docker.io docker-compose-v2
    sudo usermod -aG docker "$USER"
    ok "Docker 설치 완료. (재로그인 필요할 수 있음)"
fi

# ── 2. Clone ──────────────────────────────────────────────────────────────
info "Step 2/5: 코드 클론..."
if [ -f ~/maimai/docker-compose.yml ]; then
    cd ~/maimai
    git pull origin master && ok "코드 업데이트 완료" || ok "기존 코드 유지"
else
    rm -rf ~/maimai
    git clone https://github.com/BitByte08/maimaiDISCORD.git ~/maimai
    cd ~/maimai
    mkdir -p data
    ok "코드 클론 완료"
fi

# ── 3. Config ─────────────────────────────────────────────────────────────
info "Step 3/5: 설정 파일..."

# Discord Bot Token
if [ -z "${DISCORD_TOKEN:-}" ]; then
    read -r -p "Discord Bot Token: " DISCORD_TOKEN
fi

# Discord Client ID
if [ -z "${DISCORD_CLIENT_ID:-}" ]; then
    read -r -p "Discord Client ID: " DISCORD_CLIENT_ID
fi

# Domain
if [ -z "${DOMAIN:-}" ]; then
    read -r -p "도메인 (예: maimai.yourdomain.com): " DOMAIN
fi

# Cloudflare Tunnel Token
if [ -z "${CF_TUNNEL_TOKEN:-}" ]; then
    read -r -p "Cloudflare Tunnel Token: " CF_TUNNEL_TOKEN
fi

# Guild ID (optional)
if [ -z "${GUILD_ID:-}" ]; then
    read -r -p "Discord Guild ID (선택, 없으면 Enter): " GUILD_ID
fi

# Write config.json
cat > ~/maimai/config.json <<EOF
{
  "token": "${DISCORD_TOKEN}",
  "clientId": "${DISCORD_CLIENT_ID}",
  "guildId": "${GUILD_ID:-}",
  "webPort": 3456,
  "encryptionKey": "",
  "baseUrl": "https://${DOMAIN}"
}
EOF
ok "config.json 작성 완료"

# Write .env
cat > ~/maimai/.env <<EOF
CF_TUNNEL_TOKEN=${CF_TUNNEL_TOKEN}
EOF
ok ".env 작성 완료"

# ── 4. Build & Run ────────────────────────────────────────────────────────
info "Step 4/5: 컨테이너 빌드 & 실행..."
cd ~/maimai
docker compose pull cloudflared 2>/dev/null || true
docker compose up -d --build
ok "컨테이너 실행 완료"

# Wait for healthy
info "상태 확인 중 (최대 60초)..."
for i in $(seq 1 30); do
    if docker compose ps bot | grep -q "(healthy)"; then
        ok "봇 정상 작동 중"
        break
    fi
    sleep 2
done

# ── 5. GitHub Secrets ─────────────────────────────────────────────────────
echo -e "\n${BOLD}╔══════════════════════════════════════╗${NC}"
echo -e "${BOLD}║   Step 5/5: GitHub Secrets 설정      ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════╝${NC}\n"

SSH_PUB=$(cat ~/.ssh/id_ed25519.pub 2>/dev/null || echo "")
VM_IP=$(curl -s -m 3 ifconfig.me 2>/dev/null || curl -s -m 3 icanhazip.com 2>/dev/null || echo "YOUR_VM_IP")
HOSTNAME=$(hostname)

if [ -z "$SSH_PUB" ]; then
    warn "SSH 키가 없습니다. 아래 명령어를 먼저 실행하세요:"
    echo -e "  ${YELLOW}ssh-keygen -t ed25519 -f ~/.ssh/maimai-deploy -N ''${NC}\n"
fi

echo -e "${BOLD}GitHub → Settings → Secrets and variables → Actions → Repository secrets${NC}"
echo ""
echo -e "  ${GREEN}New repository secret${NC}"
echo ""

cat <<SECRETS
┌─────────────────┬──────────────────────────────────────────────────────┐
│ Secret Name     │ Secret Value                                         │
├─────────────────┼──────────────────────────────────────────────────────┤
│ GCP_HOST        │ ${VM_IP}
│ GCP_USER        │ ${USER}
│ GCP_SSH_KEY     │ $(cat ~/.ssh/id_ed25519 2>/dev/null | head -1 || echo "YOUR_PRIVATE_KEY") ...
│                 │ (전체 개인키: ~/.ssh/id_ed25519)
└─────────────────┴──────────────────────────────────────────────────────┘
SECRETS

echo ""
if [ -n "$SSH_PUB" ]; then
    echo -e "${BOLD}VM authorized_keys에 추가할 내용:${NC}"
    echo -e "  ${GREEN}echo '${SSH_PUB}' >> ~/.ssh/authorized_keys${NC}"
fi

echo ""
echo -e "${BOLD}┌───────────────────────────────────────┐${NC}"
echo -e "${BOLD}│   설정 완료!                          │${NC}"
echo -e "${BOLD}├───────────────────────────────────────┤${NC}"
echo -e "${BOLD}│${NC}   봇 URL: ${GREEN}https://${DOMAIN}${NC}"
echo -e "${BOLD}│${NC}   로그:   ${BLUE}docker compose logs -f${NC}"
echo -e "${BOLD}│${NC}   상태:   ${BLUE}docker compose ps${NC}"
echo -e "${BOLD}└───────────────────────────────────────┘${NC}\n"
