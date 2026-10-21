"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Item = { id: number; nombre: string; tipo: string; precio: string; cantidad: number };
type Pedido = {
  id: number;
  codigo: string | null;
  alias: string;
  celular: string;
  estado: "REGISTRADO" | "LISTO" | "PAGADO" | "ANULADO";
  servicio: "EN_LOCAL" | "PARA_LLEVAR";
  metodoPago: "EFECTIVO" | "QR" | null;
  total: string;
  vuelto: string | null;
  validoHasta: string;
  creadoEn: string;
  pagadoEn: string | null;
  mensaje: string | null;
  motivoAnulacion: string | null;
  items: Item[];
};
type Resumen = {
  cobradoBs: number;
  pedidos: number;
  ticketPromedio: number;
  anulados: number;
  efectivoBs: number;
  qrBs: number;
  localPedidos: number;
  llevarPedidos: number;
};
type Reporte = { resumen: Resumen; serie: { dia: string; bs: number; pedidos: number }[]; top: { nombre: string; tipo: string; uds: number; bs: number }[]; pagados: { id: number; alias: string; total: string; metodoPago: string; servicio: string; pagadoEn: string; items: string[] }[]; anulados: { id: number; motivoAnulacion: string | null; total: string }[] };
type Prod = { id: number; nombre: string; precio: string; imagen: string; stock: number; disponible: boolean };

