#!/usr/bin/env bash
# ============================================================
#  setup-fair.sh — Sobe a Lucy para o dia da feira (WSL)
#  - Inicia o Postgres se necessário
#  - Sobe o servidor Lucy se não estiver rodando
#  - Recria o portproxy do Windows apontando p/ o IP atual do WSL
#  - Valida /health, greeting e mostra o IP do hotspot
#
#  Requer: executado DE DENTRO do WSL (de preferência via
#  setup-feira.cmd, que eleva os privilégios no Windows).
# ============================================================

set -uo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'
ok()   { echo -e "${GREEN}[OK]${NC} $*"; }
warn() { echo -e "${YELLOW}[!!]${NC} $*"; }
err()  { echo -e "${RED}[ERR]${NC} $*"; }
info() { echo -e "${CYAN}[..]${NC} $*"; }

SERVER_DIR=/home/frostz/www/projects/lucy/server
LOG_FILE=/tmp/lucy-server.log
PORT=3333
NETSH=/mnt/c/Windows/System32/netsh.exe
EXPECTED_WINDOWS_IP=192.168.15.3

echo "=============================================="
echo "  Setup da LUCY para a feira"
echo "=============================================="

# ------------------------------------------------------------
# 1) Postgres
# ------------------------------------------------------------
info "PostgreSQL..."
if ! systemctl is-active --quiet postgresql; then
  systemctl start postgresql
  sleep 2
fi
if systemctl is-active --quiet postgresql; then
  ok "PostgreSQL ativo"
else
  err "PostgreSQL não iniciou — verifique: systemctl status postgresql"
fi

# ------------------------------------------------------------
# 2) Servidor Lucy
# ------------------------------------------------------------
if ss -tln | grep -q ":$PORT "; then
  ok "Servidor já está rodando na porta $PORT"
else
  info "Subindo o servidor em background (log: $LOG_FILE)..."
  cd "$SERVER_DIR" || exit 1
  setsid nohup npm run dev >> "$LOG_FILE" 2>&1 < /dev/null &
  disown
  for i in $(seq 1 20); do
    if curl -sf "http://localhost:$PORT/health" > /dev/null 2>&1; then
      break
    fi
    sleep 1
  done
fi

if curl -sf "http://localhost:$PORT/health" > /dev/null 2>&1; then
  ok "Servidor Lucy respondendo em /health"
else
  err "Servidor não respondeu em /health — confira: tail -f $LOG_FILE"
fi

# ------------------------------------------------------------
# 3) Portproxy do Windows (aponta para o IP ATUAL do WSL)
# ------------------------------------------------------------
WSL_IP=$(hostname -I | awk '{print $1}')
info "IP atual do WSL: $WSL_IP"

info "Recriando portproxy 0.0.0.0:$PORT -> $WSL_IP:$PORT..."
"$NETSH" interface portproxy delete v4tov4 listenport=$PORT listenaddress=0.0.0.0 > /dev/null 2>&1
ADD_OUT=$("$NETSH" interface portproxy add v4tov4 listenport=$PORT listenaddress=0.0.0.0 connectaddress=$WSL_IP connectport=$PORT 2>&1)

# Verifica o estado real: o portproxy precisa apontar para o IP ATUAL do WSL
CURRENT_TARGET=$("$NETSH" interface portproxy show v4tov4 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+' | tail -1)
if [ "$CURRENT_TARGET" = "$WSL_IP" ]; then
  ok "Portproxy OK: 0.0.0.0:$PORT -> $WSL_IP:$PORT"
else
  warn "Portproxy aponta para $CURRENT_TARGET, esperado $WSL_IP"
  if echo "$ADD_OUT" | grep -qi "elevação\|elevation"; then
    warn "Sem privilégios de admin: rode via setup-feira.cmd (Executar como administrador)."
  fi
fi

# ------------------------------------------------------------
# 4) Validação
# ------------------------------------------------------------
echo ""
echo "----- Validação -----"

# IP do Windows no hotspot (para conferir com o firmware do ESP32)
WIN_IP=$("$NETSH" interface ip show address 2>/dev/null | grep -oE '192\.168\.15\.[0-9]+' | head -1)
if [ -n "$WIN_IP" ]; then
  if [ "$WIN_IP" = "$EXPECTED_WINDOWS_IP" ]; then
    ok "IP do Windows no hotspot: $WIN_IP (bate com o firmware)"
  else
    warn "IP do Windows mudou: $WIN_IP (firmware espera $EXPECTED_WINDOWS_IP)"
    warn "Recompile o ESP32 com http://$WIN_IP:3333"
  fi
else
  warn "Não achei o IP do Windows na rede 192.168.15.x — o laptop está no hotspot do celular?"
fi

# Teste do portproxy (pelo IP do Windows)
if [ -n "$WIN_IP" ]; then
  if curl -sf "http://$WIN_IP:$PORT/health" > /dev/null 2>&1; then
    ok "Portproxy OK: ESP32 alcançaria em http://$WIN_IP:$PORT"
  else
    err "Portproxy falhou no teste — confira netsh interface portproxy show all"
  fi
fi

# Greeting (o que o ESP32 toca no boot) — requer o token do firmware
AUTH_TOKEN=$(grep -oE 'const char\* AUTH_TOKEN\s*=\s*"[^"]+"' "$SERVER_DIR/../esp32-lucy/lucy-esp32.ino" | grep -oE '"[^"]+"' | tr -d '"')
if [ -n "$AUTH_TOKEN" ]; then
  GREET=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $AUTH_TOKEN" "http://localhost:$PORT/api/voice/greeting" 2>/dev/null)
  if [ "$GREET" = "200" ]; then
    ok "Greeting /api/voice/greeting -> HTTP $GREET (com token do firmware)"
  else
    warn "Greeting não respondeu 200 (HTTP $GREET)"
  fi
else
  warn "Não achei o AUTH_TOKEN no firmware — pulei o teste do greeting"
fi

echo ""
echo "=============================================="
echo "  Pronto! Ligue o ESP32. IP do servidor no"
echo "  hotspot: $WIN_IP"
echo "=============================================="
