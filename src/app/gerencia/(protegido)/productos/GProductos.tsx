"use client";

import { useCallback, useEffect, useState } from "react";

type Prod = { id: number; nombre: string; descripcion: string; precio: string; imagen: string; stock: number; stockMin: number; disponible: boolean; creadoEn: string; categoriaId: number; categoria: { nombre: string; tipo: string } };
type Cat = { id: number; nombre: string; tipo: string };

const Bs = (n: number) => `Bs ${Number(n).toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const V = (obj: FormDataEntryValue | null) => (obj === null ? "" : String(obj));

export default function GProductos() {
  const [prods, setProds] = useState<Prod[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [dlg, setDlg] = useState<null | "nuevo">(null);
  const [edit, setEdit] = useState<Prod | null>(null);
  const [msg, setMsg] = useState("");

  const cargar = useCallback(async () => {
    const [rp, rc] = await Promise.all([fetch("/api/gerencia/productos"), fetch("/api/gerencia/categorias")]);
    if (rp.ok) setProds((await rp.json()).productos ?? []);
    if (rc.ok) setCats((await rc.json()).categorias ?? []);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function guardar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const cuerpo: Record<string, unknown> = {
      nombre: V(f.get("nombre")).trim(),
      descripcion: V(f.get("descripcion")).trim(),
      precio: Number(V(f.get("precio")).replace(",", ".")),
      categoriaId: Number(f.get("categoriaId")),
      stock: Number(f.get("stock")),
      stockMin: Number(f.get("stockMin") || 4),
    };
    const foto = f.get("foto") as File | null;

    async function post() {
      if (foto && foto.size > 0) {
        const fd = new FormData();
        fd.append("archivo", foto);
        const ru = await fetch("/api/gerencia/subir", { method: "POST", body: fd });
        const du = await ru.json();
        if (!ru.ok) throw new Error(du.error ?? "La foto no se pudo subir.");
        cuerpo.imagen = du.ruta;
      }
      const r = await fetch(dlg === "nuevo" ? "/api/gerencia/productos" : `/api/gerencia/productos/${edit!.id}`, {
        method: dlg === "nuevo" ? "POST" : "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(cuerpo),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "No se pudo guardar.");
    }

    try {
      await post();
      setMsg("Guardado.");
      setDlg(null);
      setEdit(null);
      cargar();
    } catch (err) {
      setMsg((err as Error).message);
    }
  }

  async function reponer(p: Prod, qty: number) {
    await fetch(`/api/gerencia/productos/${p.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ stock: p.stock + qty }),
    });
    cargar();
  }

  async function darBaja(p: Prod) {
    if (!confirm(`¿Dar de baja «${p.nombre}»? (el historial de ventas se conserva)`)) return;
    await fetch(`/api/gerencia/productos/${p.id}`, { method: "DELETE" });
    cargar();
  }

  const fotou = (p: Prod) => (p.imagen.startsWith("/uploads/") ? p.imagen : "");

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--muted)]">{prods.length} productos en el menú</p>
        <button className="btn btn-brasa btn-xs" onClick={() => setDlg("nuevo")}>+ nuevo producto</button>
      </div>
      {msg && <p className="card p-2 text-sm text-[var(--amanecer)]">{msg}</p>}

      <ul className="grid gap-2">
        {prods.map((p) => (
          <li key={p.id} className={`card p-3 flex items-center gap-3 ${p.disponible ? "" : "opacity-50"}`}>
            {fotou(p) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={fotou(p)} className="tile !h-12 !w-12 !text-xl object-cover" alt="" />
            ) : (
              <span className="tile !h-12 !w-12 !text-xl">{p.imagen.startsWith("emoji:") ? p.imagen.slice(6) : "🍽️"}</span>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{p.nombre}</p>
              <p className="text-xs text-[var(--muted)]">
                {p.categoria.nombre} · {Bs(Number(p.precio))} · stock <span className={p.stock === 0 ? "text-[var(--peligro)]" : p.stock <= p.stockMin ? "text-[var(--amanecer)]" : ""}>{p.stock}</span> / mín {p.stockMin} · ingresó {new Date(p.creadoEn).toLocaleDateString("es-BO")}
              </p>
            </div>
            <div className="flex flex-wrap justify-end gap-1.5">
              <button className="btn btn-suave btn-xs" onClick={() => reponer(p, 6)}>+6 stock</button>
              <button className="btn btn-suave btn-xs" onClick={() => setEdit(p)}>editar</button>
              <button className="btn btn-suave btn-xs text-[var(--peligro)]" onClick={() => darBaja(p)}>baja</button>
            </div>
          </li>
        ))}
      </ul>

      {(dlg === "nuevo" || edit) && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={() => { setDlg(null); setEdit(null); }}>
          {/* el target actual es editable: primero dlg, después edit */}
          <form className="card w-full max-w-md p-5 grid gap-3" onClick={(e) => e.stopPropagation()} onSubmit={guardar}>
            <p className="brand text-lg">{dlg === "nuevo" ? "Nuevo producto" : `Editar · ${edit?.nombre}`}</p>
            <div>
              <label className="label">Nombre</label>
              <input name="nombre" className="input" defaultValue={edit?.nombre ?? ""} required minLength={2} maxLength={60} />
            </div>
            <div>
              <label className="label">Descripción</label>
              <textarea name="descripcion" className="input" rows={2} defaultValue={edit?.descripcion ?? ""} maxLength={300} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="label">Precio Bs</label>
                <input name="precio" className="input tabular" defaultValue={edit ? Number(edit.precio) : ""} required inputMode="decimal" />
              </div>
              <div>
                <label className="label">Stock</label>
                <input name="stock" className="input tabular" type="number" defaultValue={edit?.stock ?? 0} min={0} required />
              </div>
              <div>
                <label className="label">Mín. alerta</label>
                <input name="stockMin" className="input tabular" type="number" defaultValue={edit?.stockMin ?? 4} min={0} />
              </div>
            </div>
            <div>
              <label className="label">Categoría</label>
              <select name="categoriaId" className="input" defaultValue={edit?.categoriaId ?? ""} required>
                <option value="" disabled>elige…</option>
                {cats.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre} ({c.tipo})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Foto (3 MB máx; si no subes foto quedará el emoji actual)</label>
              <input name="foto" type="file" accept="image/*" className="input" />
            </div>
            <div className="flex gap-2">
              <button type="button" className="btn btn-suave flex-1" onClick={() => { setDlg(null); setEdit(null); }}>cancelar</button>
              <button className="btn btn-brasa flex-1" type="submit">guardar</button>
            </div>
            {msg && <p className="text-sm text-[var(--peligro)]">{msg}</p>}
          </form>
        </div>
      )}
    </div>
  );
}
