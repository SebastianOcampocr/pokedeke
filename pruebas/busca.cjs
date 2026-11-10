// Pokedeke Busca, búsquedas, consultas por WhatsApp, catálogo cerrado, publicación y respaldo.
const assert = require("assert");
const vm = require("vm");
const { nuevaHoja } = require("./hoja-falsa.cjs");
let ok = 0;
const prueba = (nombre, fn) => { fn(); ok += 1; console.log("✓", nombre); };
// Las fechas nacen dentro del simulador: "instanceof Date" no las reconoce desde afuera.
const esFecha = (valor) => Object.prototype.toString.call(valor) === "[object Date]";
const filas = (hoja, columnas) => { const o = []; for (let r = 5; r <= hoja.getLastRow(); r++) o.push(Array.from({ length: columnas }, (_, i) => hoja.leer(r, i + 1))); return o; };

const m = nuevaHoja();
const solicitud = (extra = {}) => m.post({ accion: "solicitud", producto: "Booster Box Phantasmal Flames", cantidad: 2, detalle: "en inglés", presupuesto: "₡90 000", origen: "portada", ...extra });

prueba("la solicitud crea la pestaña y queda anotada como Nueva", () => {
  assert.strictEqual(m.hojas.Solicitudes, undefined);
  assert.deepStrictEqual(solicitud(), { ok: true });
  const hoja = m.hojas.Solicitudes;
  assert.strictEqual(hoja.leer(4, 2), "Qué busca");
  const [fila] = filas(hoja, 8);
  assert.ok(esFecha(fila[0]));
  assert.deepStrictEqual(fila.slice(1), ["Booster Box Phantasmal Flames", 2, "en inglés", "₡90 000", "Portada", "Nueva", ""]);
});
prueba("sin producto no guarda, y un origen raro queda como Otro", () => {
  assert.strictEqual(solicitud({ producto: " a " }).ok, false);
  assert.strictEqual(solicitud({ origen: "constructor", cantidad: "muchas" }).ok, true);
  const ultima = filas(m.hojas.Solicitudes, 8).pop();
  assert.strictEqual(ultima[5], "Otro");
  assert.strictEqual(ultima[2], 1);
});
prueba("una fórmula escrita como producto queda como texto", () => {
  solicitud({ producto: '=HYPERLINK("http://malo","clic")', detalle: "+50688881234" });
  assert.deepStrictEqual(m.hojas.Solicitudes.formulas, []);
});
prueba("el campo trampa para robots no guarda nada", () => {
  const antes = m.hojas.Solicitudes.getLastRow();
  assert.deepStrictEqual(solicitud({ sitio: "http://spam" }), { ok: true });
  assert.strictEqual(m.hojas.Solicitudes.getLastRow(), antes);
});
prueba("una vez por hora sale un solo correo con las solicitudes nuevas", () => {
  const antes = m.correos.length;
  m.ctx.tareasCadaHora();
  const nuevos = m.correos.slice(antes).filter((c) => /Pokedeke Busca/.test(c.subject));
  assert.strictEqual(nuevos.length, 1);
  assert.strictEqual(nuevos[0].to, "pokedekestore@gmail.com");
  assert.match(nuevos[0].subject, /^Hay 3 solicitudes nuevas/);
  assert.match(nuevos[0].body, /2 × Booster Box Phantasmal Flames \(detalle: en inglés; presupuesto: ₡90 000; Portada\)/);
  m.ctx.tareasCadaHora();
  assert.strictEqual(m.correos.slice(antes).filter((c) => /Pokedeke Busca/.test(c.subject)).length, 1, "sin nada nuevo no repite");
  solicitud({ producto: "Charizard ex 199", origen: "buscador" });
  m.ctx.tareasCadaHora();
  const ultimo = m.correos.slice(antes).filter((c) => /Pokedeke Busca/.test(c.subject)).pop();
  assert.match(ultimo.subject, /^Hay 1 solicitud nueva/);
  assert.match(ultimo.body, /Buscador sin resultados/);
});
prueba("tope de solicitudes por hora", () => {
  let aceptadas = 0;
  for (let i = 0; i < 60; i++) if (solicitud({ producto: "Producto " + i }).ok) aceptadas += 1;
  assert.ok(aceptadas < 60 && aceptadas > 20, "aceptadas " + aceptadas);
});

const busqueda = (texto, resultados) => m.post({ accion: "busqueda", texto, resultados, origen: "catalogo" });
prueba("las búsquedas se juntan por término, sin acentos ni mayúsculas", () => {
  assert.deepStrictEqual(busqueda("Charizárd  EX ", 3), { ok: true });
  busqueda("charizard ex", 0);
  busqueda("Prismatic Evolutions ETB", 0);
  busqueda("151", 2);
  const datos = filas(m.hojas["Búsquedas"], 5);
  assert.deepStrictEqual(datos.map((f) => f.slice(0, 4)), [["charizard ex", 2, 1, 0], ["prismatic evolutions etb", 1, 1, 0], ["151", 1, 0, 2]]);
  assert.ok(esFecha(datos[0][4]));
});
prueba("búsquedas muy cortas no se anotan y hay tope de términos", () => {
  assert.strictEqual(busqueda("ab", 0).ok, false);
  assert.strictEqual(busqueda("=1+1", 0).ok, true);
  assert.deepStrictEqual(m.hojas["Búsquedas"].formulas, []);
  vm.runInContext("CONFIG.maxTerminos = 4", m.ctx);
  assert.strictEqual(busqueda("uno nuevo", 0).ok, false);
  assert.strictEqual(busqueda("151", 1).ok, true, "los que ya existen siguen sumando");
  vm.runInContext("CONFIG.maxTerminos = 3000", m.ctx);
});

