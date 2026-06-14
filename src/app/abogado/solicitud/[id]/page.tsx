import Link from "next/link";
import { notFound } from "next/navigation";
import Chat from "@/components/Chat";
import { EstadoBadge, UrgenciaBadge } from "@/components/Badges";
import { requireRole } from "@/lib/guard";
import { getSolicitud, tiempoPrimeraRespuestaMs, tiempoPromedioRespuestaMs } from "@/lib/solicitudes";
import { formatFecha, formatDuracion } from "@/lib/format";
import { marcarResuelta, reabrir } from "../../solicitud-actions";

export const dynamic = "force-dynamic";

export default async function SolicitudAbogadoPage({
  params,
}: {
  params: { id: string };
}) {
  const session = requireRole("ABOGADO");
  const s = await getSolicitud(params.id);
  if (!s || (s.abogadoId !== session.id && session.role !== "ADMIN")) notFound();

  const mensajes = s.mensajes.map((m) => ({
    id: m.id,
    autorRol: m.autorRol,
    texto: m.texto,
    createdAt: m.createdAt.toISOString(),
  }));

  const primera = tiempoPrimeraRespuestaMs(s);
  const promChat = tiempoPromedioRespuestaMs(s.mensajes);
  const resuelta = s.estado === "Resuelta";

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/abogado" className="text-slate-400 hover:text-slate-700 text-sm">
            ← Volver
          </Link>
          <p className="font-display font-bold text-slate-800">Solicitud asignada</p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wide text-brand font-semibold">
                {s.materia}
              </span>
              <UrgenciaBadge urgencia={s.urgencia} />
            </div>
            <EstadoBadge estado={s.estado} />
          </div>

          <p className="text-sm text-slate-700 mt-3">{s.descripcion}</p>

          <div className="text-xs text-slate-500 mt-3 border-t border-slate-100 pt-3 space-y-1">
            <p>Cliente: <span className="text-slate-800">{s.cliente.name}</span> ({s.cliente.email})</p>
            <p>
              {s.ciudad ? `Ciudad: ${s.ciudad}` : "Ciudad no indicada"}
              {s.telefono ? ` · Tel: ${s.telefono}` : ""}
            </p>
            <p>Creada el {formatFecha(s.createdAt)}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-400">Tu 1ª respuesta</p>
              <p className="text-base font-display font-bold text-slate-800">
                {s.firstResponseAt ? formatDuracion(primera) : "pendiente"}
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-400">Prom. respuesta chat</p>
              <p className="text-base font-display font-bold text-slate-800">
                {formatDuracion(promChat)}
              </p>
            </div>
          </div>

          <form action={resuelta ? reabrir : marcarResuelta} className="mt-4">
            <input type="hidden" name="solicitudId" value={s.id} />
            <button
              className={`text-sm font-medium rounded-lg px-4 py-2 transition ${
                resuelta
                  ? "bg-white border border-slate-300 text-slate-600 hover:border-brand"
                  : "bg-brand text-white hover:bg-brand-dark"
              }`}
            >
              {resuelta ? "Reabrir solicitud" : "Marcar como resuelta"}
            </button>
          </form>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-slate-500 mb-2">Conversación con el cliente</h2>
          <Chat solicitudId={s.id} rol="ABOGADO" inicial={mensajes} disabled={resuelta} />
        </div>
      </main>
    </div>
  );
}
