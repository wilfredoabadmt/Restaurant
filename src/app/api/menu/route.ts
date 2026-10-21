import { db } from "@/lib/db";
import { jsonError, RespuestaJson } from "@/lib/sesion";

/** Menú público: categorías activas con productos ordenados. */
export async function GET() {
  try {
    const categorias = await db.categoria.findMany({
      where: { activa: true },
      orderBy: [{ orden: "asc" }, { id: "asc" }],
      include: {
        productos: {
          where: { disponible: true },
          orderBy: { id: "asc" },
        },
      },
    });
    return Response.json({ categorias });
  } catch (e) {
    return jsonError(e);
  }
}
