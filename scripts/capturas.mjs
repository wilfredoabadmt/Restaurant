/* Capturas por CDP para documentar el proyecto (sin dependencias: usa fetch + WebSocket nativos de Node 24) */
const msedge = process.env.EDGE_PATH;
const port = 9333;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function conWs(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    let id = 0;
    const pendientes = new Map();
    const eventos = [];
    ws.onopen = () => resolve({
      send: (method, params = {}) =>
        new Promise((res) => {
          const mid = ++id;
          pendientes.set(mid, res);
          ws.send(JSON.stringify({ id: mid, method, params }));
        }),
      eventos,
      close: () => ws.close(),
    });
    ws.onmessage = (m) => {
      const d = JSON.parse(m.data);
      if (d.id && pendientes.has(d.id)) { pendientes.get(d.id)(d.result ?? d.error); pendientes.delete(d.id); }
      else if (d.method) eventos[d.method] = d.params;
    };
    ws.onerror = reject;
  });
}

async function capturar({ url, out, w = 1280, h = 900, mobile = false, cookie = null }) {
  // página nueva
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT", headers: { "sec-fetch-mode": "cors" } })).json().catch(() => null)
    ?? await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`)).json();
  const c = await conWs(target.webSocketDebuggerUrl);

  if (cookie) {
    await c.send("Network.enable");
    await c.send("Network.setCookie", { name: "lp_sesion", value: cookie, url: "http://localhost", domain: "localhost", path: "/", httpOnly: true });
  }
  await c.send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile });
  await c.send("Page.enable");
  await c.send("Page.navigate", { url });
  await sleep(4500);
  const shot = await c.send("Page.captureScreenshot", { format: "png" });
  const fs = await import("fs");
  fs.writeFileSync(out, Buffer.from(shot.data, "base64"));
  console.log("ok:", out, Math.round(shot.data.length / 1024) + " kb");
  await c.close();
}

const [,, cmd, a1, a2, a3, a4, a5, a6] = process.argv;
if (cmd === "una") {
  await capturar({ url: a1, out: a2, w: Number(a3), h: Number(a4), mobile: process.argv.includes("--movil"), cookie: process.argv.includes("--cookie") ? (a5 ?? null) : null });
} else {
  // por defecto: secuencia completa del demo
  const esperarAshe = null;
  void esperarAshe;
  const tokCajero = process.env.TOK_CAJERO ?? "";
  const tokAdmin = process.env.TOK_ADMIN ?? "";
  const publico = [
    { url: "http://localhost:3000/menu", out: "capturas/2-menu-movil.png", w: 390, h: 844, mobile: true },
  ];
  const caja = [
    { url: "http://localhost:3000/panel", out: "capturas/5-panel-caja.png", w: 1280, h: 900, cookie: tokCajero },
    { url: "http://localhost:3000/panel/nuevo", out: "capturas/6-nuevo-pedido.png", w: 1280, h: 900, cookie: tokCajero },
  ];
  const gerencia = [
    { url: "http://localhost:3000/gerencia", out: "capturas/7-dashboard.png", w: 1280, h: 900, cookie: tokAdmin },
    { url: "http://localhost:3000/gerencia/productos", out: "capturas/8-productos.png", w: 1280, h: 900, cookie: tokAdmin },
  ];
  for (const t of publico) await capturar(t);

  // pantallas contextuales: ticket y seguimiento, vía variables DEMO
  const fs = await import("fs");
  const ticketId = (fs.readFileSync(".demo-ticket.txt", "utf8") || "").trim();
  const enCurso = (fs.readFileSync(".demo-encurso.txt", "utf8") || "").trim();
  const extras = [];
  if (ticketId) extras.push({ url: `http://localhost:3000/panel/ticket/${ticketId}`, out: "capturas/9-comandas.png", w: 1360, h: 900, cookie: tokCajero });
  if (enCurso) extras.push({ url: `http://localhost:3000/pedido/${enCurso}`, out: "capturas/4-seguimiento.png", w: 390, h: 844, mobile: true });
  for (const t of extras) await capturar(t);

  for (const t of caja) await capturar(t);
  for (const t of gerencia) await capturar(t);
}
process.exit(0);
