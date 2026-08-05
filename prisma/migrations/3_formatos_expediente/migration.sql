-- CreateEnum
CREATE TYPE "CategoriaOrden" AS ENUM ('DIETA', 'CUIDADOS', 'SOLUCIONES', 'MEDICAMENTOS', 'ESTUDIOS', 'OTRO');

-- CreateEnum
CREATE TYPE "CategoriaInsumo" AS ENUM ('MATERIAL', 'MEDICAMENTO', 'SUTURA', 'SOLUCION', 'OTRO', 'SERVICIO');

-- CreateEnum
CREATE TYPE "TipoConsumo" AS ENUM ('QUIROFANO', 'PISO');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TipoDocumento" ADD VALUE IF NOT EXISTS 'FICHA_IDENTIFICACION';
ALTER TYPE "TipoDocumento" ADD VALUE IF NOT EXISTS 'PRESCRIPCION';
ALTER TYPE "TipoDocumento" ADD VALUE IF NOT EXISTS 'ORDENES_MEDICAS';
ALTER TYPE "TipoDocumento" ADD VALUE IF NOT EXISTS 'DESCRIPCION_QX';
ALTER TYPE "TipoDocumento" ADD VALUE IF NOT EXISTS 'CONSUMO_QUIROFANO';
ALTER TYPE "TipoDocumento" ADD VALUE IF NOT EXISTS 'CONSUMO_PISO';
ALTER TYPE "TipoDocumento" ADD VALUE IF NOT EXISTS 'VALORACION_PREANESTESICA';
ALTER TYPE "TipoDocumento" ADD VALUE IF NOT EXISTS 'REGISTRO_ANESTESICO';
ALTER TYPE "TipoDocumento" ADD VALUE IF NOT EXISTS 'NOTA_POSTANESTESICA';

-- AlterTable
ALTER TABLE "configuracion" ADD COLUMN     "expediente_cofepris" TEXT,
ADD COLUMN     "licencia_sanitaria" TEXT,
ADD COLUMN     "oficio_cofepris" TEXT,
ADD COLUMN     "rfc" TEXT;

