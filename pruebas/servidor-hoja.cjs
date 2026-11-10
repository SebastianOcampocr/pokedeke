// Se porta como la aplicación web de Apps Script, con su código real y la hoja de
// mentira. Sirve para probar la página en la compu: node pruebas/servidor-hoja.cjs
const http = require("http");
const { nuevaHoja } = require("./hoja-falsa.cjs");
const m = nuevaHoja();
let caido = false;
const json = (res, d, s = 200) => { res.writeHead(s, { "content-type": "application/json", "access-control-allow-origin": "*" }); res.end(JSON.stringify(d)); };
http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  if (url.pathname === "/debug") {
    const h = (n, c) => { const o = []; for (let r = 5; r <= m.hojas[n].getLastRow(); r++) o.push(Array.from({ length: c }, (_, i) => m.hojas[n].leer(r, i + 1))); return o; };
    return json(res, { pedidos: h("Pedidos web", 21), ventas: h("Ventas", 7), interesados: h("Interesados", 4), comentarios: h("Comentarios", 8), avisos: h("Avisos de stock", 7), vistos: h("Lo más visto", 6), solicitudes: m.hojas.Solicitudes ? h("Solicitudes", 8) : [], busquedas: m.hojas["Búsquedas"] ? h("Búsquedas", 5) : [], correos: m.correos });
  }
  if (url.pathname === "/debug/estado") { const f = +url.searchParams.get("fila"), v = url.searchParams.get("valor"); m.hojas["Pedidos web"].escribir(f, 3, v); m.ctx.alEditarHoja({ value: v, range: m.hojas["Pedidos web"].getRange(f, 3, 1, 1) }); return json(res, { ok: true }); }
  if (url.pathname === "/debug/pedido") {
    const ped = m.hojas["Pedidos web"], r = Math.max(ped.getLastRow() + 1, 5), f = new Array(21).fill("");
    f[0] = url.searchParams.get("numero"); f[1] = new Date(); f[2] = "Entregado"; f[3] = "Ana Prueba"; f[4] = "8888-1234"; f[11] = "ana@example.com";
    f[19] = JSON.stringify({ lineas: [{ slug: "x", nombre: "ETB", cantidad: 1, precio: 1000 }], subtotal: 1000, descuento: 0 }); f[20] = url.searchParams.get("clave");
    f.forEach((v, j) => ped.escribir(r, j + 1, v));
    return json(res, { ok: true, fila: r });
  }
  if (url.pathname === "/debug/stock") {
    const slug = url.searchParams.get("slug"), cat = m.hojas["Catálogo web"];
    for (let r = 5; r <= cat.getLastRow(); r++) if (m.ctx.aSlug(cat.leer(r, 2)) === slug) { cat.escribir(r, 6, +url.searchParams.get("valor")); m.ctx.alEditarHoja({ value: url.searchParams.get("valor"), range: cat.getRange(r, 6, 1, 1) }); return json(res, { ok: true, fila: r }); }
    return json(res, { ok: false });
  }
  if (url.pathname === "/debug/pagar") { const f = +url.searchParams.get("fila"); m.hojas["Pedidos web"].escribir(f, 3, "Pagado"); m.ctx.alEditarHoja({ value: "Pagado", oldValue: "Pendiente de pago", range: m.hojas["Pedidos web"].getRange(f, 3, 1, 1) }); return json(res, { ok: true }); }
  if (url.pathname === "/debug/precio") { m.hojas["Catálogo web"].escribir(+url.searchParams.get("fila"), 9, +url.searchParams.get("valor")); return json(res, { ok: true }); }
  if (url.pathname === "/debug/caer") { caido = url.searchParams.get("si") === "1"; return json(res, { ok: true }); }
  if (req.method === "OPTIONS") { res.writeHead(405); return res.end(); } // Apps Script no responde consultas previas.
  if (caido) { res.destroy(); return; }
  if (req.method === "GET") { const r = m.get(Object.fromEntries(url.searchParams)); res.writeHead(200, { "content-type": "text/plain; charset=utf-8", "access-control-allow-origin": "*" }); return res.end(r.t); }
  let cuerpo = ""; req.on("data", (d) => (cuerpo += d));
  req.on("end", () => { const r = m.ctx.doPost({ postData: { contents: cuerpo } }); res.writeHead(200, { "content-type": "application/json", "access-control-allow-origin": "*" }); res.end(r.t); });
}).listen(+process.env.PUERTO || 3101, () => console.log("hoja lista"));
