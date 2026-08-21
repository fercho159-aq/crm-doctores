-- Domicilio del consultorio: lo usa el médico BASIC en su receta (RIS art. 28) en
-- lugar del domicilio institucional de `configuracion`, que solo aplica a CLINIC.
ALTER TABLE "doctor" ADD COLUMN "domicilio_consultorio" TEXT;
