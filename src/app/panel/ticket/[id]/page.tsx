import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { leerSesion } from "@/lib/sesion";
import { Bs } from "@/lib/formato";
import { BotonesTicket } from "./BotonesTicket";

export const dynamic = "force-dynamic";

/** /panel/ticket/[id] — dos comandas imprimibles: cocina (platos) y barra (bebidas + postres juntas). */
export default async function PaginaTicket({ params }: { params: Promise<{ id: string }> }) {
  const s = await leerSesion();
  if (!s) redirect("/panel/entrar");
  if (!["CAJERO", "ADMIN"].includes(s.rol)) redirect("/menu");

  const { id } = await params;
  const p = await db.pedido.findUnique({
    where: { id: Number(id) },
    include: { items: true, creadoPor: { select: { nombre: true, apellidos: true } } },
  });
  if (!p) notFound();

  const cocina = p.items.filter((i) => i.tipo === "PLATOS");
  const barra = p.items.filter((i) => i.tipo !== "PLATOS"); // bebidas y postres van juntas en la misma comanda
  const totalCocina = cocina.reduce((t, i) => t + Number(i.precio) * i.cantidad, 0);
  const totalBarra = barra.reduce((t, i) => t + Number(i.precio) * i.cantidad, 0);
  const hora = new Date(p.creadoEn).toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" });

  const Cabecera = (
    <>
      <p className="font-bold text-[18px]">LA PAILA — PICANTERÍA</p>
        <p className="text-center">COMANDA {p.codigo ?? p.id.toString().padStart(4, "0")}</p>
      <p>{new Date(p.creadoEn).toLocaleDateString("es-BO")} {hora}</p>
      <p>CLIENTE: {p.alias} · {p.celular || "—"}</p>
      <p>{p.servicio === "EN_LOCAL" ? "** SERVIR EN LOCAL **" : "** PARA LLEVAR **"}</p>
    </>
  );

  return (
    <main className="mx-auto max-w-[860px] bg-white text-black min-h-dvh p-6" style={{ fontFamily: '"Courier New", monospace' }}>
      <div className="no-print mb-6 flex items-center gap-3">
        <BotonesTicket />
        <p className="text-sm text-slate-500">
          Esta hoja lleva: {cocina.length > 0 ? "comanda de cocina" : ""}
          {cocina.length > 0 && barra.length > 0 ? " + " : ""}
          {barra.length > 0 ? "comanda de barra" : ""} — solo se imprime la comanda que tiene ítems.
        </p>
      </div>

      <div
        className={`grid gap-6 ${cocina.length > 0 && barra.length > 0 ? "sm:grid-cols-2" : "max-w-[400px] mx-auto"}`}
        style={{ boxShadow: cocina.length > 0 && barra.length > 0 ? "0 8px 30px rgba(0,0,0,.15)" : undefined }}
      >
        {cocina.length > 0 && (
          <section className="ticket-print border-2 border-black border-dashed p-4">
            <header className="text-center">{Cabecera}</header>
            <hr className="my-2" />
            <p className="font-bold underline">COMANDA DE COCINA</p>
            <ul className="mt-2 text-[15px] font-semibold">
              {cocina.map((i) => (
                <li key={i.id} className="border-b border-dotted border-black py-1">{i.cantidad} × {i.nombre}</li>
              ))}
            </ul>
            <p className="mt-2 text-[15px] font-bold">total cocina: {Bs(totalCocina)}</p>
            <p className="mt-4 text-sm">tomó: {p.creadoPor ? `${p.creadoPor.nombre} ${p.creadoPor.apellidos}` : "QR del cliente"}</p>
            <p className="mt-8 text-sm">____________ cocinero</p>
          </section>
        )}

        {barra.length > 0 && (
          <section className="ticket-print border-2 border-black border-dashed p-4">
            <header className="text-center">{Cabecera}</header>
            <hr className="my-2" />
            <p className="font-bold underline">COMANDA DE BARRA <span className="no-underline font-normal">(postres y bebidas)</span></p>
            <ul className="mt-2 text-[15px] font-semibold">
              {barra.map((i) => (
                <li key={i.id} className="border-b border-dotted border-black py-1">{i.cantidad} × {i.nombre}</li>
              ))}
            </ul>
            <p className="mt-2 text-[15px] font-bold">total barra: {Bs(totalBarra)}</p>
            <p className="mt-4 text-sm">ticket total: {Bs(Number(p.total))} · medio: {p.metodoPago ?? "por cobrar"}</p>
            <p className="mt-8 text-sm">____________ cantinero</p>
          </section>
        )}
      </div>
    </main>
  );
}
