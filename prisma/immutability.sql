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

DROP TRIGGER IF EXISTS trg_inmutable_prescripcion ON hoja_prescripcion;
CREATE TRIGGER trg_inmutable_prescripcion
  BEFORE UPDATE OR DELETE ON hoja_prescripcion
  FOR EACH ROW EXECUTE FUNCTION rechazar_mutacion_firmada();

DROP TRIGGER IF EXISTS trg_inmutable_ordenes ON hoja_ordenes_medicas;
CREATE TRIGGER trg_inmutable_ordenes
  BEFORE UPDATE OR DELETE ON hoja_ordenes_medicas
  FOR EACH ROW EXECUTE FUNCTION rechazar_mutacion_firmada();

DROP TRIGGER IF EXISTS trg_inmutable_valoracion_pre ON valoracion_preanestesica;
CREATE TRIGGER trg_inmutable_valoracion_pre
  BEFORE UPDATE OR DELETE ON valoracion_preanestesica
  FOR EACH ROW EXECUTE FUNCTION rechazar_mutacion_firmada();

DROP TRIGGER IF EXISTS trg_inmutable_registro_anestesico ON registro_anestesico;
CREATE TRIGGER trg_inmutable_registro_anestesico
  BEFORE UPDATE OR DELETE ON registro_anestesico
  FOR EACH ROW EXECUTE FUNCTION rechazar_mutacion_firmada();

DROP TRIGGER IF EXISTS trg_inmutable_nota_postanestesica ON nota_postanestesica;
CREATE TRIGGER trg_inmutable_nota_postanestesica
  BEFORE UPDATE OR DELETE ON nota_postanestesica
  FOR EACH ROW EXECUTE FUNCTION rechazar_mutacion_firmada();

-- Renglones de las hojas firmadas: no se editan una vez firmada la hoja padre.
CREATE OR REPLACE FUNCTION rechazar_mutacion_partida(estado_padre text) RETURNS void AS $$
BEGIN
  IF estado_padre <> 'BORRADOR' THEN
    RAISE EXCEPTION 'La hoja está firmada: sus renglones son inmutables.';
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION proteger_prescripcion_partida() RETURNS trigger AS $$
DECLARE e text; ref uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN ref := OLD.hoja_prescripcion_id; ELSE ref := NEW.hoja_prescripcion_id; END IF;
  SELECT estado::text INTO e FROM hoja_prescripcion WHERE id = ref;
  PERFORM rechazar_mutacion_partida(e);
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prescripcion_partida ON prescripcion_partida;
CREATE TRIGGER trg_prescripcion_partida
  BEFORE INSERT OR UPDATE OR DELETE ON prescripcion_partida
  FOR EACH ROW EXECUTE FUNCTION proteger_prescripcion_partida();

CREATE OR REPLACE FUNCTION proteger_orden_partida() RETURNS trigger AS $$
DECLARE e text; ref uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN ref := OLD.hoja_ordenes_id; ELSE ref := NEW.hoja_ordenes_id; END IF;
  SELECT estado::text INTO e FROM hoja_ordenes_medicas WHERE id = ref;
  PERFORM rechazar_mutacion_partida(e);
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_orden_partida ON orden_partida;
CREATE TRIGGER trg_orden_partida
  BEFORE INSERT OR UPDATE OR DELETE ON orden_partida
  FOR EACH ROW EXECUTE FUNCTION proteger_orden_partida();

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

-- Hojas de consumo (quirófano y piso): cerradas = cuenta cobrada, inmutable.
CREATE OR REPLACE FUNCTION rechazar_mutacion_consumo() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Hoja de consumo: no se permite DELETE.';
  END IF;
  IF OLD.estado = 'CERRADA' THEN
    RAISE EXCEPTION 'Hoja de consumo cerrada: es inmutable; capture una hoja nueva.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_inmutable_hoja_consumo ON hoja_consumo;
CREATE TRIGGER trg_inmutable_hoja_consumo
  BEFORE UPDATE OR DELETE ON hoja_consumo
  FOR EACH ROW EXECUTE FUNCTION rechazar_mutacion_consumo();

CREATE OR REPLACE FUNCTION proteger_consumo_partida() RETURNS trigger AS $$
DECLARE e text; ref uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN ref := OLD.hoja_consumo_id; ELSE ref := NEW.hoja_consumo_id; END IF;
  SELECT estado::text INTO e FROM hoja_consumo WHERE id = ref;
  IF e = 'CERRADA' THEN
    RAISE EXCEPTION 'La hoja de consumo está cerrada: sus renglones son inmutables.';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_consumo_partida ON consumo_partida;
CREATE TRIGGER trg_consumo_partida
  BEFORE INSERT OR UPDATE OR DELETE ON consumo_partida
  FOR EACH ROW EXECUTE FUNCTION proteger_consumo_partida();

-- Lecturas y fármacos del transanestésico: bloqueados al firmar el registro.
CREATE OR REPLACE FUNCTION proteger_transanestesico() RETURNS trigger AS $$
DECLARE e text; ref uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN ref := OLD.registro_anestesico_id; ELSE ref := NEW.registro_anestesico_id; END IF;
  SELECT estado::text INTO e FROM registro_anestesico WHERE id = ref;
  PERFORM rechazar_mutacion_partida(e);
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_transanestesico_lectura ON transanestesico_lectura;
CREATE TRIGGER trg_transanestesico_lectura
  BEFORE INSERT OR UPDATE OR DELETE ON transanestesico_lectura
  FOR EACH ROW EXECUTE FUNCTION proteger_transanestesico();

DROP TRIGGER IF EXISTS trg_transanestesico_farmaco ON transanestesico_farmaco;
CREATE TRIGGER trg_transanestesico_farmaco
  BEFORE INSERT OR UPDATE OR DELETE ON transanestesico_farmaco
  FOR EACH ROW EXECUTE FUNCTION proteger_transanestesico();
