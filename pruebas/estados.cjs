// Estados del inventario, pedidos repetidos, comprobación de Cloudflare y pestaña Sistema.
const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
let ok = 0;
const prueba = (nombre, fn) => { fn(); ok += 1; console.log("✓", nombre); };
const filas2 = (hoja) => filas(hoja, 3);
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
  const datos = filas(hoja, 14);
  const proveedor = datos.find((f) => f[1] === "Caja de proveedor");
  assert.match(proveedor[13], /\/producto\/caja-de-proveedor$/);
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
prueba("lo programado que se agotó o cambió de precio pasa a Error", () => {
  const nueva = new (m.hojas["Catálogo web"].constructor)("Contenido", [["Contenido"], [""], [""], ["Para cuándo", "Tipo", "Qué se publica", "Productos y precio al crearlo", "Texto", "Estado", "Revisión de inventario", "Enlace de la publicación", "Notas"]]);
  m.hojas.Contenido = nueva;
  const fila = (estado, productos) => { const r = nueva.getLastRow() + 1; ["", "Carrusel", "Prueba " + r, productos, "", estado].forEach((v, j) => nueva.escribir(r, j + 1, v)); return r; };
  const bien = fila("Programado", "dos-lotes=20000");
  const caro = fila("Aprobado", "dos-lotes=15000");
  const agotada = fila("Programado", "carta-lista=5000; dos-lotes=20000");
  const camino = fila("Revisión", "caja-en-camino=40000");
  const borrador = fila("Borrador", "carta-lista=5000");
  assert.strictEqual(m.ctx.revisarContenido(), 3);
  assert.strictEqual(nueva.leer(bien, 6), "Programado");
  assert.match(nueva.leer(bien, 7), /^Todo sigue igual/);
  assert.strictEqual(nueva.leer(caro, 6), "Error");
  assert.match(nueva.leer(caro, 7), /cambió de precio: ₡15 000 → ₡20 000/);
  assert.strictEqual(nueva.leer(agotada, 6), "Error");
  assert.match(nueva.leer(agotada, 7), /Carta lista ya no está disponible \(agotado\)/);
  assert.strictEqual(nueva.leer(camino, 6), "Revisión", "en Revisión solo se anota");
  assert.match(nueva.leer(camino, 7), /en camino/);
  assert.strictEqual(nueva.leer(borrador, 7), "", "el borrador no se revisa");
  // Al aprobar una fila se revisa de una vez.
  nueva.escribir(borrador, 6, "Aprobado");
  m.ctx.alEditarHoja({ value: "Aprobado", range: nueva.getRange(borrador, 6, 1, 1) });
  assert.strictEqual(nueva.leer(borrador, 6), "Error");
  // Y sale en las alertas de Sistema.
  m.ctx.actualizarSistema();
  assert.match(filas(m.hojas.Sistema, 3).map((f) => f[1]).join("\n"), /Contenido, fila \d+ \(Prueba \d+\): .*cambió de precio/);
});
prueba("pedido especial: apagado se ve como Por consultar y no se compra", () => {
  const h = nuevaHoja();
  const cat = h.hojas["Catálogo web"];
  // Caja de proveedor (fila 7) pasa a Pedido especial con precio de venta y entrega.
  cat.escribir(7, 18, "Pedido especial");
  cat.escribir(7, 9, 95000);
  cat.escribir(7, 16, new Date(Date.now() + 30 * 86400000));
  cat.escribir(7, 6, 2);
  h.ctx.olvidarStock();
  const vivo = JSON.parse(h.get({ accion: "stock" }).t).productos["caja-de-proveedor"];
  assert.deepStrictEqual([vivo.estado, vivo.stock], ["Por consultar", 0]);
  const r = h.post({ accion: "pedido", cliente: "Ana Pérez", whatsapp: "8888-1234", correo: "ana@ejemplo.cr", envio: "retiro-omni", aceptaCondiciones: "condiciones-2026-11-10", lineas: [{ slug: "caja-de-proveedor", cantidad: 1 }] });
  assert.strictEqual(r.ok, false);
});
prueba("pedido especial encendido: cupos, condiciones, va solo y la plata queda como anticipo", () => {
  const h = nuevaHoja();
  const cat = h.hojas["Catálogo web"];
  cat.escribir(7, 18, "Pedido especial");
  cat.escribir(7, 9, 95000);
  cat.escribir(7, 16, new Date(Date.now() + 30 * 86400000));
  cat.escribir(7, 6, 2);
  h.propiedades.PEDIDOS_ESPECIALES = "si";
  h.ctx.olvidarStock();
  const vivo = JSON.parse(h.get({ accion: "stock" }).t).productos["caja-de-proveedor"];
  assert.deepStrictEqual([vivo.estado, vivo.stock, vivo.precio], ["Pedido especial", 2, 95000]);
  assert.match(vivo.entrega, /^\d{4}-\d{2}-\d{2}$/);
  const pedir = (extra) => h.post({ accion: "pedido", cliente: "Ana Pérez", whatsapp: "8888-1234", correo: "ana@ejemplo.cr", envio: "retiro-omni", lineas: [{ slug: "caja-de-proveedor", cantidad: 1 }], ...extra });
  assert.match(pedir({}).error, /aceptar sus condiciones/);
  assert.match(pedir({ aceptaCondiciones: "condiciones-2026-11-10", lineas: [{ slug: "caja-de-proveedor", cantidad: 1 }, { slug: "carta-lista", cantidad: 1 }] }).error, /pedido aparte/);
  assert.match(pedir({ aceptaCondiciones: "condiciones-2026-11-10", lineas: [{ slug: "caja-de-proveedor", cantidad: 3 }] }).error, /Ya no quedan cupos/);
  // El precio lo pone la hoja, no la página.
  const r = pedir({ aceptaCondiciones: "condiciones-2026-11-10", total: 1, intento: "especial-1" });
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.total, 95000);
  assert.strictEqual(r.lineas[0].especial, true);
  // Repetido no hace dos pedidos.
  const filas = h.hojas["Pedidos web"].getLastRow();
  assert.strictEqual(pedir({ aceptaCondiciones: "condiciones-2026-11-10", intento: "especial-1" }).numero, r.numero);
  assert.strictEqual(h.hojas["Pedidos web"].getLastRow(), filas);
  const pe = h.hojas["Pedidos especiales"];
  assert.ok(pe, "se creó la pestaña");
  assert.deepStrictEqual([pe.leer(5, 1), pe.leer(5, 6), pe.leer(5, 11)], [r.numero, 95000, "Esperando pago"]);
  assert.match(String(h.hojas["Pedidos web"].leer(filas, 18)), /Aceptó las condiciones/);
  const alCliente = h.correos.filter((c) => c.to === "ana@ejemplo.cr").pop();
  assert.match(alCliente.body, /te devolvemos el 100%/);
  // Ocupa su cupo: queda 1.
  h.ctx.olvidarStock();
  assert.strictEqual(JSON.parse(h.get({ accion: "stock" }).t).productos["caja-de-proveedor"].stock, 1);
  // Se paga: no pasa a Ventas, queda como anticipo y sigue ocupando el cupo.
  const ventasAntes = h.hojas.Ventas.getLastRow();
  h.hojas["Pedidos web"].escribir(filas, 3, "Pagado");
  h.ctx.alEditarHoja({ value: "Pagado", oldValue: "Pendiente de pago", range: h.hojas["Pedidos web"].getRange(filas, 3, 1, 1) });
  assert.strictEqual(h.hojas.Ventas.getLastRow(), ventasAntes, "no es venta todavía");
  assert.match(String(h.hojas["Pedidos web"].leer(filas, 19)), /^Anticipo/);
  assert.deepStrictEqual([pe.leer(5, 7), pe.leer(5, 11)], [95000, "Por comprar al proveedor"]);
  h.ctx.olvidarStock();
  assert.strictEqual(JSON.parse(h.get({ accion: "stock" }).t).productos["caja-de-proveedor"].stock, 1);
  h.ctx.pagina.datos = { fecha: "2026-11-10T15:00:00.000Z", productos: 8 };
  h.ctx.actualizarSistema();
  const sistema = filas2(h.hojas.Sistema);
  assert.strictEqual(sistema.find((f) => f[0] === "Anticipos de clientes (no es ganancia)")[1], 95000);
  // No se consigue: la devolución queda pendiente y le llega a la tienda cómo hacerla.
  pe.escribir(5, 11, "No se consiguió");
  h.ctx.alEditarHoja({ value: "No se consiguió", range: pe.getRange(5, 11, 1, 1) });
  assert.strictEqual(pe.leer(5, 13), "Pendiente de devolver");
  assert.match(h.correos.pop().subject, /Devolver ₡95 000 del pedido especial/);
  // Recién cuando se confirma, se le avisa al cliente.
  pe.escribir(5, 13, "Devuelto (confirmado)");
  h.ctx.alEditarHoja({ value: "Devuelto (confirmado)", range: pe.getRange(5, 13, 1, 1) });
  assert.match(h.correos.pop().subject, /Te devolvimos tu pago/);
});
prueba("pedido especial entregado: recién ahí pasa a Ventas", () => {
  const h = nuevaHoja();
  const cat = h.hojas["Catálogo web"];
  cat.escribir(7, 18, "Pedido especial");
  cat.escribir(7, 9, 95000);
  cat.escribir(7, 16, new Date(Date.now() + 30 * 86400000));
  h.propiedades.PEDIDOS_ESPECIALES = "si";
  h.ctx.olvidarStock();
  const r = h.post({ accion: "pedido", cliente: "Ana Pérez", whatsapp: "8888-1234", correo: "ana@ejemplo.cr", envio: "retiro-omni", aceptaCondiciones: "condiciones-2026-11-10", lineas: [{ slug: "caja-de-proveedor", cantidad: 1 }] });
  assert.strictEqual(r.ok, true);
  const ped = h.hojas["Pedidos web"];
  const f = ped.getLastRow();
  ped.escribir(f, 3, "Pagado");
  h.ctx.alEditarHoja({ value: "Pagado", oldValue: "Pendiente de pago", range: ped.getRange(f, 3, 1, 1) });
  const ventasAntes = h.hojas.Ventas.getLastRow();
  ped.escribir(f, 3, "Entregado");
  h.ctx.alEditarHoja({ value: "Entregado", oldValue: "Pagado", range: ped.getRange(f, 3, 1, 1) });
  assert.match(String(ped.leer(f, 19)), /^Fila/);
  assert.ok(h.hojas.Ventas.getLastRow() > ventasAntes, "pasó a Ventas");
  assert.strictEqual(h.hojas["Pedidos especiales"].leer(5, 11), "Entregado");
});
prueba("sin precio de venta o con la fecha vencida, el pedido especial no se vende", () => {
  const h = nuevaHoja();
  const cat = h.hojas["Catálogo web"];
  cat.escribir(7, 18, "Pedido especial");
  cat.escribir(7, 16, new Date(Date.now() + 30 * 86400000));
  h.propiedades.PEDIDOS_ESPECIALES = "si";
  h.ctx.olvidarStock();
  assert.strictEqual(JSON.parse(h.get({ accion: "stock" }).t).productos["caja-de-proveedor"].estado, "Por consultar");
  cat.escribir(7, 9, 95000);
  cat.escribir(7, 16, new Date(Date.now() - 86400000));
  h.ctx.olvidarStock();
  assert.strictEqual(JSON.parse(h.get({ accion: "stock" }).t).productos["caja-de-proveedor"].estado, "Por consultar");
});
prueba("si falla la cuenta del script, el pedido igual responde bien y no se duplica", () => {
  const h = nuevaHoja();
  h.ctx.fallarSesion = true;
  const pedir = () => h.post({ accion: "pedido", cliente: "Allan Prueba", whatsapp: "8888-1234", correo: "allan@ejemplo.cr", envio: "retiro-omni", metodo: "tarjeta", intento: "reintento-1", lineas: [{ slug: "dos-lotes", cantidad: 1 }] });
  const r1 = pedir();
  assert.strictEqual(r1.ok, true, JSON.stringify(r1));
  assert.ok(r1.clave, "trae la clave para poder pagar");
  const filas = h.hojas["Pedidos web"].getLastRow();
  const r2 = pedir();
  assert.strictEqual(r2.numero, r1.numero, "el reintento devuelve el mismo pedido");
  assert.strictEqual(h.hojas["Pedidos web"].getLastRow(), filas, "no se anotó otro");
});
prueba("si falla un aviso después de anotar, el pedido responde bien y queda la nota", () => {
  const h = nuevaHoja();
  h.ctx.fallarUrl = true;
  const r = h.post({ accion: "pedido", cliente: "Ana Pérez", whatsapp: "8888-1234", correo: "ana@ejemplo.cr", envio: "retiro-omni", lineas: [{ slug: "dos-lotes", cantidad: 1 }] });
  assert.strictEqual(r.ok, true, JSON.stringify(r));
  const ped = h.hojas["Pedidos web"];
  assert.match(String(ped.leer(ped.getLastRow(), 18)), /Ojo: el pedido quedó anotado, pero falló un aviso: Error: falló getUrl/);
});
console.log("\n" + ok + " pruebas bien.");
