import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getCasosDeCliente } from "@/lib/casos";
import {
  construirContexto,
  responderConReglas,
  responderConClaude,
} from "@/lib/agent";

export async function POST(req: Request) {
  const session = getSession();
  if (!session || session.role !== "CLIENTE") {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { message } = await req.json().catch(() => ({}));
  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "Mensaje vacío." }, { status: 400 });
  }

  // Solo accede a los casos del cliente que esta logueado.
  const casos = await getCasosDeCliente(session.id);

  // Si hay API key de Anthropic, responde en lenguaje natural con Claude.
  // Si falla o no hay key, cae al modo reglas (siempre funciona).
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const contexto = construirContexto(casos);
      const reply = await responderConClaude(message, contexto);
      return NextResponse.json({ reply, modo: "claude" });
    } catch (e) {
      console.error("Error con Claude, usando reglas:", e);
    }
  }

  const reply = responderConReglas(message, casos);
  return NextResponse.json({ reply, modo: "reglas" });
}
