import crypto from "crypto";
import { cookies } from "next/headers";

// Sesion simple y segura para un MVP: un token firmado con HMAC que guarda
// el id, nombre y rol del usuario. No se puede falsificar sin el SESSION_SECRET.
// Para produccion a gran escala se puede migrar a una libreria como next-auth.

const COOKIE_NAME = "legaly_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 dias

export type Session = {
  id: string;
  name: string;
  role: "CLIENTE" | "ABOGADO" | "ADMIN";
  exp: number;
};

function getSecret(): string {
  return process.env.SESSION_SECRET || "secreto-de-desarrollo-cambialo";
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

export function createToken(data: Omit<Session, "exp">): string {
  const payload: Session = {
    ...data,
    exp: Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS,
  };
  const body = b64url(JSON.stringify(payload));
  const sig = crypto
    .createHmac("sha256", getSecret())
    .update(body)
    .digest("base64url");
  return `${body}.${sig}`;
}

export function verifyToken(token: string | undefined): Session | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = crypto
    .createHmac("sha256", getSecret())
    .update(body)
    .digest("base64url");
  // Comparacion en tiempo constante para evitar timing attacks.
  if (
    sig.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  ) {
    return null;
  }
  try {
    const session = JSON.parse(Buffer.from(body, "base64url").toString()) as Session;
    if (session.exp < Math.floor(Date.now() / 1000)) return null;
    return session;
  } catch {
    return null;
  }
}

// Guarda la cookie de sesion (usar dentro de un route handler o server action).
export function setSessionCookie(data: Omit<Session, "exp">) {
  cookies().set(COOKIE_NAME, createToken(data), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE_SECONDS,
    path: "/",
  });
}

export function clearSessionCookie() {
  cookies().delete(COOKIE_NAME);
}

// Lee la sesion actual desde la cookie. Devuelve null si no hay sesion valida.
export function getSession(): Session | null {
  return verifyToken(cookies().get(COOKIE_NAME)?.value);
}
