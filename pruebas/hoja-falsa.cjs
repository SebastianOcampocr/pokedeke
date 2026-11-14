// Hoja de mentira para probar apps-script/Pedidos.gs sin tocar la hoja real: corre el
// código tal cual, con Google (hoja, correo, memoria, PayPal, GitHub) simulado.
const fs = require("fs"), vm = require("vm"), path = require("path");
const CODIGO = fs.readFileSync(path.join(__dirname, "../apps-script/Pedidos.gs"), "utf8").replace("cupones: {},", 'cupones: { TICO10: { tipo: "porcentaje", valor: 10 }, BIENVENIDA: { tipo: "monto", valor: 2000 } },');
function nuevaHoja() {
  const correos = [], activadores = [];
  class Rango {
    constructor(h, r, c, nr = 1, nc = 1) { Object.assign(this, { h, r, c, nr, nc }); }
    getSheet() { return this.h; } getColumn() { return this.c; } getRow() { return this.r; } getNumRows() { return this.nr; }
    getValues() { const o = []; for (let i = 0; i < this.nr; i++) { const f = []; for (let j = 0; j < this.nc; j++) f.push(this.h.leer(this.r + i, this.c + j)); o.push(f); } return o; }
    getDisplayValues() { return this.getValues().map((f) => f.map((v) => String(v))); }
    getValue() { return this.h.leer(this.r, this.c); }
    setValue(v) { this.h.escribir(this.r, this.c, v); }
    clearContent() { for (let i = 0; i < this.nr; i++) for (let j = 0; j < this.nc; j++) this.h.celdas.delete(`${this.r + i},${this.c + j}`); this.h.ultima = Math.max(0, ...[...this.h.celdas.keys()].map((k) => +k.split(",")[0])); }
    setValues(m) { m.forEach((f, i) => f.forEach((v, j) => this.h.escribir(this.r + i, this.c + j, v))); }
  }
  class Hoja {
    constructor(nombre, filas, max = 1000) { this.nombre = nombre; this.celdas = new Map(); this.max = max; this.formulas = []; this.ultima = 0;
      filas.forEach((f, i) => f.forEach((v, j) => { this.celdas.set(`${i + 1},${j + 1}`, v); this.ultima = Math.max(this.ultima, i + 1); })); }
    leer(r, c) { const v = this.celdas.get(`${r},${c}`); return v === undefined ? "" : v; }
    escribir(r, c, v) {
      if (this.nombre === "Ventas" && !this.valida(r, c, v)) throw new Error("validación rechazó " + v);
      if (typeof v === "string" && /^[=+@-]/.test(v)) this.formulas.push(v);
      if (typeof v === "string" && v.startsWith("'")) v = v.slice(1);
      this.celdas.set(`${r},${c}`, v); this.ultima = Math.max(this.ultima, r); }
    valida(r, c, v) { if (c === 2) return Hoja.compras.includes(v); if (c === 5) return ["Página web", "Conocidos", "Otro", "Grupo de WhatsApp TCG CR", "Marketplace", "Instagram"].includes(v); if (c === 1) return v instanceof Date; return true; }
    getMaxColumns() { return this.columnas || 26; } insertColumnAfter() { this.columnas = this.getMaxColumns() + 1; } setFrozenRows() {}
    getLastColumn() { return Math.max(0, ...[...this.celdas.keys()].map((k) => +k.split(",")[1])); }
    getName() { return this.nombre; } getSheetId() { return 8; } getLastRow() { return this.ultima; } getMaxRows() { return this.max; }
    getRange(r, c, nr, nc) { return new Rango(this, r, c, nr, nc); }
    appendRow(f) { if (this.nombre === "Ventas" || this.nombre === "Compras") throw new Error("appendRow prohibido"); const r = this.ultima + 1; f.forEach((v, j) => this.escribir(r, j + 1, v)); }
  }
  const T = ["ID", "Producto", "Categoría", "Juego", "Idioma", "En stock", "Vendidas", "Precio sugerido (₡)", "Precio de venta (₡)", "Nombre para mostrar", "Descripción", "Fotos (URL)", "Publicado (sí/no)", "Destacado (sí/no)", "Etiqueta", "Llega (preventas)", "Peso (g)", "Estado en la página"];
  const fc = (id, p, cat, stock, sug, venta = "", extra = {}) => { const f = [id, p, cat, extra.juego || "Pokémon", "", stock, 0, sug, venta, "", "", "", extra.pub || "", "", extra.et || "", extra.llega ? new Date(extra.llega + "T12:00:00-06:00") : "", extra.peso || "", extra.estado || ""]; return f; };
  const lista = process.env.HOJA_PRODUCTOS ? JSON.parse(fs.readFileSync(process.env.HOJA_PRODUCTOS, "utf8")) : null;
  const cat = lista ? [["Catálogo web"], [""], [""], T, ...lista.map(([id, n, c, st, sug, venta, extra]) => fc(id, n, c, st, sug, venta, extra || {}))] : [["Catálogo web"], [""], [""], T,
    fc("C001", "Eevee ex #174 (Promo)", "Carta suelta (single)", 1, 8000),
    fc("C002", "ETB 30th Celebration", "ETB", 2, 42500, 50000),
    fc("C003", "ETB 30th Celebration", "ETB", 3, 43000),
    fc("C004", "Oculta", "ETB", 3, 43000, "", { pub: "no" }),
    fc("C005", "Sin stock", "ETB", 0, 1000),
    fc("C006", "Preventa X", "ETB", 5, 40000, "", { et: "Preventa" }),
    fc("C007", "One Piece Y", "ETB", 5, 40000, "", { juego: "One Piece" }),
    fc("C008", "Caja pesada", "ETB", 5, 1000, "", { peso: 1500 }),
    ...Array.from({ length: 6 }, () => new Array(18).fill(""))];
  const comp = [[""], [""], [""], ["ID"]];
  (lista ? lista.map(([id, n, , st]) => [id, n, st]) : [["C001", "Eevee ex #174 (Promo)", 1], ["C002", "ETB 30th Celebration", 2], ["C003", "ETB 30th Celebration", 3], ["C004", "Oculta", 3], ["C005", "Sin stock", 0], ["C006", "Preventa X", 5], ["C007", "One Piece Y", 5], ["C008", "Caja pesada", 5]]).forEach(([id, n, st]) => {
    const f = new Array(22).fill(""); f[0] = id; f[2] = n; f[15] = st; f[21] = `${id} · ${n}`; comp.push(f); });
  Hoja.compras = comp.slice(4).map((f) => f[21]);
  const ventas = [[""], [""], [""], ["Fecha"], [new Date(), "C001 · x", 1, 1500]];
  const hojas = { "Catálogo web": new Hoja("Catálogo web", cat), Compras: new Hoja("Compras", comp), Ventas: new Hoja("Ventas", ventas, 40), "Pedidos web": new Hoja("Pedidos web", [["t"], [""], [""], ["Número"]]), Interesados: new Hoja("Interesados", [["t"], [""], [""], ["F"]]), Carritos: new Hoja("Carritos", [["Carritos"], [""], ["Abiertos"], ["Carrito"]]), Comentarios: new Hoja("Comentarios", [["Comentarios"], [""], [""], ["Fecha"]]), "Avisos de stock": new Hoja("Avisos de stock", [["Avisos"], [""], [""], ["Fecha"]]), "Lo más visto": new Hoja("Lo más visto", [["Lo más visto"], [""], [""], ["Producto"]]) };
  const copias = [];
  const libro = { getNumSheets: () => Object.keys(hojas).length, insertSheet: (n, lugar) => { if (lugar !== Object.keys(hojas).length) throw new Error("la pestaña nueva debe ir de última"); return (hojas[n] = new Hoja(n, [])); }, copy: (n) => { copias.push(n); }, getSheetByName: (n) => hojas[n], getSpreadsheetTimeZone: () => "America/Costa_Rica", toast() {}, getUrl: () => { if (ctx.fallarUrl) throw new Error("falló getUrl"); return "https://docs.google.com/spreadsheets/d/x/edit"; } };
  const salida = (t) => ({ t, setMimeType() { return this; } });
  const cache = {};
  const propiedades = {};
  const ctx = {
    console: { error() {}, log() {} }, SpreadsheetApp: { getActiveSpreadsheet: () => libro, flush() {} },
    ContentService: { createTextOutput: salida, MimeType: { JSON: 1, CSV: 2 } },
    LockService: { getDocumentLock: () => ({ waitLock() {}, tryLock: () => true, releaseLock() {} }) },
    CacheService: { getScriptCache: () => ({ get: (k) => (cache[k] && cache[k].fin > Date.now() ? cache[k].v : null), put: (k, v, s) => { cache[k] = { v, fin: Date.now() + s * 1000 }; }, remove: (k) => { delete cache[k]; }, removeAll: (l) => l.forEach((k) => { delete cache[k]; }) }) },
    Utilities: { formatDate: (d, z, f) => { if (f === "yyyyMMddHH") return "2026110612"; if (f === "yyyy-MM-dd") return new Intl.DateTimeFormat("en-CA", { timeZone: z }).format(new Date(d)); if (f === "u") return String(["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].indexOf(new Intl.DateTimeFormat("en-US", { timeZone: z, weekday: "short" }).format(new Date(d))) + 1); if (f === "d/M") { const p = new Intl.DateTimeFormat("en-US", { timeZone: z, day: "numeric", month: "numeric" }).formatToParts(new Date(d)); return p.find((x) => x.type === "day").value + "/" + p.find((x) => x.type === "month").value; } return "06/11/2026"; }, parseDate: () => new Date(2026, 10, 6, 12), getUuid: () => "clave-" + Math.random(), DigestAlgorithm: { MD5: "md5" }, computeDigest: (a, x) => [...require("crypto").createHash("md5").update(x).digest()], base64EncodeWebSafe: (b) => Buffer.from(b).toString("base64url"), base64Encode: (t) => Buffer.from(String(t)).toString("base64"), Charset: { UTF_8: "utf8" } },
    MailApp: { sendEmail: (o) => { if (ctx.fallarCorreo) throw new Error("x"); correos.push(o); } },
    Session: { getEffectiveUser: () => { if (ctx.fallarSesion) throw new Error("Sin permiso para Session.getEffectiveUser"); return { getEmail: () => ctx.cuenta || "pokedekestore@gmail.com" }; } },
    ScriptApp: { WeekDay: { SUNDAY: "SUNDAY" }, getProjectTriggers: () => activadores.slice(), deleteTrigger: (a) => activadores.splice(activadores.indexOf(a), 1), newTrigger: (f) => { const crear = { create: () => activadores.push({ getHandlerFunction: () => f }) }; return { forSpreadsheet: () => ({ onEdit: () => crear }), timeBased: () => ({ everyHours: () => crear, everyMinutes: () => crear, onWeekDay: () => ({ atHour: () => crear }) }) }; } },
    UrlFetchApp: { fetch: (url, opciones) => (url.startsWith("https://api.github.com/") ? ctx.githubFalso(url, opciones || {}) : url.startsWith("https://challenges.cloudflare.com/") ? ctx.turnstileFalso(url, opciones || {}) : url.endsWith("/sincronizado.json") ? ctx.paginaFalsa(url) : url.startsWith("https://api.hacienda.go.cr/") ? ctx.cambioFalso(url) : ctx.paypalFalso(url, opciones || {})) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => (k in propiedades ? propiedades[k] : null), setProperty: (k, v) => { propiedades[k] = v; }, getProperties: () => ({ ...propiedades }), deleteProperty: (k) => { delete propiedades[k]; } }) },
  };
  // GitHub falso: anota cada vez que la hoja pide rearmar la página.
  ctx.github = { llamadas: [], codigo: 204 };
  ctx.githubFalso = (url, opciones) => { ctx.github.llamadas.push({ url, opciones }); return { getResponseCode: () => ctx.github.codigo, getContentText: () => "" }; };
  // Cloudflare falso: solo da por buena la prueba "humano" con el secreto correcto.
  ctx.turnstile = { llamadas: [], caido: false };
  ctx.turnstileFalso = (url, opciones) => { ctx.turnstile.llamadas.push(opciones.payload); if (ctx.turnstile.caido) throw new Error("sin red"); const bien = opciones.payload.secret === "secreto-turnstile" && opciones.payload.response === "humano"; return { getResponseCode: () => 200, getContentText: () => JSON.stringify({ success: bien }) }; };
  // La página falsa: lo que dice public/sincronizado.json.
  ctx.pagina = { datos: null, llamadas: 0 };
  ctx.paginaFalsa = () => { ctx.pagina.llamadas += 1; return { getResponseCode: () => (ctx.pagina.datos ? 200 : 404), getContentText: () => JSON.stringify(ctx.pagina.datos || {}) }; };
  // Tipo de cambio falso del Banco Central (como lo publica Hacienda).
  ctx.cambio = { venta: 448.34, compra: 442.56, caido: false, llamadas: 0 };
  ctx.cambioFalso = () => { ctx.cambio.llamadas += 1; if (ctx.cambio.caido) throw new Error("sin red"); return { getResponseCode: () => 200, getContentText: () => JSON.stringify({ venta: { fecha: "2026-11-14", valor: ctx.cambio.venta }, compra: { fecha: "2026-11-14", valor: ctx.cambio.compra } }) }; };
  ctx.olvidarCambio = () => { delete cache["tipo-cambio"]; };
  // PayPal falso: guarda las órdenes creadas y responde como la API real.
  const ordenes = {};
  ctx.paypal = { ordenes, llamadas: [], cobrarDistinto: false, estadoCaptura: "COMPLETED" };
  ctx.paypalFalso = (url, opciones) => {
    const respuesta = (codigo, datos) => ({ getResponseCode: () => codigo, getContentText: () => JSON.stringify(datos) });
    ctx.paypal.llamadas.push(url);
    if (url.endsWith("/v1/oauth2/token")) return respuesta(200, { access_token: "token-falso", expires_in: 32400 });
    if (url.endsWith("/v2/checkout/orders") && opciones.method === "post") {
      const cuerpo = JSON.parse(opciones.payload);
      const id = "ORDEN" + (Object.keys(ordenes).length + 1) + "ABCDEFG";
      ordenes[id] = cuerpo.purchase_units[0];
      return respuesta(201, { id, status: "CREATED" });
    }
    const captura = url.match(/\/v2\/checkout\/orders\/([A-Z0-9]+)\/capture$/);
    if (captura) {
      const unidad = ordenes[captura[1]];
      if (!unidad) return respuesta(404, { name: "RESOURCE_NOT_FOUND" });
      const valor = ctx.paypal.cobrarDistinto ? "1.00" : unidad.amount.value;
      return respuesta(201, { id: captura[1], status: "COMPLETED", purchase_units: [{ reference_id: unidad.reference_id, payments: { captures: [{ id: "CAPTURA" + captura[1], status: ctx.paypal.estadoCaptura, custom_id: unidad.custom_id, amount: { currency_code: "USD", value: valor }, seller_receivable_breakdown: { paypal_fee: { value: (Number(valor) * 0.054 + 0.3).toFixed(2) }, net_amount: { value: (Number(valor) * 0.946 - 0.3).toFixed(2) } } }] } }] });
    }
    if (url.includes("/v1/identity/oauth2/userinfo")) return respuesta(200, { user_id: "x" });
    return respuesta(404, {});
  };
  ctx.ponerLlavesPaypal = () => { propiedades.PAYPAL_CLIENT_ID = "cliente-prueba"; propiedades.PAYPAL_SECRET = "secreto-prueba"; propiedades.PAYPAL_MODO = "sandbox"; };
  if (process.env.PAYPAL_FALSO) ctx.ponerLlavesPaypal();
  vm.createContext(ctx); vm.runInContext(CODIGO, ctx);
  const post = (d) => JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify(d) } }).t);
  const get = (p) => ctx.doGet({ parameter: p });
  return { ctx, hojas, correos, post, get, activadores, copias, propiedades };
}


module.exports = { nuevaHoja };
