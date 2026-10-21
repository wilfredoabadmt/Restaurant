"use client";

import { useEffect, useState } from "react";

type Log = { id: number; usuarioNombre: string; accion: string; pedidoId: number | null; justificacion: string | null; detalle: unknown; creadoEn: string };

const C: Record<string, string> = {
  MODIFICADO: "chip-listo",
  ELIMINADO: "chip-anulado",
  ANULADO: "chip-anulado",
  VENCIDO: "chip-anulado",
  PAGADO: "chip-pagado",
  REPOSICION: "chip-registrado",
  CREADO: "chip-pagado",
};

export default function GAuditoria() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [dias, setDias] = useState(7);

  useEffect(() => {
    fetch(`/api/gerencia/auditoria?dias=${dias}`)
      .then((r) => r.json())
      .then((d) => setLogs(d.logs ?? []));
  }, [dias]);

  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-2">
        <p className="text-sm text-[var(--muted)] flex-1">Kardex de acciones — toda modificación, pago, anulación y reposición queda anotada.</p>
        <select className="input !w-auto" value={dias} onChange={(e) => setDias(Number(e.target.value))}>
          <option value={1}>24 h</option>
          <option value={7}>7 días</option>
          <option value={30}>30 días</option>
        </select>
      </div>
      <ul className="grid gap-1.5">
        {logs.map((l) => (
          <li key={l.id} className="card p-3 text-sm">
            <p className="flex flex-wrap items-center gap-2">
              <span className={`chip ${C[l.accion] ?? ""}`}>{l.accion}</span>
              <span className="font-semibold">{l.usuarioNombre}</span>
              {l.pedidoId && <span className="tabular">#{String(l.pedidoId).padStart(4, "0")}</span>}
              <span className="text-[var(--muted)] text-xs">{new Date(l.creadoEn).toLocaleString("es-BO")}</span>
            </p>
            {l.justificacion && <p className="text-xs text-[var(--amanecer)] mt-1">justificación: {l.justificacion}</p>}
            {l.detalle != null && (
              <p className="text-xs text-[var(--muted)] mt-0.5 break-all">
                {typeof l.detalle === "object" ? JSON.stringify(l.detalle).slice(0, 180) : String(l.detalle)}
              </p>
            )}
          </li>
        ))}
        {logs.length === 0 && <li className="card p-6 text-center text-[var(--muted)]">Sin acciones registradas en el periodo.</li>}
      </ul>
    </div>
  );
}
