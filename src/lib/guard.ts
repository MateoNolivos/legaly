import { redirect } from "next/navigation";
import { getSession, type Session } from "./auth";

// Helpers para proteger paginas (server components).
export function requireSession(): Session {
  const session = getSession();
  if (!session) redirect("/login");
  return session;
}

export function requireRole(role: "CLIENTE" | "ABOGADO"): Session {
  const session = requireSession();
  if (session.role !== role && session.role !== "ADMIN") {
    // Si el rol no coincide, lo mandamos a su propia area.
    redirect("/");
  }
  return session;
}

export function requireAdmin(): Session {
  const session = requireSession();
  if (session.role !== "ADMIN") redirect("/");
  return session;
}
