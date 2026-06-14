"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Redirige al usuario de forma fiable desde el navegador (tras un pago aprobado).
export default function AutoRedirect({ href, delay = 1500 }: { href: string; delay?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setTimeout(() => {
      // La pasarela corre dentro de un iframe protegido que puede bloquear la
      // navegación de la ventana superior. Por eso avisamos a la página
      // principal con postMessage para que ella misma redirija, y además
      // intentamos navegar directamente como respaldo.
      try { window.parent?.postMessage({ type: "LEGALY_NAV", href }, "*"); } catch {}
      try { window.top?.postMessage({ type: "LEGALY_NAV", href }, "*"); } catch {}
      try {
        const top = window.top || window;
        top.location.href = href;
      } catch {
        window.location.href = href;
      }
    }, delay);
    return () => clearTimeout(t);
  }, [href, delay, router]);
  return null;
}
