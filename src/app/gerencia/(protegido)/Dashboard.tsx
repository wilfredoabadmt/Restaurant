"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Resumen = {
  rango: "dia" | "semana" | "mes";
  kpisRango: {
    totalIngresos: number;
    cantidadPedidos: number;
    ticketPromedio: number;
    efectivoBs: number;
    qrBs: number;
    masVendido: { nombre: string; tipo: string; uds: number; bs: number } | null;
  };
  hoy: { cobradoBs: number; pedidosPagados: number; anulados: number; enCurso: number; enCursoBs: number; efectivoBs: number; qrBs: number };
  serie: { etiqueta: string; dia: string; bs: number; pedidos: number }[];
  topPlatos: { nombre: string; uds: number; bs: number }[];
  topBebidas: { nombre: string; uds: number; bs: number }[];
  topPostres: { nombre: string; uds: number; bs: number }[];
  rankingGeneral: { nombre: string; tipo: string; uds: number; bs: number }[];
  stockBajo: { id: number; nombre: string; stock: number; stockMin: number; imagen: string }[];
  productos: { id: number; nombre: string; categoria: string; stock: number; stockMin: number; precio: string; imagen: string; disponible: boolean; creadoEn: string }[];
  cajeros: { id: number; nombre: string; apellidos: string; activo: boolean; creadoEn: string; usuario: string }[];
  ultimoLog: { accion: string; creadoEn: string; usuario: string } | null;
};

