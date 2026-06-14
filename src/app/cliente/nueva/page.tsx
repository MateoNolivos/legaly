"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MATERIAS, URGENCIAS } from "@/lib/constantes";

export default function NuevaSolicitudPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    materia: "",
    descripcion: "",
    urgencia: "Media",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(campo: string, valor: string) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.materia) return setError("Elige el tipo de necesidad.");
    if (form.descripcion.trim().length < 10)
      return setError("Cuéntanos un poco más sobre tu problema.");
    setLoading(true);
    try {
      const res = await fetch("/api/solicitudes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo crear la solicitud.");
        return;
      }
      router.push(`/cliente/solicitud/${data.id}`);
      router.refresh();
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/cliente" className="text-slate-400 hover:text-slate-700 text-sm">
            ← Volver
          </Link>
          <p className="font-display font-bold text-slate-800">Necesito ayuda</p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <p className="text-sm text-slate-500 mb-6">
          Responde estas preguntas y te asignamos automáticamente al abogado indicado.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5 bg-white rounded-xl border border-slate-200 p-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              ¿Con qué necesitas ayuda?
            </label>
            <div className="flex flex-wrap gap-2">
              {MATERIAS.map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => set("materia", m)}
                  className={`text-sm rounded-full px-4 py-1.5 border transition ${
                    form.materia === m
                      ? "bg-brand text-white border-brand"
                      : "bg-white text-slate-600 border-slate-300 hover:border-brand"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Describe tu situación
            </label>
            <textarea
              value={form.descripcion}
              onChange={(e) => set("descripcion", e.target.value)}
              rows={4}
              placeholder="Cuéntanos en tus palabras qué está pasando…"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              ¿Qué tan urgente es?
            </label>
            <div className="flex gap-2">
              {URGENCIAS.map((u) => (
                <button
                  type="button"
                  key={u}
                  onClick={() => set("urgencia", u)}
                  className={`flex-1 text-sm rounded-lg px-4 py-2 border transition ${
                    form.urgencia === u
                      ? "bg-brand text-white border-brand"
                      : "bg-white text-slate-600 border-slate-300 hover:border-brand"
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand text-white rounded-lg py-3 text-sm font-medium hover:bg-brand-dark transition disabled:opacity-60"
          >
            {loading ? "Enviando…" : "Enviar solicitud"}
          </button>
        </form>
      </main>
    </div>
  );
}
