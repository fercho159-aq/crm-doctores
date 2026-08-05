import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/authz";
import { Card, CardHeader, CardBody, Badge, Button } from "@/components/ui";
import { edadDe } from "@/lib/pdf";
import { ValoracionPreForm } from "./ValoracionPreForm";
import { RegistroAnestesicoForm } from "./RegistroAnestesicoForm";
import { NotaPostanestesicaForm } from "./NotaPostanestesicaForm";
import {
  generarValoracionPrePdf,
  generarRegistroAnestesicoPdf,
  generarNotaPostanestesicaPdf,
} from "@/actions/anestesia";

const fechaISO = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");
const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));
/** Bloque Json guardado como objeto de cadenas para rellenar el formulario. */
const obj = (v: unknown): Record<string, string> => {
  if (!v || typeof v !== "object" || Array.isArray(v)) return {};
  return Object.fromEntries(
    Object.entries(v as Record<string, unknown>)
      .filter(([, x]) => x !== null && x !== undefined && x !== "")
      .map(([k, x]) => [k, String(x)]),
  );
};
const arr = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : []);
const sub = (v: unknown, k: string): string[] => (v && typeof v === "object" ? arr((v as Record<string, unknown>)[k]) : []);

function BotonPdf({
  action,
  children,
}: {
  action: (id: string) => Promise<unknown>;
  children: React.ReactNode;
}) {
  return (
    <form action={action as unknown as (fd: FormData) => Promise<void>}>
      <Button type="submit" variant="secondary" size="sm">
        {children}
      </Button>
    </form>
  );
}

