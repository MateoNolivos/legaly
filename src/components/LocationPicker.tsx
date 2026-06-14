"use client";

export type Ubicacion = { ubicacion: string; lat: number | null; lng: number | null };

// Campo de ubicación simple (texto). El autocompletado de Google Maps queda
// para más adelante (requiere API key); por ahora se escribe la dirección.
export default function LocationPicker({
  value,
  onChange,
}: {
  value: Ubicacion;
  onChange: (v: Ubicacion) => void;
}) {
  return (
    <input
      value={value.ubicacion}
      onChange={(e) => onChange({ ...value, ubicacion: e.target.value })}
      placeholder="Dirección / sector / ciudad"
      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
    />
  );
}
