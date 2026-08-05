// Catálogo base de insumos cobrables, transcrito de la hoja de consumo en
// quirófano del establecimiento. El precio lo captura la administración; aquí
// sólo se define el renglón y su categoría para que la hoja impresa conserve el
// mismo orden que el formato en papel.

import type { CategoriaInsumo } from "@prisma/client";

export type InsumoBase = { nombre: string; categoria: CategoriaInsumo };

/**
 * El formato impreso reparte los materiales en dos recuadros: el grande de la
 * primera página y este bloque corto que va en la segunda, junto a las suturas.
 */
export const MATERIALES_BLOQUE_2 = [
  "VENDA TENSOPLAST",
  "BULTO CIRUGÍA GAL DESECHABLE",
  "BATA QUIRÚRGICA",
  "PAQUETE DE PARTOS DESECHABLES",
  "ALGODÓN Y ALCOHOL",
  "GELFOAM",
  "GORROS",
];

const MATERIALES = [
  "AGUJA CHICA",
  "AGUJA GRANDE",
  "APOSITOS",
  "BENZAL",
  "BOTAS DESECHABLES",
  "BRAZALETE PARA BEBE",
  "CÁNULA EPIDURAL",
  "CEPILLOS QUIRÚRGICOS",
  "CISTOFLO",
  "CUBRE BOCAS",
  "DRENOVAC",
  "ELECTRODOS",
  "EQUIPO DE SANGRE",
  "EQUIPO DE VENOCLISIS",
  "EQUIPO DE VOLÚMENES MEDIDOS",
  "FORMOL",
  "GUANTE 6.5",
  "GUANTE 7",
  "GUANTE 7.5",
  "GUANTE 8",
  "HOJA DE BISTURÍ",
  "HOJA DE RASURAR",
  "HUATA 5",
  "HUATA 10",
  "HUATA 15",
  "ISODINE",
  "JABÓN",
  "JELCO NO.",
  "JELONET",
  "JERINGA DE 1",
  "JERINGA DE 5",
  "JERINGA DE 10",
  "JERINGA DE 20",
  "MICROPORE",
  "OPSITE",
  "PAQUETE DE GASAS",
  "PENROSE",
  "PROTECTOR CLÍNICO",
  "PUNZOCAT No.",
  "SOFFBAN 5",
  "SOFFBAN 10",
  "SOFFBAN DE 15",
  "SONDA DE ALIMENTACIÓN",
  "SONDA FOLEY",
  "VENDAS DE YESO 5",
  "VENDAS DE YESO 10",
  "VENDAS DE YESO 15",
  "VENDAS ELÁSTICAS DE 5",
  "VENDAS ELÁSTICAS DE 10",
  "VENDAS ELÁSTICAS DE 15",
  "VENDAS ELÁSTICAS DE 20",
  "VENDAS ELÁSTICAS DE 30",
  ...MATERIALES_BLOQUE_2,
];

const MEDICAMENTOS = [
  "AGUA INYECTABLE",
  "AMINOFILINA",
  "AMPICILINA",
  "ATROPINA",
  "BENCIPENICILINA DE 1200000",
  "BICARBONATO DE SODIO",
  "BROMURO DE RONCURONIO",
  "BUPIVACAINA TRONCULAR",
  "BUPIVACAINA PESADA",
  "CEFTRIAXONA",
  "CLORANFENICOL GOTAS",
  "CLOROPIRAMINA",
  "CLORURO DE POTASIO",
  "CLORURO DE SUXAMETONIO",
  "DEXAMETAXONA",
  "DIAZEPAN",
  "DICLOFENACO",
  "DURIMICUN",
  "EFEDRINA",
  "ERGOTRATE",
  "FENTANIL",
  "FITOMENADIONA DE 10 MG.",
  "FITOMENADIONA DE 2 MG.",
  "FLUMAZENIL",
  "FLUNITRAZEPAN",
  "FUROSEMIDA",
  "GLUCONATO DE CALCIO",
  "GLUCOSA AL 50 %",
  "HEMACEL",
  "HEMOSIN K",
  "HEPARINA",
  "HIDROCORTIZONA",
  "INSULINA ACCIÓN INTERMEDIA",
  "INSULINA REGULAR DE A.R.",
  "KETAMINA",
  "KETOROLACO",
  "LIDOCAINA AL 5%",
  "LIDOCAINA CON APINEFRINA",
  "LIDOCAINA SIMPLE",
  "METOCLOPRAMIDA",
  "NALBUFINA",
  "NALOXONA",
  "NEOSTIGMINA",
  "OLIGOMENTALES ENDOVENOSOS",
  "OXITOXINA",
  "PROPOFOL",
  "RANULIN",
  "REMACRODEX",
  "SEROALBUMINA HUMANA",
  "SULFATO DE MAGNESIO",
  "TITIELPERCINA",
];

const SUTURAS = [
  "NYLON O DERMALON 2-0",
  "NYLON O DERMALON 3-0",
  "VICRYL 1",
  "SEDA 1",
  "CAT SIMPLE 2/0",
  "CAT GUT 1",
  "CAT GUT 0",
  "CAT GUT 2/0",
  "SUTUPAK 1",
];

const SOLUCIONES = [
  "CLORURO DE SODIO Y GLUCOSA 1000 ml.",
  "CLORURO DE SODIO Y GLUCOSA 500 ml.",
  "SOLUCIÓN HARTMANN 1000 ml.",
  "SOLUCIÓN HARTMANN 500 ml.",
  "GLUCOSA DE 1000 ml.",
  "GLUCOSA DE 500 ml.",
  "CLORURO DE SODIO AL 0.09 % 1000 ml.",
  "CLORURO DE SODIO AL 0.09 % 500 ml.",
  "GLUCOSA AL 5% / 250 ml.",
];

// Conceptos del recuadro «SERVICIOS» que cierra la cuenta del paciente.
const SERVICIOS = [
  "LABORATORIO",
  "RAYOS X",
  "ELECTROCARDIOGRAMA",
  "ULTRASONIDO",
  "TRANSFUSIÓN",
  "MATERIALES Y MEDICAMENTOS",
  "ESTANCIA",
  "HONORARIOS MÉDICOS",
  "DERECHO DE SALA",
  "GUARDIAS",
  "OXÍGENO",
  "MEDICINA ESPECIALIZADA",
];

export const CATALOGO_INSUMOS: InsumoBase[] = [
  ...MATERIALES.map((nombre) => ({ nombre, categoria: "MATERIAL" as CategoriaInsumo })),
  ...MEDICAMENTOS.map((nombre) => ({ nombre, categoria: "MEDICAMENTO" as CategoriaInsumo })),
  ...SUTURAS.map((nombre) => ({ nombre, categoria: "SUTURA" as CategoriaInsumo })),
  ...SOLUCIONES.map((nombre) => ({ nombre, categoria: "SOLUCION" as CategoriaInsumo })),
  ...SERVICIOS.map((nombre) => ({ nombre, categoria: "SERVICIO" as CategoriaInsumo })),
];

export const CATEGORIA_INSUMO_LABEL: Record<CategoriaInsumo, string> = {
  MATERIAL: "Materiales",
  MEDICAMENTO: "Medicamentos",
  SUTURA: "Suturas",
  SOLUCION: "Soluciones",
  OTRO: "Otros",
  SERVICIO: "Servicios",
};
