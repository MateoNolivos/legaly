import Link from "next/link";
import Header from "@/components/Header";
import AdminNav from "@/components/AdminNav";
import { requireAdmin } from "@/lib/guard";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminClientesPage() {
  const session = requireAdmin();

  const clientes = await prisma.user.findMany({
    where: { role: "CLIENTE" },
    include: {
      suscripciones: { where: { estado: "Activa" }, orderBy: { inicio: "desc" }, take: 1 },
      solicitudesComoCliente: { select: { estado: true, firstResponseAt: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen">
      <Header nombre={session.name} subtitulo="Supervisor" />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <AdminNav actual="clientes" />
        <h1 className="text-2xl font-display font-extrabold text-slate-800 mb-4">Clientes</h1>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Solicitudes</th>
                <th className="px-4 py-3 font-medium">Sin responder</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => {
                const sub = c.suscripciones[0];
                const activas = c.solicitudesComoCliente.filter((s) => s.estado !== "Resuelta");
                const sinResp = activas.filter((s) => !s.firstResponseAt).length;
                return (
                  <tr key={c.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/admin/clientes/${c.id}`} className="block">
                        <p className="font-medium text-slate-800">{c.name}</p>
                        <p className="text-xs text-slate-400">{c.email}</p>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {sub ? (
                        <span className="text-xs font-medium bg-brand-mint text-brand-dark rounded-full px-2.5 py-0.5">
                          {sub.plan} · ${sub.precio}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Sin plan</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{c.solicitudesComoCliente.length}</td>
                    <td className={`px-4 py-3 ${sinResp > 0 ? "text-red-600 font-medium" : "text-slate-700"}`}>{sinResp}</td>
                  </tr>
                );
              })}
              {clientes.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">Aún no hay clientes.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
