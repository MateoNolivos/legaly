"use client";

import { useEffect, useRef, useState } from "react";

type Notif = {
  id: string;
  tipo: string;
  titulo: string;
  cuerpo: string;
  url: string | null;
  leida: boolean;
  createdAt: string;
};

function hace(iso: string): string {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.floor(h / 24)} d`;
}

export default function NotificacionesBell() {
  const [items, setItems] = useState<Notif[]>([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  async function cargar() {
    try {
      const r = await fetch("/api/notificaciones", { cache: "no-store" });
      const d = await r.json();
      setItems(d.items || []);
      setNoLeidas(d.noLeidas || 0);
    } catch {
      /* reintenta luego */
    }
  }

  useEffect(() => {
    cargar();
    const t = setInterval(cargar, 15000);
    return () => clearInterval(t);
  }, []);

  // Cerrar al hacer clic fuera.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function alternar() {
    const nuevo = !abierto;
    setAbierto(nuevo);
    if (nuevo && noLeidas > 0) {
      setNoLeidas(0);
      try { await fetch("/api/notificaciones/leer", { method: "POST" }); } catch {}
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={alternar} className="relative text-slate-500 hover:text-slate-800 transition" aria-label="Notificaciones">
        <span className="text-xl">🔔</span>
        {noLeidas > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
            {noLeidas > 9 ? "9+" : noLeidas}
          </span>
        )}
      </button>

      {abierto && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white rounded-xl border border-slate-200 shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-100 text-sm font-medium text-slate-700">
            Notificaciones
          </div>
          <div className="max-h-96 overflow-auto">
            {items.length === 0 && (
              <p className="px-4 py-6 text-sm text-slate-400 text-center">No tienes notificaciones.</p>
            )}
            {items.map((n) => {
              const contenido = (
                <div className={`px-4 py-3 border-b border-slate-50 ${n.leida ? "" : "bg-emerald-50/50"}`}>
                  <p className="text-sm font-medium text-slate-800">{n.titulo}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{n.cuerpo}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{hace(n.createdAt)}</p>
                </div>
              );
              return n.url ? (
                <a key={n.id} href={n.url} className="block hover:bg-slate-50">{contenido}</a>
              ) : (
                <div key={n.id}>{contenido}</div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
