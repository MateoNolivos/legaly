const ESTADO_ESTILO: Record<string, string> = {
  Nueva: "bg-slate-100 text-slate-600",
  Asignada: "bg-brand-mint text-brand-dark",
  "En progreso": "bg-amber-100 text-amber-700",
  Resuelta: "bg-emerald-100 text-emerald-700",
};

const URGENCIA_ESTILO: Record<string, string> = {
  Baja: "bg-slate-100 text-slate-600",
  Media: "bg-blue-100 text-blue-700",
  Alta: "bg-red-100 text-red-700",
};

export function EstadoBadge({ estado }: { estado: string }) {
  return (
    <span
      className={`text-xs font-medium rounded-full px-3 py-1 ${
        ESTADO_ESTILO[estado] ?? "bg-slate-100 text-slate-600"
      }`}
    >
      {estado}
    </span>
  );
}

export function UrgenciaBadge({ urgencia }: { urgencia: string }) {
  return (
    <span
      className={`text-xs font-medium rounded-full px-2.5 py-0.5 ${
        URGENCIA_ESTILO[urgencia] ?? "bg-slate-100 text-slate-600"
      }`}
    >
      Urgencia {urgencia.toLowerCase()}
    </span>
  );
}
