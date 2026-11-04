import { db } from "@/lib/db";
import { jsonError, RespuestaJson, exigirRol } from "@/lib/sesion";
import { randomBytes } from "crypto";
import { z } from "zod";

/**
 * GET /api/gerencia/mesas — listado de mesas del restaurante con sus tokens únicos de validación.
 */
export async function GET() {
  try {
    await exigirRol(["ADMIN", "CAJERO"]);
    let mesas = await db.mesa.findMany({
      orderBy: { numero: "asc" },
    });

    // Si aún no hay mesas generadas, inicializamos las primeras 12
    if (mesas.length === 0) {
      const creadas = [];
      for (let i = 1; i <= 12; i++) {
        const token = `tbl_${i}_${randomBytes(16).toString("hex")}`;
        const m = await db.mesa.create({
          data: {
            numero: i,
            nombre: `Mesa ${i}`,
            token,
            activa: true,
          },
        });
        creadas.push(m);
      }
      mesas = creadas;
    }

    return Response.json({ ok: true, mesas });
  } catch (e) {
    return jsonError(e);
  }
}

const esquemaMesa = z.object({
  cantidad: z.number().int().min(1).max(100),
});

/**
 * POST /api/gerencia/mesas — regenera o expande la cantidad de mesas con tokens criptográficos únicos.
 */
export async function POST(req: Request) {
  try {
    await exigirRol(["ADMIN"]);
    const parsed = esquemaMesa.safeParse(await req.json());
    if (!parsed.success) throw new RespuestaJson(400, { error: "Cantidad de mesas inválida." });
    const { cantidad } = parsed.data;

    // Crear las mesas que falten hasta completar la cantidad
    for (let i = 1; i <= cantidad; i++) {
      const existente = await db.mesa.findUnique({ where: { numero: i } });
      if (!existente) {
        const token = `tbl_${i}_${randomBytes(16).toString("hex")}`;
        await db.mesa.create({
          data: {
            numero: i,
            nombre: `Mesa ${i}`,
            token,
            activa: true,
          },
        });
      }
    }

    const mesas = await db.mesa.findMany({
      where: { numero: { lte: cantidad } },
      orderBy: { numero: "asc" },
    });

    return Response.json({ ok: true, mesas });
  } catch (e) {
    return jsonError(e);
  }
}

