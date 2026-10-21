/** Formato moneda: Bs (Bolivia) — p. ej. Bs 32,00 */
export function Bs(n: number | string | { toNumber(): number }): string {
  const v = typeof n === "object" && n !== null ? Number((n as { toNumber(): number }).toNumber()) : (typeof n === "string" ? Number(n) : n);
  const f = (Number.isFinite(v) ? v : 0).toLocaleString("es-BO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `Bs ${f}`;
}

export function num(n: unknown): number {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
}

/** "hace 5 min" / "hace 1 h 20 min" */
export function hace(desde: Date | string): string {
  const t = (typeof desde === "string" ? new Date(desde) : desde).getTime();
  const m = Math.max(0, Math.floor((Date.now() - t) / 60000));
  if (m < 1) return "recién";
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  return `hace ${h} h ${m % 60} min`;
}

/** Aser: bien formato */
export function hora(d: Date | string): string {
  return new Date(d).toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" });
}
export function fecha(d: Date | string): string {
  return new Date(d).toLocaleDateString("es-BO", { day: "2-digit", month: "short" });
}
export function fechaHora(d: Date | string): string {
  return `${fecha(d)} ${hora(d)}`;
}

/** minutos restantes hasta d (>=0) */
export function restante(d: Date | string, ahora = Date.now()): number {
  const m = Math.ceil(((typeof d === "string" ? new Date(d) : d).getTime() - ahora) / 60000);
  return m;
}

export const TIPO_SERVICIO = { EN_LOCAL: "En el local", PARA_LLEVAR: "Para llevar" } as const;
export const ESTADO_P = { REGISTRADO: "En curso", LISTO: "Verificado — a caja", PAGADO: "Pagado", ANULADO: "Anulado" } as const;
