import { jsonError, RespuestaJson, exigirRol } from "@/lib/sesion";
import { db } from "@/lib/db";
import { obtenerEmpresa } from "@/lib/negocio";
import { z } from "zod";

const EsquemaEmpresa = z.object({
  nombre: z.string().trim().min(1, "El nombre de la empresa es obligatorio").max(100),
  subtitulo: z.string().trim().max(150).default(""),
  nit: z.string().trim().max(50).default(""),
  direccion: z.string().trim().max(200).default(""),
  telefono: z.string().trim().max(50).default(""),
  mensajeTicket: z.string().trim().max(250).default("¡Gracias por su preferencia!"),
  logo: z.string().trim().default(""),
});

/** GET /api/gerencia/empresa — obtiene los datos actuales de la empresa */
export async function GET() {
  try {
    await exigirRol(["ADMIN"]);
    const empresa = await obtenerEmpresa();
    return Response.json({ ok: true, empresa });
  } catch (e) {
    return jsonError(e);
  }
}

/** PUT /api/gerencia/empresa — actualiza la configuración de la empresa */
export async function PUT(req: Request) {
  try {
    const sesion = await exigirRol(["ADMIN"]);
    const body = await req.json().catch(() => null);
    const parsed = EsquemaEmpresa.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message || "Datos inválidos";
      throw new RespuestaJson(400, { error: msg });
    }

    const { nombre, subtitulo, nit, direccion, telefono, mensajeTicket, logo } = parsed.data;

    const anterior = await obtenerEmpresa();

    const actualizada = await db.empresa.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        nombre,
        subtitulo,
        nit,
        direccion,
        telefono,
        mensajeTicket,
        logo,
      },
      update: {
        nombre,
        subtitulo,
        nit,
        direccion,
        telefono,
        mensajeTicket,
        logo,
      },
    });

    // Registrar en auditoría
    await db.auditoria.create({
      data: {
        usuarioId: sesion.id,
        usuarioNombre: `${sesion.nombre} ${sesion.apellidos}`,
        accion: "EMPRESA",
        justificacion: "Actualización de datos y personalización del restaurante",
        detalle: {
          antes: { ...anterior },
          despues: {
            nombre,
            subtitulo,
            nit,
            direccion,
            telefono,
            mensajeTicket,
            logo,
          },
        },
      },
    });

    return Response.json({ ok: true, empresa: actualizada });
  } catch (e) {
    return jsonError(e);
  }
}
