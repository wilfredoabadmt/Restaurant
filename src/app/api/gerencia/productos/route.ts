import { db } from "@/lib/db";
import { jsonError, RespuestaJson, exigirRol } from "@/lib/sesion";
import { z } from "zod";

export async function GET() {
  try {
    await exigirRol(["ADMIN"]);
    const productos = await db.producto.findMany({
      orderBy: [{ categoriaId: "asc" }, { nombre: "asc" }],
      include: { categoria: true },
    });
    return Response.json({ productos });
  } catch (e) {
    return jsonError(e);
  }
}

const esquema = z.object({
  nombre: z.string().trim().min(2).max(60),
  descripcion: z.string().trim().max(300).optional().or(z.literal("")),
  precio: z.number().positive().max(9999),
  categoriaId: z.number().int().positive(),
  stock: z.number().int().min(0).max(999),
  stockMin: z.number().int().min(0).max(99).optional(),
  imagen: z.string().max(120).optional(),
});

export async function POST(req: Request) {
  try {
    const s = await exigirRol(["ADMIN"]);
    const parsed = esquema.safeParse(await req.json());
    if (!parsed.success) throw new RespuestaJson(400, { error: parsed.error.issues[0]?.message ?? "Datos inválidos." });
    const p = await db.producto
      .create({
        data: {
          nombre: parsed.data.nombre,
          descripcion: parsed.data.descripcion ?? "",
          precio: parsed.data.precio,
          categoriaId: parsed.data.categoriaId,
          stock: parsed.data.stock,
          stockMin: parsed.data.stockMin ?? 4,
          imagen: parsed.data.imagen ?? "emoji:🍽️",
        },
      })
      .catch(() => {
        throw new RespuestaJson(409, { error: "Ya existe un producto con ese nombre." });
      });
    await db.auditoria.create({
      data: { usuarioId: s.id, usuarioNombre: `${s.nombre} ${s.apellidos}`, accion: "PRODUCTO", detalle: { creado: p.nombre, stockInicial: p.stock } },
    });
    return Response.json({ ok: true, producto: p }, { status: 201 });
  } catch (e) {
    return jsonError(e);
  }
}
