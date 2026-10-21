"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Datos = {
  numero: string;
  codigo: string;
  alias: string;
  celular: string;
  estado: "REGISTRADO" | "LISTO" | "PAGADO" | "ANULADO";
  servicio: "EN_LOCAL" | "PARA_LLEVAR";
  total: string;
  validoHasta: string;
  anuladoEn: string | null;
  motivoAnulacion: string | null;
  creadoEn: string;
  items: { nombre: string; tipo: string; precio: string; cantidad: number }[];
};

const Bs = (n: number) => `Bs ${n.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const ESTADO: Record<Datos["estado"], { verde: boolean; t: string; d: string }> = {
  REGISTRADO: { verde: true, t: "¡Tu pedido ya está en caja!", d: "Acércate a la caja y menciona tu alias para realizar el pago." },
  LISTO: { verde: true, t: "¡Tu pedido ya está listo!", d: "Acércate a la caja, menciona tu alias y realiza el pago." },
  PAGADO: { verde: true, t: "¡Pago recibido, gracias!", d: "Ya puedes volver al menú y pedir otra vez." },
  ANULADO: { verde: false, t: "Pedido anulado", d: "Puedes volver al menú y hacer un pedido nuevo." },
};

/** mm:ss para la cuenta atrás del plazo de validez */
function mmss(resta: number): string {
  if (resta <= 0) return "00:00";
  const m = Math.floor(resta / 60);
  const s = resta % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function EstadoCliente({ id }: { id: number }) {
  const [d, setD] = useState<Datos | null>(null);
  const [resta, setResta] = useState(0);

  const cargar = useCallback(async () => {
    const r = await fetch(`/api/pedidos/${id}`, { cache: "no-store" });
    if (r.ok) setD(await r.json());
  }, [id]);

  useEffect(() => {
    cargar();
    const i = setInterval(cargar, 4000);
    return () => clearInterval(i);
  }, [cargar]);

  useEffect(() => {
    if (!d) return;
    // al quedar pagado (o anulado) el cliente puede volver a pedir: soltar la cookie del menú
    if (d.estado === "PAGADO" || d.estado === "ANULADO") {
      document.cookie = "lp_pedido=; max-age=0; path=/";
    }
    const vence = new Date(d.validoHasta).getTime();
    const tick = () => setResta(Math.max(0, Math.round((vence - Date.now()) / 1000)));
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, [d]);

  if (!d) {
    return (
      <main className="grid place-items-center min-h-dvh">
        <p className="text-[var(--muted)]">Cargando tu pedido…</p>
      </main>
    );
  }
  const e = ESTADO[d.estado];
  const enCurso = d.estado === "REGISTRADO" || d.estado === "LISTO";

  return (
    <main className="min-h-dvh bg-white text-black">
      {/* banda superior verde/redonda con el mensaje principal */}
      <section
        className={`px-5 pt-8 pb-7 text-center ${e.verde ? "" : ""}`}
        style={{ background: e.verde ? "#10462f" : "#5f1919", color: "#fff" }}
      >
        <p className="m-auto mb-4 grid h-14 w-14 place-items-center rounded-full" style={{ background: "rgba(255,255,255,.14)" }}>
          <span className="text-2xl font-bold">{d.estado === "ANULADO" ? "×" : "✓"}</span>
        </p>
        <h1 className="text-2xl font-extrabold leading-tight">{e.t}</h1>
        <p className="mt-2 text-sm opacity-90 max-w-xs mx-auto">{d.motivoAnulacion && d.estado === "ANULADO" ? d.motivoAnulacion : e.d}</p>
      </section>

      {/* número de pedido, alias y expiración */}
      <section className="mx-auto max-w-md px-5 pt-7 pb-10 text-center">
        <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-500">TU NÚMERO DE PEDIDO</p>
        <p className="brand mt-1 text-5xl font-black tracking-[0.04em]" style={{ color: "#8a2b2b" }}>
          {d.codigo}
        </p>
        <p className="mt-2 text-sm">
          Alias: <strong className="!font-extrabold">{d.alias}</strong>
        </p>

        {enCurso && (
          <p className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm" style={{ background: "#faf3e2", border: "1px solid #ecdfc0", color: "#8a6d1d" }}>
            <span aria-hidden>⏱</span>
            <span>Expira en <strong className="tabular font-bold">{mmss(resta)}</strong></span>
          </p>
        )}

        {/* total a cancelar */}
        <div className="mt-6 rounded-2xl p-4" style={{ background: "#f7f1e4", border: "1px solid #e9dcc0" }}>
          <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-500">TOTAL A CANCELAR EN CAJA</p>
          <p className="brand mt-1 text-4xl font-black tabular" style={{ color: "#8a2b2b" }}>
            {Bs(Number(d.total))}
          </p>
          <p className="mt-1 text-[12px] text-slate-500">{d.servicio === "EN_LOCAL" ? "Servido en el local" : "Para llevar"}</p>
        </div>
      </section>

      {/* detalle */}
      <section className="mx-auto max-w-md px-5">
        <div className="rounded-2xl p-5" style={{ background: "#fbf8f1", border: "1px solid #e9e0cb" }}>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            <dt className="text-slate-500">Hora de envío</dt>
            <dd className="tabular font-semibold">{new Date(d.creadoEn).toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" })}</dd>
            <dt className="text-slate-500">Celular</dt>
            <dd className="tabular font-semibold">{d.celular || "—"}</dd>
          </dl>
          <hr className="my-3 border-[#e9e0cb]" />
          <h3 className="mb-2 text-sm font-bold tracking-wide text-slate-600">DETALLE</h3>
          <ul className="grid gap-1.5 text-sm">
            {d.items.map((i, k) => (
              <li key={k} className="flex justify-between gap-2">
                <span className="font-semibold">{i.cantidad}× {i.nombre}</span>
                <span className="tabular">{Bs(i.cantidad * Number(i.precio))}</span>
              </li>
            ))}
          </ul>
        </div>

        {d.estado === "PAGADO" && (
          <Link href="/menu" className="btn btn-brasa w-full mt-5 py-3">Volver al menú y pedir de nuevo</Link>
        )}
        {d.estado === "ANULADO" && (
          <Link href="/menu" className="btn bg-black text-white w-full mt-5 py-3">Pedir de nuevo</Link>
        )}
        {enCurso && (
          <p className="mt-4 text-center text-[11px] text-slate-500">Esta pantalla se actualiza sola cada pocos segundos.</p>
        )}
      </section>
    </main>
  );
}
