# CRM / Expediente Clínico Electrónico — MIT Medical Tower

Sistema web en español conforme a NOM-004-SSA3-2012, LGS 28 bis/226 y RIS 28–31.
Plan técnico completo: `PLAN_SISTEMA_MEDICALTOWER.md` (documento fuente del proyecto).

## Stack

Next.js 16 (App Router, Server Actions) · TypeScript · PostgreSQL 16 · Prisma 6 ·
Tailwind 4 · @react-pdf/renderer · Resend · Docker Compose.

## Roles

- **Enfermería**: registro de pacientes + hoja de primer llenado (NOM-004 6.1), borradores, versionado, "disponible para consulta".
- **Doctor**: toma pacientes (expediente único multi-especialidad), notas SOAP firmadas e inmutables (adendas), recetas PDF con envío automático por correo, expediente quirúrgico (8.5/8.8), citas postoperatorias, alta.
- **Admin**: catálogos (especialidades, doctores con cédula obligatoria, enfermería), bitácora append-only, monitor de correos, configuración del establecimiento.

## Desarrollo local

```bash
npm install
# levantar Postgres local y exportar DATABASE_URL
npx prisma migrate deploy && npx prisma db execute --schema prisma/schema.prisma --file prisma/immutability.sql
npx tsx prisma/seed.ts
npm run dev
```

## Producción

VPS mawsoluciones (`maw-vps`), `/root/medtower-crm`, Docker Compose
(app en 127.0.0.1:3021 + Postgres 16 + volumen `uploads`), nginx + certbot:
`https://medtower.appsoluciones.duckdns.org`.

Secretos en `/root/medtower-crm/.env` (no versionado). Cron: cola de correo (1 min)
y respaldo diario (2:00). Restauración: `ops/restore.md`.

## Cumplimiento clave

- Notas firmadas y bitácora **inmutables por trigger de BD** (`prisma/immutability.sql`).
- Recetas: snapshot congelado del médico, folio consecutivo, hash SHA-256 del PDF, leyenda de exclusión de controlados (fracciones I–III fuera del alcance).
- Sin DELETE físico en todo el sistema; retención ≥ 5 años.
- Autorización en servidor (`src/lib/authz.ts`): doctor solo ve pacientes con asignación activa; admin solo lectura del expediente.
