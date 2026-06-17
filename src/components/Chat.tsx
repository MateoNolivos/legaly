"use client";

import { useState, useRef, useEffect, useCallback } from "react";

type Mensaje = {
  id: string;
  autorRol: string;
  texto: string;
  createdAt: string;
};

function hora(iso: string) {
  return new Intl.DateTimeFormat("es-EC", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Guayaquil",
  }).format(new Date(iso));
}

const RAPIDO = 3000; // hay actividad
const LENTO = 20000; // sin novedades (ahorra llamadas)

export default function Chat({
  solicitudId,
  rol,
  inicial,
  disabled,
  puedeEscalar,
}: {
  solicitudId: string;
  rol: "CLIENTE" | "ABOGADO";
  inicial: Mensaje[];
  disabled?: boolean;
  puedeEscalar?: boolean;
}) {
  const [mensajes, setMensajes] = useState<Mensaje[]>(inicial);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [escalado, setEscalado] = useState(false);
  const finRef = useRef<HTMLDivElement>(null);

  // Marca del último mensaje (para pedir solo lo nuevo) e intervalo adaptativo.
  const ultimaFecha = useRef(inicial.length ? inicial[inicial.length - 1].createdAt : "");
  const intervalo = useRef(RAPIDO);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const agregar = useCallback((nuevos: Mensaje[]) => {
    if (!nuevos.length) return false;
    let huboNuevos = false;
    setMensajes((prev) => {
      const ids = new Set(prev.map((m) => m.id));
      const filtrados = nuevos.filter((m) => !ids.has(m.id));
      if (!filtrados.length) return prev;
      huboNuevos = true;
      const todos = [...prev, ...filtrados];
      ultimaFecha.current = todos[todos.length - 1].createdAt;
      return todos;
    });
    return huboNuevos;
  }, []);

  const consultar = useCallback(async () => {
    if (typeof document !== "undefined" && document.hidden) return false;
    try {
      const q = ultimaFecha.current ? `?desde=${encodeURIComponent(ultimaFecha.current)}` : "";
      const res = await fetch(`/api/solicitudes/${solicitudId}/mensajes${q}`, { cache: "no-store" });
      if (!res.ok) return false;
      const data = await res.json();
      return agregar(data.mensajes || []);
    } catch {
      return false;
    }
  }, [solicitudId, agregar]);

  // Bucle de polling adaptativo: rápido si hay novedades, lento si no;
  // pausa cuando la pestaña no está visible.
  useEffect(() => {
    let activo = true;
    const ciclo = async () => {
      const huboNuevos = await consultar();
      intervalo.current = huboNuevos ? RAPIDO : Math.min(intervalo.current + 3000, LENTO);
      if (activo) timer.current = setTimeout(ciclo, intervalo.current);
    };
    timer.current = setTimeout(ciclo, intervalo.current);

    const alVolver = () => {
      if (!document.hidden) {
        intervalo.current = RAPIDO;
        consultar();
      }
    };
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      activo = false;
      if (timer.current) clearTimeout(timer.current);
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, [consultar]);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  async function escalar() {
    try {
      await fetch(`/api/solicitudes/${solicitudId}/escalar`, { method: "POST" });
      setEscalado(true);
      intervalo.current = RAPIDO;
      consultar();
    } catch {
      /* ignora */
    }
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const limpio = texto.trim();
    if (!limpio || enviando) return;
    setEnviando(true);
    setTexto("");
    try {
      const res = await fetch(`/api/solicitudes/${solicitudId}/mensajes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto: limpio }),
      });
      const data = await res.json();
      if (res.ok && data.mensaje) {
        agregar([data.mensaje]);
        intervalo.current = RAPIDO; // tras enviar, vuelve a consultar seguido
      }
    } catch {
      /* ignora */
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-col h-[460px] bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {mensajes.length === 0 && (
          <p className="text-sm text-slate-400 text-center mt-8">
            Aún no hay mensajes. Escribe el primero.
          </p>
        )}
        {mensajes.map((m) => {
          const esAsistente = m.autorRol === "ASISTENTE";
          const mio = m.autorRol === rol;
          const etiqueta = esAsistente ? "🤖 Asistente" : m.autorRol === "ABOGADO" ? "Abogado" : "Cliente";
          const burbuja = mio
            ? "bg-brand text-white rounded-br-sm"
            : esAsistente
            ? "bg-brand-mint text-brand-dark border border-emerald-200 rounded-bl-sm"
            : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm";
          return (
            <div key={m.id} className={`flex ${mio ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[78%] rounded-2xl px-4 py-2 text-sm ${burbuja}`}>
                <p className="whitespace-pre-line">{m.texto}</p>
                <p className={`text-[10px] mt-1 ${mio ? "text-emerald-100" : esAsistente ? "text-emerald-700" : "text-slate-400"}`}>
                  {etiqueta} · {hora(m.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={finRef} />
      </div>

      {puedeEscalar && !escalado && !disabled && (
        <button
          type="button"
          onClick={escalar}
          className="text-xs text-brand font-medium border-t border-slate-200 bg-white py-2 hover:bg-brand-mint transition"
        >
          🧑‍⚖️ Prefiero hablar directamente con mi abogado
        </button>
      )}

      <form onSubmit={enviar} className="flex gap-2 p-3 border-t border-slate-200 bg-white">
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          disabled={disabled}
          placeholder={disabled ? "Esta solicitud está cerrada" : "Escribe un mensaje…"}
          className="flex-1 rounded-full border border-slate-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand disabled:bg-slate-100"
        />
        <button
          type="submit"
          disabled={enviando || disabled}
          className="bg-brand text-white rounded-full px-5 py-2 text-sm font-medium hover:bg-brand-dark transition disabled:opacity-60"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
