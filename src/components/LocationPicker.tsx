"use client";

import { useState } from "react";

export type Ubicacion = { ubicacion: string; lat: number | null; lng: number | null };

// Captura la ubicación del usuario.
// MVP sin API key: usa la geolocalización del navegador + una dirección en texto.
// Para autocompletado real de Google Maps Places hace falta una API key (ver README).
export default function LocationPicker({
  value,
  onChange,
}: {
  value: Ubicacion;
  onChange: (v: Ubicacion) => void;
}) {
  const [estado, setEstado] = useState("");

  function usarMiUbicacion() {
    if (!navigator.geolocation) {
      setEstado("Tu navegador no permite geolocalización. Escribe tu dirección.");
      return;
    }
    setEstado("Obteniendo tu ubicación…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        onChange({ ...value, lat, lng });
        setEstado(`Ubicación capturada (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
      },
      () => setEstado("No se pudo obtener la ubicación. Escribe tu dirección manualmente.")
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          value={value.ubicacion}
          onChange={(e) => onChange({ ...value, ubicacion: e.target.value })}
          placeholder="Dirección / referencia"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
        />
        <button
          type="button"
          onClick={usarMiUbicacion}
          className="rounded-lg border border-brand text-brand px-3 py-2 text-sm font-medium hover:bg-brand-mint whitespace-nowrap"
        >
          📍 Mi ubicación
        </button>
      </div>
      {estado && <p className="text-xs text-slate-500">{estado}</p>}
      {value.lat !== null && value.lng !== null && (
        <a
          href={`https://www.google.com/maps?q=${value.lat},${value.lng}`}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-brand hover:underline"
        >
          Ver en Google Maps ↗
        </a>
      )}
    </div>
  );
}
