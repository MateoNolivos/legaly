import Link from "next/link";

// Pestañas del área del abogado.
export default function AbogadoNav({ actual }: { actual: "solicitudes" | "ingresos" | "perfil" }) {
  const tabs = [
    { id: "solicitudes", label: "Mis solicitudes", href: "/abogado" },
    { id: "ingresos", label: "Mis ingresos", href: "/abogado/ingresos" },
    { id: "perfil", label: "Mi perfil", href: "/abogado/perfil" },
  ] as const;

  return (
    <nav className="flex gap-1 bg-white rounded-xl border border-slate-200 p-1 mb-6 w-fit">
      {tabs.map((t) => (
        <Link
          key={t.id}
          href={t.href}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            actual === t.id ? "bg-brand text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
