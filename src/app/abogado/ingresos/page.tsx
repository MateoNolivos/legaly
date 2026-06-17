import Header from "@/components/Header";
import AbogadoNav from "@/components/AbogadoNav";
import { requireRole } from "@/lib/guard";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function IngresosAbogadoPage() {
  const session = requireRole("ABOGADO");

  const suyas = await prisma.solicitud.findMany({
    where: { abogadoId: session.id },
    select: { clienteId: true, estado: true },
  });
  const clienteIds = Array.from(new Set(suyas.map((s) => s.clienteId)));

  const subs = clienteIds.length
    ? await prisma.suscripcion.findMany({
        where: { usuarioId: { in: clienteIds }, estado: "Activa" },
        select: { precio: true, plan: true, descuento: true, usuario: { select: { name: true } } },
      })
    : [];

  const ingresos = subs.reduce((s, x) => s + (x.precio || 0), 0);

  const metricas = [
    { label: "Ingresos / mes", valor: `$${ingresos}` },
    { label: "Clientes con plan", valor: String(subs.length) },
    { label: "Solicitudes activas", valor: String(suyas.filter((s) => s.estado !== "Resuelta").length) },
    { label: "Resueltas", valor: String(suyas.filter((s) => s.estado === "Resuelta").length) },
  ];

  return (
    <div className="min-h-screen">
      <Header nombre={session.name} subtitulo="Abogado" />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <AbogadoNav actual="ingresos" />
        <h1 className="text-2xl font-display font-extrabold text-slate-800 mb-4">Mis ingresos</h1>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {metricas.map((m) => (
            <div key={m.label} className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-xs text-slate-400">{m.label}</p>
              <p className="text-xl font-display font-bold mt-1 text-slate-800">{m.valor}</p>
            </div>
          ))}
        </div>

        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 text-sm font-medium text-slate-700">
            Clientes que atiendes (con plan activo)
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                <th className="px-4 py-2 font-medium">Cliente</th>
                <th className="px-4 py-2 font-medium">Plan</th>
                <th className="px-4 py-2 font-medium">Aporte / mes</th>
              </tr>
            </thead>
            <tbody>
              {subs.map((s, i) => (
                <tr key={i} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-2.5 text-slate-800">{s.usuario.name}</td>
                  <td className="px-4 py-2.5 text-slate-600">{s.plan}</td>
                  <td className="px-4 py-2.5 text-brand-dark font-medium">${s.precio}</td>
                </tr>
              ))}
              {subs.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-slate-400">Todavía no tienes clientes con plan activo.</td></tr>
              )}
            </tbody>
          </table>
        </section>

        <p className="text-xs text-slate-400 mt-3">
          Tus ingresos se calculan como la suma de las suscripciones activas de los clientes que atiendes.
        </p>
      </main>
    </div>
  );
}
