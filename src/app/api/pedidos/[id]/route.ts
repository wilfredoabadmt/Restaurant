import { db } from "@/lib/db";
import { jsonError, RespuestaJson, exigirRol } from "@/lib/sesion";
import { anularVencidos, etiqueta } from "@/lib/negocio";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const Ctx = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  return { idP: Number(id) };
};

/** GET — estado para el cliente (público, sin datos de pago). */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { idP } = await Ctx(ctx);
    await anularVencidos();
    const p = await db.pedido.findUnique({
      where: { id: idP },
      include: { items: { orderBy: { id: "asc" } } },
    });
    if (!p) throw new RespuestaJson(404, { error: "Pedido no encontrado." });
    return Response.json({
      numero: etiqueta(p.id),
      codigo: p.codigo ?? etiqueta(p.id),
      alias: p.alias,
      celular: p.celular,
      estado: p.estado,
      servicio: p.servicio,
      total: p.total,
      validoHasta: p.validoHasta,
      anuladoEn: p.anuladoEn,
      motivoAnulacion: p.motivoAnulacion,
      creadoEn: p.creadoEn,
      items: p.items.map((i) => ({ nombre: i.nombre, tipo: i.tipo, precio: i.precio, cantidad: i.cantidad })),
    });
  } catch (e) {
    return jsonError(e);
  }
}

/** PATCH — cliente completa alias, celular y mensaje (solo pedidos sin pagar de hoy). */
const esquemaDatos = z.object({
  alias: z.string().trim().min(2, "Alias de 2 a 25 caracteres").max(25),
  celular: z.string().trim().regex(/^[67]\d{7}$/, "Celular boliviano: 8 dígitos que empieza en 6 o 7"),
  mensaje: z.string().trim().max(140).optional().or(z.literal("")),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { idP } = await Ctx(ctx);
    const parsed = esquemaDatos.safeParse(await req.json());
    if (!parsed.success) throw new RespuestaJson(400, { error: parsed.error.issues[0]?.message ?? "Datos inválidos." });
    const p = await db.pedido.findUnique({ where: { id: idP } });
    if (!p) throw new RespuestaJson(404, { error: "Pedido no encontrado." });
    if (p.estado === "PAGADO" || p.estado === "ANULADO") throw new RespuestaJson(409, { error: "Este pedido ya no admite cambios de datos." });
    await db.pedido.update({
      where: { id: idP },
      data: { alias: parsed.data.alias, celular: parsed.data.celular, mensaje: parsed.data.mensaje || null },
    });
    return Response.json({ ok: true });
  } catch (e) {
    return jsonError(e);
  }
}

