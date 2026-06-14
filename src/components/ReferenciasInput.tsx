"use client";

export type Referencia = { nombre: string; contacto: string };

// Lista dinámica de referencias personales: el abogado agrega una por persona.
export default function ReferenciasInput({
  value,
  onChange,
}: {
  value: Referencia[];
  onChange: (refs: Referencia[]) => void;
}) {
  function agregar() {
    onChange([...value, { nombre: "", contacto: "" }]);
  }
  function actualizar(i: number, campo: keyof Referencia, v: string) {
    const copia = [...value];
    copia[i] = { ...copia[i], [campo]: v };
    onChange(copia);
  }
  function eliminar(i: number) {
    onChange(value.filter((_, j) => j !== i));
  }

  return (
    <div className="space-y-2">
      {value.length === 0 && (
        <p className="text-xs text-slate-400">Agrega al menos una persona que pueda dar referencias de ti.</p>
      )}
      {value.map((r, i) => (
        <div key={i} className="bg-white border border-slate-200 rounded-lg p-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-slate-500">Referencia {i + 1}</span>
            <button
              type="button"
              onClick={() => eliminar(i)}
              className="text-xs text-slate-400 hover:text-red-600"
              aria-label="Eliminar referencia"
            >
              ✕ Quitar
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            <input
              value={r.nombre}
              onChange={(e) => actualizar(i, "nombre", e.target.value)}
              placeholder="Nombre y apellido"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
            <input
              value={r.contacto}
              onChange={(e) => actualizar(i, "contacto", e.target.value)}
              placeholder="Teléfono o correo"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={agregar}
        className="w-full text-sm text-brand font-medium border border-dashed border-brand/40 rounded-lg py-2 hover:bg-brand-mint transition"
      >
        + Agregar referencia
      </button>
    </div>
  );
}
