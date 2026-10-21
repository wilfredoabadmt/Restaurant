import { db } from "@/lib/db";
import { jsonError, RespuestaJson, exigirRol } from "@/lib/sesion";
import { etiqueta } from "@/lib/negocio";
import { z } from "zod";

const esquema = z.object({
  motivo: z.string().trim().min(5, "El motivo de anulación es obligatorio (mínimo 5 caracteres).").max(200),
});

/**
 * POST /api/pedidos/[id]/anular — gerencia anula pedidos pagados, listos o registrados.
 * Si estaba pagado: reintegra stock (pedido sale del día pero se conserva para auditoría).
 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const s = await exigirRol(["ADMIN"]);
    const { id } = await ctx.params;
    const idP = Number(id);
    const parsed = esquema.safeParse(await req.json());
    if (!parsed.success) throw new RespuestaJson(400, { error: parsed.error.issues[0]?.message ?? "Motivo inválido." });

    const resultado = await db.$transaction(async (tx) => {
      const p = await tx.pedido.findUnique({ where: { id: idP }, include: { items: true } });
      if (!p) throw new RespuestaJson(404, { error: "Pedido no encontrado." });
      if (p.estado === "ANULADO") throw new RespuestaJson(409, { error: "El pedido ya está anulado." });

      // reintegra stock lo que no se haya reintegrado aún
      if (p.estado === "REGISTRADO" || p.estado === "LISTO") {
        for (const it of p.items) {
          if (it.productoId) await tx.producto.update({ where: { id: it.productoId }, data: { stock: { increment: it.cantidad } } });
        }
      }
        const pedidoAnulado = await tx.pedido.update({
          where: { id: idP },
          data: { estado: "ANULADO", anuladoEn: new Date(), motivoAnulacion: parsed.data.motivo },
        });

        await tx.auditoria.create({
          data: {
            usuarioId: s.id,
            usuarioNombre: `${s.nombre} ${s.apellidos}`,
            pedidoId: idP,
            accion: "ANULADO",
            justificacion: parsed.data.motivo,
            detalle: { numero: etiqueta(idP), estadoPrevio: p.estado },
          },
        });

        return pedidoAnulado;
      });

      return Response.json({ ok: true });
  } catch (e) {
    return jsonError(e);
  }
}
