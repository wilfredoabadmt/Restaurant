"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Tipo } from "@prisma/client";

type Prod = { id: number; nombre: string; descripcion: string; precio: string; imagen: string; stock: number; stockMin: number };
type Cat = { id: number; nombre: string; tipo: Tipo; productos: Prod[] };
type Item = { productoId: number; nombre: string; precio: number; cantidad: number };

const Bs = (n: number) => `Bs ${n.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/* estilo "carta clara": crema + vino (coincide con el comprobante de pedido) */
const VINO = "#8a2b2b";
const CREMA = "#faf4e9";
const TINTA = "#3a2a24";
const MUTE = "#8d7b70";
const LINE = "#ece1cf";
const TILE = "#f6e9e4";
const CREMA_ORO = "#f7e9c8";

const ICONO_TIPO: Record<string, string> = { PLATOS: "🍴", BEBIDAS: "🍹", POSTRES: "🧁" };

export default function MenuClient() {
  const router = useRouter();
  const [cats, setCats] = useState<Cat[]>([]);
  const [tab, setTab] = useState<number | "todos">("todos");
  const [carrito, setCarrito] = useState<Map<number, Item>>(new Map());
  const [abrirCarrito, setAbrirCarrito] = useState(false);
  const [fase, setFase] = useState<"menu" | "datos" | "enviando">("menu");
  const [alias, setAlias] = useState("");
  const [celular, setCelular] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [numero, setNumero] = useState<number | null>(null);
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/menu").then((r) => r.json()).then((d) => setCats(d.categorias ?? [])).catch(() => setError("No se pudo cargar el menú."));
  }, []);

  const total = useMemo(() => [...carrito.values()].reduce((t, i) => t + i.cantidad * i.precio, 0), [carrito]);
  const unidades = useMemo(() => [...carrito.values()].reduce((t, i) => t + i.cantidad, 0), [carrito]);

  const agregar = (p: Prod) => {
    if (p.stock <= 0) return;
    setCarrito((prev) => {
      const next = new Map(prev);
      const cant = Math.min(p.stock, (next.get(p.id)?.cantidad ?? 0) + 1);
      next.set(p.id, { productoId: p.id, nombre: p.nombre, precio: Number(p.precio), cantidad: cant });
      return next;
    });
  };
  const quitar = (p: Prod) => {
    setCarrito((prev) => {
      const next = new Map(prev);
      const it = next.get(p.id);
      if (!it) return prev;
      if (it.cantidad <= 1) next.delete(p.id);
      else next.set(p.id, { ...it, cantidad: it.cantidad - 1 });
      return next;
    });
  };

  async function enviarPedido() {
    setError("");
    if (unidades === 0) return;
    setFase("enviando");
    try {
      const r = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ items: [...carrito.values()].map(({ productoId, cantidad }) => ({ productoId, cantidad })) }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "No se pudo enviar.");
      setNumero(d.numero);
      setCodigo(d.codigo ?? String(d.numero));
      setAbrirCarrito(false);
      setFase("datos");
    } catch (e) {
      setError((e as Error).message);
      setFase("menu");
    }
  }

  async function confirmarDatos() {
    setError("");
    if (!numero) return;
    if (alias.trim().length < 2) return setError("Escribe tu alias (2+ caracteres).");
    if (!/^[67]\d{7}$/.test(celular.trim())) return setError("Celular boliviano: 8 dígitos que empieza en 6 o 7.");
    setFase("enviando");
    try {
      const r = await fetch(`/api/pedidos/${numero}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ alias: alias.trim(), celular: celular.trim(), mensaje: mensaje.trim() }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "No se pudo registrar.");
      document.cookie = `lp_pedido=${numero}; max-age=1800; path=/`;
      router.push(`/pedido/${numero}`);
    } catch (e) {
      setError((e as Error).message);
      setFase("datos");
    }
  }

  const visibles: Cat[] = tab === "todos" ? cats : cats.filter((c) => c.id === tab);

  return (
    <div className="min-h-dvh" style={{ background: CREMA, color: TINTA }}>
      <main className="mx-auto max-w-2xl pb-36">
        {/* cabecera */}
        <header className="sticky top-0 z-20 backdrop-blur-md" style={{ background: "rgba(250,244,233,.92)" }}>
          <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full font-extrabold text-white !leading-none" style={{ background: VINO }}>
                LP
              </span>
              <div>
                <p className="font-extrabold text-lg !leading-none" style={{ color: TINTA }}>La Paila</p>
                <p className="text-[11px] mt-1" style={{ color: MUTE }}>picantería criolla · para consumir aquí</p>
              </div>
            </div>
            <button
              onClick={() => unidades > 0 && setAbrirCarrito(true)}
              className="rounded-full px-3.5 py-2 text-[12px] font-semibold shrink-0"
              style={{ background: CREMA_ORO, color: "#7a5a17", border: "1px solid #eadfae" }}
            >
              {unidades > 0 ? `Tu carrito · ${unidades} ${unidades === 1 ? "ítem" : "ítems"} 👇` : "Cuenta tus platos al carrito 👇"}
            </button>
          </div>
          {/* pestañas de categorías */}
          <nav className="flex gap-2 overflow-x-auto px-5 pb-3">
            <button
              onClick={() => setTab("todos")}
              className={`chip !px-3.5 !py-1.5 shrink-0 ${tab === "todos" ? "!text-white" : ""}`}
              style={{ background: tab === "todos" ? VINO : "#fff", color: tab === "todos" ? "#fff" : VINO, border: `1px solid ${tab === "todos" ? VINO : LINE}` }}
            >
              Todo
            </button>
            {cats.map((c) => (
              <button
                key={c.id}
                onClick={() => setTab(c.id)}
                className={`chip !px-3.5 !py-1.5 shrink-0 whitespace-nowrap`}
                style={{ background: tab === c.id ? VINO : "#fff", color: tab === c.id ? "#fff" : VINO, border: `1px solid ${tab === c.id ? VINO : LINE}` }}
              >
                {c.nombre}
              </button>
            ))}
          </nav>
        </header>

        {error && (
          <p className="mx-5 mt-3 rounded-2xl p-3 text-sm" style={{ background: "#fdeaea", border: "1px solid #f3c8c8", color: "#7a1c1c" }}>
            {error}
          </p>
        )}

        {/* categorías y productos */}
        <section className="px-5 mt-3">
          {visibles.map((c) => (
            <div key={c.id} className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg" aria-hidden>{ICONO_TIPO[c.tipo] ?? "🍴"}</span>
                <h2 className="font-extrabold text-lg !leading-none" style={{ color: VINO }}>{c.nombre}</h2>
                <span className="rounded-full px-2.5 py-1 text-[10px] font-semibold" style={{ background: "#f1e6d7", color: MUTE }}>
                  {c.productos.length} {c.productos.length === 1 ? "opción" : "opciones"}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {c.productos.map((p) => {
                  const enCarrito = carrito.get(p.id)?.cantidad ?? 0;
                  return (
                    <article
                      key={p.id}
                      className="flex items-center gap-3 rounded-2xl p-3"
                      style={{ background: "#fff", border: `1px solid ${LINE}`, boxShadow: "0 1px 2px rgba(58,42,36,.05)", opacity: p.stock <= 0 ? 0.55 : 1 }}
                    >
                      {p.imagen.startsWith("/uploads/") ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.imagen} alt={p.nombre} className="!h-14 !w-14 shrink-0 rounded-xl object-cover" style={{ background: TILE }} />
                      ) : (
                        <span className="grid !h-14 !w-14 shrink-0 place-items-center rounded-xl text-2xl" style={{ background: TILE, color: VINO }}>
                          {p.imagen.replace("emoji:", "")}
                        </span>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold leading-tight" style={{ color: TINTA }}>{p.nombre}</p>
                        <p className="text-xs line-clamp-2 mt-0.5" style={{ color: MUTE }}>{p.descripcion}</p>
                        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                          <span className="tabular font-extrabold text-[15px]" style={{ color: VINO }}>{Bs(Number(p.precio))}</span>
                          {p.stock <= p.stockMin && p.stock > 0 && (
                            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: "#fdeaea", color: "#7a1c1c" }}>¡solo {p.stock}!</span>
                          )}
                          {p.stock <= 0 && (
                            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: "#fdeaea", color: "#7a1c1c" }}>agotado</span>
                          )}
                        </div>
                      </div>
                      {enCarrito > 0 ? (
                        <div className="flex items-center gap-1 rounded-full px-1.5 py-1 shrink-0" style={{ background: TILE, border: `1px solid ${LINE}` }}>
                          <button onClick={() => quitar(p)} aria-label="quitar" className="px-1.5 text-lg font-bold" style={{ color: VINO }}>−</button>
                          <span className="tabular w-5 text-center font-bold" style={{ color: TINTA }}>{enCarrito}</span>
                          <button onClick={() => agregar(p)} aria-label="agregar" className="px-1.5 text-lg font-bold" style={{ color: VINO }}>+</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => agregar(p)}
                          disabled={p.stock <= 0}
                          className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] font-semibold text-white shrink-0"
                          style={{ background: VINO }}
                        >
                          <span className="text-base leading-none">＋</span> Agregar
                        </button>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
          ))}
          {visibles.length === 0 && !error && (
            <p className="py-16 text-center text-sm" style={{ color: MUTE }}>Cargando la carta…</p>
          )}
        </section>
      </main>

      {/* barra inferior carrito */}
      {unidades > 0 && fase === "menu" && (
        <div className="fixed bottom-0 inset-x-0 z-30 p-4" style={{ background: "linear-gradient(to top, #faf4e9 70%, transparent)" }}>
          <button
            onClick={() => setAbrirCarrito(true)}
            className="mx-auto flex max-w-2xl w-full items-center justify-between rounded-full px-5 py-3.5 text-white"
            style={{ background: VINO }}
          >
            <span className="font-semibold">🛒 Ver pedido · {unidades} {unidades === 1 ? "ud" : "uds"}</span>
            <span className="tabular font-extrabold">{Bs(total)}</span>
          </button>
        </div>
      )}

      {/* cajón del carrito */}
      {abrirCarrito && (
        <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setAbrirCarrito(false)}>
          <div className="absolute bottom-0 inset-x-0 rounded-t-3xl max-w-2xl mx-auto p-5 pb-8" style={{ background: "#fff", border: `1px solid ${LINE}` }} onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-4 h-1 w-10 rounded-full" style={{ background: LINE }} />
            <h3 className="font-extrabold text-lg mb-3" style={{ color: TINTA }}>Tu pedido</h3>
            <div className="grid gap-2 max-h-64 overflow-y-auto">
              {[...carrito.values()].map((i) => {
                const prod = cats.flatMap((c) => c.productos).find((p) => p.id === i.productoId)!;
                return (
                  <div key={i.productoId} className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: TILE }}>
                    <span className="flex-1 text-sm font-semibold" style={{ color: TINTA }}>{i.nombre}</span>
                    <button className="grid h-7 w-7 place-items-center rounded-full text-base font-bold text-white" style={{ background: VINO }} onClick={() => quitar(prod)} aria-label="quitar uno">−</button>
                    <span className="tabular w-6 text-center font-bold">{i.cantidad}</span>
                    <button className="grid h-7 w-7 place-items-center rounded-full text-base font-bold text-white" style={{ background: VINO }} onClick={() => agregar(prod)} aria-label="sumar uno">+</button>
                    <span className="tabular w-20 text-right text-sm font-semibold" style={{ color: VINO }}>{Bs(i.cantidad * i.precio)}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-4 pt-3" style={{ borderTop: `1px solid ${LINE}` }}>
              <span className="text-sm" style={{ color: MUTE }}>Total a caja</span>
              <span className="tabular font-extrabold text-xl" style={{ color: VINO }}>{Bs(total)}</span>
            </div>
            <button onClick={enviarPedido} disabled={fase === "enviando"} className="mt-4 w-full rounded-xl py-3 font-bold text-white" style={{ background: VINO }}>
              {fase === "enviando" ? "Enviando…" : "Enviar pedido a caja →"}
            </button>
            <p className="mt-2 text-center text-[11px]" style={{ color: MUTE }}>Al enviar, tu pedido espera 40 minutos en caja.</p>
          </div>
        </div>
      )}

      {/* datos del cliente tras enviar */}
      {fase === "datos" && (
        <div className="fixed inset-0 z-40 bg-black/60 grid place-items-center p-4">
          <div className="w-full max-w-sm rounded-2xl p-5" style={{ background: "#fff", border: `1px solid ${LINE}` }}>
            <p className="text-xs" style={{ color: MUTE }}>Pedido enviado a caja · tu código</p>
            <p className="text-3xl font-black !leading-none tracking-[0.08em]" style={{ color: VINO }}>{codigo}</p>
            <p className="text-sm mt-2" style={{ color: TINTA }}>Registra cómo avisarte cuando esté listo:</p>
            <div className="mt-3 grid gap-3">
              <div>
                <label className="label !text-[11px]" style={{ color: MUTE }} htmlFor="alias">Tu alias (cómo te llama caja)</label>
                <input id="alias" value={alias} onChange={(e) => setAlias(e.target.value)} className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={{ background: TILE, border: `1px solid ${LINE}` }} placeholder="p. ej. Fernanda Q." />
              </div>
              <div>
                <label className="label !text-[11px]" style={{ color: MUTE }} htmlFor="cel">Celular</label>
                <input id="cel" value={celular} onChange={(e) => setCelular(e.target.value)} className="w-full rounded-xl px-3 py-2.5 text-sm outline-none tabular" style={{ background: TILE, border: `1px solid ${LINE}` }} placeholder="70012345" inputMode="numeric" maxLength={8} />
              </div>
              <div>
                <label className="label !text-[11px]" style={{ color: MUTE }} htmlFor="msg">Mensaje para el cajero (opcional)</label>
                <textarea id="msg" value={mensaje} onChange={(e) => setMensaje(e.target.value)} className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={{ background: TILE, border: `1px solid ${LINE}` }} rows={2} maxLength={140} placeholder="p. ej. sin ají, por favor" />
              </div>
              {error && <p className="text-sm" style={{ color: "#7a1c1c" }}>{error}</p>}
              <button onClick={confirmarDatos} className="rounded-xl py-3 font-bold text-white" style={{ background: VINO }}>Estoy listo — finalizar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
