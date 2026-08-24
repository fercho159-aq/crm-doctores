-- Portal del paciente: cuenta de acceso (Usuario, rol PACIENTE) ligada 1:1 a un
-- Paciente ya existente, más las tablas de aportaciones e invitaciones. Todo
-- aditivo: no se toca ninguna tabla protegida por prisma/immutability.sql.

-- AlterEnum: nuevo rol de sesión. No se usa en el mismo bloque que crea filas,
-- así que puede ir junto con el resto de esta migración sin problema de Postgres
-- con enums nuevos en la misma transacción.
ALTER TYPE "RolClave" ADD VALUE IF NOT EXISTS 'PACIENTE';

-- AlterTable: usuario -> paciente (cuenta de portal, opcional, única)
ALTER TABLE "usuario" ADD COLUMN "paciente_id" UUID;
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_paciente_id_key" UNIQUE ("paciente_id");
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "paciente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: paciente (campos administrativos editables desde el portal)
ALTER TABLE "paciente" ADD COLUMN "foto_url" TEXT;
ALTER TABLE "paciente" ADD COLUMN "pref_notificacion_email" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable: documento (distingue adjuntos subidos por el paciente)
CREATE TYPE "DocumentoOrigen" AS ENUM ('STAFF', 'PACIENTE');
ALTER TABLE "documento" ADD COLUMN "origen" "DocumentoOrigen" NOT NULL DEFAULT 'STAFF';

-- CreateEnum: aportacion_paciente
CREATE TYPE "CategoriaAporte" AS ENUM ('ALERGIA', 'MEDICAMENTO', 'ANTECEDENTE', 'SINTOMA', 'OBSERVACION', 'PRECONSULTA');
CREATE TYPE "EstadoAporte" AS ENUM ('PENDIENTE_REVISION', 'INCORPORADA', 'RECHAZADA');

-- CreateTable: aportacion_paciente
CREATE TABLE "aportacion_paciente" (
    "id" UUID NOT NULL,
    "paciente_id" UUID NOT NULL,
    "categoria" "CategoriaAporte" NOT NULL,
    "contenido" TEXT NOT NULL,
    "estado" "EstadoAporte" NOT NULL DEFAULT 'PENDIENTE_REVISION',
    "creado_por" UUID NOT NULL,
    "revisado_por" UUID,
    "nota_revisor" TEXT,
    "revisado_en" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aportacion_paciente_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "aportacion_paciente_paciente_id_estado_idx" ON "aportacion_paciente"("paciente_id", "estado");

ALTER TABLE "aportacion_paciente" ADD CONSTRAINT "aportacion_paciente_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable: invitacion_portal
CREATE TABLE "invitacion_portal" (
    "id" UUID NOT NULL,
    "paciente_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "creado_por" UUID NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "usado_en" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitacion_portal_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "invitacion_portal_token_hash_key" ON "invitacion_portal"("token_hash");
CREATE INDEX "invitacion_portal_paciente_id_idx" ON "invitacion_portal"("paciente_id");

ALTER TABLE "invitacion_portal" ADD CONSTRAINT "invitacion_portal_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
