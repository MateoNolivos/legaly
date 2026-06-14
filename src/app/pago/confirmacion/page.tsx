import { redirect } from "next/navigation";
import Logo from "@/components/Logo";
import AutoRedirect from "@/components/AutoRedirect";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { codigoAPlan } from "@/lib/constantes";
import { notificar } from "@/lib/notificaciones";

export const dynamic = "force-dynamic";

const TOKEN = process.env.NEXT_PUBLIC_PAYPHONE_TOKEN || process.env.PAYPHONE_TOKEN || "";
const CONFIRM_URL = "https://paymentbox.payphonetodoesposible.com/api/confirm";

export default async function ConfirmacionPagoPage({
  searchParams,
}: {
  searchParams: { id?: string; clientTransactionId?: string; clientTxId?: string };
}) {
  const session = getSession();
  if (!session) redirect("/login");

  const id = searchParams.id;
  const clientTxId = searchParams.clientTransactionId || searchParams.clientTxId;

  let aprobado = false;
  let mensaje = "El pago no se completó. Puedes intentarlo de nuevo.";

  if (!id || !clientTxId) {
    mensaje = "No recibimos los datos del pago.";
  } else if (!TOKEN) {
    mensaje = "La pasarela no está configurada.";
  } else {
    const plan = codigoAPlan(String(clientTxId).split("-")[1] || "");
    try {
      const res = await fetch(CONFIRM_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${TOKEN}` },
        body: JSON.stringify({ id: Number(id), clientTxId: String(clientTxId) }),
        cache: "no-store",
      });
      const pp = await res.json();
      console.log("[pago] statusCode:", pp?.statusCode, "plan:", plan?.id, "usuario:", session.id);

      if (pp?.statusCode === 3) {
        if (!plan) {
          mensaje = "Pago aprobado, pero no identificamos el plan. Contáctanos.";
        } else {
          try {
            await prisma.suscripcion.updateMany({
              where: { usuarioId: session.id, estado: "Activa" },
              data: { estado: "Cancelada", fin: new Date() },
            });
            await prisma.suscripcion.create({
              data: { usuarioId: session.id, plan: plan.id, precio: plan.precio, descuento: plan.descuento },
            });
            console.log("[pago] Suscripción creada:", plan.id);
            await notificar({
              usuarioId: session.id,
              tipo: "pago",
              titulo: "Pago confirmado",
              cuerpo: `tu plan ${plan.id} quedó activo. ¡Gracias por confiar en LEGALY!`,
              url: "/cliente",
            });
          } catch (dbErr) {
            // El pago YA se aprobó; aunque falle el guardado, dejamos pasar y lo registramos.
            console.error("[pago] Error guardando suscripción:", dbErr);
          }
          aprobado = true;
        }
      } else {
        mensaje = `El pago no se completó${pp?.message ? ` (${pp.message})` : ""}. Puedes intentarlo de nuevo.`;
      }
    } catch (e) {
      console.error("[pago] Error confirmando:", e);
      mensaje = "No se pudo contactar a Payphone. Intenta de nuevo.";
    }
  }

  if (aprobado) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <div className="flex justify-center mb-4"><Logo size={38} /></div>
          <div className="text-4xl mb-3">✅</div>
          <p className="text-slate-800 font-medium">¡Pago aprobado!</p>
          <p className="text-sm text-slate-500 mt-1">Tu plan quedó activo. Te llevamos a tu panel…</p>
          <a href="/cliente" target="_top" className="inline-block mt-5 bg-brand text-white rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-brand-dark">
            Ir a mi panel
          </a>
          <AutoRedirect href="/cliente" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 p-8 text-center">
        <div className="flex justify-center mb-4"><Logo size={38} /></div>
        <div className="text-4xl mb-3">⚠️</div>
        <p className="text-slate-700">{mensaje}</p>
        <a href="/registro/plan" target="_top" className="inline-block mt-5 text-brand font-medium hover:underline">
          Volver a intentar
        </a>
      </div>
    </main>
  );
}
