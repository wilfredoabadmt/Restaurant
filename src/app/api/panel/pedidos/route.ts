import { db } from "@/lib/db";
import { jsonError, RespuestaJson, exigirRol } from "@/lib/sesion";
import { anularVencidos, etiqueta, genCodigo } from "@/lib/negocio";
import { z } from "zod";

/** GET /api/panel/pedidos?q=<celular|alias|número>&estado= — lista para caja. */
export async function GET(req: Request) {
  try {
    await exigirRol(["CAJERO", "ADMIN"]);
    await anularVencidos();
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") ?? "").trim();
    const estado = url.searchParams.get("estado") ?? "";
    const numQ = Number(q);

      const pedidos = await db.pedido.findMany({
      where: {
        ...(q
          ? {
              OR: [
                { celular: { contains: q } },
                { alias: { contains: q } },
                { codigo: { contains: q } },
                ...(Number.isInteger(numQ) && numQ > 0 ? [{ id: numQ }] : []),
              ],
            }
          : {}),
        ...(estado && ["REGISTRADO", "LISTO", "PAGADO", "ANULADO"].includes(estado) ? { estado: estado as "REGISTRADO" } : {}),
      },
      orderBy: { id: "desc" },
      take: 60,
      include: { items: true },
    });

    const lista = pedidos.map((p) => ({
      id: p.id,
      codigo: p.codigo,
      alias: p.alias,
      celular: p.celular,
      estado: p.estado,
      servicio: p.servicio,
      metodoPago: p.metodoPago,
      total: p.total,
      vuelto: p.vuelto,
      validoHasta: p.validoHasta,
      creadoEn: p.creadoEn,
      pagadoEn: p.pagadoEn,
      mensaje: p.mensaje,
      motivoAnulacion: p.motivoAnulacion,
      items: p.items.map((i) => ({ id: i.id, nombre: i.nombre, tipo: i.tipo, precio: i.precio, cantidad: i.cantidad })),
    }));
    return Response.json({ pedidos: lista });
  } catch (e) {
    return jsonError(e);
  }
}

/** POST — caja crea pedidos manuales para clientes sin la app. */
const esquema = z.object({
  items: z.array(z.object({ productoId: z.number().int().positive(), cantidad: z.number().int().min(1).max(30) })).min(1, "Elige al menos un producto."),
  alias: z.string().trim().min(2).max(30).optional(),
  celular: z.string().trim().max(20).optional(),
  servicio: z.enum(["EN_LOCAL", "PARA_LLEVAR"]).optional(),
});

export async function POST(req: Request) {
  try {
    const s = await exigirRol(["CAJERO", "ADMIN"]);
    const parsed = esquema.safeParse(await req.json());
    if (!parsed.success) throw new RespuestaJson(400, { error: parsed.error.issues[0]?.message ?? "Datos inválidos." });
    const { items, alias, celular, servicio } = parsed.data;

    const creada = await db.$transaction(async (tx) => {
      const productos = await tx.producto.findMany({
        where: { id: { in: items.map((i) => i.productoId) } },
        include: { categoria: true },
      });
      const mapa = new Map(productos.map((p) => [p.id, p]));
      const filas = items.map((i) => {
        const p = mapa.get(i.productoId);
        if (!p || !p.disponible) throw new RespuestaJson(400, { error: "Producto no disponible." });
        if (p.stock < i.cantidad) throw new RespuestaJson(409, { error: `Stock insuficiente de «${p.nombre}» (${p.stock} uds).` });
        return { productoId: p.id, nombre: p.nombre, tipo: p.categoria.tipo, precio: p.precio, cantidad: i.cantidad };
      });
      const total = filas.reduce((t, f) => t + Number(f.precio) * f.cantidad, 0);

      const pedido = await tx.pedido.create({
        data: {
          codigo: genCodigo(),
          alias: alias || "Mostrador",
          celular: celular || "",
          estado: "LISTO", // el pedido presencial ya está delante de caja
          servicio: servicio || "EN_LOCAL",
          total,
          validoHasta: new Date(Date.now() + 40 * 60 * 1000),
          creadoPorId: s.id,
          items: {
            create: filas.map((f) => ({
              productoId: f.productoId,
              nombre: f.nombre,
              tipo: f.tipo,
              precio: f.precio,
              cantidad: f.cantidad,
            })),
          },
        },
      });
      for (const f of filas) {
        await tx.producto.update({ where: { id: f.productoId }, data: { stock: { decrement: f.cantidad } } });
      }
      return pedido;
    });

    await db.auditoria.create({
      data: {
        usuarioId: s.id,
        usuarioNombre: `${s.nombre} ${s.apellidos}`,
        pedidoId: creada.id,
        accion: "CREADO",
        justificacion: "Pedido manual tomado en mostrador",
        detalle: { numero: etiqueta(creada.id), total: creada.total },
      },
    });
    return Response.json({ ok: true, numero: creada.id }, { status: 201 });
  } catch (e) {
    return jsonError(e);
  }
}
