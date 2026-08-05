// Escalas y listas de verificación de los formatos de anestesiología del
// establecimiento (hojas 15-20). Se declaran aquí para que el PDF y el
// formulario de captura usen exactamente los mismos textos y puntajes.

export type Opcion = { clave: string; texto: string };
export type OpcionPuntos = { clave: string; texto: string; puntos: number };

// ── Hoja 15: valoración preanestésica ──────────────────────────────────────

export const TIPO_CIRUGIA = ["Mayor", "Menor", "Ambulatoria", "Urgencia", "Electiva", "Re-intervención"];

export const TIPO_PAGO = ["SEGURO", "PARTICULAR"];

export const EXPLORACION_SEGMENTOS = [
  { campo: "exCabeza", etiqueta: "Cabeza" },
  { campo: "exCuello", etiqueta: "Cuello" },
  { campo: "exRespiratorio", etiqueta: "Respiratorio" },
  { campo: "exCardiovascular", etiqueta: "Cardiovascular" },
  { campo: "exGastrointestinal", etiqueta: "Gastrointestinal" },
  { campo: "exGenitourinario", etiqueta: "Genitourinario" },
] as const;

export const LABORATORIO_CAMPOS = [
  { campo: "hemoglobina", etiqueta: "Hemoglobina" },
  { campo: "hematocrito", etiqueta: "Hematocrito" },
  { campo: "plaquetas", etiqueta: "Plaquetas" },
  { campo: "leucocitos", etiqueta: "Leucocitos" },
  { campo: "tp", etiqueta: "Tiempo de Protrombina" },
  { campo: "tpt", etiqueta: "Tiempo Parcial de Tromboplastina" },
  { campo: "tt", etiqueta: "Tiempo de Trombina" },
  { campo: "glucosa", etiqueta: "Glucosa" },
  { campo: "creatinina", etiqueta: "Creatinina" },
  { campo: "urea", etiqueta: "Urea" },
  { campo: "sodio", etiqueta: "Sodio" },
  { campo: "potasio", etiqueta: "Potasio" },
  { campo: "cloro", etiqueta: "Cloro" },
  { campo: "calcio", etiqueta: "Calcio" },
] as const;

// ── Hoja 16: valoración de factores de riesgo ──────────────────────────────

export const FACTORES_RIESGO = [
  "Tabaquismo",
  "Alcoholismo",
  "Otras drogas",
  "Transfusiones sanguíneas",
  "Hepatitis",
  "Tatuajes",
  "Alergias",
  "Anestesias previas",
  "Complicaciones",
];

export const ASA: Opcion[] = [
  { clave: "I", texto: "Paciente sano que requiere cirugía sin antecedente o patología agregada." },
  { clave: "II", texto: "Paciente que cursa con alguna enfermedad sistémica, pero compensada." },
  { clave: "III", texto: "Paciente que cursa con alguna enfermedad sistémica descompensada." },
  { clave: "IV", texto: "Paciente que cursa con alguna enfermedad incapacitante." },
  {
    clave: "V",
    texto:
      "Paciente que, se le opere o no, tiene el riesgo inminente de fallecer dentro de las 24 horas posteriores a la valoración.",
  },
  { clave: "VI", texto: "Paciente con muerte cerebral cuyos órganos se extirpan para trasplante." },
];

export const ANGINA_CANADIENSE: Opcion[] = [
  {
    clave: "Grado I",
    texto:
      "Ausencia de angina con la actividad física ordinaria. La angina sólo se produce con esfuerzos intensos, prolongados o competitivos.",
  },
  {
    clave: "Grado II",
    texto:
      "Limitación ligera de la actividad ordinaria. Angina si camina rápido, cuesta arriba o bajo estrés emocional, caminando en ambiente frío o después de una comida.",
  },
  {
    clave: "Grado III",
    texto:
      "Limitación importante de la actividad ordinaria. Angina al andar a paso normal una o dos cuadras, 100 ó 200 mts. o al subir un tramo de escaleras.",
  },
  {
    clave: "Grado IV",
    texto:
      "Incapacidad para efectuar cualquier actividad física que produzca angina; posibilidad de presentarse angina en reposo.",
  },
];

