#!/bin/sh
set -e

echo "[entrypoint] Aplicando migraciones…"
npx prisma migrate deploy

echo "[entrypoint] Aplicando triggers de inmutabilidad…"
npx prisma db execute --file prisma/immutability.sql

echo "[entrypoint] Ejecutando seed (idempotente)…"
node node_modules/tsx/dist/cli.mjs prisma/seed.ts || echo "[entrypoint] seed omitido"

echo "[entrypoint] Iniciando Next.js…"
exec node server.js
