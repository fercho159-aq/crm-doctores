-- Workspace: raíz de aislamiento multi-tenant (CLINIC = Medical Tower, BASIC = médico
-- independiente). Se agrega sin romper datos existentes: se crea un workspace CLINIC por
-- defecto y todo lo que ya existe (usuarios, pacientes) se le asigna (backfill).

-- CreateEnum
CREATE TYPE "TipoWorkspace" AS ENUM ('CLINIC', 'BASIC');

-- CreateTable
CREATE TABLE "workspace" (
    "id" UUID NOT NULL,
    "tipo" "TipoWorkspace" NOT NULL DEFAULT 'CLINIC',
    "nombre" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_pkey" PRIMARY KEY ("id")
);

-- Workspace por defecto para todo lo que ya existe en la base de datos.
INSERT INTO "workspace" ("id", "tipo", "nombre")
VALUES (gen_random_uuid(), 'CLINIC', 'MIT — Medical Tower');

-- AlterTable: usuario (columna nullable -> backfill -> NOT NULL, para no romper filas existentes)
ALTER TABLE "usuario" ADD COLUMN "workspace_id" UUID;
UPDATE "usuario" SET "workspace_id" = (SELECT "id" FROM "workspace" LIMIT 1);
ALTER TABLE "usuario" ALTER COLUMN "workspace_id" SET NOT NULL;
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "usuario_workspace_id_idx" ON "usuario"("workspace_id");

-- AlterTable: paciente (mismo patrón)
ALTER TABLE "paciente" ADD COLUMN "workspace_id" UUID;
UPDATE "paciente" SET "workspace_id" = (SELECT "id" FROM "workspace" LIMIT 1);
ALTER TABLE "paciente" ALTER COLUMN "workspace_id" SET NOT NULL;
ALTER TABLE "paciente" ADD CONSTRAINT "paciente_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "paciente_workspace_id_idx" ON "paciente"("workspace_id");
