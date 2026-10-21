import { db } from "@/lib/db";
import { jsonError, exigirRol } from "@/lib/sesion";
import { anularVencidos } from "@/lib/negocio";
import { num } from "@/lib/formato";

/** GET /api/gerencia/resumen — dashboard administrativo. */
export async function GET() {
  try {
    await exigirRol(["ADMIN"]);
    await anularVencidos();

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const hace7 = new Date(Date.now() - 7 * 86400000);

    const [pagadosHoy, registrados, anuladosHoy, productos, topBruto, serie7d, ultimoLog, cajeros] = await Promise.all([
      db.pedido.findMany({ where: { estado: "PAGADO", pagadoEn: { gte: hoy } }, select: { total: true, metodoPago: true, pagadoEn: true } }),
      db.pedido.findMany({ where: { estado: { in: ["REGISTRADO", "LISTO"] } }, select: { id: true, total: true } }),
      db.pedido.findMany({ where: { estado: "ANULADO", anuladoEn: { gte: hoy } } }),
      db.producto.findMany({ include: { categoria: true }, orderBy: [{ categoriaId: "asc" }, { nombre: "asc" }] }),
      db.pedidoItem.findMany({ where: { pedido: { estado: "PAGADO", pagadoEn: { gte: hace7 } } }, include: { producto: { select: { creadoEn: true } } } }),
      db.pedido.findMany({ where: { estado: "PAGADO", pagadoEn: { gte: hace7 } }, select: { pagadoEn: true, total: true } }),
      db.auditoria.findFirst({ orderBy: { creadoEn: "desc" } }),
      db.usuario.findMany({ where: { rol: "CAJERO" }, select: { id: true, nombre: true, apellidos: true, activo: true, creadoEn: true, usuario: true } }),
    ]);

    const bs = (xs: { total: unknown }[]) => xs.reduce((t, x) => t + num(x.total), 0);

    const stockBajo = productos
      .filter((p) => p.disponible && p.stock <= p.stockMin + 2)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 12)
      .map((p) => ({ id: p.id, nombre: p.nombre, stock: p.stock, stockMin: p.stockMin, imagen: p.imagen }));

    const conteo = new Map<string, { nombre: string; tipo: string; uds: number; bs: number }>();
    for (const it of topBruto) {
      const e = conteo.get(it.nombre) ?? { nombre: it.nombre, tipo: it.tipo, uds: 0, bs: 0 };
      e.uds += it.cantidad;
      e.bs += num(it.precio) * it.cantidad;
      conteo.set(it.nombre, e);
    }
    const porTipo = (t: string) =>
      [...conteo.values()]
        .filter((e) => e.tipo === t)
        .sort((a, b) => b.uds - a.uds)
        .slice(0, 6);

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

    return Response.json({
      hoy: {
        cobradoBs: bs(pagadosHoy),
        pedidosPagados: pagadosHoy.length,
        anulados: anuladosHoy.length,
        enCurso: registrados.length,
        enCursoBs: bs(registrados),
        efectivoBs: bs(pagadosHoy.filter((p) => p.metodoPago === "EFECTIVO")),
        qrBs: bs(pagadosHoy.filter((p) => p.metodoPago === "QR")),
      },
      serie,
      topPlatos: porTipo("PLATOS"),
      topBebidas: porTipo("BEBIDAS"),
      topPostres: porTipo("POSTRES"),
      stockBajo,
      productos: productos.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        categoria: p.categoria.nombre,
        stock: p.stock,
        stockMin: p.stockMin,
        precio: p.precio,
        imagen: p.imagen,
        disponible: p.disponible,
        creadoEn: p.creadoEn,
      })),
      cajeros,
      ultimoLog: ultimoLog && { accion: ultimoLog.accion, creadoEn: ultimoLog.creadoEn, usuario: ultimoLog.usuarioNombre },
    });
  } catch (e) {
    return jsonError(e);
  }
}
