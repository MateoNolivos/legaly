import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import { requireRole } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { formatFechaHora, formatFecha } from "@/lib/format";
import {
  agregarAudiencia,
  agregarMovimiento,
  actualizarEstado,
} from "../../actions";

export const dynamic = "force-dynamic";

export default async function CasoDetallePage({
  params,
}: {
  params: { id: string };
}) {
  const session = requireRole("ABOGADO");

  const caso = await prisma.caso.findUnique({
    where: { id: params.id },
    include: {
      cliente: { select: { name: true, email: true } },
      audiencias: { orderBy: { fecha: "asc" } },
      movimientos: { orderBy: { fecha: "desc" } },
    },
  });

  if (!caso || (caso.abogadoId !== session.id && session.role !== "ADMIN")) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      <Header nombre={session.name} subtitulo="Abogado" />

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <Link href="/abogado" className="text-sm text-slate-400 hover:text-slate-700">
          ← Volver a casos
        </Link>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <p className="text-xs uppercase tracking-wide text-brand font-semibold">
            {caso.materia}
          </p>
          <h1 className="font-mono text-lg text-slate-800 mt-1">
            Exp. {caso.numeroExpediente}
          </h1>
          <p className="text-sm text-slate-500 mt-1">{caso.juzgado}</p>
          <p className="text-sm text-slate-500 mt-2">
            Cliente: <span className="text-slate-800">{caso.cliente.name}</span>{" "}
            ({caso.cliente.email})
          </p>

          <form action={actualizarEstado} className="flex items-end gap-2 mt-4 pt-4 border-t border-slate-100">
            <input type="hidden" name="casoId" value={caso.id} />
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Estado del proceso
              </label>
              <input
                name="estado"
                defaultValue={caso.estado}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <button className="bg-slate-800 text-white rounded-lg px-4 py-2 text-sm hover:bg-slate-700 transition">
              Guardar
            </button>
          </form>
        </div>

        {/* Audiencias */}
        <section className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-3">Audiencias</h2>
          <div className="space-y-2 mb-5">
            {caso.audiencias.length === 0 && (
              <p className="text-sm text-slate-400">No hay audiencias agendadas.</p>
            )}
            {caso.audiencias.map((a) => (
              <div key={a.id} className="text-sm border border-slate-100 rounded-lg p-3">
                <p className="text-slate-800 capitalize">{formatFechaHora(a.fecha)}</p>
                <p className="text-xs text-slate-500">
                  {a.tipo} · {a.modalidad}
                  {a.lugar ? ` · ${a.lugar}` : ""}
                </p>
              </div>
            ))}
          </div>

          <form action={agregarAudiencia} className="grid sm:grid-cols-2 gap-3 pt-4 border-t border-slate-100">
            <input type="hidden" name="casoId" value={caso.id} />
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Fecha y hora</label>
              <input type="datetime-local" name="fecha" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Tipo</label>
              <input name="tipo" placeholder="Audiencia de juicio" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Modalidad</label>
              <select name="modalidad" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white">
                <option>Presencial</option>
                <option>Telemática</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Lugar / enlace</label>
              <input name="lugar" placeholder="Sala 3, Complejo Norte" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div className="sm:col-span-2">
              <button className="bg-brand text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-brand-dark transition">
                Agregar audiencia
              </button>
            </div>
          </form>
        </section>

        {/* Movimientos */}
        <section className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-3">Movimientos</h2>
          <div className="space-y-2 mb-5">
            {caso.movimientos.length === 0 && (
              <p className="text-sm text-slate-400">Sin movimientos registrados.</p>
            )}
            {caso.movimientos.map((m) => (
              <div key={m.id} className="text-sm border border-slate-100 rounded-lg p-3">
                <p className="text-slate-800">{m.descripcion}</p>
                <p className="text-xs text-slate-500 capitalize">{formatFecha(m.fecha)}</p>
              </div>
            ))}
          </div>

          <form action={agregarMovimiento} className="grid sm:grid-cols-2 gap-3 pt-4 border-t border-slate-100">
            <input type="hidden" name="casoId" value={caso.id} />
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1">Descripción</label>
              <input name="descripcion" placeholder="Calificación de la demanda…" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Fecha (opcional)</label>
              <input type="date" name="fecha" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div className="flex items-end">
              <button className="bg-brand text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-brand-dark transition">
                Agregar movimiento
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
