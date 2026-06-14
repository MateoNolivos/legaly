import Link from "next/link";

// Pestañas de navegación del panel del supervisor.
export default function AdminNav({ actual }: { actual: "resumen" | "clientes" | "abogados" }) {
  const tabs = [
    { id: "resumen", label: "Resumen", href: "/admin" },
    { id: "clientes", label: "Clientes", href: "/admin/clientes" },
    { id: "abogados", label: "Abogados", href: "/admin/abogados" },
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
