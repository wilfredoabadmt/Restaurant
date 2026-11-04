import { db } from "@/lib/db";
import { jsonError, exigirRol } from "@/lib/sesion";
import { anularVencidos } from "@/lib/negocio";
import { num } from "@/lib/formato";

/** GET /api/gerencia/resumen — dashboard administrativo con filtro por rango (dia | semana | mes). */
export async function GET(req: Request) {
  try {
    await exigirRol(["ADMIN"]);
    await anularVencidos();

    const url = new URL(req.url);
    const rango = (url.searchParams.get("rango") as "dia" | "semana" | "mes") || "semana";

    const ahora = new Date();
    const hoyInicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());

    let fechaInicioRango: Date;
    if (rango === "dia") {
      fechaInicioRango = hoyInicio;
    } else if (rango === "mes") {
      fechaInicioRango = new Date(Date.now() - 30 * 86400000);
    } else {
      // semana (default: 7 días)
      fechaInicioRango = new Date(Date.now() - 7 * 86400000);
    }

    const [pagadosHoy, registrados, anuladosHoy, productos, itemsRango, pedidosRango, ultimoLog, cajeros] = await Promise.all([
      db.pedido.findMany({ where: { estado: "PAGADO", pagadoEn: { gte: hoyInicio } }, select: { total: true, metodoPago: true, pagadoEn: true } }),
      db.pedido.findMany({ where: { estado: { in: ["REGISTRADO", "LISTO"] } }, select: { id: true, total: true } }),
      db.pedido.findMany({ where: { estado: "ANULADO", anuladoEn: { gte: hoyInicio } } }),
      db.producto.findMany({ include: { categoria: true }, orderBy: [{ categoriaId: "asc" }, { nombre: "asc" }] }),
      db.pedidoItem.findMany({ where: { pedido: { estado: "PAGADO", pagadoEn: { gte: fechaInicioRango } } }, include: { producto: { select: { creadoEn: true } } } }),
      db.pedido.findMany({ where: { estado: "PAGADO", pagadoEn: { gte: fechaInicioRango } }, select: { pagadoEn: true, total: true, metodoPago: true } }),
      db.auditoria.findFirst({ orderBy: { creadoEn: "desc" } }),
      db.usuario.findMany({ where: { rol: "CAJERO" }, select: { id: true, nombre: true, apellidos: true, activo: true, creadoEn: true, usuario: true } }),
    ]);

    const bs = (xs: { total: unknown }[]) => xs.reduce((t, x) => t + num(x.total), 0);

    const stockBajo = productos
      .filter((p) => p.disponible && p.stock <= p.stockMin + 2)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 12)
      .map((p) => ({ id: p.id, nombre: p.nombre, stock: p.stock, stockMin: p.stockMin, imagen: p.imagen }));

    // Ranking de ventas en el rango seleccionado
    const conteo = new Map<string, { nombre: string; tipo: string; uds: number; bs: number }>();
    for (const it of itemsRango) {
      const e = conteo.get(it.nombre) ?? { nombre: it.nombre, tipo: it.tipo, uds: 0, bs: 0 };
      e.uds += it.cantidad;
      e.bs += num(it.precio) * it.cantidad;
      conteo.set(it.nombre, e);
    }

    const todosRanking = [...conteo.values()].sort((a, b) => b.uds - a.uds);
    const masVendido = todosRanking[0] ?? null;

    const porTipo = (t: string) =>
      [...conteo.values()]
        .filter((e) => e.tipo === t)
        .sort((a, b) => b.uds - a.uds)
        .slice(0, 6);

    // Serie temporal dinámica según rango
    const serie = [] as { etiqueta: string; dia: string; bs: number; pedidos: number }[];
    if (rango === "dia") {
      // Agrupación por franjas de 3 horas hoy (00-03, 03-06, etc.)
      for (let h = 0; h < 24; h += 3) {
        const ini = new Date(hoyInicio.getTime() + h * 3600000);
        const fin = new Date(hoyInicio.getTime() + (h + 3) * 3600000);
        const xs = pedidosRango.filter((p) => p.pagadoEn && p.pagadoEn >= ini && p.pagadoEn < fin);
        serie.push({
          etiqueta: `${h}:00`,
          dia: `${h}:00`,
          bs: bs(xs),
          pedidos: xs.length,
        });
      }
    } else if (rango === "mes") {
      // Agrupación por días de los últimos 30 días
      for (let d = 29; d >= 0; d -= 2) {
        const ini = new Date(hoyInicio.getTime() - d * 86400000);
        const fin = new Date(ini.getTime() + 2 * 86400000);
        const xs = pedidosRango.filter((p) => p.pagadoEn && p.pagadoEn >= ini && p.pagadoEn < fin);
        serie.push({
          etiqueta: ini.toLocaleDateString("es-BO", { day: "2-digit", month: "short" }),
          dia: ini.toLocaleDateString("es-BO", { day: "2-digit", month: "short" }),
          bs: bs(xs),
          pedidos: xs.length,
        });
      }
    } else {
      // 7 días de la semana
      for (let d = 6; d >= 0; d--) {
        const ini = new Date(hoyInicio.getTime() - d * 86400000);
        const fin = new Date(ini.getTime() + 86400000);
        const xs = pedidosRango.filter((p) => p.pagadoEn && p.pagadoEn >= ini && p.pagadoEn < fin);
        serie.push({
          etiqueta: ini.toLocaleDateString("es-BO", { weekday: "short", day: "2-digit" }),
          dia: ini.toLocaleDateString("es-BO", { weekday: "short", day: "2-digit" }),
          bs: bs(xs),
          pedidos: xs.length,
        });
      }
    }

    return Response.json({
      rango,
      kpisRango: {
        totalIngresos: bs(pedidosRango),
        cantidadPedidos: pedidosRango.length,
        ticketPromedio: pedidosRango.length > 0 ? bs(pedidosRango) / pedidosRango.length : 0,
        efectivoBs: bs(pedidosRango.filter((p) => p.metodoPago === "EFECTIVO")),
        qrBs: bs(pedidosRango.filter((p) => p.metodoPago === "QR")),
        masVendido,
      },
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
      rankingGeneral: todosRanking.slice(0, 8),
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
