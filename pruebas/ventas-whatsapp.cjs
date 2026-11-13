// Ventas por WhatsApp: número, abonos, Ventas y comprobante con link.
const assert = require("assert");
process.env.PAYPAL_FALSO = "si";
const { nuevaHoja } = require("./hoja-falsa.cjs");
let ok = 0;
const prueba = (nombre, fn) => { fn(); ok += 1; console.log("✓", nombre); };

const h = nuevaHoja();
const pw = h.hojas["Pedidos web"], ventas = h.hojas.Ventas;
const COL = { numero: 1, estado: 3, total: 8, enVentas: 19, detalle: 20, clave: 21 };
const filaDe = (numero) => { for (let r = 5; r <= pw.getLastRow(); r++) if (pw.leer(r, 1) === numero) return r; return -1; };
const leer = (numero, col) => pw.leer(filaDe(numero), col);
const filasVentas = () => { const o = []; for (let r = 5; r <= ventas.getLastRow(); r++) if (ventas.leer(r, 2)) o.push([2, 3, 4, 5, 6, 7].map((c) => ventas.leer(r, c))); return o; };
const comprobante = (numero, clave) => JSON.parse(h.get({ accion: "comprobante", numero, clave }).t);
const venta = (extra = {}) => h.ctx.anotarVentaWhatsapp({
  cliente: "Alonso Acuña", whatsapp: "8888-0000", canal: "Conocidos",
  lineas: [{ slug: "preventa-x", nombre: "Preventa X", cantidad: 1, precio: 180000 }],
  envio: "Por coordinar por WhatsApp", entrega: "Llega entre el 19 y el 22 de Noviembre.",
  pago: 90000, metodo: "SINPE Móvil", referencia: "123456", saldoCuando: "el 30 de Noviembre", ...extra,
});

