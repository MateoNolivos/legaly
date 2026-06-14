import {
  type CasoConDetalle,
  proximaAudiencia,
  ultimoMovimiento,
} from "./casos";
import { formatFechaHora, formatFecha, relativo } from "./format";

// ---------------------------------------------------------------------------
// El agente tiene DOS modos:
//   1) Reglas (por defecto): detecta la intencion y responde con los datos.
//      No cuesta nada y funciona sin conexion a un modelo de IA.
//   2) Claude (si hay ANTHROPIC_API_KEY): respuestas en lenguaje natural,
//      pero SIEMPRE limitadas a los datos reales del cliente (no inventa).
// ---------------------------------------------------------------------------

// Construye un resumen en texto de los casos del cliente.
// Este texto es lo unico que el agente puede usar para responder.
export function construirContexto(casos: CasoConDetalle[]): string {
  if (casos.length === 0) {
    return "El cliente no tiene casos registrados todavía.";
  }
  return casos
    .map((caso, i) => {
      const prox = proximaAudiencia(caso);
      const ult = ultimoMovimiento(caso);
      const lineas = [
        `CASO ${i + 1}:`,
        `- Materia: ${caso.materia}`,
        `- Número de expediente: ${caso.numeroExpediente}`,
        `- Juzgado: ${caso.juzgado ?? "no registrado"}`,
        `- Estado actual: ${caso.estado}`,
        `- Abogado a cargo: ${caso.abogado.name}`,
        prox
          ? `- Próxima audiencia: ${formatFechaHora(prox.fecha)} (${prox.tipo}, ${prox.modalidad}${prox.lugar ? ", " + prox.lugar : ""})`
          : `- Próxima audiencia: no hay ninguna agendada`,
        ult
          ? `- Último movimiento: ${ult.descripcion} (${formatFecha(ult.fecha)})`
          : `- Último movimiento: ninguno registrado`,
      ];
      return lineas.join("\n");
    })
    .join("\n\n");
}

// --- Modo reglas ------------------------------------------------------------

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // quita marcas diacriticas (tildes)
}

export function responderConReglas(
  mensaje: string,
  casos: CasoConDetalle[]
): string {
  const q = normalizar(mensaje);

  if (casos.length === 0) {
    return "Todavía no tienes casos registrados en LEGALY. En cuanto tu abogado cargue tu proceso, podré darte información aquí.";
  }

  const incluye = (...palabras: string[]) => palabras.some((p) => q.includes(p));

  // Saludo
  if (incluye("hola", "buenas", "buenos dias", "buenas tardes") && q.length < 25) {
    return "¡Hola! Soy tu asistente de LEGALY. Puedo decirte cuándo es tu próxima audiencia, en qué paso está tu proceso o cuál fue el último movimiento. ¿Qué necesitas?";
  }

  // Audiencias
  if (incluye("audiencia", "cuando", "cita", "fecha")) {
    const items = casos
      .map((c) => {
        const prox = proximaAudiencia(c);
        if (!prox) return null;
        return `• ${c.materia} (Exp. ${c.numeroExpediente}): ${formatFechaHora(prox.fecha)} — ${relativo(prox.fecha)}. ${prox.tipo}, ${prox.modalidad}${prox.lugar ? ", " + prox.lugar : ""}.`;
      })
      .filter(Boolean);
    if (items.length === 0) {
      return "No tienes audiencias agendadas por el momento. Tu abogado las cargará en cuanto se fije una fecha.";
    }
    return `Tu(s) próxima(s) audiencia(s):\n${items.join("\n")}`;
  }

  // Estado / paso del proceso
  if (incluye("paso", "estado", "etapa", "proceso", "va", "situacion")) {
    const items = casos.map((c) => {
      const ult = ultimoMovimiento(c);
      return `• ${c.materia} (Exp. ${c.numeroExpediente}): estado "${c.estado}".${ult ? ` Último movimiento: ${ult.descripcion} (${formatFecha(ult.fecha)}).` : ""}`;
    });
    return `El estado de tu(s) proceso(s):\n${items.join("\n")}`;
  }

  // Movimientos / novedades
  if (incluye("movimiento", "novedad", "actualizacion", "ultimo", "paso reciente")) {
    const items = casos.map((c) => {
      const ult = ultimoMovimiento(c);
      return `• ${c.materia} (Exp. ${c.numeroExpediente}): ${ult ? `${ult.descripcion} (${formatFecha(ult.fecha)})` : "sin movimientos registrados"}.`;
    });
    return `Últimos movimientos:\n${items.join("\n")}`;
  }

  // Abogado
  if (incluye("abogado", "abogada", "quien lleva", "responsable")) {
    const items = casos.map(
      (c) => `• ${c.materia} (Exp. ${c.numeroExpediente}): ${c.abogado.name}.`
    );
    return `Abogado(s) a cargo de tu(s) caso(s):\n${items.join("\n")}`;
  }

  // Numero de expediente
  if (incluye("expediente", "numero", "causa")) {
    const items = casos.map((c) => `• ${c.materia}: ${c.numeroExpediente}.`);
    return `Tus números de expediente:\n${items.join("\n")}`;
  }

  // Fallback con resumen
  const resumen = casos
    .map((c) => {
      const prox = proximaAudiencia(c);
      return `• ${c.materia} (Exp. ${c.numeroExpediente}) — estado "${c.estado}"${prox ? `, próxima audiencia ${relativo(prox.fecha)}` : ""}.`;
    })
    .join("\n");
  return `No estoy seguro de haber entendido, pero aquí tienes un resumen de tus casos:\n${resumen}\n\nPuedes preguntarme por tu "próxima audiencia", "en qué paso está mi proceso" o el "último movimiento".`;
}

// --- Modo Claude ------------------------------------------------------------

export async function responderConClaude(
  mensaje: string,
  contexto: string
): Promise<string> {
  // Importacion dinamica: el SDK es opcional. Si no esta instalado,
  // esto falla y el endpoint cae automaticamente al modo reglas.
  const mod = await import("@anthropic-ai/sdk");
  const Anthropic = mod.default;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const system = `Eres el asistente administrativo de LEGALY, una plataforma legal en Ecuador.
Respondes preguntas de un cliente SOLO sobre sus propios casos, usando EXCLUSIVAMENTE la información que aparece abajo.
Reglas estrictas:
- NUNCA inventes fechas, números de expediente, juzgados ni movimientos. Si el dato no está abajo, di claramente que aún no está registrado y que su abogado lo cargará.
- No des asesoría legal ni opiniones jurídicas. Solo información administrativa (audiencias, estado, movimientos, datos del caso).
- Responde en español, de forma breve, clara y amable.

INFORMACIÓN DE LOS CASOS DEL CLIENTE:
${contexto}`;

  const res = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 500,
    system,
    messages: [{ role: "user", content: mensaje }],
  });

  const bloque = res.content.find((b: any) => b.type === "text");
  return bloque && bloque.type === "text"
    ? bloque.text
    : "No pude generar una respuesta en este momento.";
}
