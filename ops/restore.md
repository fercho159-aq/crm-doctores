# Runbook de restauración — CRM Medical Tower

## Restaurar base de datos desde respaldo

```bash
# 1. Ubicar el respaldo (local o descargar de R2/B2 con rclone)
ls /root/medtower-crm/backups/

# Si está cifrado con age:
age -d -i /root/.age/key.txt -o medtower.dump medtower_YYYY-MM-DD.dump.age

# 2. Detener la app (no la BD)
cd /root/medtower-crm && docker compose stop app

# 3. Restaurar (¡destruye los datos actuales!)
docker exec -i medtower-db pg_restore -U medtower -d medtower_crm --clean --if-exists < medtower_YYYY-MM-DD.dump

# 4. Reiniciar
docker compose start app
```

## Restaurar PDFs (uploads)

```bash
docker run --rm -v medtower-crm_uploads:/data -v /root/medtower-crm/backups:/backup alpine \
  sh -c "cd /data && tar xzf /backup/uploads_YYYY-MM-DD.tar.gz"
```

## Prueba mensual de restauración (obligatoria, §2.5 del plan)

1. Crear BD temporal: `docker exec medtower-db createdb -U medtower restore_test`
2. Restaurar ahí: `docker exec -i medtower-db pg_restore -U medtower -d restore_test < dump`
3. Verificar conteos: `SELECT count(*) FROM paciente; SELECT count(*) FROM receta;`
4. Borrar: `docker exec medtower-db dropdb -U medtower restore_test`
5. Documentar fecha y resultado en la bitácora de operación.

## Operación diaria

- App: `https://medtower.appsoluciones.duckdns.org` (nginx → 127.0.0.1:3021)
- Logs: `docker compose -f /root/medtower-crm/docker-compose.yml logs app -f`
- Cola de correo: cron cada minuto → `/api/cron/email` (secret en `.env`)
- Respaldo: cron 2:00 AM → `ops/backup.sh` (local 7 días; remoto si se configura `.env.backup` con AGE_RECIPIENT y RCLONE_REMOTE)
- Redeploy: `rsync` del código → `docker compose build && docker compose up -d`
