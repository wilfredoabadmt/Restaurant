import { leerSesion } from "@/lib/sesion";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

const TABS = [
  { href: "/gerencia", t: "Resumen" },
  { href: "/gerencia/productos", t: "Productos" },
  { href: "/gerencia/categorias", t: "Categorías" },
  { href: "/gerencia/cajeros", t: "Cajeros" },
  { href: "/gerencia/pedidos", t: "Pedidos" },
  { href: "/gerencia/auditoria", t: "Auditoría" },
];

export default async function LayoutGerencia({ children }: { children: React.ReactNode }) {
  const s = await leerSesion();
  if (!s) redirect("/gerencia/entrar");
  if (s.rol !== "ADMIN") redirect("/panel");

  return (
    <div className="mx-auto max-w-4xl min-h-dvh px-4 pb-16">
      <header className="flex flex-wrap items-center justify-between gap-3 py-5">
        <div>
          <p className="brand text-xl leading-none">Gerencia · La Paila</p>
          <p className="text-[11px] text-[var(--muted)]">{s.nombre} {s.apellidos}</p>
        </div>
        <nav className="flex-row-scroll flex gap-1.5 overflow-x-auto">
          {TABS.map((t) => (
            <Link key={t.href} href={t.href} className="chip hover:border-[var(--brasa)] whitespace-nowrap">{t.t}</Link>
          ))}
        </nav>
      </header>
      {children}
    </div>
  );
}
