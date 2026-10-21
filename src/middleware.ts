import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const CLAVE = new TextEncoder().encode(process.env.AUTH_KEY ?? "clave-desarrollo-con-32-caracteres-minimo!");

/** Rutas que exigen sesión firmada en cookie httpOnly. */
export async function middleware(req: NextRequest) {
  const token = req.cookies.get("lp_sesion")?.value;
  let ok = false;
  let rol = "";
  if (token) {
    try {
      const { payload } = await jwtVerify(token, CLAVE);
      ok = true;
      rol = String((payload as { rol?: string }).rol ?? "");
    } catch {
      ok = false;
    }
  }

  const path = req.nextUrl.pathname;
  const esPanel = path.startsWith("/panel") && !path.startsWith("/panel/entrar");
  const esGerencia = path.startsWith("/gerencia") && !path.startsWith("/gerencia/entrar");
  const esApi = path.startsWith("/api/panel") || path.startsWith("/api/gerencia");

  if ((esPanel && !ok) || (esGerencia && (!ok || rol !== "ADMIN")) || (esApi && !ok) || (path.startsWith("/api/gerencia") && rol !== "ADMIN")) {
    if (esApi) {
      return NextResponse.json({ error: "Sesión expirada." }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = esGerencia ? "/gerencia/entrar" : "/panel/entrar";
    url.searchParams.set("de", path);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/panel/:path*", "/gerencia/:path*", "/api/panel/:path*", "/api/gerencia/:path*"],
};
