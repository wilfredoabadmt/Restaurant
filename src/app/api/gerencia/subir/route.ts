import { jsonError, RespuestaJson, exigirRol } from "@/lib/sesion";
import { mkdir } from "fs/promises";
import path from "path";

/** POST /api/gerencia/subir — subida de foto de producto (multipart/form-data). */
export async function POST(req: Request) {
  try {
    await exigirRol(["ADMIN"]);
    const form = await req.formData().catch(() => null);
    if (!form) throw new RespuestaJson(400, { error: "No se recibió el archivo." });
    const arch = form.get("archivo");
    if (!(arch instanceof File)) throw new RespuestaJson(400, { error: "Selecciona una imagen." });
    if (arch.size > 3 * 1024 * 1024) throw new RespuestaJson(400, { error: "La imagen no debe pasar 3 MB." });
    const extValida = /\.(png|jpe?g|webp|gif)$/i.test(arch.name);
    if (!extValida) throw new RespuestaJson(400, { error: "Formato permitido: PNG, JPG, WEBP o GIF." });

    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    const nombre = `p-${Date.now()}-${arch.name.replace(/[^\w.-]/g, "_").toLowerCase()}`;
    const bytes = Buffer.from(await arch.arrayBuffer());
    await (await import("fs/promises")).writeFile(path.join(dir, nombre), bytes);

    return Response.json({ ok: true, ruta: `/uploads/${nombre}` }, { status: 201 });
  } catch (e) {
    return jsonError(e);
  }
}
