"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import PayphoneBox from "@/components/PayphoneBox";
import { getPlan, planACodigo, type Plan } from "@/lib/constantes";

const TOKEN = process.env.NEXT_PUBLIC_PAYPHONE_TOKEN || "";
const STORE_ID = process.env.NEXT_PUBLIC_PAYPHONE_STORE_ID || "";

export default function PagoPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [clientTx, setClientTx] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [mostrarEscape, setMostrarEscape] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p = getPlan(params.get("plan") || "");
    if (!p) {
      setError("Plan no válido.");
      return;
    }
    setPlan(p);
    setClientTx(`LG-${planACodigo(p.id)}-${Date.now()}`);
    // Tras unos segundos, ofrece una salida manual por si la pasarela no redirige.
    const t = setTimeout(() => setMostrarEscape(true), 12000);
    return () => clearTimeout(t);
  }, []);

  // La cajita de pago (iframe) avisa cuando termina; aquí redirigimos la página real.
  useEffect(() => {
    function onMsg(e: MessageEvent) {
      const data = e.data;
      if (data && data.type === "LEGALY_NAV" && typeof data.href === "string" && data.href.startsWith("/")) {
        window.location.href = data.href;
      }
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  // Respaldo confiable: el iframe de la pasarela puede impedir la redirección,
  // así que esta página (ventana principal) consulta cada 2s si se creó una
  // suscripción DESPUÉS de abrir esta pantalla; si es así, lleva al panel.
  useEffect(() => {
    let base: string | null | undefined = undefined; // inicio de la sub al abrir
    let detenido = false;
    async function check(primera: boolean) {
      try {
        const r = await fetch("/api/suscripcion/estado", { cache: "no-store" });
        const d = await r.json();
        if (primera) { base = d.inicio ?? null; return; }
        // Si apareció una suscripción con un "inicio" distinto al de base,
        // significa que se acaba de crear (pago aprobado) -> al panel.
        if (d.inicio && d.inicio !== base) {
          detenido = true;
          window.location.href = "/cliente";
        }
      } catch {
        /* reintenta en el siguiente ciclo */
      }
    }
    check(true);
    const t = setInterval(() => { if (!detenido) check(false); }, 2000);
    return () => { detenido = true; clearInterval(t); };
  }, []);

  // Fallback de prueba: activa el plan sin cobrar (cuando aún no hay credenciales Payphone).
  async function activarModoPrueba() {
    if (!plan) return;
    setCargando(true);
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: plan.id }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "No se pudo activar el plan.");
        return;
      }
      router.push("/cliente");
      router.refresh();
    } finally {
      setCargando(false);
    }
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 text-center">
        <div>
          <p className="text-slate-700">{error}</p>
          <button onClick={() => router.push("/registro/plan")} className="mt-4 text-brand hover:underline">
            ← Volver a elegir plan
          </button>
        </div>
      </main>
    );
  }

  if (!plan) return null;

  const hayPayphone = TOKEN && STORE_ID;

  return (
    <main className="min-h-screen flex flex-col items-center p-4 py-10">
      <Logo size={38} />
      <h1 className="text-xl font-display font-extrabold text-slate-800 mt-6">
        Pago del plan {plan.id}
      </h1>
      <p className="text-sm text-slate-500 mt-1 mb-6">
        ${plan.precio}/mes · {plan.resumen}
      </p>

      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-6">
        {hayPayphone ? (
          <PayphoneBox
            token={TOKEN}
            storeId={STORE_ID}
            amountCents={plan.precio * 100}
            reference={`LEGALY Plan ${plan.id}`}
            clientTransactionId={clientTx}
          />
        ) : (
          <div className="text-center">
            <p className="text-sm text-slate-500 mb-4">
              La pasarela de pago aún no está configurada (faltan las credenciales de Payphone).
              Puedes activar el plan en modo de prueba por ahora.
            </p>
            <button
              onClick={activarModoPrueba}
              disabled={cargando}
              className="bg-brand text-white rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-brand-dark transition disabled:opacity-60"
            >
              {cargando ? "Activando…" : `Activar plan ${plan.id} (modo prueba)`}
            </button>
          </div>
        )}
      </div>

      {mostrarEscape && (
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500">¿Ya pagaste y no avanzó?</p>
          <a href="/cliente" className="inline-block mt-1 text-brand font-medium hover:underline">
            Ir a mi panel →
          </a>
        </div>
      )}

      <button onClick={() => router.push("/registro/plan")} className="mt-6 text-sm text-slate-400 hover:underline">
        ← Cambiar de plan
      </button>
    </main>
  );
}
