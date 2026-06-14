import { PrismaClient } from "@prisma/client";

// Reutiliza una sola instancia de Prisma en desarrollo para evitar
// abrir muchas conexiones cuando Next.js recarga el codigo.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
