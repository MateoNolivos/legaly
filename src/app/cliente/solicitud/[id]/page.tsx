import Link from "next/link";
import { notFound } from "next/navigation";
import Chat from "@/components/Chat";
import Avatar from "@/components/Avatar";
import { EstadoBadge, UrgenciaBadge } from "@/components/Badges";
import { requireRole } from "@/lib/guard";
import { getSolicitud } from "@/lib/solicitudes";
import { formatFecha } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function SolicitudClientePage({
  params,
}: {
  params: { id: string };
}) {
  const session = requireRole("CLIENTE");
  const s = await getSolicitud(params.id);
  if (!s || s.clienteId !== session.id) notFound();

  const mensajes = s.mensajes.map((m) => ({
    id: m.id,
    autorRol: m.autorRol,
    texto: m.texto,
    createdAt: m.createdAt.toISOString(),
  }));

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/cliente" className="text-slate-400 hover:text-slate-700 text-sm">
            ← Volver
          </Link>
          <p className="font-display font-bold text-slate-800">Tu solicitud</p>
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
          <p className="text-xs text-slate-400 mt-3 border-t border-slate-100 pt-3">
            Creada el {formatFecha(s.createdAt)}
          </p>
        </div>

        {s.abogado ? (
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs font-semibold text-slate-400 uppercase mb-3">Tu abogado</p>
            <div className="flex items-start gap-3">
              <Avatar foto={s.abogado.foto} name={s.abogado.name} size={52} />
              <div>
                <p className="font-medium text-slate-800">{s.abogado.name}</p>
                <p className="text-xs text-slate-500">
                  {s.abogado.especialidad ?? "Abogado"}
                  {s.abogado.experiencia ? ` · ${s.abogado.experiencia} años de experiencia` : ""}
                  {s.abogado.ubicacion ? ` · ${s.abogado.ubicacion}` : ""}
                </p>
                {s.abogado.bio && (
                  <p className="text-sm text-slate-600 mt-2">{s.abogado.bio}</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-5 text-sm text-slate-500">
            Estamos asignando un abogado a tu solicitud…
          </div>
        )}

        <div>
          <h2 className="text-sm font-semibold text-slate-500 mb-2">
            Conversación con tu abogado
          </h2>
          <Chat
            solicitudId={s.id}
            rol="CLIENTE"
            inicial={mensajes}
            disabled={s.estado === "Resuelta"}
          />
        </div>
      </main>
    </div>
  );
}
