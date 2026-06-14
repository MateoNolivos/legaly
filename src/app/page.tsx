import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

// Pagina raiz: redirige segun el estado de sesion y el rol.
export default function Home() {
  const session = getSession();
  if (!session) redirect("/login");
  if (session.role === "ADMIN") redirect("/admin");
  if (session.role === "ABOGADO") redirect("/abogado");
  redirect("/cliente");
}
