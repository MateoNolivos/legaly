import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Helper: fecha relativa a hoy (dias en el futuro o pasado).
function dias(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

// Helper: fecha relativa con hora fija (para audiencias).
function diasHora(n: number, hora: number, minuto = 0): Date {
  const d = dias(n);
  d.setHours(hora, minuto, 0, 0);
  return d;
}

async function main() {
  console.log("Limpiando datos previos...");
  await prisma.mensaje.deleteMany();
  await prisma.solicitud.deleteMany();
  await prisma.movimiento.deleteMany();
  await prisma.audiencia.deleteMany();
  await prisma.caso.deleteMany();
  await prisma.suscripcion.deleteMany();
  await prisma.user.deleteMany();

  const hash = (pw: string) => bcrypt.hashSync(pw, 10);

  console.log("Creando usuarios...");
  // Contraseña para todos los usuarios de ejemplo: "legaly123"
  const abogada = await prisma.user.create({
    data: {
      email: "abogada@legaly.ec",
      passwordHash: hash("legaly123"),
      name: "Dra. Carla Jiménez",
      phone: "0991111111",
      role: "ABOGADO",
      especialidad: "Civil, Laboral",
      matricula: "17-2019-1234",
      experiencia: 8,
      ubicacion: "Quito",
      bio: "Especialista en derecho laboral y civil. Acompaño a mis clientes con cercanía y respuestas claras.",
      referencias: "Cámara de Comercio de Quito; Estudio Jurídico Andino.",
    },
  });

  const abogadoPenal = await prisma.user.create({
    data: {
      email: "diego@legaly.ec",
      passwordHash: hash("legaly123"),
      name: "Ab. Diego Andrade",
      phone: "0994444444",
      role: "ABOGADO",
      especialidad: "Penal, Tránsito",
      matricula: "17-2017-0456",
      experiencia: 12,
      ubicacion: "Quito",
      bio: "Penalista con amplia experiencia en casos de tránsito. Defensa firme y comunicación constante.",
      referencias: "Colegio de Abogados de Pichincha.",
    },
  });

  const abogadaFamilia = await prisma.user.create({
    data: {
      email: "sofia@legaly.ec",
      passwordHash: hash("legaly123"),
      name: "Dra. Sofía Vega",
      phone: "0995555555",
      role: "ABOGADO",
      especialidad: "Familia, Civil",
      matricula: "17-2020-0789",
      experiencia: 6,
      ubicacion: "Quito",
      bio: "Derecho de familia con enfoque humano: pensiones, divorcios y tenencia. Te explico cada paso.",
      referencias: "Fundación de Apoyo Familiar.",
    },
  });

  await prisma.user.create({
    data: {
      email: "admin@legaly.ec",
      passwordHash: hash("legaly123"),
      name: "Supervisor LEGALY",
      role: "ADMIN",
    },
  });

  const cliente1 = await prisma.user.create({
    data: {
      email: "cliente@legaly.ec",
      passwordHash: hash("legaly123"),
      name: "Juan Pérez",
      phone: "0992222222",
      role: "CLIENTE",
      cedula: "1712345678",
      ubicacion: "Quito",
      ocupacion: "Comerciante",
    },
  });

  const cliente2 = await prisma.user.create({
    data: {
      email: "maria@legaly.ec",
      passwordHash: hash("legaly123"),
      name: "María López",
      phone: "0993333333",
      role: "CLIENTE",
      cedula: "1798765432",
      ubicacion: "Quito",
      ocupacion: "Docente",
    },
  });

  console.log("Creando suscripciones...");
  await prisma.suscripcion.createMany({
    data: [
      { usuarioId: cliente1.id, plan: "Pro", precio: 25, descuento: 15 },
      { usuarioId: cliente2.id, plan: "Básico", precio: 10, descuento: 0 },
    ],
  });

  console.log("Creando casos...");
  const caso1 = await prisma.caso.create({
    data: {
      numeroExpediente: "17294-2025-00187",
      materia: "Laboral",
      juzgado: "Unidad Judicial de Trabajo de Pichincha",
      estado: "En trámite",
      clienteId: cliente1.id,
      abogadoId: abogada.id,
    },
  });

  const caso2 = await prisma.caso.create({
    data: {
      numeroExpediente: "17230-2025-00942",
      materia: "Civil",
      juzgado: "Unidad Judicial Civil de Pichincha",
      estado: "Prueba",
      clienteId: cliente1.id,
      abogadoId: abogada.id,
    },
  });

  const caso3 = await prisma.caso.create({
    data: {
      numeroExpediente: "17561-2025-00310",
      materia: "Tránsito",
      juzgado: "Unidad Judicial de Tránsito de Pichincha",
      estado: "En trámite",
      clienteId: cliente2.id,
      abogadoId: abogada.id,
    },
  });

  console.log("Creando audiencias...");
  await prisma.audiencia.createMany({
    data: [
      {
        casoId: caso1.id,
        fecha: diasHora(11, 9, 0),
        tipo: "Audiencia única",
        modalidad: "Telemática",
        lugar: "Sala virtual Zoom (enlace por correo)",
      },
      {
        casoId: caso2.id,
        fecha: diasHora(25, 14, 30),
        tipo: "Audiencia de juicio",
        modalidad: "Presencial",
        lugar: "Sala 3, Complejo Judicial Norte, Quito",
      },
      {
        casoId: caso3.id,
        fecha: diasHora(4, 8, 30),
        tipo: "Audiencia de juzgamiento",
        modalidad: "Presencial",
        lugar: "Sala 1, Unidad de Tránsito, Quito",
      },
    ],
  });

  console.log("Creando movimientos...");
  await prisma.movimiento.createMany({
    data: [
      { casoId: caso1.id, fecha: dias(-20), descripcion: "Calificación de la demanda." },
      { casoId: caso1.id, fecha: dias(-8), descripcion: "Citación a la parte demandada." },
      { casoId: caso2.id, fecha: dias(-15), descripcion: "Contestación a la demanda recibida." },
      { casoId: caso2.id, fecha: dias(-3), descripcion: "Anuncio de pruebas de las partes." },
      { casoId: caso3.id, fecha: dias(-30), descripcion: "Inicio del proceso por contravención de tránsito." },
    ],
  });

  console.log("Creando solicitudes y chats...");
  const ahora = Date.now();
  const H = 3600 * 1000;
  const M = 60 * 1000;
  const D = 24 * H;
  const t = (msAtras: number) => new Date(ahora - msAtras);
  const mas = (d: Date, ms: number) => new Date(d.getTime() + ms);

  // Solicitud 1: Laboral (Juan) -> Carla, en progreso, con respuestas.
  const sol1Created = t(2 * D);
  const sol1 = await prisma.solicitud.create({
    data: {
      clienteId: cliente1.id,
      abogadoId: abogada.id,
      materia: "Laboral",
      descripcion:
        "Me despidieron sin pagarme la liquidación después de casi 3 años. Quiero saber qué me corresponde.",
      urgencia: "Alta",
      ciudad: "Quito",
      telefono: "0992222222",
      estado: "En progreso",
      createdAt: sol1Created,
      assignedAt: sol1Created,
      firstResponseAt: mas(sol1Created, 3 * H),
    },
  });
  await prisma.mensaje.createMany({
    data: [
      { solicitudId: sol1.id, autorId: cliente1.id, autorRol: "CLIENTE", texto: "Hola, me despidieron sin pagarme la liquidación. ¿Qué puedo hacer?", createdAt: sol1Created },
      { solicitudId: sol1.id, autorId: abogada.id, autorRol: "ABOGADO", texto: "Hola Juan, lamento lo que pasó. Para ayudarte, ¿cuánto tiempo trabajaste en la empresa?", createdAt: mas(sol1Created, 3 * H) },
      { solicitudId: sol1.id, autorId: cliente1.id, autorRol: "CLIENTE", texto: "Casi 3 años, desde marzo de 2023.", createdAt: mas(sol1Created, 3 * H + 10 * M) },
      { solicitudId: sol1.id, autorId: abogada.id, autorRol: "ABOGADO", texto: "Perfecto. Tienes derecho a tu liquidación e indemnización. Reúne tu contrato y roles de pago y avanzamos.", createdAt: mas(sol1Created, 3 * H + 25 * M) },
    ],
  });

  // Solicitud 2: Familia (María) -> Sofía, recién asignada, SIN responder.
  const sol2Created = t(5 * H);
  const sol2 = await prisma.solicitud.create({
    data: {
      clienteId: cliente2.id,
      abogadoId: abogadaFamilia.id,
      materia: "Familia",
      descripcion: "Necesito ayuda con la pensión alimenticia de mis hijos, su papá dejó de pagar.",
      urgencia: "Media",
      ciudad: "Quito",
      telefono: "0993333333",
      estado: "Asignada",
      createdAt: sol2Created,
      assignedAt: sol2Created,
    },
  });
  await prisma.mensaje.create({
    data: { solicitudId: sol2.id, autorId: cliente2.id, autorRol: "CLIENTE", texto: "Buenas, necesito ayuda con la pensión de mis hijos, el papá dejó de pagar hace 3 meses.", createdAt: sol2Created },
  });

  // Solicitud 3: Tránsito (Juan) -> Diego, resuelta.
  const sol3Created = t(6 * D);
  const sol3 = await prisma.solicitud.create({
    data: {
      clienteId: cliente1.id,
      abogadoId: abogadoPenal.id,
      materia: "Tránsito",
      descripcion: "Tuve un choque leve y me llegó una citación de tránsito.",
      urgencia: "Baja",
      ciudad: "Quito",
      telefono: "0992222222",
      estado: "Resuelta",
      createdAt: sol3Created,
      assignedAt: sol3Created,
      firstResponseAt: mas(sol3Created, 1 * H),
      resueltaAt: t(5 * D),
    },
  });
  await prisma.mensaje.createMany({
    data: [
      { solicitudId: sol3.id, autorId: cliente1.id, autorRol: "CLIENTE", texto: "Tuve un choque leve y me llegó una citación de tránsito.", createdAt: sol3Created },
      { solicitudId: sol3.id, autorId: abogadoPenal.id, autorRol: "ABOGADO", texto: "Hola Juan, revisemos la citación. ¿Puedes enviarme el número?", createdAt: mas(sol3Created, 1 * H) },
      { solicitudId: sol3.id, autorId: cliente1.id, autorRol: "CLIENTE", texto: "Claro, es la 2025-00310.", createdAt: mas(sol3Created, 1 * H + 20 * M) },
      { solicitudId: sol3.id, autorId: abogadoPenal.id, autorRol: "ABOGADO", texto: "Listo, la reviso y te indico los pasos. Es un trámite común, no te preocupes.", createdAt: mas(sol3Created, 1 * H + 35 * M) },
    ],
  });

  console.log("\n✅ Datos de ejemplo creados.");
  console.log("Usuarios (contraseña: legaly123):");
  console.log("  ADMIN/SUPERVISOR:");
  console.log("  - admin@legaly.ec");
  console.log("  ABOGADOS:");
  console.log("  - abogada@legaly.ec  (Civil, Laboral)");
  console.log("  - diego@legaly.ec    (Penal, Tránsito)");
  console.log("  - sofia@legaly.ec    (Familia, Civil)");
  console.log("  CLIENTES:");
  console.log("  - cliente@legaly.ec  (Juan)");
  console.log("  - maria@legaly.ec    (María)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