const Bs = (n: number) => `Bs ${Number(n).toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const ESTADO_C: Record<string, string> = { REGISTRADO: "chip-registrado", LISTO: "chip-listo", PAGADO: "chip-pagado", ANULADO: "chip-anulado" };
const ESTADO_T: Record<string, string> = { REGISTRADO: "En caja", LISTO: "Listo", PAGADO: "Pagado", ANULADO: "Anulado" };
const hornear = (d: string) => new Date(d).getTime();

export default function PanelCajero(props: { nombre: string; rol: string }) {
  const router = useRouter();
  const [tab, setTab] = useState<"pedidos" | "reporte">("pedidos");
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState("");
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [reporte, setReporte] = useState<Reporte | null>(null);
  const [, setReloj] = useState(0); // re-render por segundo para la cuenta atrás mm:ss
  const [pagando, setPagando] = useState<Pedido | null>(null);
  const [editando, setEditando] = useState<Pedido | null>(null);
  const [eliminando, setEliminando] = useState<Pedido | null>(null);
  const [deseo, setDeseo] = useState(0); // pedido a cobrar directamente al llegar de "nuevo pedido en mostrador"
  const [vistaEstado, setVistaEstado] = useState<"caja" | "pagados" | "anulados" | "todos">("caja");

  const cargar = useCallback(async () => {
    const r = await fetch(`/api/panel/pedidos${q ? `?q=${encodeURIComponent(q)}` : ""}`, { cache: "no-store" });
    if (r.ok) setPedidos((await r.json()).pedidos ?? []);
  }, [q]);
  const cargarReporte = useCallback(async () => {
    const r = await fetch("/api/panel/reporte", { cache: "no-store" });
    if (r.ok) setReporte(await r.json());
  }, []);

  useEffect(() => {
    cargar();
    const i = setInterval(cargar, 6000);
    return () => clearInterval(i);
  }, [cargar]);
  useEffect(() => {
    if (tab === "reporte") cargarReporte();
  }, [tab, cargarReporte]);
  useEffect(() => {
    const i = setInterval(() => setReloj((x) => x + 1), 1000);
    return () => clearInterval(i);
  }, []);

  // /panel?cueva=IDOFPEDIDO → abre el modal de cobro para ese pedido apenas cargue la lista
  useEffect(() => {
    const cp = Number(new URLSearchParams(window.location.search).get("cueva") ?? 0);
    if (cp) setDeseo(cp);
  }, []);
  useEffect(() => {
    if (!deseo || pedidos.length === 0) return;
    const p = pedidos.find((x) => x.id === deseo);
    if (p) {
      setPagando(p);
      setDeseo(0);
      window.history.replaceState(null, "", "/panel"); // limpia la URL
    }
  }, [deseo, pedidos]);

  async function salir() {
    await fetch("/api/sesion", { method: "DELETE" });
    router.push("/");
    router.refresh();
  }

  const pendientes = pedidos.filter((p) => p.estado === "REGISTRADO" || p.estado === "LISTO").length;
  const vista = pedidos.filter((p) =>
    vistaEstado === "todos" ? true : vistaEstado === "caja" ? p.estado === "REGISTRADO" || p.estado === "LISTO" : vistaEstado === "pagados" ? p.estado === "PAGADO" : p.estado === "ANULADO",
  );
  const iniciales = props.nombre.trim().split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase() ?? "").join("");

  /* paleta verde bosque del panel de caja (estilo aprobado) — re-viste cards, chips, botones y modales vía variables CSS */
  const verdeCaja: CSSProperties = {
    "--bg": "#12251c",
    "--panel": "#1d332a",
    "--panel2": "#264438",
    "--line": "#2f4a3d",
    "--ink": "#eef3ef",
    "--muted": "#95a99e",
  } as CSSProperties;

  return (
    <div className="min-h-dvh" style={{ background: "#12251c", ...verdeCaja }}>
      <main className="mx-auto max-w-3xl px-4 pb-24">
      <header className="flex items-center gap-3 py-5 flex-wrap">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--amanecer)] font-extrabold text-[#241505]">
          {iniciales}
        </span>
        <div className="flex-1 min-w-[150px]">
          <p className="brand text-xl leading-none">Caja · La Paila</p>
          <p className="text-[11px] text-[var(--muted)] mt-1">
            usando <strong>{props.nombre}</strong>
          </p>
        </div>
        <nav className="flex items-center gap-2">
          <button
            onClick={() => setTab("pedidos")}
            className={tab === "pedidos" ? "btn btn-xs !rounded-full !bg-[#f3efe6] !text-[#16211b] !border-transparent" : "btn btn-xs btn-suave !rounded-full"}
          >
            🧾 Pedidos
          </button>
          <button
            onClick={() => setTab("reporte")}
            className={tab === "reporte" ? "btn btn-xs !rounded-full !bg-[#f3efe6] !text-[#16211b] !border-transparent" : "btn btn-xs btn-suave !rounded-full"}
          >
            📊 Reportes
          </button>
          <Link href="/panel/nuevo" className="btn btn-brasa btn-xs !rounded-full">+ nuevo</Link>
          <button onClick={salir} title="Cerrar sesión" className="btn btn-suave !h-9 !w-9 !rounded-full !p-0 grid place-items-center">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </nav>
      </header>

      {tab === "pedidos" ? (
        <>
          {/* buscador con lupa, a lo ancho */}
          <div className="card-2 flex items-center gap-2 rounded-2xl px-3">
            <span className="text-[var(--muted)]" aria-hidden>🔍</span>
            <form className="flex flex-1 items-center gap-2" onSubmit={(e) => { e.preventDefault(); setFiltro(q); }}>
              <input
                className="flex-1 bg-transparent outline-none text-sm py-2.5 placeholder:text-[var(--muted)]"
                placeholder="Buscar por celular, alias o código"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </form>
            {q && (
              <button
                type="button"
                className="btn btn-suave btn-xs"
                onClick={() => {
                  setQ("");
                  setFiltro("");
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* filtros por estado, desde la lista ya cargada */}
          <nav className="mt-3 flex flex-wrap gap-2">
            {(["caja", "pagados", "anulados", "todos"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setVistaEstado(v)}
                className={`chip !px-3.5 !py-1.5 ${vistaEstado === v ? "!bg-[#f3efe6] !text-[#16211b] !border-transparent !font-semibold" : ""}`}
              >
                {v === "caja" ? `En caja${pendientes > 0 ? ` · ${pendientes}` : ""}` : v === "pagados" ? "Pagados" : v === "anulados" ? "Anulados" : "Todos"}
              </button>
            ))}
          </nav>

          <ul className="mt-4 grid gap-3">
            {vista.map((p) => {
              const enCurso = p.estado === "REGISTRADO" || p.estado === "LISTO";
              const siglos = Math.max(0, hornear(p.validoHasta) - Date.now());
              const salida = Math.ceil(siglos / 1000);
              const mmss = `${String(Math.floor(salida / 60)).padStart(2, "0")}:${String(salida % 60).padStart(2, "0")}`;
              const nItems = p.items.length;
              const nUds = p.items.reduce((t, i) => t + i.cantidad, 0);
              return (
                <li
                  key={p.id}
                  className="rounded-2xl border p-4 grid gap-3"
                  style={{
                    background: enCurso ? "linear-gradient(180deg, rgba(20,58,44,.55), rgba(15,42,33,.55))" : "rgba(255,255,255,.03)",
                    borderColor: enCurso ? "rgba(90,160,130,.35)" : "rgba(255,255,255,.08)",
                  }}
                >
                  {/* fila superior: código y hora · alias y celular · cantidades · total · estado */}
                  <div className="flex items-start gap-3">
                    <div className="min-w-[92px]">
                      <p className="brand text-xl text-[var(--amanecer)] !leading-none">
                        #{p.codigo ?? `P-${String(p.id).padStart(4, "0")}`}
                      </p>
                      <p className="text-[11px] text-[var(--muted)] tabular mt-1.5">
                        {new Date(p.creadoEn).toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit", hour12: true })}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold !leading-none truncate">{p.alias}</p>
                      <p className="text-xs text-[var(--muted)] tabular mt-1.5">{p.celular || "—"}</p>
                    </div>
                    <div className="flex items-start gap-3 shrink-0">
                      <div className="text-[11px] leading-snug text-[var(--muted)] text-right">
                        <p>{nItems} {nItems === 1 ? "producto" : "productos"}</p>
                        <p>{nUds} {nUds === 1 ? "unidad" : "unidades"}</p>
                      </div>
                      <p className="tabular brand text-2xl text-[var(--amanecer)] !leading-none">{Bs(Number(p.total))}</p>
                      <span className={`chip ${ESTADO_C[p.estado]} !leading-none`}>{ESTADO_T[p.estado]}</span>
                    </div>
                  </div>

                  {/* píldora de cuenta atrás + servicio */}
                  <div className="flex flex-wrap items-center gap-2">
                    {enCurso && (
                      <span className="chip tabular">⏱ {mmss}</span>
                    )}
                    <span className="chip">{p.servicio === "EN_LOCAL" ? "en el local" : "para llevar"}</span>
                    {p.estado === "PAGADO" && (
                      <>
                        <span className="chip chip-pagado">{p.metodoPago}</span>
                        {p.vuelto && <span className="chip chip-pagado">vuelto {Bs(Number(p.vuelto))}</span>}
                        <a className="btn btn-suave btn-xs" href={`/panel/ticket/${p.id}`} target="_blank">imprimir comandas</a>
                      </>
                    )}
                    {p.estado === "ANULADO" && <span className="text-xs text-[var(--peligro)]">{p.motivoAnulacion ?? "anulado automáticamente"}</span>}
                  </div>

                  {/* detalle del pedido */}
                  <ul className="text-xs text-[var(--muted)]">
                    {p.items.map((i) => (
                      <li key={i.id}>
                        {i.cantidad}× {i.nombre} <span className="opacity-60">({i.tipo === "BEBIDAS" ? "bebida" : i.tipo === "POSTRES" ? "postre" : "plato"})</span>
                      </li>
                    ))}
                    {p.mensaje && <li className="text-[var(--amanecer)]">✍ {p.mensaje}</li>}
                  </ul>

                  {/* acciones */}
                  {enCurso && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {p.estado === "REGISTRADO" && (
                        <button className="btn btn-suave btn-xs" onClick={() => setEditando(p)}>✎ Modificar</button>
                      )}
                      <button className="btn btn-suave btn-xs" onClick={() => setEliminando(p)}>🗑 Eliminar</button>
                      <button className="btn btn-brasa btn-xs" onClick={() => setPagando(p)}> Cobrar {Bs(Number(p.total))}</button>
                    </div>
                  )}
                  {p.estado === "PAGADO" && (
                    <span className="text-xs text-[var(--muted)]">cobrado a {new Date(p.pagadoEn ?? "").toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" })}</span>
                  )}
                </li>
              );
            })}
            {vista.length === 0 && (
              <li
                className="rounded-2xl border border-white/10 px-8 py-12 text-center text-sm text-[var(--muted)]"
                style={{ background: "rgba(255,255,255,.03)" }}
              >
                Sin pedidos aquí. Cuando los clientes manden la suya, aparece en esta lista sin refrescar (6 s).
              </li>
            )}
          </ul>
        </>
      ) : reporte ? (
        <ReporteVista reporte={reporte} />
      ) : null}

      {/* ————— cobro ————— */}
      {pagando && (
        <ModalCobro
          pedido={pagando}
          cerrar={() => setPagando(null)}
          alCobrar={ async () => {
            await cargar();
            await cargarReporte();
          }}
        />
      )}

      {editando && (
        <ModalEditar pedido={editando} cerrar={() => setEditando(null)} alGuardar={cargar} />
      )}

      {eliminando && (
        <ModalEliminar pedido={eliminando} cerrar={() => setEliminando(null)} alGuardar={cargar} />
      )}
    </main>
    </div>
  );
}

/* ——————————————— cobro ——————————————— */
export function ModalCobro({ pedido, cerrar, alCobrar }: { pedido: Pedido; cerrar: () => void; alCobrar: () => void }) {
  const cocina = pedido.items.filter((i) => i.tipo === "PLATOS");
  const barra = pedido.items.filter((i) => i.tipo !== "PLATOS"); // postres y bebidas juntas, igual que en la comanda
  const total = Number(pedido.total);
  const [metodo, setMetodo] = useState<"EFECTIVO" | "QR">("EFECTIVO");
  const [servicio, setServicio] = useState(cb(pedido.servicio));
  const [mnt, setMnt] = useState("");
  const [verificados, setVerificados] = useState(false);
  const [error, setError] = useState("");
  const vuelto = Math.max(0, Number(mnt) - total);

  function cb(n: unknown) {
    return (n === "EN_LOCAL" ? "EN_LOCAL" : "PARA_LLEVAR") as "EN_LOCAL" | "PARA_LLEVAR";
  }

  async function cobrar() {
    setError("");
    try {
      const r = await fetch(`/api/pedidos/${pedido.id}/pagar`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ metodoPago: metodo, servicio, montoRecibido: metodo === "EFECTIVO" ? Number(mnt) : undefined }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "No se pudo cobrar.");
      window.open(`/panel/ticket/${pedido.id}`, "_blank");
      alCobrar();
      cerrar();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={cerrar}>
      <div className="card w-full max-w-md p-5 max-h-[90dvh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <p className="text-xs text-[var(--muted)]">Cobrar pedido</p>
        <p className="tabular brand text-2xl text-[var(--amanecer)]">#{pedido.codigo ?? `P-${String(pedido.id).padStart(4, "0")}`}</p>

        <section className="mt-3 grid gap-2 text-sm">
          <div className="card-2 p-3">
            <p className="text-xs text-[var(--muted)] mb-1">Cocina (platos)</p>
            {cocina.map((i) => (
              <p key={i.id} className="flex justify-between">
                <span>{i.cantidad}× {i.nombre}</span>
                <span className="tabular">{Bs(i.cantidad * Number(i.precio))}</span>
              </p>
            ))}
            {cocina.length === 0 && <p className="text-[var(--muted)]">— nada de cocina —</p>}
          </div>
          <div className="card-2 p-3">
            <p className="text-xs text-[var(--muted)] mb-1">Barra (postres y bebidas)</p>
            {barra.map((i) => (
              <p key={i.id} className="flex justify-between">
                <span>{i.cantidad}× {i.nombre}</span>
                <span className="tabular">{Bs(i.cantidad * Number(i.precio))}</span>
              </p>
            ))}
            {barra.length === 0 && <p className="text-[var(--muted)]">— nada de barra —</p>}
          </div>
          <label className="card-2 p-3 flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={verificados} onChange={(e) => setVerificados(e.target.checked)} />
            <span className="text-xs">El cliente recuerda y es conforme con todo lo pedido</span>
          </label>
          <p className="text-right">
            <span className="text-xs text-[var(--muted)]">total&nbsp;</span>
            <span className="tabular brand text-xl">{Bs(total)}</span>
          </p>
        </section>

        {/* método de pago */}
        <fieldset className="mt-4">
          <legend className="label">Método de pago</legend>
          <div className="flex gap-2">
            {(["EFECTIVO", "QR"] as const).map((m) => (
              <button key={m} type="button" onClick={() => setMetodo(m)} className={`chip !px-4 !py-2 ${metodo === m ? "!bg-[var(--ok)] !text-[#06291a] !border-transparent" : ""}`}>
                {m === "EFECTIVO" ? "💵 Efectivo" : "📱 QR"}
              </button>
            ))}
          </div>
        </fieldset>

        {/* servicio */}
        <fieldset className="mt-3">
          <legend className="label">Servicio</legend>
          <div className="flex gap-2">
            {(["EN_LOCAL", "PARA_LLEVAR"] as const).map((s) => (
              <button key={s} type="button" onClick={() => setServicio(s)} className={`chip !px-4 !py-2 ${servicio === s ? "!bg-[var(--cielo)] !text-[#08222e] !border-transparent" : ""}`}>
                {s === "EN_LOCAL" ? "🍽 en el local" : "🥡 para llevar"}
              </button>
            ))}
          </div>
        </fieldset>

        {/* monto y vuelto */}
        {metodo === "EFECTIVO" && (
          <div className="mt-3 grid gap-2">
            <div>
              <label className="label" htmlFor="mnt">Monto entregado (Bs)</label>
              <input id="mnt" className="input tabular text-lg" inputMode="decimal" value={mnt} onChange={(e) => setMnt(e.target.value)} placeholder="0,00" />
            </div>
            <div className="flex flex-wrap gap-2">
              {[total, 50, 100, 200].map((v, k) => (
                <button key={k} type="button" onClick={() => setMnt(String(v))} className="btn btn-suave btn-xs">
                  {k === 0 ? "monto exacto" : `B. ${v}`}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between card-2 p-3">
              <span className="text-sm">Cambio (vuelto)</span>
              <span className={`tabular brand text-xl ${vuelto > 0 ? "text-[var(--ok)]" : "text-[var(--muted)]"}`}>{Bs(vuelto)}</span>
            </div>
          </div>
        )}

        {metodo === "QR" && (
          <p className="mt-3 card-2 p-3 text-xs text-[var(--muted)]">Pide al cliente escanear tu QR de pago y confirma cuando el monto aparezca en tu celular.</p>
        )}

        {error && <p className="mt-3 text-sm text-[var(--peligro)]">{error}</p>}

        <button
          disabled={!verificados || (metodo === "EFECTIVO" && Number(mnt) < total)}
          onClick={cobrar}
          className="btn btn-ok w-full mt-4 py-3"
        >
          Conforme y pagado — {metodo === "EFECTIVO" ? "dar " + Bs(vuelto) + " de cambio" : "cobrar con QR"}
        </button>
        <p className="mt-2 text-center text-[11px] text-[var(--muted)]">Se desplegarán dos comandas: cocina y barra.</p>
      </div>
    </div>
  );
}

/* ——————————————— modificar (justificado) ——————————————— */
function ModalEditar({ pedido, cerrar, alGuardar }: { pedido: Pedido; cerrar: () => void; alGuardar: () => void }) {
  const [items, setItems] = useState<Item[]>(pedido.items.map((i) => ({ ...i })));
  const [servicio, setServicio] = useState(pedido.servicio);
  const [just, setJust] = useState("");
  const [menu, setMenu] = useState<Prod[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/menu").then((r) => r.json()).then((d: { categorized?: { productos: Prod[] }[] }) => {
      const cs = (d as unknown as { categorias: { productos: Prod[] }[] }).categorias;
      setMenu(cs?.flatMap((c) => c.productos) ?? []);
    });
  }, []);

  const cambiar = (p: Prod, delta: 1 | -1) => {
    setItems((prev) => {
      const it = prev.find((i) => i.id === p.id || i.nombre === p.nombre);
      if (!it) {
        if (delta === 1) return [...prev, { id: p.id, nombre: p.nombre, tipo: "", precio: p.precio, cantidad: 1 }];
        return prev;
      }
      const n = it.cantidad + delta;
      if (n <= 0) return prev.filter((i) => i !== it);
      return prev.map((i) => (i === it ? { ...it, cantidad: n } : i));
    });
  };
  const total = items.reduce((t, i) => t + Number(i.precio) * i.cantidad, 0);
  const cambio = JSON.stringify({ items: items.map((i) => [i.nombre, i.cantidad]), servicio }) !== JSON.stringify({ items: pedido.items.map((i) => [i.nombre, i.cantidad]), servicio: pedido.servicio });

  async function guardar() {
    setError("");
    try {
      const cuerpo: Record<string, unknown> = { justificacion: just, servicio };
      if (cambio) {
        cuerpo.items = items.map((i) => {
          const prod = menu.find((m) => m.nombre === i.nombre);
          return { productoId: prod?.id ?? i.id, cantidad: i.cantidad };
        });
      } else {
        // solo verificación a LISTO
        cuerpo.listo = true;
      }
      const r = await fetch(`/api/pedidos/${pedido.id}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(cuerpo) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "No se pudo guardar.");
      alGuardar();
      cerrar();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={cerrar}>
      <div className="card w-full max-w-md p-5 max-h-[90dvh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <p className="text-xs text-[var(--muted)]">Pedido #{String(pedido.id).padStart(4, "0")} · {pedido.alias}</p>
        <p className="tabular brand text-2xl">{Bs(total)}</p>

        <div className="mt-3 grid gap-1.5">
          {items.map((i) => (
            <div key={i.id || i.nombre} className="card-2 px-3 py-2 flex items-center gap-2">
              <span className="flex-1 text-sm">{i.nombre}</span>
              <button className="btn btn-suave btn-xs" onClick={() => cambiar(menu.find((m) => m.nombre === i.nombre) ?? ({ ...i } as unknown as Prod), -1)}>−</button>
              <span className="tabular w-6 text-center">{i.cantidad}</span>
              <button className="btn btn-suave btn-xs" onClick={() => cambiar(menu.find((m) => m.nombre === i.nombre) ?? ({ ...i } as unknown as Prod), 1)}>+</button>
              <span className="tabular w-20 text-right text-sm">{Bs(i.cantidad * Number(i.precio))}</span>
            </div>
          ))}
        </div>

        <p className="label mt-4">Sumar del menú</p>
        <div className="flex-row-scroll flex flex-wrap gap-2 max-h-32 overflow-y-auto">
          {menu
            .filter((m) => !items.some((i) => i.nombre === m.nombre))
            .map((m) => (
              <button key={m.id} onClick={() => cambiar(m, 1)} className="chip">+ {m.nombre}</button>
            ))}
        </div>

        <fieldset className="mt-3">
          <legend className="label">Servicio</legend>
          <div className="flex gap-2">
            {(["EN_LOCAL", "PARA_LLEVAR"] as const).map((s) => (
              <button key={s} onClick={() => setServicio(s)} className={`chip !px-3 !py-1.5 ${servicio === s ? "!bg-[var(--cielo)] !text-[#08222e] !border-transparent" : ""}`}>
                {s === "EN_LOCAL" ? "en el local" : "para llevar"}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="mt-3">
          <label className="label" htmlFor="just">Justificación obligatoria</label>
          <textarea id="just" className="input" rows={2} value={just} onChange={(e) => setJust(e.target.value)} placeholder="p. ej. cliente pidió retirar el picante / cambiar por milanesa congelada" />
        </div>
        {error && <p className="mt-2 text-sm text-[var(--peligro)]">{error}</p>}
        <button onClick={guardar} disabled={just.trim().length < 5 || items.length === 0} className="btn btn-brasa w-full mt-3">
          Guardar cambio justificado
        </button>
        {items.length === 0 && <p className="mt-2 text-[11px] text-[var(--muted)]">No puedes dejar el pedido vacío — usa eliminar.</p>}
      </div>
    </div>
  );
}

/* ——————————————— eliminar (justificado) ——————————————— */
function ModalEliminar({ pedido, cerrar, alGuardar }: { pedido: Pedido; cerrar: () => void; alGuardar: () => void }) {
  const [just, setJust] = useState("");
  const [error, setError] = useState("");
  async function eliminar() {
    setError("");
    try {
      const r = await fetch(`/api/pedidos/${pedido.id}`, { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ justificacion: just.trim() }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "No se pudo eliminar.");
      alGuardar();
      cerrar();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={cerrar}>
      <div className="card w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
        <p className="brand text-lg text-[var(--peligro)]">Eliminar pedido #{String(pedido.id).padStart(4, "0")}</p>
        <p className="text-sm mt-1">
          {pedido.alias} · {Bs(Number(pedido.total))} · se liberará el stock reservado.
        </p>
        <label className="label mt-4" htmlFor="j">Justificación obligatoria</label>
        <textarea id="j" className="input" rows={3} value={just} onChange={(e) => setJust(e.target.value)} placeholder="p. ej. pedido duplicado por doble escaneo del QR" />
        {error && <p className="mt-2 text-sm text-[var(--peligro)]">{error}</p>}
        <div className="flex gap-2 mt-3">
          <button onClick={cerrar} className="btn btn-suave flex-1">cancelar</button>
          <button onClick={eliminar} disabled={just.trim().length < 5} className="btn btn-peligro flex-1">eliminar</button>
        </div>
      </div>
    </div>
  );
}

/* ——————————————— reportes ——————————————— */
function ReporteVista({ reporte }: { reporte: Reporte }) {
  const r = reporte.resumen;
  const maxBs = Math.max(1, ...reporte.serie.map((s) => s.bs));
  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { t: "cobrado hoy", v: Bs(r.cobradoBs) },
          { t: "pedidos pagados", v: r.pedidos },
          { t: "anulados hoy", v: r.anulados },
          { t: "ticket promedio", v: Bs(r.ticketPromedio) },
        ].map((c) => (
          <article key={c.t} className="card p-4">
            <p className="text-[11px] text-[var(--muted)]">{c.t}</p>
            <p className="tabular brand text-xl mt-1">{c.v}</p>
          </article>
        ))}
      </div>

      <section className="card p-4">
        <p className="brand mb-3">Ventas · últimos 7 días</p>
        <div className="flex items-end gap-2 h-32">
          {reporte.serie.map((s) => (
            <div key={s.dia} className="flex-1 grid gap-1 justify-items-center" title={`${s.dia}: ${Bs(s.bs)} en ${s.pedidos} pedidos`}>
              <span className="tabular text-[10px] text-[var(--muted)]">{s.bs > 0 ? Math.round(s.bs) : ""}</span>
              <div className="barra w-full" style={{ height: "100%", background: "transparent", alignItems: "end", display: "flex" }}>
                <i style={{ height: `${(s.bs / maxBs) * 90 + 4}%`, width: "100%" }} />
              </div>
              <span className="text-[10px] text-[var(--muted)]">{s.dia}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3 mt-3 text-sm">
          <p>💵 efectivo <strong className="tabular">{Bs(r.efectivoBs)}</strong></p>
          <p>📱 QR <strong className="tabular">{Bs(r.qrBs)}</strong></p>
          <p>🍽 local {r.localPedidos} · 🥡 llevar {r.llevarPedidos}</p>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <section className="card p-4">
          <p className="brand mb-2">Más vendidos hoy</p>
          <ul className="grid gap-1 text-sm">
            {reporte.top.map((t) => (
              <li key={t.nombre} className="flex justify-between">
                <span>{t.nombre}</span>
                <span className="tabular text-[var(--muted)]">{t.uds} uds · {Bs(t.bs)}</span>
              </li>
            ))}
            {reporte.top.length === 0 && <li className="text-[var(--muted)]">Aún sin ventas registradas hoy.</li>}
          </ul>
        </section>
        <section className="card p-4">
          <p className="brand mb-2">Cobrados de hoy</p>
          <ul className="grid gap-1.5 text-sm max-h-64 overflow-y-auto">
            {reporte.pagados.map((p) => (
              <li key={p.id} className="flex items-start justify-between gap-2">
                <span>
                  #{String(p.id).padStart(4, "0")} {p.alias}
                  <br />
                  <span className="text-[10px] text-[var(--muted)]">{p.items.join(", ")}</span>
                </span>
                <span className="tabular text-right">{Bs(Number(p.total))}<br /><span className="text-[10px] text-[var(--muted)]">{new Date(p.pagadoEn).toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" })} · {p.metodoPago}</span></span>
              </li>
            ))}
            {reporte.pagados.length === 0 && <li className="text-[var(--muted)]">—</li>}
          </ul>
        </section>
      </div>

      {reporte.anulados.length > 0 && (
        <section className="card p-4">
          <p className="brand mb-2 text-[var(--peligro)]">Anulados de hoy</p>
          <ul className="text-sm">
            {reporte.anulados.map((a) => (
              <li key={a.id}>#{String(a.id).padStart(4, "0")} · {Bs(Number(a.total))} · {a.motivoAnulacion}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
