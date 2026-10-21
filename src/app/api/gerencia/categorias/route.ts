import { db } from "@/lib/db";
import { jsonError, RespuestaJson, exigirRol } from "@/lib/sesion";
import { z } from "zod";

export async function GET() {
  try {
    await exigirRol(["ADMIN"]);
    const categorias = await db.categoria.findMany({
      orderBy: [{ orden: "asc" }, { id: "asc" }],
      include: { _count: { select: { productos: true } } },
    });
    return Response.json({ categorias });
  } catch (e) {
    return jsonError(e);
  }
}

const esquema = z.object({
  nombre: z.string().trim().min(2).max(40),
  tipo: z.enum(["PLATOS", "BEBIDAS", "POSTRES"]),
  orden: z.number().int().min(0).max(99).optional(),
});

export async function POST(req: Request) {
  try {
    const s = await exigirRol(["ADMIN"]);
    const parsed = esquema.safeParse(await req.json());
    if (!parsed.success) throw new RespuestaJson(400, { error: parsed.error.issues[0]?.message ?? "Datos inválidos." });
    const c = await db.categoria.create({ data: parsed.data }).catch(() => {
      throw new RespuestaJson(409, { error: "Ya existe una categoría con ese nombre." });
    });
    await db.auditoria.create({
      data: { usuarioId: s.id, usuarioNombre: `${s.nombre} ${s.apellidos}`, accion: "CATEGORIA", detalle: { nuevo: c.nombre, tipo: c.tipo } },
    });
    return Response.json({ ok: true, categoria: c }, { status: 201 });
  } catch (e) {
    return jsonError(e);
  }
}
