import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import MenuClient from "./MenuClient";

export const dynamic = "force-dynamic";

/**
 * /menu — tras enviar un pedido el cliente queda bloqueado 30 min (cookie `lp_pedido`),
 * PERO en cuanto el pedido queda PAGADO, ANULADO o vencido, el menú se libera y puede pedir de nuevo.
 */
export default async function PaginaMenu() {
  const jar = await cookies();
  const activo = jar.get("lp_pedido")?.value;
  if (activo) {
    const id = Number(activo);
    const p = Number.isInteger(id) && id > 0
      ? await db.pedido.findUnique({ where: { id }, select: { estado: true, validoHasta: true } })
      : null;
    // solo redirige si el pedido sigue en curso y no ha vencido
    if (p && (p.estado === "REGISTRADO" || p.estado === "LISTO") && p.validoHasta > new Date()) {
      redirect(`/pedido/${id}`);
    }
  }
  return <MenuClient />;
}
