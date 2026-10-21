import { db } from "@/lib/db";
import { jsonError, RespuestaJson, exigirRol } from "@/lib/sesion";
import bcrypt from "bcryptjs";
import { z } from "zod";

const esquema = z.object({
  activo: z.boolean().optional(),
  password: z.string().min(6).max(40).optional(),
  nombre: z.string().trim().min(2).optional(),
  apellidos: z.string().trim().min(2).optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const s = await exigirRol(["ADMIN"]);
    const { id } = await ctx.params;
    const parsed = esquema.safeParse(await req.json());
    if (!parsed.success) throw new RespuestaJson(400, { error: "Datos inválidos." });

    const objetivo = await db.usuario.findUnique({ where: { id: Number(id) } });
    if (!objetivo) throw new RespuestaJson(404, { error: "Usuario no encontrado." });
    if (objetivo.rol === "ADMIN" && parsed.data.activo === false) throw new RespuestaJson(409, { error: "No se puede desactivar la cuenta de gerencia." });

    const data: Record<string, unknown> = {};
    if (parsed.data.activo !== undefined) data.activo = parsed.data.activo;
    if (parsed.data.nombre) data.nombre = parsed.data.nombre;
    if (parsed.data.apellidos) data.apellidos = parsed.data.apellidos;
    if (parsed.data.password) data.password = await bcrypt.hash(parsed.data.password, 10);

    await db.usuario.update({ where: { id: Number(id) }, data });
    await db.auditoria.create({
      data: {
        usuarioId: s.id,
        usuarioNombre: `${s.nombre} ${s.apellidos}`,
        accion: "CAJERO",
        detalle: { usuario: objetivo.usuario, cambios: Object.keys(data).map((k) => (k === "password" ? "password" : k)) },
      },
    });
    return Response.json({ ok: true });
  } catch (e) {
    return jsonError(e);
  }
}
