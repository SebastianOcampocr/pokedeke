// Estados del inventario, pedidos repetidos, comprobación de Cloudflare y pestaña Sistema.
const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
let ok = 0;
const prueba = (nombre, fn) => { fn(); ok += 1; console.log("✓", nombre); };
const filas = (hoja, columnas) => { const o = []; for (let r = 5; r <= hoja.getLastRow(); r++) o.push(Array.from({ length: columnas }, (_, i) => hoja.leer(r, i + 1))); return o; };

// [id, producto, categoría, stock, sugerido, venta, extra]
const PRODUCTOS = [
  ["C001", "Carta lista", "Carta suelta (single)", 2, 5000],
  ["C002", "Caja en camino", "ETB", 3, 40000, "", { estado: "En camino" }],
  ["C003", "Caja de proveedor", "ETB", 1, 90000, "", { estado: "Por consultar" }],
  ["C004", "Etiqueta vieja", "ETB", 1, 80000, "", { et: "Pedido especial" }],
  ["C005", "Forzado agotado", "ETB", 4, 30000, "", { estado: "Agotado" }],
  ["C006", "Escondido", "ETB", 4, 30000, "", { estado: "No publicado" }],
  ["C007", "Mal escrito", "ETB", 4, 30000, "", { estado: "dispnible" }],
  ["C008", "Dos lotes", "ETB", 2, 20000],
  ["C009", "Dos lotes", "ETB", 3, 20000, "", { estado: "en camino" }],
  ["C010", "Sin unidades", "ETB", 0, 10000, "", { estado: "Disponible" }],
];
const archivo = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "estados-")), "productos.json");
fs.writeFileSync(archivo, JSON.stringify(PRODUCTOS));
process.env.HOJA_PRODUCTOS = archivo;
const { nuevaHoja } = require("./hoja-falsa.cjs");

const m = nuevaHoja();
const stock = () => JSON.parse(m.get({ accion: "stock" }).t).productos;
const pedido = (lineas, extra = {}) => m.post({ accion: "pedido", cliente: "Ana Pérez", whatsapp: "8888-1234", correo: "ana@ejemplo.cr", envio: "retiro-omni", lineas, ...extra });

