#!/bin/bash
# Respaldo diario del CRM Medical Tower (estrategia 3-2-1 simplificada, §2.5 del plan)
# Cron sugerido: 0 2 * * * /root/medtower-crm/ops/backup.sh >> /var/log/medtower-backup.log 2>&1
set -euo pipefail

DIR=/root/medtower-crm/backups
KEEP_DAYS=7
FECHA=$(date +%F)

mkdir -p "$DIR"

echo "[$(date)] pg_dump…"
docker exec medtower-db pg_dump -U medtower -d medtower_crm -Fc > "$DIR/medtower_${FECHA}.dump"

echo "[$(date)] respaldo de uploads (PDFs)…"
docker run --rm -v medtower-crm_uploads:/data -v "$DIR":/backup alpine \
  tar czf "/backup/uploads_${FECHA}.tar.gz" -C /data .

# Cifrado con age si hay clave configurada (AGE_RECIPIENT en /root/medtower-crm/.env.backup)
if [ -f /root/medtower-crm/.env.backup ]; then
  # shellcheck disable=SC1091
  . /root/medtower-crm/.env.backup
  if [ -n "${AGE_RECIPIENT:-}" ] && command -v age >/dev/null; then
    age -r "$AGE_RECIPIENT" -o "$DIR/medtower_${FECHA}.dump.age" "$DIR/medtower_${FECHA}.dump"
    age -r "$AGE_RECIPIENT" -o "$DIR/uploads_${FECHA}.tar.gz.age" "$DIR/uploads_${FECHA}.tar.gz"
    # Subida remota con rclone si hay remoto configurado (R2/B2)
    if [ -n "${RCLONE_REMOTE:-}" ] && command -v rclone >/dev/null; then
      rclone copy "$DIR/medtower_${FECHA}.dump.age" "$RCLONE_REMOTE/medtower/db/"
      rclone copy "$DIR/uploads_${FECHA}.tar.gz.age" "$RCLONE_REMOTE/medtower/uploads/"
    fi
  fi
fi

echo "[$(date)] limpieza local (> ${KEEP_DAYS} días)…"
find "$DIR" -type f -mtime +"$KEEP_DAYS" -delete

echo "[$(date)] respaldo completado."
