-- Inmutabilidad a nivel de base de datos (NOM-004): las notas firmadas y la
-- bitácora no admiten UPDATE ni DELETE. Se aplica después de `prisma migrate deploy`.

CREATE OR REPLACE FUNCTION rechazar_mutacion_firmada() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Registro clínico protegido: no se permite DELETE (%).', TG_TABLE_NAME;
  END IF;
  -- UPDATE permitido solo si el registro estaba en borrador
  IF OLD.estado <> 'BORRADOR' THEN
    RAISE EXCEPTION 'Registro clínico firmado: es inmutable; use adenda o cancelación (%).', TG_TABLE_NAME;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_inmutable_nota_evolucion ON nota_evolucion;
CREATE TRIGGER trg_inmutable_nota_evolucion
  BEFORE UPDATE OR DELETE ON nota_evolucion
  FOR EACH ROW EXECUTE FUNCTION rechazar_mutacion_firmada();

DROP TRIGGER IF EXISTS trg_inmutable_nota_pre ON nota_preoperatoria;
CREATE TRIGGER trg_inmutable_nota_pre
  BEFORE UPDATE OR DELETE ON nota_preoperatoria
  FOR EACH ROW EXECUTE FUNCTION rechazar_mutacion_firmada();

DROP TRIGGER IF EXISTS trg_inmutable_nota_post ON nota_postoperatoria;
CREATE TRIGGER trg_inmutable_nota_post
  BEFORE UPDATE OR DELETE ON nota_postoperatoria
  FOR EACH ROW EXECUTE FUNCTION rechazar_mutacion_firmada();

-- Hoja de primer llenado: cerrada = inmutable (corrección por nueva versión)
CREATE OR REPLACE FUNCTION rechazar_mutacion_hoja() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Hoja de primer llenado: no se permite DELETE.';
  END IF;
  IF OLD.estado = 'CERRADA' THEN
    RAISE EXCEPTION 'Hoja cerrada: es inmutable; capture una nueva versión.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_inmutable_hoja ON hoja_primer_llenado;
CREATE TRIGGER trg_inmutable_hoja
  BEFORE UPDATE OR DELETE ON hoja_primer_llenado
  FOR EACH ROW EXECUTE FUNCTION rechazar_mutacion_hoja();

-- Bitácora: append-only absoluto
CREATE OR REPLACE FUNCTION rechazar_mutacion_bitacora() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'La bitácora es append-only: no admite UPDATE ni DELETE.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bitacora_append_only ON bitacora;
CREATE TRIGGER trg_bitacora_append_only
  BEFORE UPDATE OR DELETE ON bitacora
  FOR EACH ROW EXECUTE FUNCTION rechazar_mutacion_bitacora();

-- Recetas: emitida no se edita (solo transición a CANCELADA con motivo, y campos de envío)
CREATE OR REPLACE FUNCTION proteger_receta() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Receta: no se permite DELETE; cancele con motivo.';
  END IF;
  -- Campos clínicos congelados tras la emisión
  IF NEW.folio <> OLD.folio
     OR NEW.snapshot_medico::text <> OLD.snapshot_medico::text
     OR NEW.snapshot_paciente::text <> OLD.snapshot_paciente::text
     OR NEW.fecha_emision <> OLD.fecha_emision THEN
    RAISE EXCEPTION 'Receta emitida: los datos clínicos son inmutables.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_proteger_receta ON receta;
CREATE TRIGGER trg_proteger_receta
  BEFORE UPDATE OR DELETE ON receta
  FOR EACH ROW EXECUTE FUNCTION proteger_receta();
