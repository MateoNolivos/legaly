import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Si el usuario YA tiene sesión, no debe ver login ni el registro:
// lo mandamos a su panel (la ruta "/" redirige según su rol).
// Nota: /registro/plan SÍ se permite, porque ocurre justo después de
// registrarse como cliente (ya con sesión) para elegir el plan.
export function middleware(req: NextRequest) {
  const tieneSesion = Boolean(req.cookies.get("legaly_session")?.value);
  if (tieneSesion) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/registro", "/registro/cliente", "/registro/abogado"],
};
