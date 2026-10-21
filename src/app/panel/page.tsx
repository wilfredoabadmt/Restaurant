import { leerSesion } from "@/lib/sesion";
import { redirect } from "next/navigation";
import PanelCajero from "./PanelCajero";

export const dynamic = "force-dynamic";

export default async function PaginaPanel() {
  const s = await leerSesion();
  if (!s) redirect("/panel/entrar");
  return <PanelCajero nombre={`${s.nombre} ${s.apellidos}`} rol={s.rol} />;
}
