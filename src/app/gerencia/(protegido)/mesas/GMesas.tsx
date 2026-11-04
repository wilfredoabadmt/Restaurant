"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

type MesaBD = {
  id: number;
  numero: number;
  nombre: string;
  token: string;
  activa: boolean;
};

type MesaConQR = MesaBD & {
  qrDataUrl: string;
  urlMesa: string;
};

export default function GMesas() {
  const [cantidadMesas, setCantidadMesas] = useState(12);
  const [mesas, setMesas] = useState<MesaConQR[]>([]);
  const [hostUrl, setHostUrl] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mesaSeleccionada, setMesaSeleccionada] = useState<MesaConQR | null>(null);
  const [msg, setMsg] = useState("");

  async function cargarMesas(baseUrl?: string) {
    const origin = baseUrl || (typeof window !== "undefined" ? window.location.origin : "");
    if (!hostUrl && origin) setHostUrl(origin);

    try {
      setCargando(true);
      const res = await fetch("/api/gerencia/mesas", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cargar mesas");

      const listaBD: MesaBD[] = data.mesas || [];
      setCantidadMesas(listaBD.length || 12);

      const conQR: MesaConQR[] = [];
      for (const m of listaBD) {
        // La URL utiliza el token criptográfico seguro
        const urlMesa = `${origin}/menu?token=${m.token}`;
        const qrDataUrl = await QRCode.toDataURL(urlMesa, {
          margin: 1,
          width: 320,
          color: { dark: "#160f0a", light: "#fdfaf6" },
        });
        conQR.push({
          ...m,
          urlMesa,
          qrDataUrl,
        });
      }
      setMesas(conQR);
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Error al cargar mesas");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarMesas();
  }, []);

  async function handleGenerarMesas(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setMsg("");
    try {
      const res = await fetch("/api/gerencia/mesas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cantidad: cantidadMesas }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo actualizar");
      setMsg("Mesas y códigos QR criptográficos sincronizados correctamente.");
      cargarMesas(hostUrl);
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setGuardando(false);
    }
  }

  function imprimirTodo() {
    window.print();
  }

  return (
    <div className="grid gap-6">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="brand text-xl font-bold">Generación y Control de Códigos QR por Mesa</h2>
          <p className="text-xs text-[var(--muted)]">
            Cada mesa cuenta con un <strong>token criptográfico único e infalsificable</strong> en base de datos.
            El cliente no puede alterar el número de mesa en la URL.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={imprimirTodo} className="btn btn-brasa btn-xs">
            🖨️ Imprimir todos los QR
          </button>
        </div>
      </div>

      {msg && (
        <div className="no-print card p-3 text-xs font-semibold text-[var(--amanecer)] flex justify-between items-center">
          <span>{msg}</span>
          <button onClick={() => setMsg("")} className="opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Control de cantidad */}
      <div className="no-print card p-4 flex flex-wrap items-center justify-between gap-4">
        <form onSubmit={handleGenerarMesas} className="flex items-center gap-3">
          <label className="text-xs font-semibold">
            Mesas Activas en el Salón:
            <input
              type="number"
              min={1}
              max={60}
              value={cantidadMesas}
              onChange={(e) => setCantidadMesas(Number(e.target.value))}
              className="input !py-1 !text-xs w-20 ml-2 text-center"
            />
          </label>
          <button type="submit" disabled={guardando} className="btn btn-suave btn-xs">
            {guardando ? "Sincronizando..." : "Sincronizar Mesas"}
          </button>
        </form>
        <span className="text-xs text-[var(--muted)]">
          Formato Seguro: <code className="font-mono text-[var(--amanecer)]">{hostUrl}/menu?token=[TOKEN_MESA]</code>
        </span>
      </div>

      {cargando ? (
        <div className="card p-10 text-center text-sm text-[var(--muted)]">
          Cargando y renderizando códigos QR de alta resolución...
        </div>
      ) : (
        /* Grid de Mesas */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {mesas.map((m) => (
            <div
              key={m.numero}
              className="card p-4 flex flex-col items-center text-center space-y-2 relative group hover:border-[var(--amanecer)] transition-colors"
            >
              <div className="flex items-center justify-between w-full">
                <span className="brand font-black text-lg text-[var(--ink)]">Mesa {m.numero}</span>
                <span className="chip chip-registrado text-[10px] !py-0.5">Activa</span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-stone-300 shadow-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.qrDataUrl} alt={`QR Mesa ${m.numero}`} className="w-36 h-36 object-contain" />
              </div>

              <p className="text-[9px] text-[var(--muted)] font-mono truncate w-full" title={m.urlMesa}>
                Token: {m.token}
              </p>

              <div className="no-print pt-1 flex gap-1 w-full">
                <button
                  onClick={() => setMesaSeleccionada(m)}
                  className="btn btn-suave btn-xs flex-1 text-[11px]"
                >
                  Ver grande
                </button>
                <a
                  href={m.qrDataUrl}
                  download={`qr-mesa-${m.numero}.png`}
                  className="btn btn-suave btn-xs flex-1 text-[11px]"
                >
                  Descargar
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal QR en Grande */}
      {mesaSeleccionada && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4"
          onClick={() => setMesaSeleccionada(null)}
        >
          <div
            className="bg-white text-black p-6 rounded-2xl max-w-sm w-full text-center space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="brand text-2xl font-black tracking-tight">MESA {mesaSeleccionada.numero}</h3>
            <p className="text-xs text-stone-600">Escanea para pedir directo desde tu mesa sin modificar</p>
            <div className="p-3 bg-stone-100 rounded-xl inline-block border border-stone-300">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mesaSeleccionada.qrDataUrl} alt="QR" className="w-64 h-64 mx-auto" />
            </div>
            <p className="text-[10px] font-mono text-stone-500 break-all">{mesaSeleccionada.urlMesa}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setMesaSeleccionada(null)}
                className="btn btn-suave flex-1 text-black bg-stone-200 hover:bg-stone-300"
              >
                Cerrar
              </button>
              <a
                href={mesaSeleccionada.qrDataUrl}
                download={`qr-mesa-${mesaSeleccionada.numero}.png`}
                className="btn btn-brasa flex-1"
              >
                Descargar PNG
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
