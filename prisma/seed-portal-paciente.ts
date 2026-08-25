// Crea (o verifica) la cuenta de portal para el paciente demo BASIC.
// Idempotente, sin dependencias pesadas. Requiere que seed-demo-basic haya
// creado al paciente Roberto Iglesias previamente.
//   npx tsx prisma/seed-portal-paciente.ts
import { PrismaClient } from "@prisma/client";
import { hash } from "@node-rs/argon2";

const prisma = new PrismaClient();
const ARGON2 = { memoryCost: 19456, timeCost: 2, parallelism: 1 };
const EMAIL = "paciente.demo.basic2@example.com";
const PASSWORD = "PortalDemo2026!";

async function main() {
  const existe = await prisma.usuario.findUnique({ where: { email: EMAIL } });
  if (existe) {
    console.log(`Cuenta portal ya existe: ${EMAIL}`);
    return;
  }

  const paciente = await prisma.paciente.findFirst({
    where: { nombre: "Roberto", apellidoPaterno: "Iglesias" },
  });
  if (!paciente) {
    console.log("Paciente Roberto Iglesias no encontrado — corre seed-demo-basic primero.");
    return;
  }

  await prisma.usuario.create({
    data: {
      workspaceId: paciente.workspaceId,
      rol: "PACIENTE",
      email: EMAIL,
      passwordHash: await hash(PASSWORD, ARGON2),
      nombreCompleto: "Roberto Iglesias Durán",
      debeCambiarPassword: false,
      pacienteId: paciente.id,
    },
  });

  console.log(`Cuenta portal creada: ${EMAIL} / ${PASSWORD}`);
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
