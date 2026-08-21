// Usuarios de PRUEBA para que el equipo recorra el sistema con los cuatro roles.
//
//   npm run seed:usuarios
//
// Es idempotente: se puede correr varias veces y siempre deja la misma contraseña,
// útil cuando alguien la olvida durante las pruebas.
//
// La contraseña es común y conocida; se cambia con SEED_PRUEBA_PASSWORD.
// Estas cuentas NO deben quedar activas cuando el sistema entre en operación real:
// se desactivan desde Administración → Usuarios.
import { PrismaClient, type RolClave } from "@prisma/client";
import { hash } from "@node-rs/argon2";

const prisma = new PrismaClient();
const ARGON2 = { memoryCost: 19456, timeCost: 2, parallelism: 1 };

const PASSWORD = process.env.SEED_PRUEBA_PASSWORD ?? "PruebaMIT2026!";
// Por omisión las cuentas de prueba entran directo, sin el cambio de contraseña
// del primer acceso, para no estorbar en las pruebas. Con
// SEED_PRUEBA_FORZAR_CAMBIO=1 se comporta como una alta real.
const FORZAR_CAMBIO = process.env.SEED_PRUEBA_FORZAR_CAMBIO === "1";

type Ficha = {
  cedulaProfesional: string;
  cedulaEspecialidad?: string;
  institucionTitulo: string;
  universidadEspecialidad?: string;
  consultorio?: string;
  telefono?: string;
  /** Nombres de especialidades del catálogo; solo aplica al rol DOCTOR. */
  especialidades?: string[];
};

type UsuarioPrueba = {
  rol: RolClave;
  email: string;
  nombreCompleto: string;
  /** Para qué sirve esta cuenta en las pruebas. */
  para: string;
  ficha?: Ficha;
};

const USUARIOS: UsuarioPrueba[] = [
  {
    rol: "ADMIN",
    email: "admin.pruebas@medicaltower.mx",
    nombreCompleto: "Administración de pruebas",
    para: "Catálogos, insumos y precios, bitácora, configuración y cierre de cuentas.",
  },

  // ── Enfermería: dos turnos, para probar que cada quien ve sus borradores ──
  {
    rol: "ENFERMERIA",
    email: "enf.matutino.pruebas@medicaltower.mx",
    nombreCompleto: "Enf. Rosa Delgado Núñez (pruebas)",
    para: "Registro de pacientes, hoja de primer llenado y hojas de consumo.",
  },
  {
    rol: "ENFERMERIA",
    email: "enf.vespertino.pruebas@medicaltower.mx",
    nombreCompleto: "Enf. Miguel Ángel Tapia Cruz (pruebas)",
    para: "Segundo turno: comprobar que no ve los borradores del turno matutino.",
  },

  // ── Doctores: tres especialidades distintas y una con dos, para probar
  //    la asignación y el expediente con varios episodios de atención ──
  {
    rol: "DOCTOR",
    email: "dr.estetica.pruebas@medicaltower.mx",
    nombreCompleto: "Dr. Emilio Cortés Lara (pruebas)",
    para: "Flujo quirúrgico completo: consentimientos, notas pre y post, citas.",
    ficha: {
      cedulaProfesional: "10000001",
      cedulaEspecialidad: "20000001",
      institucionTitulo: "UNAM",
      universidadEspecialidad: "UNAM",
      consultorio: "Torre MIT, consultorio 302",
      telefono: "5528380715",
      especialidades: ["Cirugía Estética"],
    },
  },
  {
    rol: "DOCTOR",
    email: "dra.ortopedia.pruebas@medicaltower.mx",
    nombreCompleto: "Dra. Mariana Solís Vega (pruebas)",
    para: "Consulta, notas de evolución, recetas y órdenes médicas.",
    ficha: {
      cedulaProfesional: "10000002",
      cedulaEspecialidad: "20000002",
      institucionTitulo: "IPN",
      universidadEspecialidad: "UNAM",
      consultorio: "Torre MIT, consultorio 205",
      telefono: "5528380715",
      especialidades: ["Traumatología y Ortopedia"],
    },
  },
  {
    rol: "DOCTOR",
    email: "dra.gineco.pruebas@medicaltower.mx",
    nombreCompleto: "Dra. Paulina Ávila Rojas (pruebas)",
    para: "Doctora con dos especialidades: prueba el expediente con varios episodios.",
    ficha: {
      cedulaProfesional: "10000003",
      cedulaEspecialidad: "20000003",
      institucionTitulo: "UAM",
      universidadEspecialidad: "UNAM",
      consultorio: "Torre MIT, consultorio 410",
      telefono: "5528380715",
      especialidades: ["Ginecología y Obstetricia", "Medicina Interna"],
    },
  },

  // ── Anestesiología: llevan ficha de Doctor porque su cédula se imprime
  //    en la valoración preanestésica, el registro y la nota post-anestésica ──
  {
    rol: "ANESTESIOLOGO",
    email: "anest.uno.pruebas@medicaltower.mx",
    nombreCompleto: "Dr. Sergio Fuentes Palma (pruebas)",
    para: "Las tres hojas de anestesiología de una cirugía.",
    ficha: {
      cedulaProfesional: "30000001",
      cedulaEspecialidad: "40000001",
      institucionTitulo: "UNAM",
      consultorio: "Anestesiología",
      telefono: "5528380715",
    },
  },
  {
    rol: "ANESTESIOLOGO",
    email: "anest.dos.pruebas@medicaltower.mx",
    nombreCompleto: "Dra. Claudia Bernal Ochoa (pruebas)",
    para: "Segundo anestesiólogo, para repartirse las cirugías programadas.",
    ficha: {
      cedulaProfesional: "30000002",
      cedulaEspecialidad: "40000002",
      institucionTitulo: "IPN",
      consultorio: "Anestesiología",
      telefono: "5528380715",
    },
  },
];