export const GOLDMAN: OpcionPuntos[] = [
  { clave: "edad70", texto: "Edad > 70 años", puntos: 5 },
  { clave: "infarto6m", texto: "Cardioinfarto < 6 meses", puntos: 10 },
  { clave: "ecgNoSinusal", texto: "ECG: ritmo no sinusal o extrasístoles ventriculares", puntos: 7 },
  { clave: "extrasistoles", texto: "Extrasístoles ventriculares (> 5 p.m.)", puntos: 7 },
  { clave: "ingurgitacion", texto: "Ingurgitación venosa yugular o ritmo galopante", puntos: 11 },
  { clave: "estenosisAortica", texto: "Estenosis aórtica", puntos: 3 },
  { clave: "urgencia", texto: "Cirugía de urgencia", puntos: 4 },
  { clave: "toraxAbdomenAorta", texto: "Cirugía de tórax, abdominal o aórtica", puntos: 3 },
  { clave: "malEstado", texto: "Mal estado orgánico general", puntos: 3 },
];

export const GOLDMAN_CLASES = [
  { clase: "CLASE I", rango: "0-5 puntos", max: 5 },
  { clase: "CLASE II", rango: "6-12 puntos", max: 12 },
  { clase: "CLASE III", rango: "13-25 puntos", max: 25 },
  { clase: "CLASE IV", rango: "> 25 puntos", max: Infinity },
];

export function clasificarGoldman(puntos: number): string {
  return GOLDMAN_CLASES.find((c) => puntos <= c.max)?.clase ?? "CLASE IV";
}

export const PREDICTORES_EAC = {
  menores: [
    "Historia familiar con EAC",
    "Edad avanzada",
    "Hábito tabáquico",
    "Hipertensión arterial descontrolada",
    "Síndrome metabólico (hipercolesterolemia, diabetes tipo II, obesidad troncular)",
    "Estado polivascular (ej. EVC)",
    "Eventos coronarios (> 3 meses)",
    "ECO anormal (hipertrofia de ventrículo izquierdo, ritmo no sinusal, bloqueo de rama izquierda, anormalidades del ST-T)",
    "Historia de EVC > 3 meses",
    "Capacidad funcional baja (incapacidad para subir 1 piso de escaleras)",
  ],
  intermedios: [
    "Angina de pecho leve (clasificación canadiense grados I-II)",
    "Paciente asintomático con tratamiento médico óptimo",
    "Isquemia silenciosa: evento coronario > 6 semanas y < 3 meses, o > 3 meses",
    "Episodios previos de isquemia documentados",
    "Falla cardiaca compensada (EF < 0.35)",
    "Valvulopatía compensada",
    "Infarto previo > 6 semanas y > 3 meses",
    "Insuficiencia renal (creatinina > 200 mosm/L)",
    "Diabetes mellitus (principalmente insulina-dependiente, glucosa > 11 mmol/L)",
  ],
  mayores: [
    "Síndromes coronarios inestables",
    "IM agudo o reciente, con riesgo isquémico importante por síntomas clínicos",
    "Angina inestable (clasificación canadiense grados III o IV)",
    "Evento coronario < 6 semanas",
    "Angina residual después del IM o revascularización",
    "Falla cardiaca congestiva",
    "Arritmias malignas",
    "Bloqueo aurículo-ventricular de alto grado",
    "Arritmias ventriculares + enfermedad cardiaca",
    "Arritmias supraventriculares con frecuencia ventricular rápida",
    "Enfermedad valvular severa",
  ],
};

