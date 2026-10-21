import { db } from "@/lib/db";
import { jsonError, RespuestaJson } from "@/lib/sesion";
import { anularVencidos, genCodigo } from "@/lib/negocio";
import { z } from "zod";

const esquema = z.object({
  items: z.array(z.object({ productoId: z.number().int().positive(), cantidad: z.number().int().min(1).max(30) })).min(1, "El carrito está vacío."),
  mostrar: z.boolean().optional(), // pedidos creados desde caja no van por QR
});

/** POST /api/pedidos — envío de carrito (QR y caja). Reserva stock en la misma transacción. */
export async function POST(req: Request) {
  try {
    const parsed = esquema.safeParse(await req.json());
    if (!parsed.success) throw new RespuestaJson(400, { error: "Formato de carrito inválido." });
    await anularVencidos();

    const creada = await db.$transaction(async (tx) => {
      const productos = await tx.producto.findMany({
        where: { id: { in: parsed.data.items.map((i) => i.productoId) } },
        include: { categoria: true },
      });
      const mapa = new Map(productos.map((p) => [p.id, p]));

      const items = parsed.data.items.map((i) => {
        const p = mapa.get(i.productoId);
        if (!p || !p.disponible) throw new RespuestaJson(400, { error: "Un producto del carrito ya no está disponible. Actualiza el menú." });
        if (p.stock < i.cantidad) {
          throw new RespuestaJson(409, { error: `Solo quedan ${p.stock} uds de «${p.nombre}». Revisa tu carrito.` });
        }
        return { productoId: p.id, nombre: p.nombre, tipo: p.categoria.tipo, precio: p.precio, cantidad: i.cantidad };
      });

      const total = items.reduce((t, i) => t + Number(i.precio) * i.cantidad, 0);
      const nuevoPedido = await tx.pedido.create({
        data: {
          codigo: genCodigo(),
          total,
          validoHasta: new Date(Date.now() + 40 * 60 * 1000),
          items: {
            create: items.map((i) => ({
              productoId: i.productoId,
              nombre: i.nombre,
              tipo: i.tipo,
              precio: i.precio,
              cantidad: i.cantidad,
            })),
          },
        },
        select: { id: true, codigo: true, validoHasta: true, total: true },
      });

      // Descuento atómico de stock dentro de la misma transacción (Invariante 1)
      for (const i of items) {
        await tx.producto.update({
          where: { id: i.productoId },
          data: { stock: { decrement: i.cantidad } },
        });
      }

      return nuevoPedido;
    });

    return Response.json({ ok: true, numero: creada.id, codigo: creada.codigo, validoHasta: creada.validoHasta, total: creada.total }, { status: 201 });
  } catch (e) {
    return jsonError(e);
  }
}
