"use client";

import { useCallback, useEffect, useState } from "react";

type Prod = {
  id: number;
  nombre: string;
  stock: number;
  stockMin: number;
  precio: string;
  disponible: boolean;
  categoria: { nombre: string; tipo: string };
};

const Bs = (n: number) => `Bs ${Number(n).toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function GStock() {
  const [prods, setProds] = useState<Prod[]>([]);
  const [filtro, setFiltro] = useState<"todos" | "bajos" | "agotados">("todos");
  const [q, setQ] = useState("");
  const [cargando, setCargando] = useState(true);
  const [msg, setMsg] = useState("");
  const [editandoStock, setEditandoStock] = useState<{ id: number; valor: number } | null>(null);

  const cargar = useCallback(async () => {
    try {
      const r = await fetch("/api/gerencia/productos", { cache: "no-store" });
      if (r.ok) {
        const d = await r.json();
        setProds(d.productos ?? []);
      }
    } catch {
      setMsg("Error al cargar inventario.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function actualizarStock(id: number, nuevoStock: number) {
    if (nuevoStock < 0) return;
    try {
      const r = await fetch(`/api/gerencia/productos/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ stock: nuevoStock }),
      });
      if (r.ok) {
        setMsg("Stock actualizado en tiempo real.");
        setEditandoStock(null);
        cargar();
      } else {
        const d = await r.json();
        setMsg(d.error || "No se pudo actualizar");
      }
    } catch {
      setMsg("Error al comunicar con el servidor.");
    }
  }

  const productosFiltrados = prods.filter((p) => {
    const coincideTexto = p.nombre.toLowerCase().includes(q.toLowerCase()) || p.categoria.nombre.toLowerCase().includes(q.toLowerCase());
    if (!coincideTexto) return false;
    if (filtro === "agotados") return p.stock === 0;
    if (filtro === "bajos") return p.stock > 0 && p.stock <= p.stockMin;
    return true;
  });

  const totalAgotados = prods.filter((p) => p.stock === 0).length;
  const totalBajos = prods.filter((p) => p.stock > 0 && p.stock <= p.stockMin).length;
  const totalUnidades = prods.reduce((acc, p) => acc + p.stock, 0);

  return (
    <div className="grid gap-5">
      {/* Encabezado y Métricas Rápidas */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="brand text-xl font-bold">Control de Inventario y Stock en Tiempo Real</h2>
          <p className="text-xs text-[var(--muted)]">
            Ajustes rápidos, reposición directa y monitoreo de niveles críticos.
          </p>
        </div>
        <button onClick={() => cargar()} className="btn btn-suave btn-xs">
          🔄 Refrescar inventario
        </button>
      </div>

      {msg && (
        <div className="card p-2.5 text-xs font-semibold text-[var(--amanecer)] flex justify-between items-center">
          <span>{msg}</span>
          <button onClick={() => setMsg("")} className="opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <article className="card p-3.5">
          <p className="text-[11px] text-[var(--muted)]">Total Unidades en Almacén</p>
          <p className="tabular brand text-2xl font-bold mt-1 text-[var(--ink)]">{totalUnidades}</p>
        </article>
        <article className="card p-3.5">
          <p className="text-[11px] text-[var(--muted)]">Productos Registrados</p>
          <p className="tabular brand text-2xl font-bold mt-1 text-[var(--ink)]">{prods.length}</p>
        </article>
        <article
          onClick={() => setFiltro("bajos")}
          className={`card p-3.5 cursor-pointer transition-colors ${filtro === "bajos" ? "border-[var(--amanecer)]" : ""}`}
        >
          <p className="text-[11px] text-[var(--amanecer)] font-semibold">⚠️ Por Agotarse</p>
          <p className="tabular brand text-2xl font-bold mt-1 text-[var(--amanecer)]">{totalBajos}</p>
        </article>
        <article
          onClick={() => setFiltro("agotados")}
          className={`card p-3.5 cursor-pointer transition-colors ${filtro === "agotados" ? "border-[var(--peligro)]" : ""}`}
        >
          <p className="text-[11px] text-[var(--peligro)] font-semibold">⛔ Agotados (Stock 0)</p>
          <p className="tabular brand text-2xl font-bold mt-1 text-[var(--peligro)]">{totalAgotados}</p>
        </article>
      </div>

      {/* Barra de filtros */}
      <div className="card p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5">
          <button
            onClick={() => setFiltro("todos")}
            className={`chip btn-xs ${filtro === "todos" ? "!bg-[var(--brasa)] !text-white !border-transparent" : ""}`}
          >
            Todos ({prods.length})
          </button>
          <button
            onClick={() => setFiltro("bajos")}
            className={`chip btn-xs ${filtro === "bajos" ? "!bg-[var(--amanecer)] !text-[#26150b] !border-transparent" : ""}`}
          >
            Por Agotarse ({totalBajos})
          </button>
          <button
            onClick={() => setFiltro("agotados")}
            className={`chip btn-xs ${filtro === "agotados" ? "!bg-[var(--peligro)] !text-white !border-transparent" : ""}`}
          >
            Agotados ({totalAgotados})
          </button>
        </div>

        <input
          type="search"
          placeholder="Buscar producto o categoría..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="input !py-1 !text-xs max-w-xs"
        />
      </div>

      {/* Lista de productos con ajuste dinámico de stock */}
      {cargando ? (
        <p className="text-center py-10 text-sm text-[var(--muted)]">Cargando stock...</p>
      ) : productosFiltrados.length === 0 ? (
        <div className="card p-10 text-center text-sm text-[var(--muted)]">
          No se encontraron productos con el filtro aplicado.
        </div>
      ) : (
        <div className="grid gap-2">
          {productosFiltrados.map((p) => {
            const esAgotado = p.stock === 0;
            const esBajo = p.stock > 0 && p.stock <= p.stockMin;

            return (
              <div
                key={p.id}
                className={`card p-3.5 flex flex-wrap items-center justify-between gap-3 ${
                  esAgotado ? "border-red-900/50 bg-red-950/10" : esBajo ? "border-amber-900/50 bg-amber-950/10" : ""
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[var(--ink)] truncate">{p.nombre}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[var(--muted)]">
                      {p.categoria.nombre}
                    </span>
                    {!p.disponible && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400">
                        Inactivo
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    Precio: <strong className="text-[var(--ink)]">{Bs(Number(p.precio))}</strong> · Umbral mínimo: {p.stockMin} uds
                  </p>
                </div>

                {/* Control de stock y botones rápidos */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-lg border border-white/10">
                    <button
                      title="Disminuir 1"
                      onClick={() => actualizarStock(p.id, Math.max(0, p.stock - 1))}
                      className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 font-bold text-xs"
                    >
                      -1
                    </button>

                    {editandoStock?.id === p.id ? (
                      <input
                        type="number"
                        min={0}
                        autoFocus
                        value={editandoStock.valor}
                        onChange={(e) => setEditandoStock({ id: p.id, valor: Number(e.target.value) })}
                        onBlur={() => actualizarStock(p.id, editandoStock.valor)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") actualizarStock(p.id, editandoStock.valor);
                          if (e.key === "Escape") setEditandoStock(null);
                        }}
                        className="w-14 text-center bg-black border border-[var(--brasa)] rounded text-sm py-0.5 tabular font-bold"
                      />
                    ) : (
                      <span
                        onClick={() => setEditandoStock({ id: p.id, valor: p.stock })}
                        title="Clic para editar valor manual"
                        className={`cursor-pointer px-2 text-sm tabular font-bold ${
                          esAgotado ? "text-[var(--peligro)] font-black" : esBajo ? "text-[var(--amanecer)]" : "text-emerald-400"
                        }`}
                      >
                        {p.stock} uds
                      </span>
                    )}

                    <button
                      title="Aumentar 1"
                      onClick={() => actualizarStock(p.id, p.stock + 1)}
                      className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 font-bold text-xs"
                    >
                      +1
                    </button>
                  </div>

                  {/* Atajos de reposición */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => actualizarStock(p.id, p.stock + 5)}
                      className="btn btn-suave btn-xs"
                      title="Agregar 5 unidades"
                    >
                      +5
                    </button>
                    <button
                      onClick={() => actualizarStock(p.id, p.stock + 10)}
                      className="btn btn-suave btn-xs"
                      title="Agregar 10 unidades"
                    >
                      +10
                    </button>
                    <button
                      onClick={() => actualizarStock(p.id, p.stock + 20)}
                      className="btn btn-suave btn-xs"
                      title="Agregar 20 unidades"
                    >
                      +20
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