export const TROMBOLITICO = {
  menores: [
    { clave: "sexoF", texto: "Sexo femenino", puntos: 1 },
    { clave: "edad50", texto: "Igual o mayor a 50 años", puntos: 1 },
    { clave: "sobrepeso20", texto: "Sobrepeso mayor del 20%", puntos: 1 },
    { clave: "cardiopatia", texto: "Cardiopatía", puntos: 1 },
    { clave: "neuropatia", texto: "Neuropatía", puntos: 1 },
    { clave: "diabetes", texto: "Diabetes mellitus", puntos: 1 },
    { clave: "hormonal", texto: "Tratamiento hormonal con estrógenos / progesterona", puntos: 1 },
    { clave: "reposo", texto: "Reposo prolongado", puntos: 1 },
    { clave: "cxMenor3h", texto: "Cirugía con duración menor a 3 hrs.", puntos: 1 },
  ] as OpcionPuntos[],
  intermedios: [
    { clave: "crecimientoCardiaco", texto: "Crecimiento cardiaco y/o fibrilación auricular", puntos: 5 },
    { clave: "arteritis", texto: "Arteritis", puntos: 5 },
    { clave: "flebitis", texto: "Flebitis", puntos: 5 },
    { clave: "varices", texto: "Várices en miembros pélvicos", puntos: 5 },
    { clave: "neoplasias", texto: "Neoplasias malignas", puntos: 5 },
    { clave: "tep", texto: "Antecedentes de tromboembolia pulmonar", puntos: 5 },
    { clave: "cxMayor3h", texto: "Cirugía con duración > a 3 horas", puntos: 5 },
  ] as OpcionPuntos[],
  mayores: [
    { clave: "cadera", texto: "Cirugía de cadera", puntos: 15 },
    { clave: "femur", texto: "Cirugía de fémur", puntos: 15 },
    { clave: "prostata", texto: "Cirugía de próstata", puntos: 15 },
    { clave: "columna", texto: "Cirugía de columna", puntos: 15 },
  ] as OpcionPuntos[],
};

export function clasificarTrombolitico(total: number): string {
  if (total <= 5) return "Riesgo mínimo (menor a 5 puntos)";
  if (total <= 14) return "Riesgo moderado (6 a 14 puntos)";
  return "Riesgo elevado (mayor a 15 puntos)";
}

export const GLASGOW = {
  ojos: [
    { clave: "4", texto: "Espontánea", puntos: 4 },
    { clave: "3", texto: "Orden verbal", puntos: 3 },
    { clave: "2", texto: "Dolor", puntos: 2 },
    { clave: "1", texto: "Sin respuesta", puntos: 1 },
  ] as OpcionPuntos[],
  motor: [
    { clave: "6", texto: "Orden verbal", puntos: 6 },
    { clave: "5", texto: "Localiza el dolor", puntos: 5 },
    { clave: "4", texto: "Flexión normal", puntos: 4 },
    { clave: "3", texto: "Flexión que retira", puntos: 3 },
    { clave: "2", texto: "Extensión", puntos: 2 },
    { clave: "1", texto: "Sin respuesta", puntos: 1 },
  ] as OpcionPuntos[],
  verbal: [
    { clave: "5", texto: "Orientado", puntos: 5 },
    { clave: "4", texto: "Confuso", puntos: 4 },
    { clave: "3", texto: "Incoherente", puntos: 3 },
    { clave: "2", texto: "Sonidos incomprensibles", puntos: 2 },
    { clave: "1", texto: "Sin respuesta", puntos: 1 },
  ] as OpcionPuntos[],
};

export const PUPILAS = ["Reactiva D", "Reactiva I", "No reactiva D", "No reactiva I", "Normal", "Anormal"];

export const VENTILACION_DIFICIL = [
  "Obesidad IMC > 26 kg/m²",
  "Barba",
  "Adoncia",
  "Historia de ronquidos",
];

export const MALLAMPATI = ["Clase I", "Clase II", "Clase III", "Clase IV"];

export const APERTURA_BUCAL = ["Grado 1: ≥ 5 cm", "Grado 2: 3.5 - 5 cm", "Grado 3: < 3.5 cm"];

