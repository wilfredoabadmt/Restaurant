import { db } from "@/lib/db";
import { jsonError, RespuestaJson, exigirRol } from "@/lib/sesion";
import { etiqueta } from "@/lib/negocio";
import { z } from "zod";

const esquema = z.object({
  metodoPago: z.enum(["EFECTIVO", "QR"]),
  servicio: z.enum(["EN_LOCAL", "PARA_LLEVAR"]),
  montoRecibido: z.number().positive().optional(),
});

/** POST /api/pedidos/[id]/pagar — cobra el pedido. Genera datos para comandas. */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const s = await exigirRol(["CAJERO", "ADMIN"]);
    const { id } = await ctx.params;
    const idP = Number(id);
    const parsed = esquema.safeParse(await req.json());
    if (!parsed.success) throw new RespuestaJson(400, { error: "Elige el método de pago y el tipo de servicio." });
    const { metodoPago, servicio, montoRecibido } = parsed.data;

    const submit = await db.$transaction(async (tx) => {
      const p = await tx.pedido.findUnique({ where: { id: idP }, include: { items: true } });
      if (!p) throw new RespuestaJson(404, { error: "Pedido no encontrado." });
      if (p.estado === "PAGADO") throw new RespuestaJson(409, { error: "Este pedido ya fue cobrado." });
      if (p.estado === "ANULADO") throw new RespuestaJson(409, { error: "No se puede cobrar un pedido anulado." });

      const total = Number(p.total);
      let vuelto = 0;
      if (metodoPago === "EFECTIVO") {
        if (!montoRecibido || montoRecibido < total) {
          throw new RespuestaJson(400, { error: `El monto recibido debe ser al menos el total (${total.toFixed(2)} Bs).` });
        }
        vuelto = Number((montoRecibido - total).toFixed(2));
      }

      const pedidoActualizado = await tx.pedido.update({
        where: { id: idP },
        data: { estado: "PAGADO", metodoPago, servicio, montoRecibido: montoRecibido ?? null, vuelto: metodoPago === "EFECTIVO" ? vuelto : null, pagadoEn: new Date() },
        include: { items: true },
      });

      await tx.auditoria.create({
        data: {
          usuarioId: s.id,
          usuarioNombre: `${s.nombre} ${s.apellidos}`,
          pedidoId: idP,
          accion: "PAGADO",
          detalle: { total: pedidoActualizado.total, metodoPago, servicio },
        },
      });

      return pedidoActualizado;
    });

    const cocina = submit.items.filter((i) => i.tipo === "PLATOS");
    const barra = submit.items.filter((i) => i.tipo !== "PLATOS");
    return Response.json({
      ok: true,
      numero: etiqueta(idP),
      codigo: submit.codigo ?? etiqueta(idP),
      vuelto: submit.vuelto,
      comandas: {
        cocina: cocina.map((i) => ({ nombre: i.nombre, cantidad: i.cantidad })),
        barra: barra.map((i) => ({ nombre: i.nombre, cantidad: i.cantidad })),
      },
    });
  } catch (e) {
    return jsonError(e);
  }
}
