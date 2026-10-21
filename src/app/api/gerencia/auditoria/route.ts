import { db } from "@/lib/db";
import { jsonError, exigirRol } from "@/lib/sesion";

/** GET /api/gerencia/auditoria — kardex de acciones (modificaciones, anulaciones, pagos…). */
export async function GET(req: Request) {
  try {
    await exigirRol(["ADMIN"]);
    const url = new URL(req.url);
    const dias = Math.min(30, Math.max(1, Number(url.searchParams.get("dias") ?? 7)));
    const desde = new Date(Date.now() - dias * 86400000);

    const logs = await db.auditoria.findMany({
      where: { creadoEn: { gte: desde } },
      orderBy: { creadoEn: "desc" },
      take: 150,
    });
    return Response.json({ logs });
  } catch (e) {
    return jsonError(e);
  }
}