export const DISTANCIA_TIROMENTONIANA = ["> 6.5 cm — fácil", "6 cm — probable", "< 6.5 cm — difícil"];

export const SUBLUXACION_MANDIBULAR = [
  "> 0 — los incisivos inferiores se colocan por delante de los superiores",
  "= 0 — los incisivos inferiores quedan a la altura de los superiores",
  "< 0 — los incisivos inferiores quedan por detrás de los superiores",
];

export const EXTENSION_CABEZA = ["> 100°", "± 90°", "< 80°"];

// ── Hoja 17: plan anestésico, evaluación inmediata y registro ───────────────

export const PLAN_ANESTESICO = [
  "Local",
  "BPD",
  "BSA",
  "B. Mixto",
  "Troncular",
  "A.G.I.",
  "A.G.I.V.",
  "A.G.B.",
  "Sedación",
];

export const VERIFICACION_EQUIPO = [
  "Aparato de anestesia",
  "Circuito",
  "Fugas",
  "Cal sodada",
  "Ventilador",
  "Parámetros ventilatorios",
  "Flujómetros",
  "Vaporizadores",
  "Fuente de O2 y alarmas",
  "Fuente de energía y alarmas",
  "ECG",
  "PANI",
  "SpO2",
  "CO2FE",
];

export const VERIFICACION_OPCIONALES = [
  "Analizadores de gases resp.",
  "Índice biespectral",
  "Bomba de infusión",
  "Monitor de relajación",
];

export const POSICION_PACIENTE = [
  "Supinación",
  "Pronación",
  "Lateral",
  "Litotomía",
  "Fowler",
  "Trendelemburg",
  "Sentado",
  "Navaja sevillana",
  "Ginecológica",
  "Otra",
];

export const POSICION_BRAZOS = ["Abducción", "Aducción"];

export const TECNICA_ANESTESICA = ["Local", "Regional", "General", "Sedación"];

export const TIPO_VENTILACION = ["Manual", "Mecánica", "Asistida", "Controlada"];

// ── Hoja 18: registro transanestésico ──────────────────────────────────────

export const TIEMPOS_TRANSANESTESICOS = [
  { clave: "ingreso", numero: 1, etiqueta: "Ingreso" },
  { clave: "inicioAnestesia", numero: 2, etiqueta: "Inicio anestesia" },
  { clave: "inicioCirugia", numero: 3, etiqueta: "Inicio cirugía" },
  { clave: "finalCirugia", numero: 4, etiqueta: "Final cirugía" },
  { clave: "finalAnestesia", numero: 5, etiqueta: "Final anestesia" },
  { clave: "recuperacion", numero: 6, etiqueta: "Recuperación" },
];

export const EGRESOS = [
  { campo: "perdidasInsensibles", etiqueta: "Pérdidas insensibles" },
  { campo: "ayuno", etiqueta: "Ayuno" },
  { campo: "exposicionQuirurgica", etiqueta: "Exposición quirúrgica" },
  { campo: "diuresis", etiqueta: "Diuresis" },
  { campo: "sangrado", etiqueta: "Sangrado" },
  { campo: "otros", etiqueta: "Otros" },
] as const;

export const INGRESOS = [
  { campo: "cristaloides", etiqueta: "Cristaloides" },
  { campo: "coloides", etiqueta: "Coloides" },
  { campo: "sangre", etiqueta: "Sangre" },
  { campo: "plasma", etiqueta: "Plasma" },
  { campo: "otros", etiqueta: "Otros" },
] as const;

export const DESTINO_SALA = ["Recuperación", "Cuidados intensivos", "Urgencias", "Otro"];

// ── Hoja 19: recuperación anestésica ───────────────────────────────────────

/** Minutos en que se evalúa el Aldrete modificado, igual que las columnas del papel. */
export const ALDRETE_TIEMPOS = [0, 5, 10, 20, 30, 40, 50, 60];