/** PUT — caja modifica items/servicio; exige justificación (auditoría). */
const esquemaMod = z.object({
  items: z.array(z.object({ productoId: z.number().int().positive(), cantidad: z.number().int().min(1).max(30) })).min(1).optional(),
  servicio: z.enum(["EN_LOCAL", "PARA_LLEVAR"]).optional(),
  listo: z.boolean().optional(),
  justificacion: z.string().trim().min(5, "La modificación exige justificación (mínimo 5 caracteres).").max(200),
});

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const s = await exigirRol(["CAJERO", "ADMIN"]);
    const { idP } = await Ctx(ctx);
    const parsed = esquemaMod.safeParse(await req.json());
    if (!parsed.success) throw new RespuestaJson(400, { error: parsed.error.issues[0]?.message ?? "Datos inválidos." });
    const { items, servicio, listo, justificacion } = parsed.data;

    const actualizada = await db.$transaction(async (tx) => {
      const p = await tx.pedido.findUnique({ where: { id: idP }, include: { items: true } });
      if (!p) throw new RespuestaJson(404, { error: "Pedido no encontrado." });
      if (p.estado === "PAGADO" || p.estado === "ANULADO") {
        throw new RespuestaJson(409, { error: "No se puede modificar un pedido pagado o anulado (usa anulación de gerencia)." });
      }

      let nuevoTotal = Number(p.total);
      if (items) {
        // reintegra stock original y valida/reserva el nuevo
        for (const it of p.items) {
          if (it.productoId) await tx.producto.update({ where: { id: it.productoId }, data: { stock: { increment: it.cantidad } } });
        }
        const productos = await tx.producto.findMany({ where: { id: { in: items.map((i) => i.productoId) } }, include: { categoria: true } });
        const mapa = new Map(productos.map((pr) => [pr.id, pr]));
        const nuevos = items.map((i) => {
          const prod = mapa.get(i.productoId);
          if (!prod || !prod.disponible) throw new RespuestaJson(400, { error: "Producto no disponible." });
          if (prod.stock < i.cantidad) throw new RespuestaJson(409, { error: `Stock insuficiente de «${prod.nombre}» (${prod.stock} uds).` });
          return { productoId: prod.id, nombre: prod.nombre, tipo: prod.categoria.tipo, precio: prod.precio, cantidad: i.cantidad };
        });
        nuevoTotal = nuevos.reduce((t, i) => t + Number(i.precio) * i.cantidad, 0);
        await tx.pedidoItem.deleteMany({ where: { pedidoId: idP } });
        await tx.pedidoItem.createMany({ data: nuevos.map((i) => ({ ...i, pedidoId: idP })) });
        for (const n of nuevos) {
          await tx.producto.update({ where: { id: n.productoId }, data: { stock: { decrement: n.cantidad } } });
        }
      }

        const pedidoModificado = await tx.pedido.update({
          where: { id: idP },
          data: { servicio, estado: listo ? "LISTO" : undefined, total: new Prisma.Decimal(nuevoTotal) },
          include: { items: true },
        });

        await tx.auditoria.create({
          data: {
            usuarioId: s.id,
            usuarioNombre: `${s.nombre} ${s.apellidos}`,
            pedidoId: idP,
            accion: "MODIFICADO",
            justificacion,
            detalle: { total: pedidoModificado.total, servicio: pedidoModificado.servicio },
          },
        });

        return pedidoModificado;
      });

      return Response.json({ ok: true });
  } catch (e) {
    return jsonError(e);
  }
}

/** DELETE — caja elimina (con justificación obligatoria); registra snapshot. */
export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const s = await exigirRol(["CAJERO", "ADMIN"]);
    const { idP } = await Ctx(ctx);
    const { justificacion } = (await req.json()) as { justificacion?: string };
    if (!justificacion || justificacion.trim().length < 5) throw new RespuestaJson(400, { error: "La eliminación exige justificación." });

    const eliminado = await db.$transaction(async (tx) => {
      const p = await tx.pedido.findUnique({ where: { id: idP }, include: { items: true } });
      if (!p) throw new RespuestaJson(404, { error: "Pedido no encontrado." });
      if (p.estado === "PAGADO") throw new RespuestaJson(409, { error: "Un pedido pagado se anula desde gerencia, no se elimina." });
      if (p.estado !== "ANULADO") {
        for (const it of p.items) {
          if (it.productoId) await tx.producto.update({ where: { id: it.productoId }, data: { stock: { increment: it.cantidad } } });
        }
      }
      await tx.auditoria.create({
        data: {
          usuarioId: s.id,
          usuarioNombre: `${s.nombre} ${s.apellidos}`,
          accion: "ELIMINADO",
          justificacion,
          detalle: { numero: etiqueta(p.id), alias: p.alias, celular: p.celular, total: p.total, items: p.items.map((i) => ({ n: i.nombre, c: i.cantidad })) },
        },
      });
      return tx.pedido.delete({ where: { id: idP } });
    });

    return Response.json({ ok: true, eliminado: etiqueta(eliminado.id) });
  } catch (e) {
    return jsonError(e);
  }
}
