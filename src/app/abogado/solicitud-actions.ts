"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

async function requireAsignado(solicitudId: string) {
  const session = getSession();
  if (!session || (session.role !== "ABOGADO" && session.role !== "ADMIN")) {
    throw new Error("No autorizado");
  }
  const solicitud = await prisma.solicitud.findUnique({ where: { id: solicitudId } });
  if (!solicitud || (solicitud.abogadoId !== session.id && session.role !== "ADMIN")) {
    throw new Error("No autorizado");
  }
  return solicitud;
}

export async function marcarResuelta(formData: FormData) {
  const id = String(formData.get("solicitudId"));
  await requireAsignado(id);
  await prisma.solicitud.update({
    where: { id },
    data: { estado: "Resuelta", resueltaAt: new Date() },
  });
  revalidatePath(`/abogado/solicitud/${id}`);
  revalidatePath("/abogado");
}

export async function reabrir(formData: FormData) {
  const id = String(formData.get("solicitudId"));
  await requireAsignado(id);
  await prisma.solicitud.update({
    where: { id },
    data: { estado: "En progreso", resueltaAt: null },
  });
  revalidatePath(`/abogado/solicitud/${id}`);
  revalidatePath("/abogado");
}
