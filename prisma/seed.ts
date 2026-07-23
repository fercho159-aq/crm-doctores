import { PrismaClient } from "@prisma/client";
import { hash } from "@node-rs/argon2";

const prisma = new PrismaClient();

const ARGON2_OPTS = { memoryCost: 19456, timeCost: 2, parallelism: 1 };

async function main() {
  const especialidades = [
    "Traumatología y Ortopedia",
    "Neurología",
    "Cardiología",
    "Cirugía Estética",
    "Medicina Interna",
    "Ginecología y Obstetricia",
  ];
  for (const nombre of especialidades) {
    await prisma.especialidad.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    });
  }

  const adminPass = process.env.SEED_ADMIN_PASSWORD ?? "CambiarAhora2026!";
  await prisma.usuario.upsert({
    where: { email: "admin@medicaltower.mx" },
    update: {},
    create: {
      rol: "ADMIN",
      email: "admin@medicaltower.mx",
      passwordHash: await hash(adminPass, ARGON2_OPTS),
      nombreCompleto: "Administrador MIT",
      debeCambiarPassword: true,
    },
  });

  await prisma.configuracion.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      razonSocial: "MIT — Medical Tower (Care Tower, S de RL de CV)",
      domicilio: "Blvd. Prados de Aragón N° 8-B, Col. Prados de Aragón, CP 57179, Nezahualcóyotl, Estado de México",
      telefono: "5528380715",
    },
  });

  console.log("Seed completado. Admin: admin@medicaltower.mx");
}

main().finally(() => prisma.$disconnect());