let primera;
prueba("una venta con abono queda Abonado y entra a Ventas con el precio completo", () => {
  const antes = filasVentas().length;
  const correos = h.correos.length;
  primera = venta();
  assert.strictEqual(primera.ok, true, primera.error);
  assert.strictEqual(primera.numero, "TCG-0001");
  assert.strictEqual(primera.estado, "Abonado");
  assert.deepStrictEqual([primera.total, primera.pagado, primera.saldo], [180000, 90000, 90000]);
  const nuevas = filasVentas().slice(antes);
  assert.strictEqual(nuevas.length, 1);
  assert.deepStrictEqual(nuevas[0].slice(0, 5), ["C006 · Preventa X", 1, 180000, "Conocidos", "Alonso Acuña"]);
  assert.match(nuevas[0][5], /TCG-0001 · Venta por WhatsApp/);
  assert.match(nuevas[0][5], /Abonó ₡90 000, falta ₡90 000/);
  assert.match(leer("TCG-0001", COL.enVentas), /^Fila /);
  assert.strictEqual(h.correos.length, correos, "una venta por WhatsApp no manda correos");
});
prueba("el mensaje trae el link del comprobante y lo que falta", () => {
  assert.match(primera.enlace, /^https:\/\/pokedeke\.store\/comprobante\?pedido=TCG-0001&clave=/);
  assert.match(primera.mensaje, /Hola Alonso/);
  assert.match(primera.mensaje, /te faltan ₡90 000 \(el 30 de Noviembre\)/);
  assert.match(primera.abrirWhatsapp, /^https:\/\/wa\.me\/50688880000\?text=/);
});
prueba("el comprobante solo se ve con la clave y trae pagos y saldo", () => {
  const clave = leer("TCG-0001", COL.clave);
  assert.strictEqual(comprobante("TCG-0001", "otra").ok, false);
  assert.strictEqual(comprobante("TCG-0001", "").ok, false);
  const c = comprobante("TCG-0001", clave);
  assert.strictEqual(c.ok, true);
  assert.deepStrictEqual([c.pedido.estado, c.pedido.total, c.pedido.pagado, c.pedido.saldo], ["Abonado", 180000, 90000, 90000]);
  assert.strictEqual(c.pedido.pagos.length, 1);
  assert.strictEqual(c.pedido.pagos[0].metodo, "SINPE Móvil");
  assert.strictEqual(c.pedido.entrega, "Llega entre el 19 y el 22 de Noviembre.");
  assert.strictEqual(c.pedido.lineas[0].precio, 180000);
});
prueba("un pedido de la página después de una venta por WhatsApp sigue la numeración", () => {
  const r = h.post({ accion: "pedido", cliente: "Ana Pérez", whatsapp: "8888-1234", correo: "ana@ejemplo.cr", envio: "retiro-omni", lineas: [{ slug: "eevee-ex-174-promo", cantidad: 1 }] });
  assert.strictEqual(r.ok, true, r.error);
  assert.strictEqual(r.numero, "TCG-0002");
});
prueba("con un abono no se puede cobrar el total con tarjeta", () => {
  const clave = leer("TCG-0001", COL.clave);
  pw.escribir(filaDe("TCG-0001"), COL.estado, "Pendiente de pago");
  const r = h.post({ accion: "paypal-crear", numero: "TCG-0001", clave });
  assert.strictEqual(r.ok, false);
  assert.match(r.error, /abono/);
  pw.escribir(filaDe("TCG-0001"), COL.estado, "Abonado");
});
prueba("el resto del pago pasa a Pagado sin repetir la venta en Ventas", () => {
  const antes = filasVentas().length;
  assert.strictEqual(h.ctx.anotarPagoDePedido({ numero: "TCG-0001", monto: 100000 }).ok, false);
  const r = h.ctx.anotarPagoDePedido({ numero: "TCG-0001", monto: 90000, metodo: "Efectivo" });
  assert.strictEqual(r.ok, true, r.error);
  assert.deepStrictEqual([r.estado, r.pagado, r.saldo], ["Pagado", 180000, 0]);
  assert.strictEqual(filasVentas().length, antes);
  const c = comprobante("TCG-0001", leer("TCG-0001", COL.clave));
  assert.deepStrictEqual([c.pedido.saldo, c.pedido.pagos.length], [0, 2]);
  assert.strictEqual(h.ctx.anotarPagoDePedido({ numero: "TCG-0001", monto: 1 }).ok, false);
});
prueba("una venta sin pago queda pendiente y entra a Ventas con el primer abono", () => {
  const antes = filasVentas().length;
  const r = venta({ cliente: "Jose Martínez", whatsapp: "", pago: 0, lineas: [{ slug: "preventa-x", nombre: "Preventa X", cantidad: 1, precio: 160000 }] });
  assert.strictEqual(r.ok, true, r.error);
  assert.deepStrictEqual([r.numero, r.estado, r.saldo, r.abrirWhatsapp], ["TCG-0003", "Pendiente de pago", 160000, ""]);
  assert.match(r.mensaje, /Total a pagar: ₡160 000 por SINPE Móvil/);
  assert.strictEqual(filasVentas().length, antes);
  const abono = h.ctx.anotarPagoDePedido({ numero: "TCG-0003", monto: 80000 });
  assert.deepStrictEqual([abono.estado, abono.saldo], ["Abonado", 80000]);
  assert.strictEqual(filasVentas().length, antes + 1);
  assert.strictEqual(filasVentas().at(-1)[2], 160000);
});
prueba("una venta pagada completa queda Pagado y en Ventas", () => {
  const antes = filasVentas().length;
  const r = venta({ pago: 50000, canal: "Marketplace", lineas: [{ slug: "etb-30th-celebration", nombre: "ETB 30th Celebration", cantidad: 1, precio: 50000 }] });
  assert.deepStrictEqual([r.estado, r.saldo], ["Pagado", 0]);
  assert.strictEqual(filasVentas().length, antes + 1);
  assert.strictEqual(filasVentas().at(-1)[3], "Marketplace");
});
prueba("con envío, el total lo incluye", () => {
  const r = venta({ pago: 0, costoEnvio: 3000, envio: "Correos de Costa Rica", direccion: "Puriscal" });
  assert.strictEqual(r.total, 183000);
  const c = comprobante(r.numero, leer(r.numero, COL.clave));
  assert.deepStrictEqual([c.pedido.costoEnvio, c.pedido.envio, c.pedido.direccion], [3000, "Correos de Costa Rica", "Puriscal"]);
});
prueba("datos malos no anotan nada", () => {
  const filas = pw.getLastRow();
  assert.strictEqual(venta({ lineas: [{ slug: "no-existe", nombre: "Inventado", cantidad: 1, precio: 1 }] }).ok, false);
  assert.strictEqual(venta({ pago: 999999 }).ok, false);
  assert.strictEqual(venta({ cliente: "A" }).ok, false);
  assert.strictEqual(venta({ whatsapp: "123" }).ok, false);
  assert.strictEqual(venta({ lineas: [] }).ok, false);
  assert.strictEqual(pw.getLastRow(), filas);
});
prueba("anota la venta aunque el script corra con otra cuenta", () => {
  h.ctx.fallarSesion = true;
  const r = venta({ pago: 0 });
  h.ctx.fallarSesion = false;
  assert.strictEqual(r.ok, true, r.error);
});
prueba("un pedido de la página: comprobante sin pagar y después pagado a mano", () => {
  const clave = leer("TCG-0002", COL.clave);
  const antes = comprobante("TCG-0002", clave);
  assert.deepStrictEqual([antes.pedido.pagado, antes.pedido.saldo], [0, antes.pedido.total]);
  pw.escribir(filaDe("TCG-0002"), COL.estado, "Pagado");
  h.ctx.alEditarHoja({ value: "Pagado", oldValue: "Pendiente de pago", range: pw.getRange(filaDe("TCG-0002"), 3, 1, 1) });
  const despues = comprobante("TCG-0002", clave);
  assert.deepStrictEqual([despues.pedido.pagado, despues.pedido.saldo], [despues.pedido.total, 0]);
});
prueba("poner Abonado a mano en la hoja también pasa la venta a Ventas", () => {
  const r = venta({ pago: 0 });
  const antes = filasVentas().length;
  pw.escribir(filaDe(r.numero), COL.estado, "Abonado");
  h.ctx.alEditarHoja({ value: "Abonado", oldValue: "Pendiente de pago", range: pw.getRange(filaDe(r.numero), 3, 1, 1) });
  assert.strictEqual(filasVentas().length, antes + 1);
});
prueba("el link de un pedido sin clave le pone una", () => {
  const r = filaDe("TCG-0002");
  pw.escribir(r, COL.clave, "");
  const link = h.ctx.comprobanteDePedido("TCG-0002");
  assert.strictEqual(link.ok, true);
  assert.ok(pw.leer(r, COL.clave));
  assert.match(link.enlace, new RegExp("clave=" + pw.leer(r, COL.clave)));
});
prueba("la ventana del menú lleva los datos sin romper el HTML", () => {
  const html = h.ctx.htmlDeVentana("venta", { productos: [{ slug: "a", nombre: "A $1 </script>", precio: 1, estado: "Disponible" }], envios: ["x"], canales: ["Otro"], metodos: ["SINPE Móvil"] });
  assert.doesNotMatch(html, /__DATOS__/);
  assert.strictEqual((html.match(/<\/script>/g) || []).length, 1);
  assert.match(html, /A \$1/);
});

console.log(`\n${ok} pruebas bien.`);
