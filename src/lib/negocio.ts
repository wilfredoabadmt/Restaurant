import { randomBytes } from "crypto";
import { db } from "./db";

/** Nº de pedido legible: 1 → "P-0042" (fallback cuando no hay código alfanumérico) */
export const etiqueta = (id: number) => `P-${String(id).padStart(4, "0")}`;

/** Código corto alfanumérico para el cliente (p. ej. "JPCG9"), sin caracteres confusos. */
export function genCodigo(): string {
  const ABC = "ABCDEFGHJKLMNPQRSTUVWXYZ123456789";
  const bytes = randomBytes(5);
  return [...bytes].map((b) => ABC[b % ABC.length]).join("");
}

/**
 * Anula automáticamente los pedidos vencidos (validoHasta < ahora) que sigan
 * en REGISTRADO o LISTO: devuelve el stock reservado y registra auditoría.
 * Se ejecuta de forma "perezosa" en cada lectura relevante.
 */
export async function anularVencidos() {
  const ahora = new Date();
  const vencidos = await db.pedido.findMany({
    where: { estado: { in: ["REGISTRADO", "LISTO"] }, validoHasta: { lt: ahora } },
    select: { id: true, items: true },
  });
  if (vencidos.length === 0) return 0;

  let totalAnulados = 0;
  for (const p of vencidos) {
    try {
      await db.$transaction(async (tx) => {
        // Verificación atómica: solo cambiar de estado si sigue en REGISTRADO o LISTO
        const actualizado = await tx.pedido.updateMany({
          where: { id: p.id, estado: { in: ["REGISTRADO", "LISTO"] } },
          data: {
            estado: "ANULADO",
            anuladoEn: ahora,
            motivoAnulacion: "Automático: el pedido no se presentó a caja dentro de los 40 minutos de validez.",
          },
        });

        // Si otra petición concurrente ya lo procesó, count será 0 (evita doble stock)
        if (actualizado.count === 0) return;

        // Devolver stock reservado
        for (const it of p.items) {
          if (it.productoId) {
            await tx.producto.update({
              where: { id: it.productoId },
              data: { stock: { increment: it.cantidad } },
            });
          }
        }

        await tx.auditoria.create({
          data: {
            usuarioNombre: "Sistema",
            pedidoId: p.id,
            accion: "VENCIDO",
            justificacion: "Anulación automática por vencimiento (40 min).",
          },
        });

        totalAnulados++;
      });
    } catch (e) {
      console.error(`[anularVencidos] Error al procesar pedido ${p.id}:`, e);
    }
  }
  return totalAnulados;
}

/** Recalcula el total de un pedido a partir de sus ítems. */
export function sumar(items: { precio: string | number; cantidad: number }[]) {
  return items.reduce((t, i) => t + Number(i.precio) * i.cantidad, 0);
}

/** SEGLOBAL Emojis por tipo (para tiles de imagen sin foto subida) */
export function emojiDe(imagen: string): string {
  return imagen.startsWith("emoji:") ? imagen.slice(6) : "🍽️";
}

export function esRutaImagen(imagen: string): boolean {
  return imagen.startsWith("/uploads/");
}