prueba("solo lo Disponible tiene unidades para vender", () => {
  const p = stock();
  assert.deepStrictEqual([p["carta-lista"].stock, p["carta-lista"].estado], [2, "Disponible"]);
  assert.deepStrictEqual([p["caja-en-camino"].stock, p["caja-en-camino"].estado], [0, "En camino"]);
  assert.deepStrictEqual([p["caja-de-proveedor"].stock, p["caja-de-proveedor"].estado], [0, "Por consultar"]);
  assert.deepStrictEqual([p["forzado-agotado"].stock, p["forzado-agotado"].estado], [0, "Agotado"]);
  assert.deepStrictEqual([p["sin-unidades"].stock, p["sin-unidades"].estado], [0, "Agotado"]);
});
prueba("la etiqueta vieja de pedido especial sale como Por consultar, sin stock", () => {
  assert.deepStrictEqual([stock()["etiqueta-vieja"].stock, stock()["etiqueta-vieja"].estado], [0, "Por consultar"]);
});
prueba("un estado que no se entiende no se vende", () => {
  assert.deepStrictEqual([stock()["mal-escrito"].stock, stock()["mal-escrito"].estado], [0, "Agotado"]);
});
prueba("lo No publicado no sale ni en el stock ni en el catálogo abierto", () => {
  assert.strictEqual(stock().escondido, undefined);
  const csv = m.get({ accion: "catalogo" }).t;
  assert.doesNotMatch(csv, /Escondido/);
  assert.match(csv, /Estado en la página/);
  assert.match(csv, /Caja de proveedor/);
});
prueba("con un lote en el mezzanine y otro en camino, solo se vende el primero", () => {
  assert.deepStrictEqual([stock()["dos-lotes"].stock, stock()["dos-lotes"].estado], [2, "Disponible"]);
  assert.strictEqual(pedido([{ slug: "dos-lotes", cantidad: 3 }]).ok, false);
});
prueba("no se puede pedir lo que está en camino ni lo que es por consultar", () => {
  const camino = pedido([{ slug: "caja-en-camino", cantidad: 1 }]);
  assert.strictEqual(camino.ok, false);
  assert.match(camino.error, /no se puede comprar por ahora \(en camino\)/);
  const proveedor = pedido([{ slug: "caja-de-proveedor", cantidad: 1 }]);
  assert.strictEqual(proveedor.ok, false);
  assert.match(proveedor.error, /por consultar/);
  assert.strictEqual(pedido([{ slug: "etiqueta-vieja", cantidad: 1 }]).ok, false);
  assert.strictEqual(m.hojas["Pedidos web"].getLastRow(), 4, "no quedó ningún pedido");
});
prueba("el precio y el total los pone la hoja, no la página", () => {
  const r = pedido([{ slug: "carta-lista", cantidad: 1, precio: 1 }], { total: 1, intento: "abc-123" });
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.total, 5000);
  assert.strictEqual(r.lineas[0].precio, 5000);
  assert.strictEqual(r.lineas[0].preventa, undefined);
});
prueba("el mismo intento mandado dos veces no hace dos pedidos", () => {
  const antes = m.hojas["Pedidos web"].getLastRow();
  const correos = m.correos.length;
  const r = pedido([{ slug: "carta-lista", cantidad: 1 }], { intento: "abc-123" });
  assert.strictEqual(r.ok, true);
  assert.strictEqual(m.hojas["Pedidos web"].getLastRow(), antes);
  assert.strictEqual(m.correos.length, correos, "no se mandan correos de nuevo");
  assert.strictEqual(r.numero, m.hojas["Pedidos web"].leer(antes, 1));
  // Otro intento sí es otro pedido, y se lleva la última unidad.
  assert.strictEqual(pedido([{ slug: "carta-lista", cantidad: 1 }], { intento: "otro-456" }).ok, true);
  assert.strictEqual(pedido([{ slug: "carta-lista", cantidad: 1 }], { intento: "tercero" }).ok, false, "ya no quedan");
});
prueba("los correos ya no hablan de apartar", () => {
  const todos = m.correos.map((c) => (c.body || "") + (c.htmlBody || "")).join("\n");
  assert.doesNotMatch(todos, /apartad/i);
  assert.match(todos, /Tenés 24 horas para hacer el pago/);
});
prueba("sin secreto de Cloudflare no se pide comprobación", () => {
  assert.strictEqual(m.post({ accion: "solicitud", producto: "Caja rara", origen: "portada" }).ok, true);
  assert.strictEqual(m.ctx.turnstile.llamadas.length, 0);
});
prueba("con secreto, los formularios piden una comprobación buena", () => {
  m.propiedades.TURNSTILE_SECRET = "secreto-turnstile";
  const sin = m.post({ accion: "solicitud", producto: "Caja rara", origen: "portada" });
  assert.deepStrictEqual([sin.ok, sin.verificar], [false, true]);
  assert.strictEqual(m.ctx.turnstile.llamadas.length, 0, "sin prueba ni se le pregunta a Cloudflare");
  assert.strictEqual(m.post({ accion: "solicitud", producto: "Caja rara", origen: "portada", verificacion: "robot" }).ok, false);
  assert.strictEqual(pedido([{ slug: "dos-lotes", cantidad: 1 }], { verificacion: "robot" }).ok, false);
  assert.strictEqual(m.post({ accion: "aviso", slug: "sin-unidades", nombre: "Luis", contacto: "luis@ejemplo.cr" }).ok, false);
  assert.strictEqual(m.post({ accion: "solicitud", producto: "Caja rara", origen: "portada", verificacion: "humano" }).ok, true);
  assert.strictEqual(pedido([{ slug: "dos-lotes", cantidad: 1 }], { verificacion: "humano" }).ok, true);
  // Lo que no escribe datos de personas sigue sin pedirla.
  assert.strictEqual(m.post({ accion: "visto", slug: "dos-lotes", tipo: "vista" }).ok, true);
  assert.strictEqual(JSON.parse(m.get({ accion: "stock" }).t).ok, true);
});
prueba("si Cloudflare no responde, no pasa", () => {
  m.ctx.turnstile.caido = true;
  assert.strictEqual(m.post({ accion: "solicitud", producto: "Caja rara", origen: "portada", verificacion: "humano" }).ok, false);
  m.ctx.turnstile.caido = false;
  delete m.propiedades.TURNSTILE_SECRET;
});
prueba("la solicitud que sale de un producto queda con ese producto", () => {
  m.post({ accion: "solicitud", producto: "Caja de proveedor", origen: "consultar", slug: "caja-de-proveedor" });
  m.post({ accion: "solicitud", producto: "Algo inventado", origen: "consultar", slug: "no-existe" });
  const sol = filas(m.hojas.Solicitudes, 9);
  assert.strictEqual(m.hojas.Solicitudes.leer(4, 9), "Producto del catálogo");
  const deProveedor = sol.find((f) => f[1] === "Caja de proveedor");
  assert.deepStrictEqual([deProveedor[5], deProveedor[6], deProveedor[8]], ["Producto por consultar", "Nueva", "caja-de-proveedor"]);
  assert.strictEqual(sol.find((f) => f[1] === "Algo inventado")[8], "");
});
prueba("Demanda dice el estado, lo vendido y cuenta la solicitud en su producto", () => {
  m.ctx.actualizarDemanda();
  const hoja = m.hojas.Demanda;
  assert.deepStrictEqual([hoja.leer(4, 3), hoja.leer(4, 5)], ["Estado", "Vendidas"]);
  const datos = filas(hoja, 13);
  const proveedor = datos.find((f) => f[1] === "Caja de proveedor");
  assert.deepStrictEqual([proveedor[0], proveedor[2], proveedor[3], proveedor[10]], ["Media", "Por consultar", 0, 1]);
  assert.match(proveedor[12], /revisar si se puede conseguir/);
  assert.strictEqual(datos.filter((f) => f[1] === "Caja de proveedor").length, 1, "no sale además como algo que no está");
  // Lo que es de proveedor o viene en camino nunca sale como stock quieto.
  assert.strictEqual(datos.find((f) => f[0] === "Sin movimiento" && /camino|proveedor|vieja/i.test(f[1])), undefined);
});
prueba("los estados de una solicitud cerrada la sacan de Demanda", () => {
  const sol = m.hojas.Solicitudes;
  for (let r = 5; r <= sol.getLastRow(); r++) if (sol.leer(r, 2) === "Algo inventado") sol.escribir(r, 7, "No disponible");
  m.ctx.actualizarDemanda();
  assert.strictEqual(filas(m.hojas.Demanda, 13).find((f) => f[1] === "Algo inventado"), undefined);
});
prueba("la pestaña Sistema cuenta por estado y junta las alertas", () => {
  m.ctx.pagina.datos = { fecha: "2026-11-09T15:00:00.000Z", productos: 3 };
  const alertas = m.ctx.actualizarSistema();
  const datos = filas(m.hojas.Sistema, 3);
  const valor = (que) => datos.find((f) => f[0] === que)[1];
  // Disponible: Dos lotes. Carta lista se quedó sin unidades libres, pero sigue siendo Disponible en la hoja.
  assert.strictEqual(valor("Productos disponibles"), 2);
  assert.strictEqual(valor("Productos en camino"), 1);
  assert.strictEqual(valor("Productos por consultar"), 2);
  assert.strictEqual(valor("Productos agotados"), 3);
  assert.strictEqual(valor("Filas sin publicar"), 1);
  assert.strictEqual(valor("Alertas"), alertas);
  const textos = datos.filter((f) => f[0] === "Alerta").map((f) => f[1]).join("\n");
  assert.match(textos, /Fila 11 de Catálogo web: el estado "dispnible" no se entiende/);
  assert.match(textos, /La página muestra 3 productos y la hoja tiene 8/);
  assert.deepStrictEqual(m.hojas.Sistema.formulas, []);
  // Con la página al día, esa alerta se va.
  m.ctx.CacheService.getScriptCache().remove("pagina-armada");
  m.ctx.pagina.datos = { fecha: "2026-11-09T15:00:00.000Z", productos: 8 };
  m.ctx.actualizarSistema();
  assert.doesNotMatch(filas(m.hojas.Sistema, 3).map((f) => f[1]).join("\n"), /La página muestra/);
});
console.log("\n" + ok + " pruebas bien.");
