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

export default function Chat({
  solicitudId,
  rol,
  inicial,
  disabled,
}: {
  solicitudId: string;
  rol: "CLIENTE" | "ABOGADO";
  inicial: Mensaje[];
  disabled?: boolean;
}) {
  const [mensajes, setMensajes] = useState<Mensaje[]>(inicial);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const finRef = useRef<HTMLDivElement>(null);

  const cargar = useCallback(async () => {
    try {
      const res = await fetch(`/api/solicitudes/${solicitudId}/mensajes`);
      if (!res.ok) return;
      const data = await res.json();
      setMensajes(data.mensajes);
    } catch {
      /* silencio: reintenta en el siguiente ciclo */
    }
  }, [solicitudId]);

  // Polling cada 4 segundos para ver mensajes nuevos.
  useEffect(() => {
    const t = setInterval(cargar, 4000);
    return () => clearInterval(t);
  }, [cargar]);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

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
      if (res.ok) setMensajes((m) => [...m, data.mensaje]);
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
          const mio = m.autorRol === rol;
          return (
            <div key={m.id} className={`flex ${mio ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[78%] rounded-2xl px-4 py-2 text-sm ${
                  mio
                    ? "bg-brand text-white rounded-br-sm"
                    : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"
                }`}
              >
                <p className="whitespace-pre-line">{m.texto}</p>
                <p className={`text-[10px] mt-1 ${mio ? "text-emerald-100" : "text-slate-400"}`}>
                  {m.autorRol === "ABOGADO" ? "Abogado" : "Cliente"} · {hora(m.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={finRef} />
      </div>

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
