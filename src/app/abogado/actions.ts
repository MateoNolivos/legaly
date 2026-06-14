"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

function requireAbogado() {
  const session = getSession();
  if (!session || (session.role !== "ABOGADO" && session.role !== "ADMIN")) {
    throw new Error("No autorizado");
  }
  return session;
}

export async function crearCaso(formData: FormData) {
  const session = requireAbogado();
  await prisma.caso.create({
    data: {
      numeroExpediente: String(formData.get("numeroExpediente") || "").trim(),
      materia: String(formData.get("materia") || "").trim(),
      juzgado: String(formData.get("juzgado") || "").trim() || null,
      estado: String(formData.get("estado") || "En trámite").trim(),
      clienteId: String(formData.get("clienteId")),
      abogadoId: session.id,
    },
  });
  revalidatePath("/abogado");
}

export async function agregarAudiencia(formData: FormData) {
  requireAbogado();
  const casoId = String(formData.get("casoId"));
  const fechaStr = String(formData.get("fecha")); // "2026-06-23T09:00"
  await prisma.audiencia.create({
    data: {
      casoId,
      fecha: new Date(fechaStr),
      tipo: String(formData.get("tipo") || "Audiencia").trim(),
      modalidad: String(formData.get("modalidad") || "Presencial"),
      lugar: String(formData.get("lugar") || "").trim() || null,
    },
  });
  revalidatePath(`/abogado/casos/${casoId}`);
}

export async function agregarMovimiento(formData: FormData) {
  requireAbogado();
  const casoId = String(formData.get("casoId"));
  const fechaStr = String(formData.get("fecha") || "");
  await prisma.movimiento.create({
    data: {
      casoId,
      descripcion: String(formData.get("descripcion") || "").trim(),
      fecha: fechaStr ? new Date(fechaStr) : new Date(),
    },
  });
  revalidatePath(`/abogado/casos/${casoId}`);
}

export async function actualizarEstado(formData: FormData) {
  requireAbogado();
  const casoId = String(formData.get("casoId"));
  await prisma.caso.update({
    where: { id: casoId },
    data: { estado: String(formData.get("estado") || "").trim() },
  });
  revalidatePath(`/abogado/casos/${casoId}`);
}