export const ALDRETE_CRITERIOS = [
  {
    campo: "actividad",
    etiqueta: "Actividad",
    niveles: [
      { puntos: 2, texto: "Mueve 4 extremidades voluntariamente o ante órdenes" },
      { puntos: 1, texto: "Mueve 2 extremidades voluntariamente o ante órdenes" },
      { puntos: 0, texto: "Incapaz de mover extremidades" },
    ],
  },
  {
    campo: "respiracion",
    etiqueta: "Respiración",
    niveles: [
      { puntos: 2, texto: "Capaz de respirar profundamente y toser libremente" },
      { puntos: 1, texto: "Disnea o limitación a la respiración" },
      { puntos: 0, texto: "Apnea" },
    ],
  },
  {
    campo: "circulacion",
    etiqueta: "Circulación",
    niveles: [
      { puntos: 2, texto: "Presión arterial < 20% del nivel preanestésico" },
      { puntos: 1, texto: "Presión arterial 20-49% del nivel preanestésico" },
      { puntos: 0, texto: "Presión arterial > 50% del nivel preanestésico" },
    ],
  },
  {
    campo: "conciencia",
    etiqueta: "Conciencia",
    niveles: [
      { puntos: 2, texto: "Completamente despierto" },
      { puntos: 1, texto: "Responde a la llamada" },
      { puntos: 0, texto: "No responde" },
    ],
  },
  {
    campo: "saturacion",
    etiqueta: "Saturación arterial",
    niveles: [
      { puntos: 2, texto: "Mantiene SaO2 > 92% con aire ambiente" },
      { puntos: 1, texto: "Necesita O2 para mantener SaO2 > 90%" },
      { puntos: 0, texto: "SaO2 < 90% con O2 suplementario" },
    ],
  },
] as const;

export const RAMSAY = [
  { nivel: 1, estado: "Despierto", texto: "Con ansiedad y agitación o inquieto" },
  { nivel: 2, estado: "Despierto", texto: "Cooperador, orientado, tranquilo" },
  { nivel: 3, estado: "Despierto", texto: "Somnoliento, responde a estímulos verbales normales" },
  { nivel: 4, estado: "Dormido", texto: "Respuesta rápida a ruidos fuertes o a la percusión leve en el entrecejo" },
  { nivel: 5, estado: "Dormido", texto: "Respuesta perezosa a ruidos fuertes o a la percusión leve en el entrecejo" },
  { nivel: 6, estado: "Dormido", texto: "Ausencia de respuesta a ruidos fuertes o a la percusión leve en el entrecejo" },
];

export const BROMAGE = [
  { nivel: 0, texto: "No hay parálisis (flexión de las rodillas y pies completas)" },
  { nivel: 1, texto: "Incapacidad de elevar extendida la extremidad (sólo puede flexionar las rodillas)" },
  { nivel: 2, texto: "Incapacidad de flexionar rodillas (capaz de mover los pies solamente)" },
  { nivel: 3, texto: "Incapacidad de flexionar el tobillo (incapaz de mover pies y rodillas)" },
];

export const DESTINO_RECUPERACION = ["Habitación", "Urgencias", "Cuidados intensivos", "Otro"];

export const PLAN_POSTANESTESICO = [
  { campo: "planOxigeno", etiqueta: "Oxígeno suplementario" },
  { campo: "planSolucionesIV", etiqueta: "Soluciones IV" },
  { campo: "planMedicamentos", etiqueta: "Medicamentos" },
  { campo: "planComponentesSanguineos", etiqueta: "Componentes sanguíneos" },
  { campo: "planManejoDolor", etiqueta: "Medidas para el manejo del dolor" },
] as const;

/** Suma de los puntajes marcados en un bloque de casillas con puntos. */
export function sumarPuntos(opciones: OpcionPuntos[], marcadas: string[] | null | undefined): number {
  if (!marcadas?.length) return 0;
  return opciones.filter((o) => marcadas.includes(o.clave)).reduce((s, o) => s + o.puntos, 0);
}
