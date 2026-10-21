"use client";

import { useCallback, useEffect, useState } from "react";

type Cat = { id: number; nombre: string; tipo: string; orden: number; activa: boolean; _count: { productos: number } };

const TIPO_L: Record<string, string> = { PLATOS: "platos 🍛", BEBIDAS: "bebidas 🍹", POSTRES: "postres 🥧" };

export default function GCategorias() {
  const [cats, setCats] = useState<Cat[]>([]);
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<"PLATOS" | "BEBIDAS" | "POSTRES">("PLATOS");
  const [msg, setMsg] = useState("");

  const cargar = useCallback(async () => {
    const r = await fetch("/api/gerencia/categorias");
    if (r.ok) setCats((await r.json()).categorias ?? []);
  }, []);
  useEffect(() => {
    cargar();
  }, [cargar]);

  async function crear() {
    setMsg("");
    const r = await fetch("/api/gerencia/categorias", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ nombre: nombre.trim(), tipo }),
    });
    const d = await r.json();
    if (!r.ok) return setMsg(d.error);
    setNombre("");
    setMsg("Categoría creada.");
    cargar();
  }

  async function cambiar(c: Cat, cambios: Record<string, unknown>) {
    const r = await fetch(`/api/gerencia/categorias/${c.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(cambios),
    });
    const d = await r.json();
    if (!r.ok) return setMsg(d.error);
    setMsg(`«${c.nombre}» actualizada.`);
    cargar();
  }

  async function borrar(c: Cat) {
    if (!confirm(`¿Quitar «${c.nombre}»? Si tiene productos solo se apaga para conservar el historial.`)) return;
    const r = await fetch(`/api/gerencia/categorias/${c.id}`, { method: "DELETE" });
    const d = await r.json();
    if (!r.ok) return setMsg(d.error);
    setMsg(d.borrada ? `«${c.nombre}» borrada.` : `«${c.nombre}» apagada (tiene ${c._count?.productos ?? 0} productos).`);
    cargar();
  }

  return (
    <div className="grid gap-4">
      <section className="card p-4">
        <p className="brand mb-3">Nueva categoría</p>
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-48">
            <label className="label">Nombre</label>
            <input className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="p. ej. Sopas" maxLength={40} />
          </div>
          <div>
            <label className="label">Tipo de carta</label>
            <select className="input" value={tipo} onChange={(e) => setTipo(e.target.value as typeof tipo)}>
              <option value="PLATOS">platos</option>
              <option value="BEBIDAS">bebidas</option>
              <option value="POSTRES">postres</option>
            </select>
          </div>
          <button className="btn btn-brasa" onClick={crear} disabled={nombre.trim().length < 2}>crear</button>
        </div>
        {msg && <p className="mt-2 text-sm text-[var(--amanecer)]">{msg}</p>}
      </section>

      <ul className="grid gap-2">
        {cats.map((c) => (
          <li key={c.id} className={`card p-3 flex items-center gap-3 ${c.activa ? "" : "opacity-50"}`}>
            <div className="flex-1 min-w-0">
              <p className="font-semibold">
                {c.nombre} <span className={`chip ml-1 ${c.activa ? "chip-registrado" : "chip-anulado"}`}>{c.activa ? TIPO_L[c.tipo] : "apagada"}</span>
              </p>
              <p className="text-xs text-[var(--muted)]">{c._count.productos} productos · orden {c.orden}</p>
            </div>
            <div className="flex gap-1.5">
              <button className="btn btn-suave btn-xs" onClick={() => cambiar(c, { activa: !c.activa })}>{c.activa ? "apagar" : "encender"}</button>
              <button className="btn btn-suave btn-xs text-[var(--peligro)]" onClick={() => borrar(c)}>quitar</button>
            </div>
          </li>
        ))}
      </ul>
      <p className="text-xs text-[var(--muted)]">La pestaña «todo» del menú agrupa las categorías encendidas por su orden.</p>
    </div>
  );
}