prueba("la consulta por WhatsApp agrega su columna y cuenta", () => {
  const vistos = m.hojas["Lo más visto"];
  vistos.columnas = 5;
  m.post({ accion: "visto", slug: "eevee-ex-174-promo", tipo: "vista" });
  m.post({ accion: "visto", slug: "eevee-ex-174-promo", tipo: "whatsapp" });
  m.post({ accion: "visto", slug: "eevee-ex-174-promo", tipo: "whatsapp" });
  m.post({ accion: "visto", slug: "caja-pesada", tipo: "whatsapp" });
  assert.strictEqual(vistos.getMaxColumns(), 6);
  assert.strictEqual(vistos.leer(4, 6), "Consultas por WhatsApp");
  const datos = filas(vistos, 6).map((f) => [f[4], f[1], f[2], f[5]]);
  assert.deepStrictEqual(datos, [["eevee-ex-174-promo", 1, 0, 2], ["caja-pesada", 0, 0, 1]]);
  assert.strictEqual(m.post({ accion: "visto", slug: "eevee-ex-174-promo", tipo: "constructor" }).ok, false);
  const extras = JSON.parse(m.get({ accion: "extras" }).t);
  assert.deepStrictEqual(extras.masVistos[0], { slug: "eevee-ex-174-promo", vistas: 1, agregados: 0 });
});

prueba("el catálogo abierto solo entrega lo publicado y sin el precio sugerido", () => {
  const csv = m.get({ accion: "catalogo" }).t;
  assert.doesNotMatch(csv, /Oculta/);
  assert.doesNotMatch(csv, /One Piece Y/);
  const lineas = csv.split("\n");
  assert.match(lineas[0], /^"ID","Producto"/);
  const etb = lineas.find((l) => l.startsWith('"C002"'));
  assert.doesNotMatch(etb, /42500/);
  assert.strictEqual(etb.split('","')[7], "50000");
  assert.strictEqual(etb.split('","')[8], "50000");
  // Sin precio de venta, el sugerido es el precio de la página: ese sí va.
  assert.strictEqual(lineas.find((l) => l.startsWith('"C003"')).split('","')[7], "43000");
});

