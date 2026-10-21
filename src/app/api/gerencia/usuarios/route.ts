import { db } from "@/lib/db";
import { jsonError, RespuestaJson, exigirRol } from "@/lib/sesion";
import bcrypt from "bcryptjs";
import { z } from "zod";

export async function GET() {
  try {
    await exigirRol(["ADMIN"]);
    const usuarios = await db.usuario.findMany({
      orderBy: [{ rol: "asc" }, { nombre: "asc" }],
    });
    return Response.json({
      usuarios: usuarios.map((u) => ({
        id: u.id,
        usuario: u.usuario,
        nombre: u.nombre,
        apellidos: u.apellidos,
        rol: u.rol,
        activo: u.activo,
        creadoEn: u.creadoEn,
      })),
    });
  } catch (e) {
    return jsonError(e);
  }
}

const esquema = z.object({
  usuario: z.string().trim().regex(/^[a-zA-Z0-9._-]{3,20}$/, "Usuario: 3-20 letras/números"),
  nombre: z.string().trim().min(2).max(40),
  apellidos: z.string().trim().min(2).max(60),
  password: z.string().min(6, "La contraseña debe tener 6+ caracteres").max(40),
});

export async function POST(req: Request) {
  try {
    const s = await exigirRol(["ADMIN"]);
    const parsed = esquema.safeParse(await req.json());
    if (!parsed.success) throw new RespuestaJson(400, { error: parsed.error.issues[0]?.message ?? "Datos inválidos." });
    const { usuario, nombre, apellidos, password } = parsed.data;

    const nuevo = await db.usuario
      .create({
        data: {
          usuario,
          nombre,
          apellidos,
          password: await bcrypt.hash(password, 10),
          rol: "CAJERO",
        },
      })
      .catch(() => {
        throw new RespuestaJson(409, { error: "Ese nombre de usuario ya está en uso." });
      });
    await db.auditoria.create({
      data: {
        usuarioId: s.id,
        usuarioNombre: `${s.nombre} ${s.apellidos}`,
        accion: "CAJERO",
        detalle: { creado: `${nuevo.nombre} ${nuevo.apellidos}`, usuario: nuevo.usuario },
      },
    });
    return Response.json({ ok: true }, { status: 201 });
  } catch (e) {
    return jsonError(e);
  }
}
