import { prisma } from "./db";

// Trae los casos de un cliente con sus audiencias y movimientos.
export async function getCasosDeCliente(clienteId: string) {
  return prisma.caso.findMany({
    where: { clienteId },
    include: {
      abogado: { select: { name: true, especialidad: true } },
      audiencias: { orderBy: { fecha: "asc" } },
      movimientos: { orderBy: { fecha: "desc" } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export type CasoConDetalle = Awaited<ReturnType<typeof getCasosDeCliente>>[number];

// La proxima audiencia futura de un caso (o null si no hay).
export function proximaAudiencia(caso: CasoConDetalle) {
  const ahora = Date.now();
  return (
    caso.audiencias.find((a) => a.fecha.getTime() >= ahora) ?? null
  );
}

// El movimiento mas reciente (o null).
export function ultimoMovimiento(caso: CasoConDetalle) {
  return caso.movimientos[0] ?? null;
}
