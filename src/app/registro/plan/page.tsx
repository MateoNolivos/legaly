"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { PLANES } from "@/lib/constantes";

export default function PlanPage() {
  const router = useRouter();
  const [elegido, setElegido] = useState("Pro");
  const [loading, setLoading] = useState(false);

  function confirmar() {
    setLoading(true);
    // Pasa a la pantalla de pago con el plan elegido.
    router.push(`/pago?plan=${encodeURIComponent(elegido)}`);
  }

  return (
    <main className="min-h-screen flex flex-col items-center p-4 py-10">
      <Logo size={40} />
      <h1 className="text-2xl font-display font-extrabold text-slate-800 mt-6">
        Elige tu plan
      </h1>
      <p className="text-sm text-slate-500 mt-1 mb-8">
        Puedes cambiarlo cuando quieras. El cobro se configura más adelante.
      </p>

      <div className="grid md:grid-cols-3 gap-4 w-full max-w-4xl">
        {PLANES.map((p) => {
          const activo = elegido === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setElegido(p.id)}
              className={`text-left bg-white rounded-2xl border p-6 transition relative ${
                activo ? "border-brand ring-2 ring-brand" : "border-slate-200 hover:border-brand"
              }`}
            >
              {p.destacado && (
                <span className="absolute -top-3 left-6 bg-brand text-white text-xs font-medium rounded-full px-3 py-1">
                  Más popular
                </span>
              )}
              <p className="font-display font-bold text-slate-800 text-lg">{p.id}</p>
              <p className="text-xs text-slate-500 mb-3">{p.resumen}</p>
              <p className="text-3xl font-display font-extrabold text-slate-800">
                ${p.precio}
                <span className="text-sm font-normal text-slate-400">/mes</span>
              </p>
              {p.descuento > 0 && (
                <p className="text-xs text-brand-dark mt-1">
                  {p.descuento}% de descuento en servicios
                </p>
              )}
              <ul className="mt-4 space-y-2">
                {p.beneficios.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="text-brand mt-0.5">✓</span> {b}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>


      <button
        onClick={confirmar}
        disabled={loading}
        className="mt-8 bg-brand text-white rounded-lg px-8 py-3 text-sm font-medium hover:bg-brand-dark transition disabled:opacity-60"
      >
        {loading ? "Guardando…" : `Continuar con el plan ${elegido}`}
      </button>
    </main>
  );
}
