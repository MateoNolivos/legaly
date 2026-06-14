import { prisma } from "./db";

const normaliza = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

// Asigna automaticamente un abogado a una solicitud:
//   1) Filtra abogados cuya especialidad incluya la materia.
//   2) Entre esos (o todos, si ninguno coincide), elige al de MENOR carga
//      (menos solicitudes activas, es decir no resueltas).
// Devuelve el id del abogado, o null si no hay abogados.
export async function asignarAbogado(materia: string): Promise<string | null> {
  const abogados = await prisma.user.findMany({
    where: { role: "ABOGADO" },
    select: { id: true, especialidad: true },
  });
  if (abogados.length === 0) return null;

  const m = normaliza(materia);
  const matches = abogados.filter(
    (a) => a.especialidad && normaliza(a.especialidad).includes(m)
  );
  const pool = matches.length > 0 ? matches : abogados;
  const poolIds = pool.map((a) => a.id);

  // Carga activa por abogado (solicitudes no resueltas).
  const cargas = await prisma.solicitud.groupBy({
    by: ["abogadoId"],
    where: { abogadoId: { in: poolIds }, estado: { not: "Resuelta" } },
    _count: { _all: true },
  });
  const cargaPorId = new Map<string, number>();
  for (const c of cargas) {
    if (c.abogadoId) cargaPorId.set(c.abogadoId, c._count._all);
  }

  // Elige el de menor carga.
  pool.sort(
    (a, b) => (cargaPorId.get(a.id) ?? 0) - (cargaPorId.get(b.id) ?? 0)
  );
  return pool[0].id;
}