const Bs = (n: number) => `Bs ${Number(n).toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Dashboard(props: { nombre: string }) {
  const router = useRouter();
  const [d, setD] = useState<Resumen | null>(null);
  const [rango, setRango] = useState<"dia" | "semana" | "mes">("semana");

  const cargar = useCallback(async () => {
    const r = await fetch(`/api/gerencia/resumen?rango=${rango}`, { cache: "no-store" });
    if (r.ok) setD(await r.json());
  }, [rango]);

  useEffect(() => {
    cargar();
    const i = setInterval(cargar, 10000);
    return () => clearInterval(i);
  }, [cargar]);

  async function reponer(id: number, qty: number) {
    const actual = d?.productos.find((p) => p.id === id);
    const destino = (actual ? Number(actual.stock) : 0) + qty;
    await fetch(`/api/gerencia/productos/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ stock: destino }),
    });
    cargar();
  }

  async function salir() {
    await fetch("/api/sesion", { method: "DELETE" });
    router.push("/");
    router.refresh();
  }

  if (!d) return <p className="text-[var(--muted)]">Cargando resumen…</p>;
  const maxBs = Math.max(1, ...d.serie.map((s) => s.bs));

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--muted)]">Hola {props.nombre} — resumen en vivo.</p>
        <div className="flex gap-2">
          <button onClick={() => cargar()} className="btn btn-suave btn-xs">refrescar</button>
          <button onClick={salir} className="btn btn-suave btn-xs">salir</button>
        </div>
      </div>

      {/* Selector de Rango y Métricas Clave Dinámicas */}
      <div className="card p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--borde)] pb-3">
          <div>
            <h3 className="brand font-bold text-base text-[var(--ink)]">Estadísticas de Ventas Dinámicas</h3>
            <p className="text-xs text-[var(--muted)]">Selecciona el horizonte temporal para proyectar los KPIs y gráficos.</p>
          </div>
          {/* Tabs selector de rango */}
          <div className="flex gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
            {(["dia", "semana", "mes"] as const).map((rg) => (
              <button
                key={rg}
                onClick={() => setRango(rg)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors capitalize ${
                  rango === rg ? "bg-[var(--brasa)] text-white shadow" : "text-[var(--muted)] hover:text-white"
                }`}
              >
                {rg === "dia" ? "Por Día" : rg === "semana" ? "Por Semana" : "Por Mes"}
              </button>
            ))}
          </div>
        </div>

        {/* KPIs del Rango Seleccionado */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
            <p className="text-xs text-[var(--muted)]">Total Ingresos ({rango})</p>
            <p className="brand text-2xl font-bold text-[var(--amanecer)] mt-1 tabular">
              {Bs(d.kpisRango.totalIngresos)}
            </p>
            <p className="text-[11px] text-[var(--muted)] mt-1">
              💵 Efectivo {Bs(d.kpisRango.efectivoBs)} · 📱 QR {Bs(d.kpisRango.qrBs)}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
            <p className="text-xs text-[var(--muted)]">Cantidad de Pedidos</p>
            <p className="brand text-2xl font-bold text-[var(--ink)] mt-1 tabular">
              {d.kpisRango.cantidadPedidos} pedidos
            </p>
            <p className="text-[11px] text-[var(--muted)] mt-1">
              Ticket Promedio: <strong className="text-[var(--ink)]">{Bs(d.kpisRango.ticketPromedio)}</strong>
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
            <p className="text-xs text-[var(--muted)]">Producto Más Vendido</p>
            {d.kpisRango.masVendido ? (
              <>
                <p className="brand text-lg font-bold text-amber-300 mt-1 truncate">
                  🏆 {d.kpisRango.masVendido.nombre}
                </p>
                <p className="text-[11px] text-[var(--muted)] mt-1">
                  {d.kpisRango.masVendido.uds} unidades · {Bs(d.kpisRango.masVendido.bs)}
                </p>
              </>
            ) : (
              <p className="text-xs text-[var(--muted)] mt-2">Sin ventas registradas</p>
            )}
          </div>
        </div>
      </div>

      {/* métricas de hoy */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { t: "cobrado hoy", v: Bs(d.hoy.cobradoBs), c: "text-[var(--amanecer)]" },
          { t: "pedidos pagados", v: d.hoy.pedidosPagados, c: "" },
          { t: "en curso ahora", v: `${d.hoy.enCurso} · ${Bs(d.hoy.enCursoBs)}`, c: "" },
          { t: "anulados hoy", v: d.hoy.anulados, c: d.hoy.anulados > 0 ? "text-[var(--peligro)]" : "" },
        ].map((c) => (
          <article key={c.t} className="card p-4">
            <p className="text-[11px] text-[var(--muted)]">{c.t}</p>
            <p className={`tabular brand text-xl mt-1 ${c.c}`}>{c.v}</p>
          </article>
        ))}
      </div>

      {/* serie y métodos */}
      <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
        <section className="card p-4">
          <p className="brand mb-3">Ventas {rango === "dia" ? "por hora (hoy)" : rango === "mes" ? "últimos 30 días" : "última semana"}</p>
          <div className="flex items-end gap-2 h-40">
            {d.serie.map((s) => (
              <div key={s.dia} className="flex-1 grid gap-1 justify-items-center" title={`${Bs(s.bs)} · ${s.pedidos} pedidos`}>
                <span className="tabular text-[10px] text-[var(--muted)]">{s.bs > 0 ? Math.round(s.bs) : ""}</span>
                <div className="flex h-full w-full items-end">
                  <div className="barra w-full" style={{ "--h": `${(s.bs / maxBs) * 88 + 4}%` } as React.CSSProperties}>
                    <i style={{ height: "var(--h)" }} />
                  </div>
                </div>
                <span className="text-[10px] text-[var(--muted)]">{s.etiqueta || s.dia}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
            <p>💵 efectivo <strong className="tabular">{Bs(d.hoy.efectivoBs)}</strong></p>
            <p>📱 QR <strong className="tabular">{Bs(d.hoy.qrBs)}</strong></p>
          </div>
        </section>

        {/* stock por agotarse */}
        <section className="card p-4">
          <p className="brand mb-1">Por agotarse <span className="text-xs text-[var(--muted)]">(≤ umbral+2)</span></p>
          <p className="text-[11px] text-[var(--muted)] mb-2">Repon en un toque; cada reposición queda en auditoría.</p>
          <ul className="grid gap-2 max-h-64 overflow-y-auto">
            {d.stockBajo.map((p) => (
              <li key={p.id} className="card-2 px-3 py-2 flex items-center gap-2">
                <span className="text-lg">{p.imagen.startsWith("emoji:") ? p.imagen.slice(6) : "📷"}</span>
                <span className="flex-1 text-sm truncate">
                  {p.nombre}
                  <span className={`tabular ml-2 text-xs ${p.stock === 0 ? "text-[var(--peligro)]" : "text-[var(--amanecer)]"}`}>
                    {p.stock} / mín {p.stockMin}
                  </span>
                </span>
                <button className="btn btn-suave btn-xs" onClick={() => reponer(p.id, 6)}>+6</button>
                <button className="btn btn-brasa btn-xs" onClick={() => reponer(p.id, 12)}>+12</button>
              </li>
            ))}
            {d.stockBajo.length === 0 && <li className="text-sm text-[var(--muted)]">Toda la despensa bien — nada por agotarse.</li>}
          </ul>
        </section>
      </div>

      {/* más vendidos */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { t: "Platos 🍛", xs: d.topPlatos },
          { t: "Bebidas 🍹", xs: d.topBebidas },
          { t: "Postres 🥧", xs: d.topPostres },
        ].map((g) => (
          <section key={g.t} className="card p-4">
            <p className="brand mb-2">{g.t} · 7 días</p>
            <ul className="grid gap-1.5 text-sm">
              {g.xs.map((x, i) => (
                <li key={x.nombre} className="flex justify-between gap-2">
                  <span className="truncate">
                    <span className="text-[var(--muted)] mr-1 tabular">{i + 1}.</span>
                    {x.nombre}
                  </span>
                  <span className="tabular text-[var(--muted)] whitespace-nowrap">{x.uds} uds</span>
                </li>
              ))}
              {g.xs.length === 0 && <li className="text-[var(--muted)]">— sin ventas aún</li>}
            </ul>
          </section>
        ))}
      </div>

      {/* ingreso de productos + cajeros */}
      <div className="grid gap-4 sm:grid-cols-2">
        <section className="card p-4">
          <p className="brand mb-2">Ingresos al menú <span className="text-xs text-[var(--muted)]">(últimos 8)</span></p>
          <ul className="grid gap-1 text-sm">
            {[...d.productos]
              .sort((a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime())
              .slice(0, 8)
              .map((p) => (
                <li key={p.id} className="flex justify-between gap-2">
                  <span className="truncate">{p.nombre} <span className="text-[var(--muted)]">({p.categoria})</span></span>
                  <span className="tabular text-[var(--muted)] whitespace-nowrap">
                    {new Date(p.creadoEn).toLocaleDateString("es-BO", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                  </span>
                </li>
              ))}
          </ul>
        </section>
        <section className="card p-4">
          <p className="brand mb-2">Cajeros ({d.cajeros.filter((c) => c.activo).length} activos)</p>
          <ul className="grid gap-1 text-sm">
            {d.cajeros.map((c) => (
              <li key={c.id} className="flex justify-between gap-2">
                <span className="truncate">{c.nombre} {c.apellidos} <span className="text-[var(--muted)]">({c.usuario})</span></span>
                <span className={`chip ${c.activo ? "chip-pagado" : "chip-anulado"}`}>{c.activo ? "activo" : "inactivo"}</span>
              </li>
            ))}
          </ul>
          <Link href="/gerencia/cajeros" className="btn btn-suave btn-xs mt-3">gestionar cajeros →</Link>
        </section>
      </div>

      {d.ultimoLog && (
        <p className="text-xs text-[var(--muted)]">
          Última acción: <strong className="text-[var(--ink)]">{d.ultimoLog.accion}</strong> por {d.ultimoLog.usuario} — {new Date(d.ultimoLog.creadoEn).toLocaleString("es-BO")}
        </p>
      )}
    </div>
  );
}