export default async function AnestesiologiaHoja({ params }: { params: Promise<{ qxId: string }> }) {
  const { qxId } = await params;
  const user = await requireRole("ANESTESIOLOGO", "ADMIN");

  const qx = await db.expedienteQuirurgico.findUnique({
    where: { id: qxId },
    include: {
      paciente: true,
      notaPre: true,
      asignacion: { include: { doctor: { include: { usuario: true } }, especialidad: true } },
    },
  });
  if (!qx) notFound();

  const [valoracion, registro, notaPost] = await Promise.all([
    db.valoracionPreanestesica.findUnique({ where: { expedienteQxId: qxId } }),
    db.registroAnestesico.findUnique({
      where: { expedienteQxId: qxId },
      include: { lecturas: { orderBy: { minuto: "asc" } }, farmacos: { orderBy: { orden: "asc" } } },
    }),
    db.notaPostanestesica.findUnique({ where: { expedienteQxId: qxId } }),
  ]);

  // El administrador consulta e imprime; sólo el anestesiólogo captura y firma.
  const puedeCapturar = user.rol === "ANESTESIOLOGO";
  const p = qx.paciente;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title={`${p.nombre} ${p.apellidoPaterno} ${p.apellidoMaterno ?? ""}`.trim()}
          subtitle={`${p.numeroExpediente} · ${edadDe(p.fechaNacimiento)} · ${
            p.sexo === "M" ? "Masculino" : p.sexo === "F" ? "Femenino" : "Otro"
          } · ${qx.asignacion.especialidad.nombre} · Cirujano: ${qx.asignacion.doctor.usuario.nombreCompleto}`}
          action={
            <div className="flex items-center gap-2">
              <Badge tone={qx.estado === "REALIZADA" ? "green" : "blue"}>{qx.estado}</Badge>
              <Link href="/anestesiologia">
                <Button variant="ghost" size="sm">
                  Volver
                </Button>
              </Link>
            </div>
          }
        />
        <CardBody className="flex flex-wrap gap-2">
          {valoracion && <BotonPdf action={generarValoracionPrePdf.bind(null, qxId)}>Valoración preanestésica (PDF)</BotonPdf>}
          {registro && <BotonPdf action={generarRegistroAnestesicoPdf.bind(null, qxId)}>Registro anestésico (PDF)</BotonPdf>}
          {notaPost && <BotonPdf action={generarNotaPostanestesicaPdf.bind(null, qxId)}>Nota post-anestésica (PDF)</BotonPdf>}
          {!valoracion && !registro && !notaPost && (
            <p className="text-sm text-slate-500">Capture las hojas para poder descargarlas en PDF.</p>
          )}
        </CardBody>
      </Card>

      <ValoracionPreForm
        qxId={qxId}
        editable={puedeCapturar && valoracion?.estado !== "FIRMADA"}
        firmada={valoracion?.estado === "FIRMADA"}
        inicial={{
          habitacion: str(valoracion?.habitacion),
          servicio: str(valoracion?.servicio ?? qx.asignacion.especialidad.nombre),
          folio: str(valoracion?.folio),
          tipoPago: str(valoracion?.tipoPago),
          fechaIngreso: fechaISO(valoracion?.fechaIngreso ?? null),
          horaIngreso: str(valoracion?.horaIngreso),
          diagnosticoPrequirurgico: str(valoracion?.diagnosticoPrequirurgico ?? qx.notaPre?.diagnosticoPreoperatorio),
          cirugiaPlaneada: str(valoracion?.cirugiaPlaneada ?? qx.notaPre?.planQuirurgico),
          cirujano: str(valoracion?.cirujano ?? qx.asignacion.doctor.usuario.nombreCompleto),
          anestesiologo: str(valoracion?.anestesiologo ?? (puedeCapturar ? user.nombreCompleto : "")),
          tipoCirugia: arr(valoracion?.tipoCirugia),
          antecedentesImportancia: str(valoracion?.antecedentesImportancia),
          pesoKg: str(valoracion?.pesoKg),
          tallaCm: str(valoracion?.tallaCm),
          temperatura: str(valoracion?.temperatura),
          ta: str(valoracion?.ta),
          fr: str(valoracion?.fr),
          fc: str(valoracion?.fc),
          spo2: str(valoracion?.spo2),
          exploracion: {
            exCabeza: str(valoracion?.exCabeza),
            exCuello: str(valoracion?.exCuello),
            exRespiratorio: str(valoracion?.exRespiratorio),
            exCardiovascular: str(valoracion?.exCardiovascular),
            exGastrointestinal: str(valoracion?.exGastrointestinal),
            exGenitourinario: str(valoracion?.exGenitourinario),
          },
          labFecha: fechaISO(valoracion?.labFecha ?? null),
          grupoSanguineo: str(valoracion?.grupoSanguineo),
          factorRh: str(valoracion?.factorRh),
          laboratorio: {
            hemoglobina: str(valoracion?.hemoglobina),
            hematocrito: str(valoracion?.hematocrito),
            plaquetas: str(valoracion?.plaquetas),
            leucocitos: str(valoracion?.leucocitos),
            tp: str(valoracion?.tp),
            tpt: str(valoracion?.tpt),
            tt: str(valoracion?.tt),
            glucosa: str(valoracion?.glucosa),
            creatinina: str(valoracion?.creatinina),
            urea: str(valoracion?.urea),
            sodio: str(valoracion?.sodio),
            potasio: str(valoracion?.potasio),
            cloro: str(valoracion?.cloro),
            calcio: str(valoracion?.calcio),
          },
          labOtros: str(valoracion?.labOtros),
          ecg: str(valoracion?.ecg),
          rayosX: str(valoracion?.rayosX),
          ultrasonido: str(valoracion?.ultrasonido),
          gabineteOtros: str(valoracion?.gabineteOtros),
          factoresRiesgo: sub(valoracion?.factoresRiesgo, "marcadas"),
          factoresRiesgoEspecificar: str(obj(valoracion?.factoresRiesgo).especificar),
          asa: str(valoracion?.asa),
          anginaCanadiense: str(valoracion?.anginaCanadiense),
          goldman: arr(valoracion?.goldman),
          predMenores: sub(valoracion?.predictores, "menores"),
          predIntermedios: sub(valoracion?.predictores, "intermedios"),
          predMayores: sub(valoracion?.predictores, "mayores"),
          trombMenores: sub(valoracion?.trombolitico, "menores"),
          trombIntermedios: sub(valoracion?.trombolitico, "intermedios"),
          trombMayores: sub(valoracion?.trombolitico, "mayores"),
          pupilas: sub(valoracion?.neurologico, "pupilas"),
          glasgowOjos: str(obj(valoracion?.neurologico).ojos),
          glasgowMotor: str(obj(valoracion?.neurologico).motor),
          glasgowVerbal: str(obj(valoracion?.neurologico).verbal),
          ventilacionDificil: sub(valoracion?.viaAerea, "ventilacionDificil"),
          mallampati: str(obj(valoracion?.viaAerea).mallampati),
          apertura: str(obj(valoracion?.viaAerea).apertura),
          tiromentoniana: str(obj(valoracion?.viaAerea).tiromentoniana),
          subluxacion: str(obj(valoracion?.viaAerea).subluxacion),
          extension: str(obj(valoracion?.viaAerea).extension),
          planAnestesico: arr(valoracion?.planAnestesico),
        }}
      />

      <RegistroAnestesicoForm
        qxId={qxId}
        editable={puedeCapturar && registro?.estado !== "FIRMADA"}
        firmada={registro?.estado === "FIRMADA"}
        inicial={{
          evalFecha: fechaISO(registro?.evalFecha ?? null),
          evalHora: str(registro?.evalHora),
          consentimientoAnestesia: registro?.consentimientoAnestesia ?? null,
          identificacionCorroborada: registro?.identificacionCorroborada ?? null,
          verificacionEquipo: arr(registro?.verificacionEquipo),
          signosBasales: obj(registro?.signosBasales),
          medicacion: (Array.isArray(registro?.medicacionPreanestesica) ? registro.medicacionPreanestesica : []).map(
            (m) => {
              const x = obj(m);
              return {
                mp_medicamento: x.medicamento ?? "",
                mp_dosis: x.dosis ?? "",
                mp_via: x.via ?? "",
                mp_fecha: x.fecha ?? "",
                mp_hora: x.hora ?? "",
                mp_efecto: x.efecto ?? "",
              };
            },
          ),
          evalObservaciones: str(registro?.evalObservaciones),
          horasAyuno: str(registro?.horasAyuno),
          premedicacion: registro?.premedicacion ?? null,
          premedicacionDetalle: str(registro?.premedicacionDetalle),
          accesoVenoso: registro?.accesoVenoso ?? null,
          accesoSitio: str(registro?.accesoSitio),
          calibreCateter: str(registro?.calibreCateter),
          posicionPaciente: str(registro?.posicionPaciente),
          posicionBrazos: str(registro?.posicionBrazos),
          proteccionOjos: registro?.proteccionOjos ?? null,
          proteccionProminencias: registro?.proteccionProminencias ?? null,
          torniquete: registro?.torniquete ?? null,
          torniqueteSitio: str(registro?.torniqueteSitio),
          torniqueteInicia: str(registro?.torniqueteInicia),
          torniqueteTermina: str(registro?.torniqueteTermina),
          tecnicaAnestesica: str(registro?.tecnicaAnestesica),
          local: obj(registro?.anestesiaLocal),
          regional: obj(registro?.anestesiaRegional),
          general: obj(registro?.anestesiaGeneral),
          obstetrico: obj(registro?.casoObstetrico),
          agentes: str(registro?.agentes),
          tiempos: obj(registro?.tiempos),
          tipoVentilacion: str(registro?.tipoVentilacion),
          egresos: obj(registro?.egresos),
          ingresos: obj(registro?.ingresos),
          balanceHidrico: str(registro?.balanceHidrico),
          aldreteFinal: str(registro?.aldreteFinal),
          pasaA: str(registro?.pasaA),
          lecturas: (registro?.lecturas ?? []).map((l) => ({
            lec_minuto: String(l.minuto),
            lec_hora: str(l.hora),
            lec_taSistolica: str(l.taSistolica),
            lec_taDiastolica: str(l.taDiastolica),
            lec_fc: str(l.fc),
            lec_fr: str(l.fr),
            lec_temperatura: str(l.temperatura),
            lec_spo2: str(l.spo2),
            lec_etco2: str(l.etco2),
            lec_pvcPam: str(l.pvcPam),
            lec_bis: str(l.bis),
            lec_otros: str(l.otros),
          })),
          farmacos: (registro?.farmacos ?? []).map((x) => ({
            fa_nombre: x.nombre,
            fa_dosis: str(x.dosis),
            fa_via: str(x.via),
          })),
        }}
      />

      <NotaPostanestesicaForm
        qxId={qxId}
        editable={puedeCapturar && notaPost?.estado !== "FIRMADA"}
        firmada={notaPost?.estado === "FIRMADA"}
        inicial={{
          aldrete: Object.fromEntries(
            Object.entries(
              (notaPost?.aldrete && typeof notaPost.aldrete === "object" && !Array.isArray(notaPost.aldrete)
                ? notaPost.aldrete
                : {}) as Record<string, unknown>,
            ).map(([min, col]) => [min, obj(col)]),
          ),
          ramsay: str(notaPost?.ramsay),
          bromage: str(notaPost?.bromage),
          nota: str(notaPost?.nota),
          planOxigeno: str(notaPost?.planOxigeno),
          planSolucionesIV: str(notaPost?.planSolucionesIV),
          planMedicamentos: str(notaPost?.planMedicamentos),
          planComponentesSanguineos: str(notaPost?.planComponentesSanguineos),
          planManejoDolor: str(notaPost?.planManejoDolor),
          motivoEgreso: str(notaPost?.motivoEgreso),
          pasaA: str(notaPost?.pasaA),
        }}
      />
    </div>
  );
}