async function main() {
  const workspace =
    (await prisma.workspace.findFirst({ where: { tipo: "CLINIC" } })) ??
    (await prisma.workspace.create({ data: { tipo: "CLINIC", nombre: "MIT — Medical Tower" } }));

  const passwordHash = await hash(PASSWORD, ARGON2);

  const especialidades = await prisma.especialidad.findMany({ select: { id: true, nombre: true } });
  const idPorNombre = new Map(especialidades.map((e) => [e.nombre, e.id]));
  if (especialidades.length === 0) {
    throw new Error("No hay especialidades en el catálogo. Corra primero: npm run seed");
  }

  for (const u of USUARIOS) {
    const email = u.email.toLowerCase();
    const usuario = await prisma.usuario.upsert({
      where: { email },
      // Al reejecutar se restablece la contraseña y se desbloquea la cuenta:
      // es lo que se necesita cuando alguien la olvida a media prueba.
      update: {
        rol: u.rol,
        nombreCompleto: u.nombreCompleto,
        passwordHash,
        debeCambiarPassword: FORZAR_CAMBIO,
        activo: true,
        intentosFallidos: 0,
        bloqueadoHasta: null,
      },
      create: {
        workspaceId: workspace.id,
        rol: u.rol,
        email,
        passwordHash,
        nombreCompleto: u.nombreCompleto,
        debeCambiarPassword: FORZAR_CAMBIO,
      },
    });

    if (!u.ficha) {
      console.log(`  ${u.rol.padEnd(14)} ${email}`);
      continue;
    }

    const f = u.ficha;
    const doctor = await prisma.doctor.upsert({
      where: { usuarioId: usuario.id },
      update: {
        cedulaProfesional: f.cedulaProfesional,
        cedulaEspecialidad: f.cedulaEspecialidad ?? null,
        institucionTitulo: f.institucionTitulo,
        universidadEspecialidad: f.universidadEspecialidad ?? null,
        consultorio: f.consultorio ?? null,
        telefono: f.telefono ?? null,
      },
      create: {
        usuarioId: usuario.id,
        cedulaProfesional: f.cedulaProfesional,
        cedulaEspecialidad: f.cedulaEspecialidad ?? null,
        institucionTitulo: f.institucionTitulo,
        universidadEspecialidad: f.universidadEspecialidad ?? null,
        consultorio: f.consultorio ?? null,
        telefono: f.telefono ?? null,
      },
    });

    const faltantes: string[] = [];
    for (const nombre of f.especialidades ?? []) {
      const especialidadId = idPorNombre.get(nombre);
      if (!especialidadId) {
        faltantes.push(nombre);
        continue;
      }
      await prisma.doctorEspecialidad.upsert({
        where: { doctorId_especialidadId: { doctorId: doctor.id, especialidadId } },
        update: {},
        create: { doctorId: doctor.id, especialidadId },
      });
    }
    if (faltantes.length) {
      console.log(`  ⚠  ${email}: especialidad no encontrada en el catálogo: ${faltantes.join(", ")}`);
    }

    console.log(`  ${u.rol.padEnd(14)} ${email}   céd. ${f.cedulaProfesional}`);
  }

  const sinFirma = await prisma.doctor.count({ where: { firmaDigitalizada: null } });

  console.log(`\n${USUARIOS.length} usuarios de prueba listos.`);
  console.log(`Contraseña para todos: ${PASSWORD}`);
  console.log(
    FORZAR_CAMBIO
      ? "Se pedirá cambiar la contraseña en el primer acceso."
      : "Entran directo (sin cambio de contraseña obligatorio).",
  );
  if (sinFirma > 0) {
    console.log(
      `\n${sinFirma} médico(s) sin rúbrica digitalizada. Cárguela en Administración → Doctores;` +
        " sin ella los PDF salen con la línea de firma en blanco.",
    );
  }
  console.log(
    "\nCuentas de prueba con contraseña compartida: desactívelas en" +
      " Administración → Usuarios antes de operar con pacientes reales.",
  );
}

main()
  .catch((e) => {
    console.error("Error al sembrar usuarios de prueba:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
