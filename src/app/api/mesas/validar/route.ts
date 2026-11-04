import { db } from "@/lib/db";
import { jsonError, RespuestaJson } from "@/lib/sesion";

export const dynamic = "force-dynamic";

/**
 * GET /api/mesas/validar?token=XYZ
 * Valida de forma estricta que el QR escaneado corresponda a una mesa auténtica en la BD.
 * Si el cliente altera la URL, el token no coincidirá y el pedido no se procesará.
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      throw new RespuestaJson(400, { error: "Falta el token de validación de la mesa." });
    }

    const mesa = await db.mesa.findUnique({
      where: { token },
      select: { numero: true, nombre: true, activa: true },
    });

    if (!mesa || !mesa.activa) {
      throw new RespuestaJson(404, { error: "Mesa no encontrada o inactiva en el restaurante." });
    }

    // Buscar si la mesa tiene ya una comanda activa en curso (sin pagar)
    const pedidoActivo = await db.pedido.findFirst({
      where: {
        mesaNumero: mesa.numero,
        estado: { in: ["REGISTRADO", "LISTO"] },
        validoHasta: { gt: new Date() },
      },
      select: {
        id: true,
        codigo: true,
        total: true,
        items: {
          select: {
            id: true,
            nombre: true,
            cantidad: true,
            precio: true,
          },
        },
      },
    });

    return Response.json({
      ok: true,
      mesa: {
        numero: mesa.numero,
        nombre: mesa.nombre,
      },
      cuentaActiva: pedidoActivo,
    });
  } catch (e) {
    return jsonError(e);
  }
}

