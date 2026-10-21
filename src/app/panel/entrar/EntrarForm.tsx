"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function EntrarForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const [usu, setUsu] = useState("");
  const [pwd, setPwd] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function entrar() {
    setError("");
    setEnviando(true);
    try {
      const r = await fetch("/api/sesion", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ usuario: usu.trim(), password: pwd }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "No se pudo entrar.");
      router.push(sp.get("de") ?? d.redirigir ?? "/panel");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setEnviando(false);
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center px-5">
      <form
        className="card w-full max-w-sm p-6"
        onSubmit={(e) => {
          e.preventDefault();
          entrar();
        }}
      >
        <p className="brand text-xl">La Paila · caja</p>
        <p className="text-xs text-[var(--muted)] mt-1">Inicia con tu cuenta de cajero.</p>
        <div className="mt-5 grid gap-3">
          <div>
            <label className="label" htmlFor="u">Usuario</label>
            <input id="u" className="input" value={usu} onChange={(e) => setUsu(e.target.value)} autoComplete="username" />
          </div>
          <div>
            <label className="label" htmlFor="c">Contraseña</label>
            <input id="c" className="input" type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} autoComplete="current-password" />
          </div>
          {error && <p className="text-sm text-[var(--peligro)]">{error}</p>}
          <button disabled={enviando} className="btn btn-brasa py-3 mt-1">{enviando ? "Entrando…" : "Entrar al panel"}</button>
        </div>
        <p className="mt-4 card-2 p-3 text-[11px] leading-relaxed text-[var(--muted)]">
          Demo: <strong className="text-[var(--ink)]">cajero1 / cajero123</strong> · gerencia: <strong className="text-[var(--ink)]">admin / admin123</strong>
        </p>
      </form>
    </main>
  );
}
