// Muestra la foto del usuario o, si no tiene, sus iniciales en un círculo.
export default function Avatar({
  foto,
  name,
  size = 40,
}: {
  foto?: string | null;
  name: string;
  size?: number;
}) {
  const iniciales = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  if (foto) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={foto}
        alt={name}
        style={{ width: size, height: size }}
        className="rounded-full object-cover border border-slate-200 shrink-0"
      />
    );
  }

  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      className="rounded-full bg-brand-mint text-brand-dark font-semibold flex items-center justify-center shrink-0"
    >
      {iniciales || "?"}
    </div>
  );
}
