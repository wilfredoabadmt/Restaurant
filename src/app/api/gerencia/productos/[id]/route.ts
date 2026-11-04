import { db } from "@/lib/db";
import { jsonError, RespuestaJson, exigirRol } from "@/lib/sesion";
import { z } from "zod";

const esquema = z.object({
  nombre: z.string().trim().min(2).max(60).optional(),
  descripcion: z.string().trim().max(300).optional(),
  precio: z.number().positive().max(9999).optional(),
  categoriaId: z.number().int().positive().optional(),
  stock: z.number().int().min(0).max(999).optional(),
  stockMin: z.number().int().min(0).max(99).optional(),
  disponible: z.boolean().optional(),
  imagen: z.string().max(120).optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const s = await exigirRol(["ADMIN"]);
    const { id } = await ctx.params;
    const parsed = esquema.safeParse(await req.json());
    if (!parsed.success) throw new RespuestaJson(400, { error: "Datos inválidos." });

    const antes = await db.producto.findUnique({ where: { id: Number(id) }, include: { categoria: true } });
    if (!antes) throw new RespuestaJson(404, { error: "Producto no encontrado." });

    const p = await db.producto
      .update({ where: { id: Number(id) }, data: parsed.data, include: { categoria: true } })
      .catch(() => {
        throw new RespuestaJson(409, { error: "No se pudo actualizar (posible nombre duplicado)." });
      });

    // reposición de stock → auditoría distinta
    if (parsed.data.stock !== undefined && parsed.data.stock > antes.stock) {
      await db.auditoria.create({
        data: {
          usuarioId: s.id,
          usuarioNombre: `${s.nombre} ${s.apellidos}`,
          accion: "REPOSICION",
          detalle: { producto: p.nombre, stockAntes: antes.stock, stockDespues: p.stock },
        },
      });
    } else {
      await db.auditoria.create({
        data: {
          usuarioId: s.id,
          usuarioNombre: `${s.nombre} ${s.apellidos}`,
          accion: "PRODUCTO",
          detalle: { editado: p.nombre, cambios: parsed.data },
        },
      });
    }
    return Response.json({ ok: true, producto: p });
  } catch (e) {
    return jsonError(e);
  }
}

/** DELETE — eliminación total o baja lógica según parámetro query o si tiene historial de pedidos. */
export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const s = await exigirRol(["ADMIN"]);
    const { id } = await ctx.params;
    const prodId = Number(id);

    const url = new URL(req.url);
    const hardDelete = url.searchParams.get("hard") === "true";

    // Verificar si el producto tiene historial de pedidos vinculados
    const tienePedidos = await db.pedidoItem.count({ where: { productoId: prodId } });

    if (hardDelete && tienePedidos === 0) {
      // Eliminación física si no tiene relaciones
      const p = await db.producto.delete({ where: { id: prodId } });
      await db.auditoria.create({
        data: {
          usuarioId: s.id,
          usuarioNombre: `${s.nombre} ${s.apellidos}`,
          accion: "PRODUCTO",
          justificacion: "Eliminación completa del producto",
          detalle: { eliminadoFisico: p.nombre },
        },
      });
      return Response.json({ ok: true, tipo: "eliminado" });
    }

    // Baja lógica (si ya fue vendido o se solicita borrado estándar)
    const p = await db.producto.update({ where: { id: prodId }, data: { disponible: false } }).catch(() => null);
    if (!p) throw new RespuestaJson(404, { error: "Producto no encontrado." });
    await db.auditoria.create({
      data: {
        usuarioId: s.id,
        usuarioNombre: `${s.nombre} ${s.apellidos}`,
        accion: "PRODUCTO",
        justificacion: "Baja del menú (disponible = false)",
        detalle: { dadoDeBaja: p.nombre, tieneHistorialVentas: tienePedidos > 0 },
      },
    });
    return Response.json({ ok: true, tipo: "desactivado", tieneHistorial: tienePedidos > 0 });
  } catch (e) {
    return jsonError(e);
  }
}
