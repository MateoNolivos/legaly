import Link from "next/link";
import Header from "@/components/Header";
import AdminNav from "@/components/AdminNav";
import { requireAdmin } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { tiempoPrimeraRespuestaMs, tiempoPromedioRespuestaMs, promedio } from "@/lib/solicitudes";
import { formatDuracion } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminAbogadosPage() {
  const session = requireAdmin();

  const [abogados, solicitudes, subs] = await Promise.all([
    prisma.user.findMany({ where: { role: "ABOGADO", aprobado: true }, orderBy: { name: "asc" } }),
    prisma.solicitud.findMany({
      select: {
        abogadoId: true, clienteId: true, estado: true, firstResponseAt: true, createdAt: true,
        mensajes: { select: { autorRol: true, createdAt: true }, orderBy: { createdAt: "asc" } },
      },
    }),
    prisma.suscripcion.findMany({ where: { estado: "Activa" }, select: { usuarioId: true, precio: true } }),
  ]);

  const subPorUsuario = new Map<string, number>();
  subs.forEach((s) => subPorUsuario.set(s.usuarioId, s.precio));

  const filas = abogados.map((ab) => {
    const suyas = solicitudes.filter((s) => s.abogadoId === ab.id);
    const clientes = new Set(suyas.map((s) => s.clienteId));
    let ingresos = 0;
    clientes.forEach((cid) => (ingresos += subPorUsuario.get(cid) || 0));
    return {
      id: ab.id,
      name: ab.name,
      especialidad: ab.especialidad,
      activas: suyas.filter((s) => s.estado !== "Resuelta").length,
      resueltas: suyas.filter((s) => s.estado === "Resuelta").length,
      promPrimera: promedio(suyas.map((s) => tiempoPrimeraRespuestaMs(s))),
      promChat: promedio(suyas.map((s) => tiempoPromedioRespuestaMs(s.mensajes))),
      ingresos,
    };
  });

  return (
    <div className="min-h-screen">
      <Header nombre={session.name} subtitulo="Supervisor" />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <AdminNav actual="abogados" />
        <h1 className="text-2xl font-display font-extrabold text-slate-800 mb-4">Abogados</h1>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                <th className="px-4 py-3 font-medium">Abogado</th>
                <th className="px-4 py-3 font-medium">Activas</th>
                <th className="px-4 py-3 font-medium">Resueltas</th>
                <th className="px-4 py-3 font-medium">Prom. 1ª resp.</th>
                <th className="px-4 py-3 font-medium">Prom. chat</th>
                <th className="px-4 py-3 font-medium">Ingresos</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/abogados/${f.id}`} className="block">
                      <p className="font-medium text-slate-800">{f.name}</p>
                      <p className="text-xs text-slate-400">{f.especialidad}</p>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{f.activas}</td>
                  <td className="px-4 py-3 text-slate-700">{f.resueltas}</td>
                  <td className="px-4 py-3 text-slate-700">{formatDuracion(f.promPrimera)}</td>
                  <td className="px-4 py-3 text-slate-700">{formatDuracion(f.promChat)}</td>
                  <td className="px-4 py-3 font-medium text-brand-dark">${f.ingresos}</td>
                </tr>
              ))}
              {filas.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">Aún no hay abogados aprobados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Ingresos = suma de las suscripciones activas de los clientes que atiende cada abogado.
        </p>
      </main>
    </div>
  );
}
