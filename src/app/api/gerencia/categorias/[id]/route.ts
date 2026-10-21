import { db } from "@/lib/db";
import { jsonError, RespuestaJson, exigirRol } from "@/lib/sesion";
import { z } from "zod";

const esquema = z.object({
  nombre: z.string().trim().min(2).max(40).optional(),
  tipo: z.enum(["PLATOS", "BEBIDAS", "POSTRES"]).optional(),
  orden: z.number().int().optional(),
  activa: z.boolean().optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const s = await exigirRol(["ADMIN"]);
    const { id } = await ctx.params;
    const parsed = esquema.safeParse(await req.json());
    if (!parsed.success) throw new RespuestaJson(400, { error: "Datos inválidos." });
    const c = await db.categoria.update({ where: { id: Number(id) }, data: parsed.data }).catch(() => null);
    if (!c) throw new RespuestaJson(409, { error: "No se pudo actualizar (¿nombre duplicado?)." });
    await db.auditoria.create({
      data: { usuarioId: s.id, usuarioNombre: `${s.nombre} ${s.apellidos}`, accion: "CATEGORIA", detalle: { editada: c.nombre, cambios: parsed.data } },
    });
    return Response.json({ ok: true, categoria: c });
  } catch (e) {
    return jsonError(e);
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const s = await exigirRol(["ADMIN"]);
    const { id } = await ctx.params;
    const conProductos = await db.producto.count({ where: { categoriaId: Number(id) } });
    if (conProductos > 0) {
      // desactiva en lugar de borrar para preservar historial
      const c = await db.categoria.update({ where: { id: Number(id) }, data: { activa: false } });
      await db.auditoria.create({
        data: { usuarioId: s.id, usuarioNombre: `${s.nombre} ${s.apellidos}`, accion: "CATEGORIA", justificacion: `Tiene ${conProductos} productos: se desactivó para conservar el historial`, detalle: { desactivada: c.nombre } },
      });
      return Response.json({ ok: true, desactivada: true });
    }
    const c = await db.categoria.delete({ where: { id: Number(id) } });
    await db.auditoria.create({
      data: { usuarioId: s.id, usuarioNombre: `${s.nombre} ${s.apellidos}`, accion: "CATEGORIA", justificacion: "Categoría sin productos", detalle: { borrada: c.nombre } },
    });
    return Response.json({ ok: true, borrada: true });
  } catch (e) {
    return jsonError(e);
  }
}
