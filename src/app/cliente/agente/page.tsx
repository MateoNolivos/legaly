"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

type Mensaje = { de: "usuario" | "agente"; texto: string };

const SUGERENCIAS = [
  "¿Cuándo es mi próxima audiencia?",
  "¿En qué paso está mi proceso?",
  "¿Cuál fue el último movimiento?",
];

export default function AgentePage() {
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    {
      de: "agente",
      texto:
        "¡Hola! Soy tu asistente de LEGALY. Puedo decirte cuándo es tu próxima audiencia, en qué paso está tu proceso o cuál fue el último movimiento.",
    },
  ]);
  const [texto, setTexto] = useState("");
  const [cargando, setCargando] = useState(false);
  const finRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes, cargando]);

  async function enviar(mensaje: string) {
    const limpio = mensaje.trim();
    if (!limpio || cargando) return;
    setMensajes((m) => [...m, { de: "usuario", texto: limpio }]);
    setTexto("");
    setCargando(true);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: limpio }),
      });
      const data = await res.json();
      setMensajes((m) => [
        ...m,
        { de: "agente", texto: data.reply || data.error || "No pude responder." },
      ]);
    } catch {
      setMensajes((m) => [
        ...m,
        { de: "agente", texto: "Hubo un error de conexión. Intenta de nuevo." },
      ]);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/cliente" className="text-slate-400 hover:text-slate-700 text-sm">
            ← Volver
          </Link>
          <div>
            <p className="font-semibold text-slate-800">Asistente LEGALY</p>
            <p className="text-xs text-slate-400">Información de tus casos</p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 flex flex-col">
        <div className="flex-1 space-y-4">
          {mensajes.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.de === "usuario" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-line ${
                  m.de === "usuario"
                    ? "bg-brand text-white rounded-br-sm"
                    : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"
                }`}
              >
                {m.texto}
              </div>
            </div>
          ))}
          {cargando && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm text-slate-400">
                Escribiendo…
              </div>
            </div>
          )}
          <div ref={finRef} />
        </div>

        {mensajes.length <= 1 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {SUGERENCIAS.map((s) => (
              <button
                key={s}
                onClick={() => enviar(s)}
                className="text-xs bg-white border border-slate-200 rounded-full px-3 py-1.5 text-slate-600 hover:border-brand hover:text-brand transition"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            enviar(texto);
          }}
          className="flex gap-2 sticky bottom-4"
        >
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Escribe tu pregunta…"
            className="flex-1 rounded-full border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-white"
          />
          <button
            type="submit"
            disabled={cargando}
            className="bg-brand text-white rounded-full px-5 py-2.5 text-sm font-medium hover:bg-brand-dark transition disabled:opacity-60"
          >
            Enviar
          </button>
        </form>
      </main>
    </div>
  );
}
