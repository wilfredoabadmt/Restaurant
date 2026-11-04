import { obtenerEmpresa } from "@/lib/negocio";

export const dynamic = "force-dynamic";

/** GET /api/empresa — endpoint público para obtener el nombre, logo, subtítulo y pie de ticket */
export async function GET() {
  try {
    const empresa = await obtenerEmpresa();
    return Response.json({ ok: true, empresa });
  } catch (e) {
    return Response.json({ ok: false, error: "Error al obtener empresa" }, { status: 500 });
  }
}