prueba("sin llave no se le pide nada a GitHub", () => {
  assert.match(m.ctx.publicarSiCambio(), /Falta la propiedad GITHUB_TOKEN/);
  assert.strictEqual(m.ctx.github.llamadas.length, 0);
});
prueba("con llave pide rearmar la página solo cuando el catálogo cambió", () => {
  m.propiedades.GITHUB_TOKEN = "llave-de-prueba";
  assert.match(m.ctx.publicarSiCambio(), /se pidió rearmar/);
  const [llamada] = m.ctx.github.llamadas;
  assert.strictEqual(llamada.url, "https://api.github.com/repos/SebastianOcampocr/pokedeke/actions/workflows/publicar-demo.yml/dispatches");
  assert.strictEqual(llamada.opciones.headers.Authorization, "Bearer llave-de-prueba");
  assert.deepStrictEqual(JSON.parse(llamada.opciones.payload), { ref: "main" });
  assert.match(m.ctx.publicarSiCambio(), /no ha cambiado/);
  assert.strictEqual(m.ctx.github.llamadas.length, 1);
  m.hojas["Catálogo web"].escribir(5, 9, 9000);
  assert.match(m.ctx.publicarSiCambio(), /se pidió rearmar/);
  assert.strictEqual(m.ctx.github.llamadas.length, 2);
});
prueba("si GitHub rechaza la llave, lo vuelve a intentar la próxima vez", () => {
  m.hojas["Catálogo web"].escribir(5, 9, 9500);
  m.ctx.github.codigo = 401;
  assert.match(m.ctx.publicarSiCambio(), /GitHub respondió 401/);
  m.ctx.github.codigo = 204;
  assert.match(m.ctx.publicarSiCambio(), /se pidió rearmar/);
  assert.strictEqual(m.ctx.github.llamadas.length, 4);
});
prueba("el respaldo semanal hace una copia con la fecha", () => {
  m.ctx.respaldarHoja();
  assert.strictEqual(m.copias.length, 1);
  assert.match(m.copias[0], /^Respaldo Pokedeke \d{4}-\d{2}-\d{2}$/);
});
prueba("instalarAvisos deja los cuatro activadores, sin repetir", () => {
  m.ctx.instalarAvisos();
  m.ctx.instalarAvisos();
  assert.deepStrictEqual(m.activadores.map((a) => a.getHandlerFunction()).sort(), ["alEditarHoja", "publicarSiCambio", "respaldarHoja", "tareasCadaHora"]);
});
prueba("la hoja de prueba marca sus correos y apunta a su propia página", () => {
  m.propiedades.MODO_PRUEBA = "si";
  m.propiedades.SITIO = "https://experimental.pokedeke.pages.dev/";
  for (const [nombre, col] of [["Catálogo web", 6], ["Compras", 16]]) { const h = m.hojas[nombre]; for (let i = 5; i <= h.getLastRow(); i++) if (/Caja pesada/.test(String(h.leer(i, nombre === "Compras" ? 3 : 2)))) h.escribir(i, col, 100); }
  const antes = m.correos.length;
  const r = m.post({ accion: "pedido", cliente: "Ana Prueba", whatsapp: "8888-1234", correo: "ana@ejemplo.cr", envio: "retiro-omni", lineas: [{ slug: "caja-pesada", cantidad: 1 }], cupon: null });
  assert.strictEqual(r.ok, true, JSON.stringify(r));
  const nuevos = m.correos.slice(antes);
  assert.ok(nuevos.length >= 2);
  assert.ok(nuevos.every((c) => c.subject.startsWith("[PRUEBA] ")));
  const alCliente = nuevos.find((c) => c.to === "ana@ejemplo.cr");
  assert.match(alCliente.htmlBody, /https:\/\/experimental\.pokedeke\.pages\.dev\/pedido\?numero=/);
  assert.doesNotMatch(alCliente.htmlBody, /https:\/\/pokedeke\.store\//);
});
prueba("la pestaña Demanda junta las señales con el stock y sugiere", () => {
  m.post({ accion: "aviso", slug: "sin-stock", nombre: "Luis", contacto: "luis@ejemplo.cr" });
  m.post({ accion: "visto", slug: "sin-stock", tipo: "vista" });
  const cuantas = m.ctx.actualizarDemanda();
  const hoja = m.hojas.Demanda;
  assert.strictEqual(hoja.leer(4, 1), "Prioridad");
  const datos = filas(hoja, 13);
  assert.strictEqual(datos.length, cuantas);
  const de = (nombre) => datos.find((f) => f[1] === nombre);
  // Eevee: 1 vista y 2 consultas por WhatsApp son 9 puntos, con stock.
  assert.deepStrictEqual(de("Eevee ex #174 (Promo)").slice(0, 9), ["Media", "Eevee ex #174 (Promo)", "Disponible", 1, 0, 1, 0, 2, 0]);
  assert.match(de("Eevee ex #174 (Promo)")[12], /buen candidato para una publicación/);
  // Agotado con alguien esperando.
  assert.deepStrictEqual(de("Sin stock").slice(2, 9), ["Agotado", 0, 0, 1, 0, 0, 1]);
  assert.match(de("Sin stock")[12], /revisar si conviene reponerlo/);
  // Lo que no está: lo pedido en Busca pesa más que lo solo buscado.
  const caja = de("Booster Box Phantasmal Flames");
  assert.deepStrictEqual([caja[2], caja[10], caja[0]], ["No está en la página", 2, "Alta"]);
  assert.match(caja[12], /Lo pidieron en Busca: revisar si se puede conseguir/);
  const etb = de("prismatic evolutions etb");
  assert.deepStrictEqual([etb[0], etb[2], etb[9]], ["Baja", "No está en la página", 1]);
  assert.strictEqual(de("151"), undefined, "lo que sí dio resultados no cuenta como faltante");
  // Charizard ex 199 se pidió y además se buscó "charizard ex" sin suerte: son dos filas distintas, cada una con su señal.
  assert.strictEqual(de("Charizard ex 199")[10], 1);
  // Con stock y sin que nadie lo mire.
  const quieto = de("ETB 30th Celebration");
  assert.deepStrictEqual([quieto[0], quieto[3]], ["Sin movimiento", 5]);
  assert.match(quieto[12], /darle visibilidad con contenido/);
  // Lo que tiene la etiqueta vieja de preventa no cuenta como stock propio.
  assert.strictEqual(de("Preventa X"), undefined);
  assert.strictEqual(de("Oculta"), undefined);
  assert.deepStrictEqual(hoja.formulas, []);
  assert.match(String(hoja.leer(3, 1)), /^Actualizado: /);
  // Volver a correr no duplica nada.
  assert.strictEqual(m.ctx.actualizarDemanda(), cuantas);
  assert.strictEqual(filas(hoja, 13).length, cuantas);
});
prueba("una solicitud cerrada deja de pedirse en Demanda", () => {
  const sol = m.hojas.Solicitudes;
  for (let r = 5; r <= sol.getLastRow(); r++) if (sol.leer(r, 2) === "Booster Box Phantasmal Flames") sol.escribir(r, 7, "Conseguida");
  m.ctx.actualizarDemanda();
  assert.strictEqual(filas(m.hojas.Demanda, 13).find((f) => f[1] === "Booster Box Phantasmal Flames"), undefined);
});
console.log("\n" + ok + " pruebas bien.");
