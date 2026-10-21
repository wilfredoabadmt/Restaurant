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
    color: { dark: "#fdfaf6", light: "#160f0a" },
  });

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col px-5 pb-16">
      <header className="flex items-center justify-between py-6">
        <div className="flex items-center gap-3">
          <span className="tile !h-12 !w-12 !text-2xl shadow-inner">🫕</span>
          <div>
            <p className="brand text-2xl tracking-tight text-[var(--ink)]">La Paila</p>
            <p className="text-xs uppercase tracking-widest text-[var(--amanecer)] font-medium">picantería criolla</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/panel/entrar" className="btn btn-suave btn-xs hover:border-[var(--amanecer)]">
            Caja
          </Link>
          <Link href="/gerencia/entrar" className="btn btn-suave btn-xs hover:border-[var(--amanecer)]">
            Gerencia
          </Link>
        </div>
      </header>

      <section className="mt-6 text-center">
        <p className="serif text-[var(--amanecer)] italic text-lg sm:text-xl font-medium tracking-wide">
          Del fondo de la olla, directo a tu mesa
        </p>
        <h1 className="brand mt-2 text-4xl leading-tight sm:text-5xl font-bold text-[var(--ink)]">
          Escanea, pide y
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--brasa)] via-[var(--amanecer)] to-[var(--oro)]">
            pasa por caja
          </span>
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[var(--muted-light)]">
          Explora los auténticos sabores criollos desde tu mesa. Envía tu pedido y recíbelo en caja de inmediato con tu comanda lista.
        </p>
      </section>

      <section className="mt-8 flex flex-col items-center gap-4">
        <div className="relative group p-1 rounded-[1.75rem] bg-gradient-to-b from-[var(--brasa)]/30 via-transparent to-[var(--amanecer)]/20 shadow-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qr}
            alt="Código QR hacia el menú digital de La Paila"
            className="rounded-[1.5rem] bg-[var(--panel)] p-4 border border-[var(--line)] shadow-xl transition-transform duration-300 group-hover:scale-[1.02]"
            width={280}
            height={280}
          />
        </div>
        <p className="text-xs text-[var(--muted)]">
          URL directa del menú: <span className="font-mono text-[var(--amanecer)] font-medium">{urlMenu}</span>
        </p>
        <Link href="/menu" className="btn btn-brasa w-full max-w-xs text-base py-3">
          Ver el menú ahora →
        </Link>
      </section>

      <section className="mt-12 grid gap-3.5 sm:grid-cols-3">
        {[
          { e: "🍲", t: "Menú Criollo Vivo", d: "Platos tradicionales, bebidas y postres con disponibilidad en tiempo real." },
          { e: "🛒", t: "Pedido al Instante", d: "Agrega a tu canasta, revisa el total y confirma en un solo toque." },
          { e: "🧾", t: "Atención y Comanda", d: "Paga en caja con QR o efectivo; la comanda sale directo a cocina y barra." },
        ].map((f) => (
          <article key={f.t} className="card p-4.5 flex flex-col justify-between">
            <div>
              <p className="text-2xl">{f.e}</p>
              <p className="brand mt-2 font-semibold text-[var(--ink)] text-base">{f.t}</p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--muted-light)]">{f.d}</p>
            </div>
          </article>
        ))}
      </section>

      <footer className="mt-auto pt-12 text-center text-xs text-[var(--muted)]">
        <p>
          <span className="serif italic text-[var(--muted-light)]">Horario de atención:</span> Lun a Sáb · 11:30 – 15:00 y 18:00 – 22:00
        </p>
        <p className="mt-1">Picantería Criolla Tradicional — Precios expresados en Bolivianos (Bs).</p>
      </footer>
    </main>
  );
}
