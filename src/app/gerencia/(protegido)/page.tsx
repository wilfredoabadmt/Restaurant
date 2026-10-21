import { redirect } from "next/navigation";
import { leerSesion } from "@/lib/sesion";
import Dashboard from "./Dashboard";

export const dynamic = "force-dynamic";

export default async function PaginaGerencia() {
  const s = await leerSesion();
  if (!s) redirect("/gerencia/entrar");
  return <Dashboard nombre={`${s.nombre} ${s.apellidos}`} />;
}
