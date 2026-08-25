-- Plan tier: distingue entre Receta (gratis), Consultorio ($199) y Clínica Pro ($699).
-- Hasta ahora el tipo de workspace (CLINIC/BASIC) servía como proxy del plan, pero
-- no diferenciaba entre BASIC gratis y BASIC de pago. Este campo lo resuelve.

CREATE TYPE "PlanTier" AS ENUM ('RECETA', 'CONSULTORIO', 'CLINICA_PRO');

ALTER TABLE "workspace" ADD COLUMN "plan" "PlanTier" NOT NULL DEFAULT 'RECETA';

-- Backfill: los workspaces CLINIC ya existentes son Clínica Pro.
UPDATE "workspace" SET "plan" = 'CLINICA_PRO' WHERE "tipo" = 'CLINIC';
