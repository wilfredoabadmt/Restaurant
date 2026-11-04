import { db } from "@/lib/db";
import { jsonError, RespuestaJson } from "@/lib/sesion";
import { anularVencidos, genCodigo } from "@/lib/negocio";
import { z } from "zod";

const esquema = z.object({
  items: z.array(z.object({ productoId: z.number().int().positive(), cantidad: z.number().int().min(1).max(30) })).min(1, "El carrito está vacío."),
  mostrar: z.boolean().optional(), // pedidos creados desde caja no van por QR
  mesaNumero: z.number().int().positive().optional(),
  mesaToken: z.string().trim().optional(),
  alias: z.string().trim().max(30).optional(),
});

/**
 * POST /api/pedidos — registro de pedidos (QR de mesa, menú general y caja).
 * REGLA DE NEGOCIO CRÍTICA:
 * El stock NO se descuenta aquí al crear el pedido.
 * Solo se verifica disponibilidad de los productos.
 * El descuento estricto de stock ocurre únicamente al pasar a PAGADO en el módulo de caja.
 * Si se recibe mesaToken y existe un pedido activo no pagado en la misma mesa, se agrupa o valida.
 */
export async function POST(req: Request) {
  try {
    const parsed = esquema.safeParse(await req.json());
    if (!parsed.success) throw new RespuestaJson(400, { error: "Formato de carrito inválido." });
    await anularVencidos();

    const { items: rawItems, mesaNumero, mesaToken, alias } = parsed.data;

    const creada = await db.$transaction(async (tx) => {
      // 1. Obtener los productos solicitados
      const productos = await tx.producto.findMany({
        where: { id: { in: rawItems.map((i) => i.productoId) } },
        include: { categoria: true },
      });
      const mapa = new Map(productos.map((p) => [p.id, p]));

      // 2. Validar disponibilidad de productos sin descontar stock todavía
      const itemsValidados = rawItems.map((i) => {
        const p = mapa.get(i.productoId);
        if (!p || !p.disponible) throw new RespuestaJson(400, { error: "Un producto del carrito ya no está disponible. Actualiza el menú." });
        if (p.stock < i.cantidad) {
          throw new RespuestaJson(409, { error: `Solo quedan ${p.stock} uds en almacén de «${p.nombre}». Revisa tu carrito.` });
        }
        return { productoId: p.id, nombre: p.nombre, tipo: p.categoria.tipo, precio: p.precio, cantidad: i.cantidad };
      });

      // 3. Manejo de agrupación por Mesa / Token de sesión QR para evitar duplicidad
      if (mesaNumero && mesaToken) {
        const pedidoActivoMesa = await tx.pedido.findFirst({
          where: {
            mesaNumero,
            mesaToken,
            estado: { in: ["REGISTRADO", "LISTO"] },
            validoHasta: { gt: new Date() },
          },
          include: { items: true },
        });

        if (pedidoActivoMesa) {
          // Si ya hay un pedido activo para este token/mesa, anexar los nuevos ítems a la misma cuenta
          for (const it of itemsValidados) {
            const itemExistente = pedidoActivoMesa.items.find((x) => x.productoId === it.productoId);
            if (itemExistente) {
              await tx.pedidoItem.update({
                where: { id: itemExistente.id },
                data: { cantidad: itemExistente.cantidad + it.cantidad },
              });
            } else {
              await tx.pedidoItem.create({
                data: {
                  pedidoId: pedidoActivoMesa.id,
                  productoId: it.productoId,
                  nombre: it.nombre,
                  tipo: it.tipo,
                  precio: it.precio,
                  cantidad: it.cantidad,
                },
              });
            }
          }

          // Recalcular total del pedido agrupado
          const todosItems = await tx.pedidoItem.findMany({ where: { pedidoId: pedidoActivoMesa.id } });
          const nuevoTotal = todosItems.reduce((acc, x) => acc + Number(x.precio) * x.cantidad, 0);

          const pedidoActualizado = await tx.pedido.update({
            where: { id: pedidoActivoMesa.id },
            data: { total: nuevoTotal },
            select: { id: true, codigo: true, validoHasta: true, total: true },
          });

          return pedidoActualizado;
        }
      }

      // 4. Crear nuevo pedido
      const total = itemsValidados.reduce((t, i) => t + Number(i.precio) * i.cantidad, 0);
      const aliasFinal = alias || (mesaNumero ? `Mesa ${mesaNumero}` : "Pendiente");

      const nuevoPedido = await tx.pedido.create({
        data: {
          codigo: genCodigo(),
          alias: aliasFinal,
          mesaNumero: mesaNumero ?? null,
          mesaToken: mesaToken ?? null,
          total,
          validoHasta: new Date(Date.now() + 40 * 60 * 1000),
          items: {
            create: itemsValidados.map((i) => ({
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

      return nuevoPedido;
    });

    return Response.json(
      { ok: true, numero: creada.id, codigo: creada.codigo, validoHasta: creada.validoHasta, total: creada.total },
      { status: 201 }
    );
  } catch (e) {
    return jsonError(e);
  }
}
