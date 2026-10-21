import EstadoCliente from "./EstadoCliente";

export const dynamic = "force-dynamic";

/** /pedido/[id] — seguimiento del pedido del cliente (notificación de LISTO y total). */
export default async function PaginaPedido({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EstadoCliente id={Number(id)} />;
}
