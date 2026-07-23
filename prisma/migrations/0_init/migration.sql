-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "RolClave" AS ENUM ('ADMIN', 'DOCTOR', 'ENFERMERIA');

-- CreateEnum
CREATE TYPE "EstadoHoja" AS ENUM ('BORRADOR', 'CERRADA');

-- CreateEnum
CREATE TYPE "EstadoAsignacion" AS ENUM ('ACTIVA', 'ALTA', 'REFERIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "EstadoNota" AS ENUM ('BORRADOR', 'FIRMADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "EstadoReceta" AS ENUM ('EMITIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "EstadoEnvio" AS ENUM ('PENDIENTE', 'ENVIADA', 'ERROR', 'SIN_CORREO');

-- CreateEnum
CREATE TYPE "EstadoQx" AS ENUM ('PREOPERATORIO', 'REALIZADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "EstadoCita" AS ENUM ('PROGRAMADA', 'REALIZADA', 'NO_ASISTIO', 'REPROGRAMADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "TipoDocumento" AS ENUM ('RECETA', 'CONSENTIMIENTO', 'ESTUDIO', 'RESUMEN_CLINICO', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoEmail" AS ENUM ('PENDIENTE', 'ENVIADO', 'FALLIDO');

-- CreateTable
CREATE TABLE "usuario" (
    "id" UUID NOT NULL,
    "rol" "RolClave" NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "nombre_completo" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "debe_cambiar_password" BOOLEAN NOT NULL DEFAULT true,
    "intentos_fallidos" INTEGER NOT NULL DEFAULT 0,
    "bloqueado_hasta" TIMESTAMP(3),
    "ultimo_acceso" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "usuario_id" UUID NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "especialidad" (
    "id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "especialidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "cedula_profesional" TEXT NOT NULL,
    "cedula_especialidad" TEXT,
    "institucion_titulo" TEXT NOT NULL,
    "universidad_especialidad" TEXT,
    "consultorio" TEXT,
    "telefono" TEXT,
    "firma_digitalizada" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "doctor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_especialidad" (
    "doctor_id" UUID NOT NULL,
    "especialidad_id" UUID NOT NULL,

    CONSTRAINT "doctor_especialidad_pkey" PRIMARY KEY ("doctor_id","especialidad_id")
);

-- CreateTable
CREATE TABLE "paciente" (
    "id" UUID NOT NULL,
    "numero_expediente" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido_paterno" TEXT NOT NULL,
    "apellido_materno" TEXT,
    "fecha_nacimiento" DATE NOT NULL,
    "sexo" TEXT NOT NULL,
    "curp" TEXT,
    "tipo_sangre" TEXT,
    "estado_civil" TEXT,
    "ocupacion" TEXT,
    "escolaridad" TEXT,
    "religion" TEXT,
    "nacionalidad" TEXT,
    "referencia" TEXT,
    "calle" TEXT,
    "colonia" TEXT,
    "municipio" TEXT,
    "estado" TEXT,
    "cp" TEXT,
    "telefono" TEXT NOT NULL,
    "email" TEXT,
    "sin_correo" BOOLEAN NOT NULL DEFAULT false,
    "contacto_emergencia_nombre" TEXT,
    "contacto_emergencia_telefono" TEXT,
    "contacto_emergencia_parentesco" TEXT,
    "derechohabiencia" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "paciente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hoja_primer_llenado" (
    "id" UUID NOT NULL,
    "paciente_id" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "motivo_consulta" TEXT,
    "padecimiento_actual" TEXT,
    "especialidades_sugeridas" TEXT,
    "antecedentes_heredofamiliares" TEXT,
    "antecedentes_personales_patologicos" TEXT,
    "antecedentes_personales_no_patologicos" TEXT,
    "antecedentes_gineco_obstetricos" TEXT,
    "alergias" TEXT,
    "medicamentos_actuales" TEXT,
    "interrogatorio_aparatos_sistemas" TEXT,
    "cirugia_deseada" TEXT,
    "presupuesto" TEXT,
    "fecha_programada_deseada" TEXT,
    "ta_sistolica" INTEGER,
    "ta_diastolica" INTEGER,
    "fc" INTEGER,
    "fr" INTEGER,
    "temperatura" DECIMAL(4,1),
    "peso_kg" DECIMAL(5,1),
    "talla_cm" DECIMAL(5,1),
    "spo2" INTEGER,
    "glucosa" INTEGER,
    "escala_dolor" INTEGER,
    "observaciones_enfermeria" TEXT,
    "estado" "EstadoHoja" NOT NULL DEFAULT 'BORRADOR',
    "disponible_consulta" BOOLEAN NOT NULL DEFAULT false,
    "capturado_por" UUID NOT NULL,
    "fecha_hora_captura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_cierre" TIMESTAMP(3),

    CONSTRAINT "hoja_primer_llenado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asignacion" (
    "id" UUID NOT NULL,
    "paciente_id" UUID NOT NULL,
    "especialidad_id" UUID NOT NULL,
    "doctor_id" UUID NOT NULL,
    "fecha_asignacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "motivo" TEXT,
    "estado" "EstadoAsignacion" NOT NULL DEFAULT 'ACTIVA',
    "fecha_cierre" TIMESTAMP(3),

    CONSTRAINT "asignacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nota_evolucion" (
    "id" UUID NOT NULL,
    "asignacion_id" UUID NOT NULL,
    "fecha_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subjetivo" TEXT,
    "objetivo" TEXT,
    "signos_vitales" JSONB,
    "resultados_estudios" TEXT,
    "diagnosticos" TEXT,
    "pronostico" TEXT,
    "plan_tratamiento" TEXT,
    "elaborada_por" UUID NOT NULL,
    "estado" "EstadoNota" NOT NULL DEFAULT 'BORRADOR',
    "fecha_firma" TIMESTAMP(3),
    "motivo_cancelacion" TEXT,
    "nota_padre_id" UUID,

    CONSTRAINT "nota_evolucion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receta" (
    "id" UUID NOT NULL,
    "folio" TEXT NOT NULL,
    "asignacion_id" UUID NOT NULL,
    "nota_evolucion_id" UUID,
    "fecha_emision" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diagnostico" TEXT,
    "indicaciones_generales" TEXT,
    "proxima_cita" TEXT,
    "snapshot_medico" JSONB NOT NULL,
    "snapshot_paciente" JSONB NOT NULL,
    "documento_id" UUID,
    "estado_envio" "EstadoEnvio" NOT NULL DEFAULT 'PENDIENTE',
    "fecha_envio_email" TIMESTAMP(3),
    "estado" "EstadoReceta" NOT NULL DEFAULT 'EMITIDA',
    "motivo_cancelacion" TEXT,

    CONSTRAINT "receta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receta_partida" (
    "id" UUID NOT NULL,
    "receta_id" UUID NOT NULL,
    "orden" INTEGER NOT NULL,
    "medicamento" TEXT NOT NULL,
    "presentacion" TEXT,
    "dosis" TEXT NOT NULL,
    "via_administracion" TEXT NOT NULL,
    "frecuencia" TEXT NOT NULL,
    "duracion" TEXT NOT NULL,
    "cantidad" TEXT,
    "indicaciones" TEXT,

    CONSTRAINT "receta_partida_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expediente_quirurgico" (
    "id" UUID NOT NULL,
    "asignacion_id" UUID NOT NULL,
    "paciente_id" UUID NOT NULL,
    "fecha_cirugia_programada" TIMESTAMP(3),
    "quirofano_sede" TEXT,
    "estado" "EstadoQx" NOT NULL DEFAULT 'PREOPERATORIO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consentimiento_doc_id" UUID,
    "consentimiento_fecha" TIMESTAMP(3),

    CONSTRAINT "expediente_quirurgico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nota_preoperatoria" (
    "id" UUID NOT NULL,
    "expediente_qx_id" UUID NOT NULL,
    "fecha_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diagnostico_preoperatorio" TEXT,
    "plan_quirurgico" TEXT,
    "tipo_cirugia" TEXT,
    "riesgo_quirurgico" TEXT,
    "cuidados_y_plan_terapeutico" TEXT,
    "pronostico" TEXT,
    "elaborada_por" UUID NOT NULL,
    "estado" "EstadoNota" NOT NULL DEFAULT 'BORRADOR',
    "fecha_firma" TIMESTAMP(3),

    CONSTRAINT "nota_preoperatoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nota_postoperatoria" (
    "id" UUID NOT NULL,
    "expediente_qx_id" UUID NOT NULL,
    "fecha_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diagnostico_preoperatorio" TEXT,
    "operacion_planeada" TEXT,
    "operacion_realizada" TEXT,
    "diagnostico_postoperatorio" TEXT,
    "descripcion_tecnica_quirurgica" TEXT,
    "hallazgos_transoperatorios" TEXT,
    "reporte_conteo_gasas_compresas_instrumental" TEXT,
    "incidentes_accidentes" TEXT,
    "cuantificacion_sangrado" TEXT,
    "transfusiones" TEXT,
    "estudios_transoperatorios" TEXT,
    "ayudantes_anestesiologo_enfermeria" TEXT,
    "estado_postquirurgico_inmediato" TEXT,
    "plan_manejo_tratamiento" TEXT,
    "pronostico" TEXT,
    "envio_piezas_patologia" TEXT,
    "elaborada_por" UUID NOT NULL,
    "estado" "EstadoNota" NOT NULL DEFAULT 'BORRADOR',
    "fecha_firma" TIMESTAMP(3),

    CONSTRAINT "nota_postoperatoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cita_postoperatoria" (
    "id" UUID NOT NULL,
    "expediente_quirurgico_id" UUID NOT NULL,
    "asignacion_id" UUID NOT NULL,
    "fecha_hora_programada" TIMESTAMP(3) NOT NULL,
    "motivo" TEXT NOT NULL,
    "estado" "EstadoCita" NOT NULL DEFAULT 'PROGRAMADA',
    "nota_evolucion_id" UUID,
    "observaciones" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cita_postoperatoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documento" (
    "id" UUID NOT NULL,
    "paciente_id" UUID NOT NULL,
    "tipo" "TipoDocumento" NOT NULL,
    "nombre_archivo" TEXT NOT NULL,
    "ruta_o_clave_almacenamiento" TEXT NOT NULL,
    "hash_sha256" TEXT NOT NULL,
    "subido_por" UUID NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_queue" (
    "id" UUID NOT NULL,
    "receta_id" UUID NOT NULL,
    "destinatario" TEXT NOT NULL,
    "intentos" INTEGER NOT NULL DEFAULT 0,
    "proximo_intento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" "EstadoEmail" NOT NULL DEFAULT 'PENDIENTE',
    "ultimo_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bitacora" (
    "id" BIGSERIAL NOT NULL,
    "usuario_id" UUID,
    "rol_snapshot" TEXT,
    "accion" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidad_id" TEXT,
    "paciente_id" UUID,
    "datos_antes" JSONB,
    "datos_despues" JSONB,
    "ip_origen" TEXT,
    "fecha_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bitacora_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracion" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "razon_social" TEXT NOT NULL DEFAULT 'MIT — Medical Tower',
    "domicilio" TEXT NOT NULL DEFAULT '',
    "telefono" TEXT NOT NULL DEFAULT '',
    "logotipo" TEXT,
    "email_remitente" TEXT NOT NULL DEFAULT 'onboarding@resend.dev',

    CONSTRAINT "configuracion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE INDEX "session_usuario_id_idx" ON "session"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "especialidad_nombre_key" ON "especialidad"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "doctor_usuario_id_key" ON "doctor"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "paciente_numero_expediente_key" ON "paciente"("numero_expediente");

-- CreateIndex
CREATE INDEX "paciente_nombre_apellido_paterno_idx" ON "paciente"("nombre", "apellido_paterno");

-- CreateIndex
CREATE INDEX "paciente_curp_idx" ON "paciente"("curp");

-- CreateIndex
CREATE INDEX "hoja_primer_llenado_paciente_id_idx" ON "hoja_primer_llenado"("paciente_id");

-- CreateIndex
CREATE INDEX "hoja_primer_llenado_disponible_consulta_idx" ON "hoja_primer_llenado"("disponible_consulta");

-- CreateIndex
CREATE INDEX "asignacion_doctor_id_estado_idx" ON "asignacion"("doctor_id", "estado");

-- CreateIndex
CREATE INDEX "asignacion_paciente_id_estado_idx" ON "asignacion"("paciente_id", "estado");

-- CreateIndex
CREATE INDEX "nota_evolucion_asignacion_id_idx" ON "nota_evolucion"("asignacion_id");

-- CreateIndex
CREATE UNIQUE INDEX "receta_folio_key" ON "receta"("folio");

-- CreateIndex
CREATE INDEX "receta_partida_receta_id_idx" ON "receta_partida"("receta_id");

-- CreateIndex
CREATE UNIQUE INDEX "nota_preoperatoria_expediente_qx_id_key" ON "nota_preoperatoria"("expediente_qx_id");

-- CreateIndex
CREATE UNIQUE INDEX "nota_postoperatoria_expediente_qx_id_key" ON "nota_postoperatoria"("expediente_qx_id");

-- CreateIndex
CREATE INDEX "cita_postoperatoria_fecha_hora_programada_idx" ON "cita_postoperatoria"("fecha_hora_programada");

-- CreateIndex
CREATE INDEX "documento_paciente_id_idx" ON "documento"("paciente_id");

-- CreateIndex
CREATE INDEX "email_queue_estado_proximo_intento_idx" ON "email_queue"("estado", "proximo_intento");

-- CreateIndex
CREATE INDEX "bitacora_paciente_id_idx" ON "bitacora"("paciente_id");

-- CreateIndex
CREATE INDEX "bitacora_usuario_id_idx" ON "bitacora"("usuario_id");

-- CreateIndex
CREATE INDEX "bitacora_fecha_hora_idx" ON "bitacora"("fecha_hora");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor" ADD CONSTRAINT "doctor_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_especialidad" ADD CONSTRAINT "doctor_especialidad_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_especialidad" ADD CONSTRAINT "doctor_especialidad_especialidad_id_fkey" FOREIGN KEY ("especialidad_id") REFERENCES "especialidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hoja_primer_llenado" ADD CONSTRAINT "hoja_primer_llenado_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hoja_primer_llenado" ADD CONSTRAINT "hoja_primer_llenado_capturado_por_fkey" FOREIGN KEY ("capturado_por") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignacion" ADD CONSTRAINT "asignacion_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignacion" ADD CONSTRAINT "asignacion_especialidad_id_fkey" FOREIGN KEY ("especialidad_id") REFERENCES "especialidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignacion" ADD CONSTRAINT "asignacion_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nota_evolucion" ADD CONSTRAINT "nota_evolucion_asignacion_id_fkey" FOREIGN KEY ("asignacion_id") REFERENCES "asignacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nota_evolucion" ADD CONSTRAINT "nota_evolucion_elaborada_por_fkey" FOREIGN KEY ("elaborada_por") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nota_evolucion" ADD CONSTRAINT "nota_evolucion_nota_padre_id_fkey" FOREIGN KEY ("nota_padre_id") REFERENCES "nota_evolucion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receta" ADD CONSTRAINT "receta_asignacion_id_fkey" FOREIGN KEY ("asignacion_id") REFERENCES "asignacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receta" ADD CONSTRAINT "receta_nota_evolucion_id_fkey" FOREIGN KEY ("nota_evolucion_id") REFERENCES "nota_evolucion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receta" ADD CONSTRAINT "receta_documento_id_fkey" FOREIGN KEY ("documento_id") REFERENCES "documento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receta_partida" ADD CONSTRAINT "receta_partida_receta_id_fkey" FOREIGN KEY ("receta_id") REFERENCES "receta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expediente_quirurgico" ADD CONSTRAINT "expediente_quirurgico_asignacion_id_fkey" FOREIGN KEY ("asignacion_id") REFERENCES "asignacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expediente_quirurgico" ADD CONSTRAINT "expediente_quirurgico_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nota_preoperatoria" ADD CONSTRAINT "nota_preoperatoria_expediente_qx_id_fkey" FOREIGN KEY ("expediente_qx_id") REFERENCES "expediente_quirurgico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nota_postoperatoria" ADD CONSTRAINT "nota_postoperatoria_expediente_qx_id_fkey" FOREIGN KEY ("expediente_qx_id") REFERENCES "expediente_quirurgico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cita_postoperatoria" ADD CONSTRAINT "cita_postoperatoria_expediente_quirurgico_id_fkey" FOREIGN KEY ("expediente_quirurgico_id") REFERENCES "expediente_quirurgico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cita_postoperatoria" ADD CONSTRAINT "cita_postoperatoria_asignacion_id_fkey" FOREIGN KEY ("asignacion_id") REFERENCES "asignacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cita_postoperatoria" ADD CONSTRAINT "cita_postoperatoria_nota_evolucion_id_fkey" FOREIGN KEY ("nota_evolucion_id") REFERENCES "nota_evolucion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documento" ADD CONSTRAINT "documento_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_queue" ADD CONSTRAINT "email_queue_receta_id_fkey" FOREIGN KEY ("receta_id") REFERENCES "receta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bitacora" ADD CONSTRAINT "bitacora_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

