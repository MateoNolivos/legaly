import { prisma } from "./db";

export async function getSolicitudesDeCliente(clienteId: string) {
  return prisma.solicitud.findMany({
    where: { clienteId },
    include: {
      abogado: { select: { name: true, especialidad: true } },
      _count: { select: { mensajes: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getSolicitudesDeAbogado(abogadoId: string) {
  return prisma.solicitud.findMany({
    where: { abogadoId },
    include: {
      cliente: { select: { name: true } },
      _count: { select: { mensajes: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getSolicitud(id: string) {
  return prisma.solicitud.findUnique({
    where: { id },
    include: {
      cliente: { select: { id: true, name: true, email: true } },
      abogado: {
        select: {
          id: true,
          name: true,
          especialidad: true,
          foto: true,
          bio: true,
          experiencia: true,
          ubicacion: true,
        },
      },
      mensajes: { orderBy: { createdAt: "asc" } },
    },
  });
}

export type SolicitudConChat = NonNullable<
  Awaited<ReturnType<typeof getSolicitud>>
>;

// --- Metricas de tiempo -----------------------------------------------------

// Tiempo (ms) desde que entra la solicitud hasta la primera respuesta del abogado.
export function tiempoPrimeraRespuestaMs(s: {
  createdAt: Date;
  firstResponseAt: Date | null;
}): number | null {
  if (!s.firstResponseAt) return null;
  return s.firstResponseAt.getTime() - s.createdAt.getTime();
}

// Tiempo promedio (ms) que tarda el abogado en responder a un mensaje del cliente.
export function tiempoPromedioRespuestaMs(
  mensajes: { autorRol: string; createdAt: Date }[]
): number | null {
  const deltas: number[] = [];
  let ultimoCliente: number | null = null;
  for (const m of mensajes) {
    if (m.autorRol === "CLIENTE") {
      if (ultimoCliente === null) ultimoCliente = m.createdAt.getTime();
    } else if (m.autorRol === "ABOGADO" && ultimoCliente !== null) {
      deltas.push(m.createdAt.getTime() - ultimoCliente);
      ultimoCliente = null;
    }
  }
  if (deltas.length === 0) return null;
  return deltas.reduce((a, b) => a + b, 0) / deltas.length;
}

export function promedio(valores: (number | null)[]): number | null {
  const v = valores.filter((x): x is number => x !== null);
  if (v.length === 0) return null;
  return v.reduce((a, b) => a + b, 0) / v.length;
}
