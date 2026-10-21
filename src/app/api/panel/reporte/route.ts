import { db } from "@/lib/db";
import { jsonError, exigirRol } from "@/lib/sesion";
import { anularVencidos } from "@/lib/negocio";
import { num } from "@/lib/formato";
/** GET /api/panel/reporte — ventas del cajero para caja y gerencia. */
export async function GET() {
  try {
    await exigirRol(["CAJERO", "ADMIN"]);
    await anularVencidos();

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const [pagadosHoy, anuladosHoy, serie7d, topBruto] = await Promise.all([
      db.pedido.findMany({ where: { estado: "PAGADO", pagadoEn: { gte: hoy } }, include: { items: true }, orderBy: { pagadoEn: "desc" } }),
      db.pedido.findMany({ where: { estado: "ANULADO", anuladoEn: { gte: hoy } } }),
      db.pedido.findMany({ where: { estado: "PAGADO", pagadoEn: { gte: new Date(Date.now() - 7 * 86400000) } }, select: { pagadoEn: true, total: true, metodoPago: true, servicio: true } }),
      db.pedidoItem.findMany({ where: { pedido: { estado: "PAGADO", pagadoEn: { gte: hoy } } } }),
    ]);

    const bs = (xs: { total: unknown }[]) => xs.reduce((t, x) => t + num(x.total), 0);
    const resumen = {
      cobradoBs: bs(pagadosHoy),
      pedidos: pagadosHoy.length,
      ticketPromedio: pagadosHoy.length ? bs(pagadosHoy) / pagadosHoy.length : 0,
      anulados: anuladosHoy.length,
      efectivoBs: bs(pagadosHoy.filter((p) => p.metodoPago === "EFECTIVO")),
      qrBs: bs(pagadosHoy.filter((p) => p.metodoPago === "QR")),
      localPedidos: pagadosHoy.filter((p) => p.servicio === "EN_LOCAL").length,
      llevarPedidos: pagadosHoy.filter((p) => p.servicio === "PARA_LLEVAR").length,
    };

    // serie de 7 días
    const serie = [] as { dia: string; bs: number; pedidos: number }[];
    for (let d = 6; d >= 0; d--) {
      const ini = new Date(hoy.getTime() - d * 86400000);
      const fin = new Date(ini.getTime() + 86400000);
      const xs = serie7d.filter((p) => p.pagadoEn && p.pagadoEn >= ini && p.pagadoEn < fin);
      serie.push({
        dia: ini.toLocaleDateString("es-BO", { weekday: "short", day: "2-digit" }),
        bs: bs(xs),
        pedidos: xs.length,
      });
    }

    // platos más vendidos hoy
    const conteo = new Map<string, { nombre: string; tipo: string; uds: number; bs: number }>();
    for (const it of topBruto) {
      const e = conteo.get(it.nombre) ?? { nombre: it.nombre, tipo: it.tipo, uds: 0, bs: 0 };
      e.uds += it.cantidad;
      e.bs += num(it.precio) * it.cantidad;
      conteo.set(it.nombre, e);
    }
    const top = [...conteo.values()].sort((a, b) => b.uds - a.uds).slice(0, 8);

    return Response.json({
      resumen,
      serie,
      top,
      pagados: pagadosHoy.map((p) => ({
        id: p.id,
        alias: p.alias,
        celular: p.celular,
        total: p.total,
        metodoPago: p.metodoPago,
        servicio: p.servicio,
        pagadoEn: p.pagadoEn,
        items: p.items.map((i) => `${i.cantidad}× ${i.nombre}`),
      })),
      anulados: anuladosHoy.map((p) => ({ id: p.id, motivoAnulacion: p.motivoAnulacion, anuladoEn: p.anuladoEn, total: p.total })),
    });
  } catch (e) {
    return jsonError(e);
  }
}

