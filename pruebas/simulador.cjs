// Simulador mínimo de Apps Script para probar Pedidos.gs sin tocar la hoja real.
const fs = require("fs");
const vm = require("vm");
const assert = require("assert");

const ruta = process.argv[2];
const codigo = fs.readFileSync(ruta, "utf8");

function nuevaPestana(nombre, id, filas) {
  // filas: arreglo de arreglos, fila 1 = índice 0.
  const datos = filas.map((f) => f.slice());
  const pestana = {
    datos,
    getName: () => nombre,
    getSheetId: () => id,
    getLastColumn: () => Math.max(...filas.map((fila) => fila.length)),
    getLastRow: () => {
      for (let i = datos.length - 1; i >= 0; i -= 1) {
        if ((datos[i] || []).some((v) => v !== "" && v !== undefined && v !== null)) return i + 1;
      }
      return 0;
    },
    getMaxRows: () => Math.max(datos.length, 1000),
    appendRow: (valores) => {
      const ultima = pestana.getLastRow();
      datos[ultima] = valores.map((v) => (typeof v === "string" ? v.replace(/^'/, "") : v));
    },
    getRange: (fila, col, nf = 1, nc = 1) => ({
      getValues: () =>
        Array.from({ length: nf }, (_, i) =>
          Array.from({ length: nc }, (_, j) => {
            const v = (datos[fila - 1 + i] || [])[col - 1 + j];
            return v === undefined ? "" : v;
          }),
        ),
      getDisplayValues() {
        return this.getValues().map((f) => f.map(String));
      },
      getValue: () => {
        const v = (datos[fila - 1] || [])[col - 1];
        return v === undefined ? "" : v;
      },
      setValues: (valores) =>
        valores.forEach((f, i) =>
          f.forEach((v, j) => {
            datos[fila - 1 + i] = datos[fila - 1 + i] || [];
            datos[fila - 1 + i][col - 1 + j] = typeof v === "string" ? v.replace(/^'/, "") : v;
          }),
        ),
      setValue: (v) => {
        datos[fila - 1] = datos[fila - 1] || [];
        datos[fila - 1][col - 1] = v;
      },
      getSheet: () => pestana,
      getColumn: () => col,
      getRow: () => fila,
      getNumRows: () => nf,
    }),
  };
  return pestana;
}

const encabezado = (titulo, columnas) => [[titulo], ["descripción"], [], columnas];

const CATALOGO_COLUMNAS = [
  "ID", "Producto", "Categoría", "Juego", "Idioma", "En stock", "Vendidas", "Precio sugerido (₡)",
  "Precio de venta (₡)", "Nombre para mostrar", "Descripción", "Fotos (URL)", "Publicado (sí/no)",
  "Destacado (sí/no)", "Etiqueta", "Llega (preventas)", "Peso (g)",
];
const catalogo = nuevaPestana("Catálogo web", 7, [
  ...encabezado("Catálogo", CATALOGO_COLUMNAS),
  ["C1", "ETB Destined Rivals", "ETB", "Pokémon", "Inglés", 0, 2, 53500, 53500, "", "", "", "sí", "", "", "", ""],
  ["C2", "Lopunny Poké Ball #084 (Prismatic Evolutions)", "Carta suelta (single)", "Pokémon", "Inglés", 1, 0, 500, 500, "", "", "", "sí", "", "", "", ""],
  ["C3", "Booster Bundle Delta Reign", "Booster bundle", "Pokémon", "Inglés", 2, 0, 19000, 19000, "", "", "", "sí", "", "", "", ""],
]);

const TOTAL = 21;
const filaPedido = (numero, estado, correo, extra = {}) => {
  const f = Array(TOTAL).fill("");
  f[0] = numero;
  f[1] = new Date(Date.now() - 3600 * 1000);
  f[2] = estado;
  f[3] = "Ana Pérez";
  f[4] = "8888-1234";
  f[5] = "Correos de Costa Rica";
  f[7] = 19000;
  f[11] = correo;
  f[19] = JSON.stringify({ lineas: [{ slug: extra.slug || "booster-bundle-delta-reign", nombre: "Booster Bundle Delta Reign", cantidad: extra.cantidad || 1, precio: 19000 }], subtotal: 19000, descuento: 0 });
  f[20] = "clave-" + numero;
  return f;
};
const pedidos = nuevaPestana("Pedidos web", 8, [
  ...encabezado("Pedidos", Array(TOTAL).fill("t")),
  filaPedido("PD-0001", "Entregado", "ana@example.com"),
  // Apartado vigente: deja el bundle con 1 libre de 2.
  filaPedido("PD-0002", "Pendiente de pago", "beto@example.com"),
]);
const comentarios = nuevaPestana("Comentarios", 12, encabezado("Comentarios", ["Fecha", "Calificación", "Comentario", "Nombre", "Contacto", "Permiso", "Publicar", "Pedido"]));
const avisos = nuevaPestana("Avisos de stock", 13, encabezado("Avisos", ["Fecha", "Producto", "Nombre", "Contacto", "Estado", "Avisado el", "Slug"]));
const vistos = nuevaPestana("Lo más visto", 14, encabezado("Lo más visto", ["Producto", "Vistas", "Agregados", "Última", "Slug"]));
const pestanas = [catalogo, pedidos, comentarios, avisos, vistos];

const correos = [];
const toasts = [];
const memoria = new Map();
const propiedades = new Map();
const libro = {
  getSheetByName: (n) => pestanas.find((p) => p.getName() === n) || null,
  getUrl: () => "https://docs.google.com/spreadsheets/d/x/edit",
  getSpreadsheetTimeZone: () => "America/Costa_Rica",
  toast: (t) => toasts.push(t),
};
let cuenta = "pokedekestore@gmail.com";
let horaFalsa = null;

const contexto = {
  console,
  JSON, Date, Math, Object, Array, String, Number, Boolean, RegExp, Set, Map, encodeURIComponent, Error,
  SpreadsheetApp: { getActiveSpreadsheet: () => libro, flush: () => {} },
  LockService: { getDocumentLock: () => ({ waitLock: () => {}, tryLock: () => true, releaseLock: () => {} }) },
  CacheService: {
    getScriptCache: () => ({
      get: (k) => (memoria.has(k) ? memoria.get(k) : null),
      put: (k, v) => memoria.set(k, v),
      removeAll: (ks) => ks.forEach((k) => memoria.delete(k)),
    }),
  },
  PropertiesService: {
    getScriptProperties: () => ({
      getProperty: (k) => (propiedades.has(k) ? propiedades.get(k) : null),
      setProperty: (k, v) => propiedades.set(k, v),
      getProperties: () => Object.fromEntries(propiedades),
      deleteProperty: (k) => propiedades.delete(k),
    }),
  },
  MailApp: { sendEmail: (o) => correos.push(o) },
  Session: { getEffectiveUser: () => ({ getEmail: () => cuenta }) },
  ScriptApp: { getProjectTriggers: () => [], deleteTrigger: () => {}, newTrigger: () => ({ forSpreadsheet: () => ({ onEdit: () => ({ create: () => {} }) }), timeBased: () => ({ everyHours: () => ({ create: () => {} }) }) }) },
  ContentService: { createTextOutput: (t) => ({ texto: t, setMimeType() { return this; } }), MimeType: { JSON: "json", CSV: "csv" } },
  Utilities: {
    formatDate: (fecha, zona, formato) => {
      if (formato === "H") return String(horaFalsa ?? 12);
      const d = new Date(fecha);
      if (formato === "yyyy-MM-dd") return d.toISOString().slice(0, 10);
      if (formato === "yyyyMMddHH") return d.toISOString().slice(0, 13).replace(/\D/g, "");
      return d.toISOString();
    },
    getUuid: () => "uuid",
    computeDigest: () => [1, 2, 3],
    base64EncodeWebSafe: () => "v1",
    DigestAlgorithm: { MD5: "md5" },
  },
};
vm.createContext(contexto);
vm.runInContext(codigo + "\n;globalThis.__ = { doPost, doGet, revisarAvisos, alEditarHoja, tareasCadaHora, pedirOpiniones, VERSION };", contexto);
const g = contexto.__;
const post = (datos) => JSON.parse(g.doPost({ postData: { contents: JSON.stringify(datos) } }).texto);
const get = (p) => JSON.parse(g.doGet({ parameter: p }).texto);

const igual = (a, b) => assert.strictEqual(JSON.stringify(a), JSON.stringify(b));
let pruebas = 0;
const prueba = (nombre, fn) => {
  fn();
  pruebas += 1;
  console.log("✓", nombre);
};

prueba("versión", () => assert.strictEqual(get({}).version, g.VERSION));

prueba("aviso: producto que no existe", () => {
  const r = post({ accion: "aviso", slug: "no-existe", nombre: "Ana", contacto: "ana@example.com" });
  assert.strictEqual(r.ok, false);
});
prueba("aviso: contacto inválido", () => {
  const r = post({ accion: "aviso", slug: "etb-destined-rivals", nombre: "Ana", contacto: "123" });
  assert.strictEqual(r.ok, false);
  assert.match(r.error, /WhatsApp de 8/);
});
prueba("aviso por correo y por WhatsApp, sin repetir", () => {
  assert.strictEqual(post({ accion: "aviso", slug: "etb-destined-rivals", nombre: "Carla Mora", contacto: "Carla@Example.com" }).ok, true);
  assert.strictEqual(post({ accion: "aviso", slug: "etb-destined-rivals", nombre: "Carla Mora", contacto: "carla@example.com" }).ok, true);
  assert.strictEqual(post({ accion: "aviso", slug: "etb-destined-rivals", nombre: "Dani", contacto: "+506 7777 1234" }).ok, true);
  const filas = avisos.datos.slice(4).filter((f) => f && f[0]);
  assert.strictEqual(filas.length, 2);
  assert.strictEqual(filas[0][3], "carla@example.com");
  assert.strictEqual(filas[1][3], "7777-1234");
  assert.strictEqual(filas[0][4], "Esperando");
  assert.strictEqual(filas[0][6], "etb-destined-rivals");
});
prueba("sin stock no avisa", () => {
  correos.length = 0;
  g.revisarAvisos();
  assert.strictEqual(correos.length, 0);
  assert.strictEqual(avisos.datos[4][4], "Esperando");
});
prueba("aviso del bundle con 1 libre (2 en stock, 1 apartado) avisa", () => {
  post({ accion: "aviso", slug: "booster-bundle-delta-reign", nombre: "", contacto: "eva@example.com" });
  correos.length = 0;
  g.revisarAvisos();
  const fila = avisos.datos[6];
  assert.strictEqual(fila[4], "Avisado por correo");
  assert.strictEqual(correos.length, 1);
  assert.strictEqual(correos[0].to, "eva@example.com");
  assert.strictEqual(correos[0].replyTo, "sac@pokedeke.store");
  assert.match(correos[0].subject, /Volvió Booster Bundle Delta Reign/);
  assert.match(correos[0].htmlBody, /producto\/booster-bundle-delta-reign/);
});
prueba("vuelve la ETB: correo a Carla y botón de WhatsApp a la tienda", () => {
  catalogo.datos[4][5] = 1;
  correos.length = 0;
  g.alEditarHoja({ range: catalogo.getRange(5, 6), value: "1" });
  assert.strictEqual(avisos.datos[4][4], "Avisado por correo");
  assert.strictEqual(avisos.datos[5][4], "Avisale por WhatsApp");
  assert.ok(avisos.datos[5][5] instanceof Date);
  const aCarla = correos.find((c) => c.to === "carla@example.com");
  assert.ok(aCarla);
  assert.match(aCarla.body, /¡Hola Carla!/);
  const aTienda = correos.find((c) => c.to === "pokedekestore@gmail.com");
  assert.ok(aTienda);
  assert.match(aTienda.htmlBody, /wa\.me\/50677771234\?text=/);
  correos.length = 0;
  g.revisarAvisos();
  assert.strictEqual(correos.length, 0, "no repite");
});
prueba("con otra cuenta no le escribe al cliente y sigue esperando", () => {
  catalogo.datos[4][5] = 0;
  post({ accion: "aviso", slug: "etb-destined-rivals", nombre: "Fer", contacto: "fer@example.com" });
  catalogo.datos[4][5] = 1;
  cuenta = "personal@gmail.com";
  correos.length = 0;
  g.revisarAvisos();
  assert.strictEqual(correos.length, 0);
  assert.strictEqual(avisos.datos[7][4], "Esperando");
  cuenta = "pokedekestore@gmail.com";
});

prueba("vistas y carrito", () => {
  post({ accion: "visto", slug: "lopunny-poke-ball-084-prismatic-evolutions", tipo: "vista" });
  post({ accion: "visto", slug: "lopunny-poke-ball-084-prismatic-evolutions", tipo: "vista" });
  post({ accion: "visto", slug: "booster-bundle-delta-reign", tipo: "vista" });
  post({ accion: "visto", slug: "booster-bundle-delta-reign", tipo: "carrito" });
  assert.strictEqual(post({ accion: "visto", slug: "inventado", tipo: "vista" }).ok, false);
  assert.strictEqual(post({ accion: "visto", slug: "booster-bundle-delta-reign", tipo: "otro" }).ok, false);
  const filas = vistos.datos.slice(4).filter((f) => f && f[0]);
  assert.strictEqual(filas.length, 2);
  igual(filas[0].slice(0, 3), ["Lopunny Poké Ball #084 (Prismatic Evolutions)", 2, 0]);
  igual(filas[1].slice(0, 3), ["Booster Bundle Delta Reign", 1, 1]);
  const extras = get({ accion: "extras" });
  igual(extras.masVistos.map((m) => m.slug), ["booster-bundle-delta-reign", "lopunny-poke-ball-084-prismatic-evolutions"]);
});

prueba("comentario con pedido verificado y sin publicar", () => {
  assert.strictEqual(post({ accion: "comentario", calificacion: 5, comentario: "Todo llegó perfecto", nombre: "Ana Pérez", contacto: "", pedido: "pd-0001", clave: "clave-PD-0001", permiso: true }).ok, true);
  assert.strictEqual(post({ accion: "comentario", calificacion: 4, comentario: "Clave mala", nombre: "X", contacto: "", pedido: "PD-0001", clave: "otra" }).ok, true);
  assert.strictEqual(comentarios.datos[4][7], "PD-0001");
  assert.strictEqual(comentarios.datos[4][5], "sí");
  assert.strictEqual(comentarios.datos[5][7], "");
  assert.strictEqual(comentarios.datos[5][5], "no");
  igual(get({ accion: "extras" }).opiniones, []);
  comentarios.datos[5][6] = "sí";
  igual(get({ accion: "extras" }).opiniones, [], "sin permiso no sale aunque digan Publicar");
  comentarios.datos[4][6] = "sí";
  const ops = get({ accion: "extras" }).opiniones;
  assert.strictEqual(ops.length, 1);
  igual({ ...ops[0], fecha: "" }, { fecha: "", estrellas: 5, comentario: "Todo llegó perfecto", nombre: "Ana", compra: true });
});

prueba("Entregado programa la opinión y se manda a los 2 días, de día", () => {
  correos.length = 0;
  g.alEditarHoja({ range: pedidos.getRange(5, 3), value: "Entregado" });
  assert.ok(propiedades.has("opinion:PD-0001"));
  assert.match(toasts.at(-1), /2 días/);
  assert.strictEqual(correos.length, 1, "la edición también revisó los avisos: Fer seguía esperando");
  assert.strictEqual(correos[0].to, "fer@example.com");
  correos.length = 0;
  g.pedirOpiniones();
  assert.strictEqual(correos.length, 0, "todavía no");
  propiedades.set("opinion:PD-0001", String(Date.now() - 3 * 24 * 3600 * 1000));
  horaFalsa = 22;
  g.pedirOpiniones();
  assert.strictEqual(correos.length, 0, "de noche no");
  horaFalsa = 10;
  g.tareasCadaHora();
  assert.strictEqual(correos.length, 1);
  assert.strictEqual(correos[0].to, "ana@example.com");
  assert.match(correos[0].htmlBody, /comentarios\?pedido=PD-0001&amp;clave=clave-PD-0001/);
  assert.ok(!propiedades.has("opinion:PD-0001"));
});
prueba("si la opinión la intenta otra cuenta, no se pierde: sale con la de la tienda", () => {
  correos.length = 0;
  pedidos.datos[4][2] = "Entregado";
  propiedades.set("opinion:PD-0001", String(Date.now() - 3 * 24 * 3600 * 1000));
  horaFalsa = 10;
  cuenta = "personal@gmail.com";
  g.pedirOpiniones();
  assert.strictEqual(correos.length, 0, "desde la cuenta personal no se le escribe al cliente");
  assert.ok(propiedades.has("opinion:PD-0001"), "queda pendiente para la próxima hora");
  cuenta = "pokedekestore@gmail.com";
  g.pedirOpiniones();
  assert.strictEqual(correos.length, 1);
  assert.strictEqual(correos[0].to, "ana@example.com");
  assert.ok(!propiedades.has("opinion:PD-0001"));
  cuenta = "personal@gmail.com";
  propiedades.set("opinion:PD-0001", String(Date.now() - 10 * 24 * 3600 * 1000));
  g.pedirOpiniones();
  assert.ok(!propiedades.has("opinion:PD-0001"), "después de una semana se deja");
  cuenta = "pokedekestore@gmail.com";
});
prueba("si cambió a Cancelado no pide opinión", () => {
  correos.length = 0;
  propiedades.set("opinion:PD-0002", String(Date.now() - 3 * 24 * 3600 * 1000));
  g.pedirOpiniones();
  assert.strictEqual(correos.length, 0);
  assert.ok(!propiedades.has("opinion:PD-0002"));
});

console.log(`\n${pruebas} pruebas bien.`);
