import QRCode from "qrcode";
import Link from "next/link";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export default async function Landing() {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = host.includes("localhost") ? "http" : "https";
  const urlMenu = `${proto}://${host}/menu`;
  const qr = await QRCode.toDataURL(urlMenu, {
    margin: 1,
    width: 320,
    color: { dark: "#f2e8dc", light: "#140e0a" },
  });

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col px-5 pb-16">
      <header className="flex items-center justify-between py-6">
        <div className="flex items-center gap-3">
          <span className="tile !h-12 !w-12 !text-2xl">🫕</span>
          <div>
            <p className="brand text-xl">La Paila</p>
            <p className="text-xs text-[var(--muted)]">picantería criolla</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/panel/entrar" className="btn btn-suave btn-xs">Caja</Link>
          <Link href="/gerencia/entrar" className="btn btn-suave btn-xs">Gerencia</Link>
        </div>
      </header>

      <section className="mt-6 text-center">
        <p className="serif text-[var(--amanecer)] italic">Del fondo de la olla, directo a tu mesa</p>
        <h1 className="brand mt-1 text-4xl leading-tight sm:text-5xl">
          Escanea, pide y
          <br />
          pasa por caja
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-[var(--muted)]">
          Elige platos, bebidas y postres desde tu celular. Envía el pedido y lo recibe
          caja al instante, con su número y tiempo de validez.
        </p>
      </section>

      <section className="mt-8 flex flex-col items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qr} alt="Código QR hacia el menú" className="card-2 rounded-3xl p-3" width={280} height={280} />
        <p className="text-xs text-[var(--muted)]">
          URL directa: <span className="font-mono text-[var(--ink)]">{urlMenu}</span>
        </p>
        <Link href="/menu" className="btn btn-brasa w-full max-w-xs">
          Ver el menú ahora →
        </Link>
      </section>

      <section className="mt-12 grid gap-3 sm:grid-cols-3">
        {[
          { e: "📋", t: "Menú por categorías", d: "Platos, bebidas y postres con foto e inventario en vivo" },
          { e: "🛒", t: "Carrito y envío", d: "Suma cantidades, ve el total y confirma en un toque" },
          { e: "🧾", t: "Cobro en caja", d: "Efectivo o QR, con comanda para cocina y barra" },
        ].map((f) => (
          <article key={f.t} className="card p-4">
            <p className="text-2xl">{f.e}</p>
            <p className="mt-2 font-semibold">{f.t}</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">{f.d}</p>
          </article>
        ))}
      </section>

      <footer className="mt-auto pt-10 text-center text-xs text-[var(--muted)]">
        <p>
          <span className="serif italic">Horario:</span> lun a sáb · 11:30 – 15:00 y 18:00 – 22:00
        </p>
        <p className="mt-1">Frente al mercado La Cancha, Cochabamba — se paga en Bs.</p>
      </footer>
    </main>
  );
}
