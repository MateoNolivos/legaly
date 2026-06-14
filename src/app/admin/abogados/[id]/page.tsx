import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Avatar from "@/components/Avatar";
import { EstadoBadge, UrgenciaBadge } from "@/components/Badges";
import { requireAdmin } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { tiempoPrimeraRespuestaMs, tiempoPromedioRespuestaMs, promedio } from "@/lib/solicitudes";
import { formatFecha, formatDuracion } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function FichaAbogadoPage({ params }: { params: { id: string } }) {
  const session = requireAdmin();
  const ab = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      solicitudesComoAbogado: {
        include: {
          cliente: { select: { name: true } },
          mensajes: { select: { autorRol: true, createdAt: true }, orderBy: { createdAt: "asc" } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!ab || ab.role !== "ABOGADO") notFound();

  const suyas = ab.solicitudesComoAbogado;
  const clienteIds = Array.from(new Set(suyas.map((s) => s.clienteId)));
  const subs = clienteIds.length
    ? await prisma.suscripcion.findMany({ where: { usuarioId: { in: clienteIds }, estado: "Activa" }, select: { precio: true } })
    : [];
  const ingresos = subs.reduce((s, x) => s + (x.precio || 0), 0);

  let refs: { nombre: string; contacto: string }[] = [];
  try { refs = ab.referencias ? JSON.parse(ab.referencias) : []; } catch { refs = []; }

  const metricas = [
    { label: "Activas", valor: String(suyas.filter((s) => s.estado !== "Resuelta").length) },
    { label: "Resueltas", valor: String(suyas.filter((s) => s.estado === "Resuelta").length) },
    { label: "Prom. 1ª resp.", valor: formatDuracion(promedio(suyas.map((s) => tiempoPrimeraRespuestaMs(s)))) },
    { label: "Prom. chat", valor: formatDuracion(promedio(suyas.map((s) => tiempoPromedioRespuestaMs(s.mensajes)))) },
    { label: "Ingresos", valor: `$${ingresos}` },
  ];

  return (
    <div className="min-h-screen">
      <Header nombre={session.name} subtitulo="Supervisor" />
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <Link href="/admin/abogados" className="text-sm text-slate-400 hover:text-slate-700">← Volver a abogados</Link>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-start gap-4">
            <Avatar foto={ab.foto} name={ab.name} size={64} />
            <div className="flex-1">
              <h1 className="text-xl font-display font-extrabold text-slate-800">{ab.name}</h1>
              <p className="text-sm text-slate-500">{ab.email} · {ab.phone ?? "sin teléfono"}</p>
              <p className="text-sm text-slate-500 mt-1">
                {ab.especialidad ?? "Sin especialidad"}
                {ab.experiencia ? ` · ${ab.experiencia} años` : ""}
                {ab.ubicacion ? ` · ${ab.ubicacion}` : ""}
                {ab.matricula ? ` · Mat. ${ab.matricula}` : ""}
              </p>
              {ab.cedula && <p className="text-xs text-slate-400 mt-1">Cédula: {ab.cedula}</p>}
              {ab.bio && <p className="text-sm text-slate-600 mt-2">{ab.bio}</p>}
              {refs.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-semibold text-slate-400 uppercase">Referencias</p>
                  <ul className="text-xs text-slate-600">
                    {refs.map((r, i) => <li key={i}>• {r.nombre} {r.contacto ? `— ${r.contacto}` : ""}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {metricas.map((m) => (
            <div key={m.label} className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-xs text-slate-400">{m.label}</p>
              <p className="text-lg font-display font-bold text-slate-800 mt-1">{m.valor}</p>
            </div>
          ))}
        </div>

        <div>
          <h2 className="font-display font-bold text-slate-800 mb-3">Sus solicitudes</h2>
          <div className="space-y-3">
            {suyas.length === 0 && (
              <p className="text-sm text-slate-400 bg-white rounded-xl border border-slate-200 p-4">Sin solicitudes asignadas.</p>
            )}
            {suyas.map((s) => (
              <Link key={s.id} href={`/abogado/solicitud/${s.id}`} className="block bg-white rounded-xl border border-slate-200 p-4 hover:border-brand transition">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase tracking-wide text-brand font-semibold">{s.materia}</span>
                      <UrgenciaBadge urgencia={s.urgencia} />
                    </div>
                    <p className="text-sm text-slate-700 mt-1 line-clamp-1">{s.descripcion}</p>
                    <p className="text-xs text-slate-400 mt-1">Cliente: {s.cliente.name} · {formatFecha(s.createdAt)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <EstadoBadge estado={s.estado} />
                    <p className="text-xs mt-1.5 text-slate-400">
                      1ª resp:{" "}
                      <span className={s.firstResponseAt ? "text-slate-600" : "text-red-600 font-medium"}>
                        {s.firstResponseAt ? formatDuracion(tiempoPrimeraRespuestaMs(s)) : "pendiente"}
                      </span>
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
