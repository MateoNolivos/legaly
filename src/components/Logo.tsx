// Logo de LEGALY. Variantes:
//  - "full" (icono + wordmark, por defecto)
//  - "icon" (solo el icono)
// La prop "tone" cambia el color del texto: "dark" (sobre fondo claro) o
// "light" (sobre fondo oscuro).

export default function Logo({
  variant = "full",
  tone = "dark",
  size = 32,
}: {
  variant?: "full" | "icon";
  tone?: "dark" | "light";
  size?: number;
}) {
  const Icono = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="legalyEmeraldUI" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#34D399" />
          <stop offset="0.55" stopColor="#10B981" />
          <stop offset="1" stopColor="#047857" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="92" height="92" rx="27" fill="url(#legalyEmeraldUI)" />
      <path
        d="M40 27 L40 66 L71 66"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="11"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  if (variant === "icon") return Icono;

  return (
    <span className="inline-flex items-center gap-2">
      {Icono}
      <span
        className="font-display font-extrabold tracking-tight leading-none"
        style={{
          fontSize: size * 0.72,
          color: tone === "light" ? "#FFFFFF" : "#0F172A",
        }}
      >
        Legaly<span style={{ color: "#10B981" }}>.</span>
      </span>
    </span>
  );
}
