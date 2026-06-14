import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { codigoAPlan } from "@/lib/constantes";

const TOKEN = process.env.NEXT_PUBLIC_PAYPHONE_TOKEN || process.env.PAYPHONE_TOKEN || "";
const CONFIRM_URL = "https://paymentbox.payphonetodoesposible.com/api/confirm";

export async function POST(req: Request) {
  const session = getSession();
  if (!session || session.role !== "CLIENTE") {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  if (!TOKEN) {
    return NextResponse.json({ error: "La pasarela no está configurada." }, { status: 500 });
  }

  const { id, clientTxId } = await req.json().catch(() => ({}));
  if (!id || !clientTxId) {
    return NextResponse.json({ error: "Faltan datos del pago." }, { status: 400 });
  }

  // El plan viene codificado en el clientTransactionId: "LG-<codigo>-<timestamp>".
  const codigo = String(clientTxId).split("-")[1] || "";
  const plan = codigoAPlan(codigo);
  if (!plan) {
    return NextResponse.json({ error: "No se pudo identificar el plan." }, { status: 400 });
  }

  // Confirma la transacción con Payphone.
  let payphone: any;
  try {
    const res = await fetch(CONFIRM_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TOKEN}`,
      },
      body: JSON.stringify({ id: Number(id), clientTxId: String(clientTxId) }),
    });
    payphone = await res.json();
  } catch (e) {
    console.error("[pago] Error al contactar Payphone:", e);
    return NextResponse.json({ error: "No se pudo contactar a Payphone." }, { status: 502 });
  }

  console.log("[pago] Respuesta Payphone:", JSON.stringify(payphone));

  // statusCode 3 = aprobada.
  if (payphone?.statusCode === 3) {
    await prisma.suscripcion.updateMany({
      where: { usuarioId: session.id, estado: "Activa" },
      data: { estado: "Cancelada", fin: new Date() },
    });
    await prisma.suscripcion.create({
      data: {
        usuarioId: session.id,
        plan: plan.id,
        precio: plan.precio,
        descuento: plan.descuento,
      },
    });
    return NextResponse.json({ ok: true, aprobado: true, plan: plan.id });
  }

  return NextResponse.json({
    ok: true,
    aprobado: false,
    detalle: payphone?.message || payphone?.transactionStatus || null,
    statusCode: payphone?.statusCode ?? null,
  });
}
