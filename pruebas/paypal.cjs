// Pago con tarjeta por PayPal contra la hoja falsa.
const assert = require("assert");
const { nuevaHoja } = require("./hoja-falsa.cjs");
let ok = 0;
const prueba = (nombre, fn) => { fn(); ok += 1; console.log("✓", nombre); };
const m = nuevaHoja();
// Stock de sobra para todos los pedidos de prueba (en Catálogo web y en Compras).
for (const [nombre, col] of [["Catálogo web", 6], ["Compras", 16]]) {
  const h = m.hojas[nombre];
  for (let i = 5; i <= h.getLastRow(); i++) if (/Caja pesada/.test(String(h.leer(i, nombre === "Compras" ? 3 : 2)))) h.escribir(i, col, 100);
}
const filaDe = (numero) => { const h = m.hojas["Pedidos web"]; for (let i = 5; i <= h.getLastRow(); i++) if (h.leer(i, 1) === numero) return i; throw new Error("no está " + numero); };
const pedido = (extra = {}) => m.post({ accion: "pedido", cliente: "Ana Prueba", whatsapp: "8888-1234", correo: "ana@ejemplo.cr", envio: "retiro-omni", lineas: [{ slug: "caja-pesada", cantidad: 1 }], cupon: null, ...extra });

prueba("sin llaves no hay botón ni cobro", () => {
  assert.strictEqual(JSON.parse(m.get({ accion: "paypal" }).t).ok, false);
  const p = pedido();
  assert.strictEqual(m.post({ accion: "paypal-crear", numero: p.numero, clave: p.clave }).ok, false);
});
m.ctx.ponerLlavesPaypal();
prueba("con llaves la página recibe el Client ID y el tipo de cambio", () => {
  const c = JSON.parse(m.get({ accion: "paypal" }).t);
  assert.strictEqual(c.ok, true); assert.strictEqual(c.clientId, "cliente-prueba"); assert.strictEqual(c.colonesPorDolar, 500); assert.strictEqual(c.secreto, undefined);
});
const p = pedido();
prueba("crea el cobro en dólares con el total de la hoja", () => {
  const r = m.post({ accion: "paypal-crear", numero: p.numero, clave: p.clave });
  assert.strictEqual(r.ok, true, JSON.stringify(r));
  assert.strictEqual(r.dolares, (Math.round(p.total / 500 * 100) / 100).toFixed(2));
  assert.strictEqual(m.ctx.paypal.ordenes[r.id].custom_id, p.numero);
  p.orden = r.id;
});
prueba("clave equivocada no crea nada", () => {
  assert.strictEqual(m.post({ accion: "paypal-crear", numero: p.numero, clave: "otra" }).ok, false);
});
prueba("monto distinto no marca pagado y avisa a la tienda", () => {
  m.ctx.paypal.cobrarDistinto = true;
  const antes = m.correos.length;
  const r = m.post({ accion: "paypal-capturar", numero: p.numero, clave: p.clave, orden: p.orden });
  m.ctx.paypal.cobrarDistinto = false;
  assert.strictEqual(r.ok, false);
  const fila = m.hojas["Pedidos web"]; let estado; for (let i = 5; i <= fila.getLastRow(); i++) if (fila.leer(i, 1) === p.numero) estado = fila.leer(i, 3);
  assert.strictEqual(estado, "Pendiente de pago");
  assert.ok(m.correos.slice(antes).some((c) => /Revisá un pago con PayPal/.test(c.subject)));
});
prueba("pago completo: Pagado, a Ventas, correo al cliente y a la tienda", () => {
  const antes = m.correos.length;
  const r = m.post({ accion: "paypal-capturar", numero: p.numero, clave: p.clave, orden: p.orden });
  assert.strictEqual(r.ok, true, JSON.stringify(r));
  const h = m.hojas["Pedidos web"]; const i = filaDe(p.numero);
  assert.strictEqual(h.leer(i, 3), "Pagado (PayPal)");
  assert.match(String(h.leer(i, 7)), /^PayPal CAPTURA/);
  assert.strictEqual(h.leer(i, 16), "PayPal (tarjeta)");
  assert.match(String(h.leer(i, 19)), /^Fila /);
  assert.match(String(h.leer(i, 18)), /comisión \$/);
  const v = m.hojas.Ventas; let nota = ""; for (let j = 5; j <= v.getLastRow(); j++) if (String(v.leer(j, 7)).includes(p.numero)) nota = v.leer(j, 7);
  assert.match(nota, /PayPal CAPTURA/); assert.doesNotMatch(nota, /SINPE PayPal/);
  const nuevos = m.correos.slice(antes);
  const gracias = nuevos.find((c) => c.to === "ana@ejemplo.cr" && /Gracias por tu compra con PayPal/.test(c.subject));
  assert.ok(gracias, "correo de gracias");
  assert.match(gracias.body, /Se cobró: \$/);
  assert.match(gracias.htmlBody, /Pagado \(PayPal\)/);
  assert.ok(nuevos.some((c) => c.to === "pokedekestore@gmail.com" && /Pago con tarjeta/.test(c.subject)));
});
prueba("repetir la confirmación no cobra ni anota dos veces", () => {
  const ventasAntes = m.hojas.Ventas.getLastRow();
  const r = m.post({ accion: "paypal-capturar", numero: p.numero, clave: p.clave, orden: p.orden });
  assert.strictEqual(r.ok, true);
  assert.strictEqual(m.hojas.Ventas.getLastRow(), ventasAntes);
  assert.strictEqual(m.post({ accion: "paypal-crear", numero: p.numero, clave: p.clave }).ok, false, "ya no está pendiente");
});
prueba("envío por confirmar: solo SINPE", () => {
  const q = pedido({ envio: "entre-tiendas", tienda: "otra", direccion: "Tienda X en Liberia" });
  assert.strictEqual(q.ok, true, JSON.stringify(q));
  const r = m.post({ accion: "paypal-crear", numero: q.numero, clave: q.clave });
  assert.strictEqual(r.ok, false); assert.match(r.error, /SINPE/);
});
prueba("PayPal en revisión no marca pagado", () => {
  const q = pedido();
  const c = m.post({ accion: "paypal-crear", numero: q.numero, clave: q.clave });
  m.ctx.paypal.estadoCaptura = "PENDING";
  const r = m.post({ accion: "paypal-capturar", numero: q.numero, clave: q.clave, orden: c.id });
  m.ctx.paypal.estadoCaptura = "COMPLETED";
  assert.strictEqual(r.ok, false); assert.match(r.error, /revisando/);
});
prueba("si eligió tarjeta, el pedido y el correo lo dicen", () => {
  const antes = m.correos.length;
  const q = pedido({ metodo: "tarjeta" });
  assert.strictEqual(q.ok, true, JSON.stringify(q));
  const h = m.hojas["Pedidos web"]; const i = filaDe(q.numero);
  assert.strictEqual(h.leer(i, 16), "Tarjeta (PayPal)");
  const nuevos = m.correos.slice(antes);
  const alCliente = nuevos.find((c) => c.to === "ana@ejemplo.cr");
  assert.match(alCliente.body, /Pagá con tarjeta en la página/);
  const aTienda = nuevos.find((c) => c.to === "pokedekestore@gmail.com");
  assert.match(aTienda.body, /Eligió pagar con tarjeta/);
});
prueba("con SINPE sigue igual", () => {
  const q = pedido({ metodo: "sinpe" });
  assert.strictEqual(q.ok, true, JSON.stringify(q));
  const h = m.hojas["Pedidos web"]; const i = filaDe(q.numero);
  assert.strictEqual(h.leer(i, 16), "SINPE Móvil");
});
prueba("marcar Pagado (PayPal) a mano también pasa a Ventas", () => {
  const q = pedido();
  assert.strictEqual(q.ok, true, JSON.stringify(q));
  const h = m.hojas["Pedidos web"]; const i = filaDe(q.numero);
  h.escribir(i, 3, "Pagado (PayPal)");
  m.ctx.alEditarHoja({ value: "Pagado (PayPal)", oldValue: "Pendiente de pago", range: h.getRange(i, 3, 1, 1) });
  assert.match(String(h.leer(i, 19)), /^Fila /);
});
console.log(`\n${ok} pruebas bien.`);
