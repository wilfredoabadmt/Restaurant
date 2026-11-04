"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type Empresa = {
  id: number;
  nombre: string;
  subtitulo: string;
  nit: string;
  direccion: string;
  telefono: string;
  mensajeTicket: string;
  logo: string;
};

export default function GEmpresa() {
  const [empresa, setEmpresa] = useState<Empresa>({
    id: 1,
    nombre: "",
    subtitulo: "",
    nit: "",
    direccion: "",
    telefono: "",
    mensajeTicket: "",
    logo: "",
  });
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [archivoLogo, setArchivoLogo] = useState<File | null>(null);
  const [previewLogo, setPreviewLogo] = useState<string>("");

  useEffect(() => {
    fetch("/api/gerencia/empresa")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.empresa) {
          setEmpresa(data.empresa);
          setPreviewLogo(data.empresa.logo || "");
        }
      })
      .catch(() => {
        setMsg({ tipo: "error", texto: "No se pudieron cargar los datos de la empresa." });
      })
      .finally(() => setCargando(false));
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        setMsg({ tipo: "error", texto: "El logo no debe superar los 3 MB." });
        return;
      }
      setArchivoLogo(file);
      setPreviewLogo(URL.createObjectURL(file));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setMsg(null);

    try {
      let logoRuta = empresa.logo;

      // Si seleccionó un archivo nuevo, subirlo primero
      if (archivoLogo) {
        const formData = new FormData();
        formData.append("archivo", archivoLogo);
        const resSubida = await fetch("/api/gerencia/subir", {
          method: "POST",
          body: formData,
        });
        const dataSubida = await resSubida.json();
        if (!resSubida.ok) throw new Error(dataSubida.error || "Error al subir el logo");
        logoRuta = dataSubida.ruta;
      }

      const res = await fetch("/api/gerencia/empresa", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: empresa.nombre,
          subtitulo: empresa.subtitulo,
          nit: empresa.nit,
          direccion: empresa.direccion,
          telefono: empresa.telefono,
          mensajeTicket: empresa.mensajeTicket,
          logo: logoRuta,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al actualizar los datos");

      setEmpresa(data.empresa);
      setPreviewLogo(data.empresa.logo || "");
      setArchivoLogo(null);
      setMsg({ tipo: "ok", texto: "¡Configuración de la empresa guardada correctamente!" });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Ocurrió un error al guardar";
      setMsg({ tipo: "error", texto: errorMsg });
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return <div className="card p-8 text-center text-sm text-[var(--muted)]">Cargando personalización...</div>;
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Formulario principal */}
      <form onSubmit={handleSubmit} className="card p-5 md:col-span-2 space-y-4">
        <div>
          <h2 className="text-lg font-bold">Personalización del Restaurante / Empresa</h2>
          <p className="text-xs text-[var(--muted)]">
            Configura el nombre comercial, datos de contacto y la información que saldrá en la comanda e interfaz.
          </p>
        </div>

        {msg && (
          <div
            className={`rounded-lg px-4 py-3 text-sm font-medium ${
              msg.tipo === "ok" ? "bg-emerald-950/40 text-emerald-300 border border-emerald-800" : "bg-red-950/40 text-red-300 border border-red-800"
            }`}
          >
            {msg.texto}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-xs font-semibold">
            Nombre del Negocio *
            <input
              type="text"
              required
              value={empresa.nombre}
              onChange={(e) => setEmpresa({ ...empresa, nombre: e.target.value })}
              placeholder="Ej: La Paila"
              className="mt-1 w-full rounded-md border border-[var(--borde)] bg-[var(--tarjeta)] px-3 py-2 text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--brasa)]"
            />
          </label>

          <label className="block text-xs font-semibold">
            Eslogan o Subtítulo
            <input
              type="text"
              value={empresa.subtitulo}
              onChange={(e) => setEmpresa({ ...empresa, subtitulo: e.target.value })}
              placeholder="Ej: Picantería Criolla"
              className="mt-1 w-full rounded-md border border-[var(--borde)] bg-[var(--tarjeta)] px-3 py-2 text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--brasa)]"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-xs font-semibold">
            NIT / RUC / Identificación Fiscal
            <input
              type="text"
              value={empresa.nit}
              onChange={(e) => setEmpresa({ ...empresa, nit: e.target.value })}
              placeholder="Ej: 1020304050"
              className="mt-1 w-full rounded-md border border-[var(--borde)] bg-[var(--tarjeta)] px-3 py-2 text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--brasa)]"
            />
          </label>

          <label className="block text-xs font-semibold">
            Teléfono o Celular de Contacto
            <input
              type="text"
              value={empresa.telefono}
              onChange={(e) => setEmpresa({ ...empresa, telefono: e.target.value })}
              placeholder="Ej: +591 70012345"
              className="mt-1 w-full rounded-md border border-[var(--borde)] bg-[var(--tarjeta)] px-3 py-2 text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--brasa)]"
            />
          </label>
        </div>

        <label className="block text-xs font-semibold">
          Dirección Física del Local
          <input
            type="text"
            value={empresa.direccion}
            onChange={(e) => setEmpresa({ ...empresa, direccion: e.target.value })}
            placeholder="Ej: Av. Las Américas #450, Esq. Junín"
            className="mt-1 w-full rounded-md border border-[var(--borde)] bg-[var(--tarjeta)] px-3 py-2 text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--brasa)]"
          />
        </label>

        <label className="block text-xs font-semibold">
          Mensaje de Agradecimiento (Pie de Ticket / Comanda)
          <textarea
            rows={2}
            value={empresa.mensajeTicket}
            onChange={(e) => setEmpresa({ ...empresa, mensajeTicket: e.target.value })}
            placeholder="Ej: ¡Muchas gracias por su visita, vuelva pronto!"
            className="mt-1 w-full rounded-md border border-[var(--borde)] bg-[var(--tarjeta)] px-3 py-2 text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--brasa)]"
          />
        </label>

        <div className="border-t border-[var(--borde)] pt-4">
          <label className="block text-xs font-semibold mb-2">
            Logo de la Empresa (PNG, JPG, WEBP - Máx 3 MB)
          </label>
          <div className="flex flex-wrap items-center gap-4">
            <input
              type="file"
              accept="image/png, image/jpeg, image/webp"
              onChange={handleFileChange}
              className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[var(--brasa)] file:text-white hover:file:opacity-90 cursor-pointer"
            />
            {previewLogo && previewLogo.startsWith("/uploads/") && (
              <button
                type="button"
                onClick={() => {
                  setEmpresa({ ...empresa, logo: "" });
                  setPreviewLogo("");
                  setArchivoLogo(null);
                }}
                className="text-xs text-red-400 hover:underline"
              >
                Quitar logo
              </button>
            )}
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={guardando}
            className="btn btn-primary w-full sm:w-auto px-6 py-2.5 font-semibold text-sm disabled:opacity-50"
          >
            {guardando ? "Guardando..." : "Guardar Personalización"}
          </button>
        </div>
      </form>

      {/* Vista previa en tiempo real */}
      <div className="space-y-4">
        {/* Previsualización Tarjeta / Encabezado */}
        <section className="card p-4">
          <p className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-3">
            Vista previa Menú & Cabecera
          </p>
          <div className="flex items-center gap-3 p-3 bg-black/20 rounded-lg border border-[var(--borde)]">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-stone-800 flex items-center justify-center shrink-0 border border-white/10">
              {previewLogo && previewLogo.startsWith("/uploads/") ? (
                <Image
                  src={previewLogo}
                  alt="Logo"
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              ) : previewLogo && previewLogo.startsWith("blob:") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewLogo}
                  alt="Logo preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl">🥘</span>
              )}
            </div>
            <div className="min-w-0">
              <h3 className="brand text-base font-bold truncate leading-tight text-[var(--ink)]">
                {empresa.nombre || "Nombre de Empresa"}
              </h3>
              <p className="text-xs text-[var(--muted)] truncate">
                {empresa.subtitulo || "Eslogan o Tipo de Cocina"}
              </p>
            </div>
          </div>
          {empresa.telefono && (
            <p className="mt-2 text-xs text-[var(--muted)]">📞 {empresa.telefono}</p>
          )}
          {empresa.direccion && (
            <p className="text-xs text-[var(--muted)]">📍 {empresa.direccion}</p>
          )}
        </section>

        {/* Previsualización Ticket Comanda */}
        <section className="card p-4">
          <p className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-2">
            Vista previa Comanda Impresa
          </p>
          <div
            className="bg-white text-black p-3.5 rounded text-[11px] shadow-md border-2 border-dashed border-gray-400 select-none"
            style={{ fontFamily: '"Courier New", monospace' }}
          >
            <p className="font-bold text-center text-[13px] leading-tight">
              {(empresa.nombre || "MI RESTAURANTE").toUpperCase()}
            </p>
            {empresa.subtitulo && (
              <p className="text-center text-[10px] text-gray-700">
                {empresa.subtitulo.toUpperCase()}
              </p>
            )}
            {empresa.nit && (
              <p className="text-center text-[10px]">NIT: {empresa.nit}</p>
            )}
            {empresa.direccion && (
              <p className="text-center text-[10px] truncate">{empresa.direccion}</p>
            )}
            {empresa.telefono && (
              <p className="text-center text-[10px]">TEL: {empresa.telefono}</p>
            )}
            <div className="border-t border-dashed border-black my-1.5"></div>
            <p className="text-center font-bold">COMANDA #0042</p>
            <p>CLIENTE: Mesa 4 · Juan</p>
            <p>** SERVIR EN LOCAL **</p>
            <div className="border-t border-black my-1"></div>
            <p className="font-semibold">2 × Plato Especial</p>
            <p className="font-semibold">1 × Bebida Refrescante</p>
            <div className="border-t border-dashed border-black my-1.5"></div>
            <p className="text-center italic text-[10px] mt-1 font-sans">
              &quot;{empresa.mensajeTicket || "¡Gracias por su preferencia!"}&quot;
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

