// Crea el usuario administrador/supervisor SIN borrar el resto de los datos.
// Úsalo con:  npm run admin
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@legaly.ec";
  const existe = await prisma.user.findUnique({ where: { email } });
  if (existe) {
    console.log("ℹ️  El supervisor ya existe:", email);
    return;
  }
  await prisma.user.create({
    data: {
      email,
      passwordHash: bcrypt.hashSync("legaly123", 10),
      name: "Supervisor LEGALY",
      role: "ADMIN",
    },
  });
  console.log("✅ Supervisor creado:", email, "/ legaly123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
