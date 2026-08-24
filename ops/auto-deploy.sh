#!/bin/bash
# Auto-deploy: revisa si hay commits nuevos en GitHub y despliega
# Se ejecuta cada minuto via cron
# Instalar: crontab -e → * * * * * /root/novamed/ops/auto-deploy.sh

REPO_DIR="/root/novamed"
LOG="/var/log/novamed-deploy.log"
LOCK="/tmp/novamed-deploy.lock"

# Evitar ejecuciones paralelas
if [ -f "$LOCK" ]; then
  exit 0
fi

cd "$REPO_DIR" || exit 1

# Traer cambios sin aplicar
git fetch origin main --quiet 2>/dev/null

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

# Si son iguales, no hay nada que hacer
if [ "$LOCAL" = "$REMOTE" ]; then
  exit 0
fi

# Hay cambios nuevos — desplegar
touch "$LOCK"
echo "$(date): Nuevos commits detectados, desplegando..." >> "$LOG"

git pull --quiet >> "$LOG" 2>&1
docker compose build --no-cache >> "$LOG" 2>&1
docker compose up -d >> "$LOG" 2>&1

echo "$(date): Deploy completado ($(git rev-parse --short HEAD))" >> "$LOG"
rm -f "$LOCK"