-- CreateTable
CREATE TABLE "hoja_prescripcion" (
    "id" UUID NOT NULL,
    "paciente_id" UUID NOT NULL,
    "asignacion_id" UUID NOT NULL,
    "cuarto" TEXT,
    "diagnostico" TEXT,
    "dieta" TEXT,
    "elaborada_por" UUID NOT NULL,
    "estado" "EstadoNota" NOT NULL DEFAULT 'BORRADOR',
    "fecha_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_firma" TIMESTAMP(3),

    CONSTRAINT "hoja_prescripcion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescripcion_partida" (
    "id" UUID NOT NULL,
    "hoja_prescripcion_id" UUID NOT NULL,
    "orden" INTEGER NOT NULL,
    "fecha" DATE NOT NULL,
    "medicamento" TEXT NOT NULL,
    "dosis" TEXT NOT NULL,
    "via" TEXT NOT NULL,
    "horario" TEXT NOT NULL,

    CONSTRAINT "prescripcion_partida_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hoja_ordenes_medicas" (
    "id" UUID NOT NULL,
    "paciente_id" UUID NOT NULL,
    "asignacion_id" UUID NOT NULL,
    "fecha_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cuarto" TEXT,
    "elaborada_por" UUID NOT NULL,
    "estado" "EstadoNota" NOT NULL DEFAULT 'BORRADOR',
    "fecha_firma" TIMESTAMP(3),

    CONSTRAINT "hoja_ordenes_medicas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orden_partida" (
    "id" UUID NOT NULL,
    "hoja_ordenes_id" UUID NOT NULL,
    "orden" INTEGER NOT NULL,
    "categoria" "CategoriaOrden" NOT NULL DEFAULT 'OTRO',
    "texto" TEXT NOT NULL,

    CONSTRAINT "orden_partida_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insumo" (
    "id" UUID NOT NULL,
    "clave" TEXT,
    "nombre" TEXT NOT NULL,
    "categoria" "CategoriaInsumo" NOT NULL,
    "precio" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "insumo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hoja_consumo" (
    "id" UUID NOT NULL,
    "paciente_id" UUID NOT NULL,
    "expediente_quirurgico_id" UUID,
    "tipo" "TipoConsumo" NOT NULL,
    "cuarto" TEXT,
    "tratamiento" TEXT,
    "procedimiento" TEXT,
    "fecha_ingreso" TIMESTAMP(3),
    "fecha_egreso" TIMESTAMP(3),
    "hora_ingreso_quirofano" TEXT,
    "hora_termino_quirofano" TEXT,
    "turno" TEXT,
    "medico_pediatra" TEXT,
    "medico_tratante" TEXT,
    "medico_cirujano" TEXT,
    "medico_anestesiologo" TEXT,
    "medico_ayudante" TEXT,
    "enfermera" TEXT,
    "instrumentista" TEXT,
    "capturado_por" UUID NOT NULL,
    "estado" "EstadoHoja" NOT NULL DEFAULT 'BORRADOR',
    "fecha_cierre" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hoja_consumo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consumo_partida" (
    "id" UUID NOT NULL,
    "hoja_consumo_id" UUID NOT NULL,
    "insumo_id" UUID,
    "descripcion" TEXT NOT NULL,
    "categoria" "CategoriaInsumo" NOT NULL,
    "cantidad" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "precio_unitario" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "importe" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "fecha" DATE,
    "enfermera" TEXT,
    "observaciones" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "consumo_partida_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "valoracion_preanestesica" (
    "id" UUID NOT NULL,
    "expediente_quirurgico_id" UUID NOT NULL,
    "paciente_id" UUID NOT NULL,
    "habitacion" TEXT,
    "servicio" TEXT,
    "folio" TEXT,
    "tipo_pago" TEXT,
    "fecha_ingreso" TIMESTAMP(3),
    "hora_ingreso" TEXT,
    "diagnostico_prequirurgico" TEXT,
    "cirugia_planeada" TEXT,
    "cirujano" TEXT,
    "anestesiologo" TEXT,
    "tipo_cirugia" JSONB,
    "antecedentes_importancia" TEXT,
    "peso_kg" DECIMAL(5,1),
    "talla_cm" DECIMAL(5,1),
    "imc" DECIMAL(5,2),
    "temperatura" DECIMAL(4,1),
    "ta" TEXT,
    "fr" INTEGER,
    "fc" INTEGER,
    "spo2" INTEGER,
    "ex_cabeza" TEXT,
    "ex_cuello" TEXT,
    "ex_respiratorio" TEXT,
    "ex_cardiovascular" TEXT,
    "ex_gastrointestinal" TEXT,
    "ex_genitourinario" TEXT,
    "lab_fecha" TIMESTAMP(3),
    "grupo_sanguineo" TEXT,
    "factor_rh" TEXT,
    "hemoglobina" TEXT,
    "hematocrito" TEXT,
    "plaquetas" TEXT,
    "leucocitos" TEXT,
    "tp" TEXT,
    "tpt" TEXT,
    "tt" TEXT,
    "glucosa" TEXT,
    "creatinina" TEXT,
    "urea" TEXT,
    "sodio" TEXT,
    "potasio" TEXT,
    "cloro" TEXT,
    "calcio" TEXT,
    "lab_otros" TEXT,
    "ecg" TEXT,
    "rayos_x" TEXT,
    "ultrasonido" TEXT,
    "gabinete_otros" TEXT,
    "factores_riesgo" JSONB,
    "asa" TEXT,
    "angina_canadiense" TEXT,
    "goldman" JSONB,
    "predictores" JSONB,
    "goldman_puntos" INTEGER,
    "goldman_clase" TEXT,
    "trombolitico" JSONB,
    "neurologico" JSONB,
    "via_aerea" JSONB,
    "plan_anestesico" JSONB,
    "fecha_elaboracion" TIMESTAMP(3),
    "anestesiologo_id" UUID NOT NULL,
    "firma_anestesiologo" TEXT,
    "estado" "EstadoNota" NOT NULL DEFAULT 'BORRADOR',
    "fecha_firma" TIMESTAMP(3),

    CONSTRAINT "valoracion_preanestesica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registro_anestesico" (
    "id" UUID NOT NULL,
    "expediente_quirurgico_id" UUID NOT NULL,
    "paciente_id" UUID NOT NULL,
    "eval_fecha" TIMESTAMP(3),
    "eval_hora" TEXT,
    "consentimiento_anestesia" BOOLEAN,
    "identificacion_corroborada" BOOLEAN,
    "verificacion_equipo" JSONB,
    "signos_basales" JSONB,
    "medicacion_preanestesica" JSONB,
    "eval_observaciones" TEXT,
    "horas_ayuno" TEXT,
    "premedicacion" BOOLEAN,
    "premedicacion_detalle" TEXT,
    "acceso_venoso" BOOLEAN,
    "acceso_sitio" TEXT,
    "calibre_cateter" TEXT,
    "posicion_paciente" TEXT,
    "posicion_brazos" TEXT,
    "proteccion_ojos" BOOLEAN,
    "proteccion_prominencias" BOOLEAN,
    "torniquete" BOOLEAN,
    "torniquete_sitio" TEXT,
    "torniquete_inicia" TEXT,
    "torniquete_termina" TEXT,
    "tecnica_anestesica" TEXT,
    "anestesia_local" JSONB,
    "anestesia_regional" JSONB,
    "anestesia_general" JSONB,
    "caso_obstetrico" JSONB,
    "agentes" TEXT,
    "tiempos" JSONB,
    "tipo_ventilacion" TEXT,
    "egresos" JSONB,
    "ingresos" JSONB,
    "balance_hidrico" TEXT,
    "aldrete_final" INTEGER,
    "pasa_a" TEXT,
    "anestesiologo_id" UUID NOT NULL,
    "firma_anestesiologo" TEXT,
    "estado" "EstadoNota" NOT NULL DEFAULT 'BORRADOR',
    "fecha_firma" TIMESTAMP(3),

    CONSTRAINT "registro_anestesico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transanestesico_lectura" (
    "id" UUID NOT NULL,
    "registro_anestesico_id" UUID NOT NULL,
    "minuto" INTEGER NOT NULL,
    "hora" TEXT,
    "ta_sistolica" INTEGER,
    "ta_diastolica" INTEGER,
    "fc" INTEGER,
    "fr" INTEGER,
    "temperatura" DECIMAL(4,1),
    "spo2" INTEGER,
    "etco2" TEXT,
    "pvc_pam" TEXT,
    "bis" TEXT,
    "otros" TEXT,

    CONSTRAINT "transanestesico_lectura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transanestesico_farmaco" (
    "id" UUID NOT NULL,
    "registro_anestesico_id" UUID NOT NULL,
    "orden" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "dosis" TEXT,
    "via" TEXT,
    "aplicaciones" JSONB,

    CONSTRAINT "transanestesico_farmaco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nota_postanestesica" (
    "id" UUID NOT NULL,
    "expediente_quirurgico_id" UUID NOT NULL,
    "paciente_id" UUID NOT NULL,
    "aldrete" JSONB,
    "ramsay" INTEGER,
    "bromage" INTEGER,
    "nota" TEXT,
    "plan_oxigeno" TEXT,
    "plan_soluciones_iv" TEXT,
    "plan_medicamentos" TEXT,
    "plan_componentes_sanguineos" TEXT,
    "plan_manejo_dolor" TEXT,
    "motivo_egreso" TEXT,
    "pasa_a" TEXT,
    "fecha_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "anestesiologo_id" UUID NOT NULL,
    "firma_anestesiologo" TEXT,
    "estado" "EstadoNota" NOT NULL DEFAULT 'BORRADOR',
    "fecha_firma" TIMESTAMP(3),

    CONSTRAINT "nota_postanestesica_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hoja_prescripcion_paciente_id_idx" ON "hoja_prescripcion"("paciente_id");

-- CreateIndex
CREATE INDEX "prescripcion_partida_hoja_prescripcion_id_idx" ON "prescripcion_partida"("hoja_prescripcion_id");

-- CreateIndex
CREATE INDEX "hoja_ordenes_medicas_paciente_id_idx" ON "hoja_ordenes_medicas"("paciente_id");

-- CreateIndex
CREATE INDEX "orden_partida_hoja_ordenes_id_idx" ON "orden_partida"("hoja_ordenes_id");

-- CreateIndex
CREATE INDEX "insumo_categoria_orden_idx" ON "insumo"("categoria", "orden");

-- CreateIndex
CREATE UNIQUE INDEX "insumo_categoria_nombre_key" ON "insumo"("categoria", "nombre");

-- CreateIndex
CREATE INDEX "hoja_consumo_paciente_id_idx" ON "hoja_consumo"("paciente_id");

-- CreateIndex
CREATE INDEX "hoja_consumo_expediente_quirurgico_id_idx" ON "hoja_consumo"("expediente_quirurgico_id");

-- CreateIndex
CREATE INDEX "consumo_partida_hoja_consumo_id_idx" ON "consumo_partida"("hoja_consumo_id");

-- CreateIndex
CREATE UNIQUE INDEX "valoracion_preanestesica_expediente_quirurgico_id_key" ON "valoracion_preanestesica"("expediente_quirurgico_id");

-- CreateIndex
CREATE INDEX "valoracion_preanestesica_paciente_id_idx" ON "valoracion_preanestesica"("paciente_id");

-- CreateIndex
CREATE UNIQUE INDEX "registro_anestesico_expediente_quirurgico_id_key" ON "registro_anestesico"("expediente_quirurgico_id");

-- CreateIndex
CREATE INDEX "registro_anestesico_paciente_id_idx" ON "registro_anestesico"("paciente_id");

-- CreateIndex
CREATE UNIQUE INDEX "transanestesico_lectura_registro_anestesico_id_minuto_key" ON "transanestesico_lectura"("registro_anestesico_id", "minuto");

-- CreateIndex
CREATE INDEX "transanestesico_farmaco_registro_anestesico_id_idx" ON "transanestesico_farmaco"("registro_anestesico_id");

-- CreateIndex
CREATE UNIQUE INDEX "nota_postanestesica_expediente_quirurgico_id_key" ON "nota_postanestesica"("expediente_quirurgico_id");

-- CreateIndex
CREATE INDEX "nota_postanestesica_paciente_id_idx" ON "nota_postanestesica"("paciente_id");

-- AddForeignKey
ALTER TABLE "hoja_prescripcion" ADD CONSTRAINT "hoja_prescripcion_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hoja_prescripcion" ADD CONSTRAINT "hoja_prescripcion_asignacion_id_fkey" FOREIGN KEY ("asignacion_id") REFERENCES "asignacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hoja_prescripcion" ADD CONSTRAINT "hoja_prescripcion_elaborada_por_fkey" FOREIGN KEY ("elaborada_por") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescripcion_partida" ADD CONSTRAINT "prescripcion_partida_hoja_prescripcion_id_fkey" FOREIGN KEY ("hoja_prescripcion_id") REFERENCES "hoja_prescripcion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hoja_ordenes_medicas" ADD CONSTRAINT "hoja_ordenes_medicas_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hoja_ordenes_medicas" ADD CONSTRAINT "hoja_ordenes_medicas_asignacion_id_fkey" FOREIGN KEY ("asignacion_id") REFERENCES "asignacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hoja_ordenes_medicas" ADD CONSTRAINT "hoja_ordenes_medicas_elaborada_por_fkey" FOREIGN KEY ("elaborada_por") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orden_partida" ADD CONSTRAINT "orden_partida_hoja_ordenes_id_fkey" FOREIGN KEY ("hoja_ordenes_id") REFERENCES "hoja_ordenes_medicas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hoja_consumo" ADD CONSTRAINT "hoja_consumo_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hoja_consumo" ADD CONSTRAINT "hoja_consumo_expediente_quirurgico_id_fkey" FOREIGN KEY ("expediente_quirurgico_id") REFERENCES "expediente_quirurgico"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hoja_consumo" ADD CONSTRAINT "hoja_consumo_capturado_por_fkey" FOREIGN KEY ("capturado_por") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consumo_partida" ADD CONSTRAINT "consumo_partida_hoja_consumo_id_fkey" FOREIGN KEY ("hoja_consumo_id") REFERENCES "hoja_consumo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consumo_partida" ADD CONSTRAINT "consumo_partida_insumo_id_fkey" FOREIGN KEY ("insumo_id") REFERENCES "insumo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "valoracion_preanestesica" ADD CONSTRAINT "valoracion_preanestesica_expediente_quirurgico_id_fkey" FOREIGN KEY ("expediente_quirurgico_id") REFERENCES "expediente_quirurgico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "valoracion_preanestesica" ADD CONSTRAINT "valoracion_preanestesica_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "valoracion_preanestesica" ADD CONSTRAINT "valoracion_preanestesica_anestesiologo_id_fkey" FOREIGN KEY ("anestesiologo_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registro_anestesico" ADD CONSTRAINT "registro_anestesico_expediente_quirurgico_id_fkey" FOREIGN KEY ("expediente_quirurgico_id") REFERENCES "expediente_quirurgico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registro_anestesico" ADD CONSTRAINT "registro_anestesico_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registro_anestesico" ADD CONSTRAINT "registro_anestesico_anestesiologo_id_fkey" FOREIGN KEY ("anestesiologo_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transanestesico_lectura" ADD CONSTRAINT "transanestesico_lectura_registro_anestesico_id_fkey" FOREIGN KEY ("registro_anestesico_id") REFERENCES "registro_anestesico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transanestesico_farmaco" ADD CONSTRAINT "transanestesico_farmaco_registro_anestesico_id_fkey" FOREIGN KEY ("registro_anestesico_id") REFERENCES "registro_anestesico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nota_postanestesica" ADD CONSTRAINT "nota_postanestesica_expediente_quirurgico_id_fkey" FOREIGN KEY ("expediente_quirurgico_id") REFERENCES "expediente_quirurgico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nota_postanestesica" ADD CONSTRAINT "nota_postanestesica_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nota_postanestesica" ADD CONSTRAINT "nota_postanestesica_anestesiologo_id_fkey" FOREIGN KEY ("anestesiologo_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

