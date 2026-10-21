"use client";

import { useCallback, useEffect, useState } from "react";

type U = { id: number; usuario: string; nombre: string; apellidos: string; rol: string; activo: boolean; creadoEn: string };

export default function GCajeros() {
  const [us, setUs] = useState<U[]>([]);
  const [msg, setMsg] = useState("");
  const [nuevo, setNuevo] = useState({ usuario: "", nombre: "", apellidos: "", password: "" });

  const cargar = useCallback(async () => {
    const r = await fetch("/api/gerencia/usuarios");
    if (r.ok) setUs((await r.json()).usuarios ?? []);
  }, []);
  useEffect(() => {
    cargar();
  }, [cargar]);

  async function crear() {
    setMsg("");
    const r = await fetch("/api/gerencia/usuarios", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(nuevo),
    });
    const d = await r.json();
    if (!r.ok) return setMsg(d.error);
    setMsg(`Cajero «${nuevo.nombre} ${nuevo.apellidos}» creado con la contraseña ${nuevo.password}. ¡Pásale la credencial en persona!`);
    setNuevo({ usuario: "", nombre: "", apellidos: "", password: "" });
    cargar();
  }

  async function cambiar(id: number, cambios: Record<string, unknown>, nota: string) {
    const r = await fetch(`/api/gerencia/usuarios/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(cambios),
    });
    const d = await r.json();
    if (!r.ok) return setMsg(d.error);
    setMsg(nota);
    cargar();
  }

  return (
    <div className="grid gap-4">
      <section className="card p-4">
        <p className="brand mb-1">Alta de cajero</p>
        <p className="text-xs text-[var(--muted)] mb-3">El cajero entra a /panel con su nombre de usuario y contraseña.</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <label className="label">Nombres</label>
            <input className="input" value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} placeholder="p. ej. Jessica" />
          </div>
          <div>
            <label className="label">Apellidos</label>
            <input className="input" value={nuevo.apellidos} onChange={(e) => setNuevo({ ...nuevo, apellidos: e.target.value })} placeholder="p. ej. Mamani Ríos" />
          </div>
          <div>
            <label className="label">Usuario de acceso</label>
            <input className="input" value={nuevo.usuario} onChange={(e) => setNuevo({ ...nuevo, usuario: e.target.value.toLowerCase() })} placeholder="p. ej. cajero3" />
          </div>
          <div>
            <label className="label">Contraseña (6+)</label>
            <input className="input" type="text" value={nuevo.password} onChange={(e) => setNuevo({ ...nuevo, password: e.target.value })} placeholder="p. ej. caja2026" />
          </div>
        </div>
        <button className="btn btn-brasa mt-3" disabled={!nuevo.nombre || !nuevo.apellidos || !nuevo.usuario || nuevo.password.length < 6} onClick={crear}>
          crear cajero
        </button>
        {msg && <p className="mt-2 text-sm text-[var(--amanecer)]">{msg}</p>}
      </section>

      <ul className="grid gap-2">
        {us.map((u) => (
          <li key={u.id} className={`card p-3 flex items-center gap-3 ${u.activo ? "" : "opacity-50"}`}>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">
                {u.nombre} {u.apellidos} <span className={`chip ml-1 ${u.activo ? "chip-pagado" : "chip-anulado"}`}>{u.activo ? "activo" : "inactivo"}</span>
              </p>
              <p className="text-xs text-[var(--muted)]">
                {u.usuario} · rol {u.rol.toLowerCase()} · alta {new Date(u.creadoEn).toLocaleDateString("es-BO")}
              </p>
            </div>
            {u.rol === "CAJERO" && (
              <div className="flex gap-1.5">
                <button
                  className="btn btn-suave btn-xs"
                  onClick={() => {
                    const pwd = prompt(`Nueva contraseña para ${u.usuario}:`, "caja2026");
                    if (pwd && pwd.length >= 6) cambiar(u.id, { password: pwd }, `Contraseña de ${u.nombre} actualizada.`);
                  }}
                >
                  nueva clave
                </button>
                <button className="btn btn-suave btn-xs" onClick={() => cambiar(u.id, { activo: !u.activo }, `${u.usuario} ${u.activo ? "desactivada" : "reactivada"}.`)}>
                  {u.activo ? "apagar" : "encender"}
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
