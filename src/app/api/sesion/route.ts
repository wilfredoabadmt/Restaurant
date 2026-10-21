import { db } from "@/lib/db";
import { crearSesion, cerrarSesion, leerSesion, jsonError, RespuestaJson } from "@/lib/sesion";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { usuario, password } = (await req.json()) as { usuario?: string; password?: string };
    if (!usuario || !password) throw new RespuestaJson(400, { error: "Escribe tu usuario y contraseña." });
    const u = await db.usuario.findUnique({ where: { usuario: usuario.trim() } });
    if (!u || !u.activo || !(await bcrypt.compare(password, u.password))) {
      throw new RespuestaJson(401, { error: "Usuario o contraseña incorrectos." });
    }
    await crearSesion({ id: u.id, nombre: u.nombre, apellidos: u.apellidos, rol: u.rol });
    return Response.json({ ok: true, rol: u.rol, redirigir: u.rol === "ADMIN" ? "/gerencia" : "/panel" });
  } catch (e) {
    return jsonError(e);
  }
}

export async function GET() {
  const s = await leerSesion();
  return Response.json({ sesion: s });
}

export async function DELETE() {
  await cerrarSesion();
  return Response.json({ ok: true });
}
