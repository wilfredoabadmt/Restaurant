import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "./db";

const CLAVE = new TextEncoder().encode(process.env.AUTH_KEY ?? "clave-desarrollo-con-32-caracteres-minimo!");
const COOKIE = "lp_sesion";
const DURACION_MS = 1000 * 60 * 60 * 12; // 12 h

export type Sesion = { id: number; nombre: string; apellidos: string; rol: "ADMIN" | "CAJERO" };

export async function crearSesion(s: Sesion) {
  const token = await new SignJWT({ ...s })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("12h")
    .sign(CLAVE);
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: DURACION_MS / 1000,
  });
}

export async function cerrarSesion() {
  (await cookies()).delete(COOKIE);
}

export async function leerSesion(): Promise<Sesion | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, CLAVE);
    // verificar que el usuario siga activo
    const u = await db.usuario.findUnique({ where: { id: Number(payload.id) } });
    if (!u || !u.activo) return null;
    return { id: u.id, nombre: u.nombre, apellidos: u.apellidos, rol: u.rol };
  } catch {
    return null;
  }
}

export async function exigirSesion(): Promise<Sesion> {
  const s = await leerSesion();
  if (!s) throw new RespuestaJson(401, { error: "Sesión expirada. Vuelve a entrar." });
  return s;
}

export async function exigirRol(roles: ("ADMIN" | "CAJERO")[]): Promise<Sesion> {
  const s = await exigirSesion();
  if (!roles.includes(s.rol)) throw new RespuestaJson(403, { error: "No tienes permisos para esta acción." });
  return s;
}

/** Respuesta JSON estandarizada para errores de negocio. */
export class RespuestaJson extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown) {
    super(JSON.stringify(body));
    this.status = status;
    this.body = body;
  }
}

export function jsonError(e: unknown) {
  if (e instanceof RespuestaJson) return Response.json(e.body, { status: e.status });
  console.error("[api]", e);
  return Response.json({ error: "Error inesperado del servidor." }, { status: 500 });
}
