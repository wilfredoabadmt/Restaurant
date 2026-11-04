"use client";

import { useEffect, useState, useId } from "react";
import QRCode from "qrcode";

type Mesa = {
  numero: number;
  qrDataUrl: string;
  urlMesa: string;
};

export default function GMesas() {
  const [cantidadMesas, setCantidadMesas] = useState(12);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [hostUrl, setHostUrl] = useState("");
  const [mesaSeleccionada, setMesaSeleccionada] = useState<Mesa | null>(null);

  useEffect(() => {
    const origin = window.location.origin;
    setHostUrl(origin);
    generarQRs(cantidadMesas, origin);
  }, []);

  async function generarQRs(total: number, baseUrl: string) {
    const res: Mesa[] = [];
    for (let i = 1; i <= total; i++) {
      const url = `${baseUrl}/menu?mesa=${i}`;
      const qrDataUrl = await QRCode.toDataURL(url, {
        margin: 1,
        width: 300,
        color: { dark: "#160f0a", light: "#fdfaf6" },
      });
      res.push({
        numero: i,
        qrDataUrl,
        urlMesa: url,
      });
    }
    setMesas(res);
  }

  function handleActualizarMesas(e: React.FormEvent) {
    e.preventDefault();
    generarQRs(cantidadMesas, hostUrl);
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
            Cada mesa cuenta con un enlace y token de sesión único para evitar duplicidades y consolidar cuentas.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={imprimirTodo} className="btn btn-brasa btn-xs">
            🖨️ Imprimir todos los QR
          </button>
        </div>
      </div>

      {/* Control de cantidad */}
      <div className="no-print card p-4 flex flex-wrap items-center justify-between gap-4">
        <form onSubmit={handleActualizarMesas} className="flex items-center gap-3">
          <label className="text-xs font-semibold">
            Número de Mesas en Salón:
            <input
              type="number"
              min={1}
              max={60}
              value={cantidadMesas}
              onChange={(e) => setCantidadMesas(Number(e.target.value))}
              className="input !py-1 !text-xs w-20 ml-2 text-center"
            />
          </label>
          <button type="submit" className="btn btn-suave btn-xs">
            Actualizar Mesas
          </button>
        </form>
        <span className="text-xs text-[var(--muted)]">
          Base: <code className="font-mono text-[var(--amanecer)]">{hostUrl}/menu?mesa=[N]</code>
        </span>
      </div>

      {/* Grid de Mesas */}
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

            <p className="text-[10px] text-[var(--muted)] font-mono truncate w-full">
              {m.urlMesa}
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
            <p className="text-xs text-stone-600">Escanea para pedir directo desde tu mesa</p>
            <div className="p-3 bg-stone-100 rounded-xl inline-block border border-stone-300">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mesaSeleccionada.qrDataUrl} alt="QR" className="w-64 h-64 mx-auto" />
            </div>
            <p className="text-[11px] font-mono text-stone-500">{mesaSeleccionada.urlMesa}</p>
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

