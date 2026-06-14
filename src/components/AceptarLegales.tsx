"use client";

import Link from "next/link";

// Casillas de aceptación de Términos y Políticas de privacidad.
export default function AceptarLegales({
  terminos,
  privacidad,
  onTerminos,
  onPrivacidad,
}: {
  terminos: boolean;
  privacidad: boolean;
  onTerminos: (v: boolean) => void;
  onPrivacidad: (v: boolean) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="flex items-start gap-2 text-sm text-slate-600 cursor-pointer">
        <input
          type="checkbox"
          checked={terminos}
          onChange={(e) => onTerminos(e.target.checked)}
          className="mt-0.5 w-4 h-4 accent-emerald-600"
        />
        <span>
          Acepto los{" "}
          <Link href="/terminos" target="_blank" className="text-brand font-medium hover:underline">
            Términos y condiciones
          </Link>
        </span>
      </label>

      <label className="flex items-start gap-2 text-sm text-slate-600 cursor-pointer">
        <input
          type="checkbox"
          checked={privacidad}
          onChange={(e) => onPrivacidad(e.target.checked)}
          className="mt-0.5 w-4 h-4 accent-emerald-600"
        />
        <span>
          Acepto las{" "}
          <Link href="/privacidad" target="_blank" className="text-brand font-medium hover:underline">
            Políticas de privacidad y protección de datos
          </Link>
        </span>
      </label>
    </div>
  );
}
