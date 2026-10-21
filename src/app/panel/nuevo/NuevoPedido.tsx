"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Prod = { id: number; nombre: string; descripcion: string; precio: string; imagen: string; stock: number; disponible: boolean };
type Cat = { id: number; nombre: string; tipo: string; productos: Prod[] };
type Item = { productoId: number; nombre: string; precio: number; cantidad: number };

const Bs = (n: number) => `Bs ${n.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function NuevoPedido() {
  const router = useRouter();
  const [cats, setCats] = useState<Cat[]>([]);
  const [carrito, setCarrito] = useState<Map<number, Item>>(new Map());
  const [alias, setAlias] = useState("");
  const [celular, setCelular] = useState("");
  const [servicio, setServicio] = useState<"EN_LOCAL" | "PARA_LLEVAR">("EN_LOCAL");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    fetch("/api/menu").then((r) => r.json()).then((d) => setCats(d.categorias ?? []));
  }, []);

  const items = useMemo(() => [...carrito.values()], [carrito]);
  const total = items.reduce((t, i) => t + i.cantidad * i.precio, 0);

  function sumar(p: Prod, d: number) {
    setCarrito((prev) => {
      const next = new Map(prev);
      const n = Math.min(p.stock, (next.get(p.id)?.cantidad ?? 0) + d);
      if (n <= 0) next.delete(p.id);
      else next.set(p.id, { productoId: p.id, nombre: p.nombre, precio: Number(p.precio), cantidad: n });
      return next;
    });
  }

  async function crear() {
    setError("");
    setGuardando(true);
    try {
      const r = await fetch("/api/panel/pedidos", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          items: items.map(({ productoId, cantidad }) => ({ productoId, cantidad })),
          alias: alias.trim() || undefined,
          celular: celular.trim() || undefined,
          servicio,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "No se pudo crear.");
      router.push(`/panel?cueva=${d.numero}`);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setGuardando(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl min-h-dvh px-4 pb-40">
      <header className="flex items-center justify-between py-5">
        <p className="brand text-xl">Nuevo pedido en mostrador</p>
      </header>

      <section className="card p-4 grid gap-3 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="a">Alias del cliente (opcional)</label>
          <input id="a" className="input" value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="p. ej. Mesa 4 — Familia Cruz" />
        </div>
        <div>
          <label className="label" htmlFor="c">Celular (opcional)</label>
          <input id="c" className="input tabular" value={celular} onChange={(e) => setCelular(e.target.value)} inputMode="numeric" maxLength={8} placeholder="70012345" />
        </div>
        <div>
          <span className="label">Servicio</span>
          <div className="flex gap-2">
            {(["EN_LOCAL", "PARA_LLEVAR"] as const).map((s) => (
              <button key={s} type="button" onClick={() => setServicio(s)} className={`chip !px-3 !py-1.5 ${servicio === s ? "!bg-[var(--cielo)] !text-[#08222e] !border-transparent" : ""}`}>
                {s === "EN_LOCAL" ? "en el local" : "para llevar"}
              </button>
            ))}
          </div>
        </div>
      </section>

      {cats.map((c) => (
        <section key={c.id} className="mt-5">
          <h2 className="serif italic text-[var(--amanecer)] text-lg">{c.nombre}</h2>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {c.productos.map((p) => (
              <article key={p.id} className={`card p-3 flex items-center gap-3 ${carrito.has(p.id) ? "border-[var(--brasa)]" : ""}`}>
                {p.imagen.startsWith("/uploads/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.imagen} alt="" className="tile !h-12 !w-12 !text-xl object-cover" />
                ) : (
                  <span className="tile !h-12 !w-12 !text-xl">{p.imagen.replace("emoji:", "")}</span>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{p.nombre}</p>
                  <p className="tabular text-xs text-[var(--muted)]">{Bs(Number(p.precio))} · stock {p.stock}</p>
                </div>
                {carrito.has(p.id) ? (
                  <div className="flex items-center gap-1 card-2 rounded-xl px-1.5 py-1">
                    <button className="px-1.5 text-lg font-bold text-[var(--amanecer)]" onClick={() => sumar(p, -1)}>−</button>
                    <span className="tabular w-5 text-center text-sm">{carrito.get(p.id)?.cantidad}</span>
                    <button className="px-1.5 text-lg font-bold text-[var(--amanecer)]" onClick={() => sumar(p, 1)}>+</button>
                  </div>
                ) : (
                  <button className="btn btn-brasa btn-xs" onClick={() => sumar(p, 1)} disabled={p.stock <= 0}>+</button>
                )}
              </article>
            ))}
          </div>
        </section>
      ))}

      {error && <p className="mt-4 card p-3 text-sm text-[var(--peligro)]">{error}</p>}

      {items.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-30 p-4" style={{ background: "linear-gradient(to top, var(--bg) 70%, transparent)" }}>
          <div className="mx-auto max-w-3xl card p-4 flex items-center gap-3">
            <div className="flex-1 text-sm">
              {items.map((i) => (
                <p key={i.productoId}>
                  {i.cantidad}× {i.nombre}
                </p>
              ))}
            </div>
            <p className="tabular brand text-xl text-[var(--amanecer)]">{Bs(total)}</p>
            <button className="btn btn-brasa" disabled={guardando} onClick={crear}>{guardando ? "creando…" : "crear y cobrar"}</button>
          </div>
        </div>
      )}
    </main>
  );
}
