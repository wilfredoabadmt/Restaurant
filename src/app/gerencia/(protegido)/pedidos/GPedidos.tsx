"use client";

import { useCallback, useEffect, useState } from "react";

type Item = { id: number; nombre: string; tipo: string; precio: string; cantidad: number };
type Ped = {
  id: number;
  alias: string;
  celular: string;
  estado: string;
  servicio: string;
  metodoPago: string | null;
  total: string;
  validoHasta: string;
  creadoEn: string;
  pagadoEn: string | null;
  motivoAnulacion: string | null;
  items: Item[];
};

const Bs = (n: number) => `Bs ${Number(n).toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const ESTADO_C: Record<string, string> = { REGISTRADO: "chip-registrado", LISTO: "chip-listo", PAGADO: "chip-pagado", ANULADO: "chip-anulado" };
const ESTADO_T: Record<string, string> = { REGISTRADO: "en curso", LISTO: "verificado", PAGADO: "pagado", ANULADO: "anulado" };

export default function GPedidos() {
  const [q, setQ] = useState("");
  const [qs, setQs] = useState("");
  const [peds, setPeds] = useState<Ped[]>([]);
  const [objetivo, setObjetivo] = useState<Ped | null>(null);
  const [motivo, setMotivo] = useState("");
  const [msg, setMsg] = useState("");

  const cargar = useCallback(async () => {
    let r = await fetch("/api/panel/pedidos", { cache: "no-store" });
    try {
      if (qs) r = await fetch(`/api/panel/pedidos?q=${encodeURIComponent(qs)}`, { cache: "no-store" });
    } catch { /* mantener primera respuesta */ }
    if (r.ok) setPeds((await r.json()).pedidos ?? []);
  }, [qs]);

  useEffect(() => {
    cargar();
    const i = setInterval(cargar, 10000);
    return () => clearInterval(i);
  }, [cargar]);

  async function anular() {
    if (!objetivo) return;
    setMsg("");
    const r = await fetch(`/api/pedidos/${objetivo.id}/anular`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ motivo: motivo.trim() }),
    });
    const d = await r.json();
    if (!r.ok) return setMsg(d.error);
    setMsg(`Pedido #${String(objetivo.id).padStart(4, "0")} anulado con motivo registrado.`);
    setObjetivo(null);
    setMotivo("");
    cargar();
  }

  return (
    <div className="grid gap-3">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setQs(q);
        }}
      >
        <input className="input" placeholder="Buscar por alias, celular o Nº" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn btn-suave">buscar</button>
      </form>
      {msg && <p className="card p-2 text-sm text-[var(--amanecer)]">{msg}</p>}

      <ul className="grid gap-2">
        {peds.map((p) => (
          <li key={p.id} className="card p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="tabular brand text-lg">
                #{String(p.id).padStart(4, "0")} <span className={`chip ${ESTADO_C[p.estado]} ml-1 align-middle`}>{ESTADO_T[p.estado]}</span>
              </p>
              <p className="tabular brand text-lg text-[var(--amanecer)]">{Bs(Number(p.total))}</p>
            </div>
            <p className="text-sm mt-1">
              <strong>{p.alias}</strong> · <span className="tabular">{p.celular || "—"}</span> · {new Date(p.creadoEn).toLocaleString("es-BO")}
            </p>
            <p className="text-xs text-[var(--muted)]">
              {p.items.map((i) => `${i.cantidad}× ${i.nombre}`).join(" · ")}
            </p>
            {p.motivoAnulacion && <p className="text-xs text-[var(--peligro)] mt-1">motivo: {p.motivoAnulacion}</p>}
            {p.estado !== "ANULADO" && (
              <button className="btn btn-xs btn-peligro mt-2" onClick={() => setObjetivo(p)}>
                anular (gerencia)
              </button>
            )}
          </li>
        ))}
      </ul>

      {objetivo && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={() => setObjetivo(null)}>
          <div className="card w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <p className="brand text-lg text-[var(--peligro)]">Anular #{String(objetivo.id).padStart(4, "0")}</p>
            <p className="text-sm mt-1">
              {objetivo.estado === "PAGADO" ? "Estaba pagado con " + objetivo.metodoPago + "; quedarán reflejados como venta anulada del día y el stock se reintegra." : "El stock reservado se reintegra al menú."}
            </p>
            <label className="label mt-3">Motivo (obligatorio, queda en auditoría)</label>
            <textarea className="input" rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="p. ej. pago duplicado — se acordó anular y reponer" />
            <div className="flex gap-2 mt-3">
              <button className="btn btn-suave flex-1" onClick={() => setObjetivo(null)}>cancelar</button>
              <button className="btn btn-peligro flex-1" onClick={anular} disabled={motivo.trim().length < 5}>anular pedido</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
