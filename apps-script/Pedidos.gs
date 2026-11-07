/**
 * Servidor de Pokedeke. Vive adentro de la hoja "Control del negocio TCG",
 * en Extensiones > Apps Script. Hace cuatro cosas:
 *
 * 1. Recibe los pedidos de la página y los anota en "Pedidos web".
 * 2. Avisa por correo cuando entra un pedido o un comprobante, y le escribe al
 *    cliente al hacer el pedido y al confirmarse el pago.
 * 3. Cuando el Estado de un pedido pasa a "Pagado", anota la venta en "Ventas".
 * 4. Le entrega a GitHub el catálogo, a la página el stock en vivo y a cada
 *    cliente el estado de su pedido.
 *
 * Los precios y el stock siempre se leen de la hoja: lo que manda el navegador
 * nunca se usa para calcular cuánto se cobra.
 *
 * Todo corre con la cuenta de la tienda: la implementación se crea desde esa
 * cuenta y ahí mismo se corre instalarAvisos() una vez.
 */

const CONFIG = {
  correoAvisos: "pokedekestore@gmail.com",
  nombreTienda: "Pokedeke",
  canal: "Página web",
  metodoPago: "SINPE Móvil",
  sinpe: "8781-2831",
  whatsapp: "50687812831",
  // Dirección de la página: si cambia, hay que cambiarla aquí. Los correos sacan
  // de aquí las imágenes y el enlace para ver el pedido.
  sitio: "https://sebastianocampocr.github.io/pokedeke/",
  horasApartado: 24,
  adelantoPreventa: 0.5,
  envioGratisDesde: 50000,
  maxLlamadasPorHora: 60,
  maxLineasPorPedido: 100,
  // Estos valores deben coincidir con lib/tienda.ts.
  envios: {
    correos: { nombre: "Correos de Costa Rica", pideDireccion: true },
    "retiro-omni": { nombre: "Retiro en Edificio Omni", pideDireccion: false },
  },
  // EMS Nacional Paquetes saliendo de la GAM, con IVA. correos.go.cr/servicio-ems
  tarifaCorreos: {
    gam: { primerKilo: 2450, kiloAdicional: 1400 },
    resto: { primerKilo: 3350, kiloAdicional: 1550 },
  },
  pesoEmpaque: 100,
  cantonesGam: {
    "San José": ["Central", "Escazú", "Desamparados", "Aserrí", "Mora", "Goicoechea", "Santa Ana", "Alajuelita", "Vázquez De Coronado", "Tibás", "Moravia", "Montes De Oca", "Curridabat"],
    Alajuela: ["Central", "Atenas", "Poás"],
    Cartago: ["Central", "Paraíso", "La Unión", "Alvarado", "Oreamuno", "El Guarco"],
    Heredia: ["Central", "Barva", "Santo Domingo", "Santa Barbara", "San Rafael", "San Isidro", "Belén", "Flores", "San Pablo"],
  },
  // Gramos estimados: se usan solo si la columna Peso (g) de Catálogo web está vacía.
  pesos: {
    "Carta suelta (single)": 30,
    "Carta gradada": 150,
    "Booster pack": 30,
    "Blister / sleeved booster": 80,
    "Booster bundle": 200,
    "Tin o caja de colección": 400,
    ETB: 800,
    "Booster box": 800,
    "Colección premium / UPC": 2500,
    Mazos: 200,
    "Sleeves y fundas": 150,
    Accesorios: 200,
  },
  pesoSinCategoria: 300,
  // Apagados hasta decidir las promociones. Deben coincidir con lib/tienda.ts.
  cupones: {},
  // Precio especial por llevar varias unidades de un grupo. Entran los productos
  // cuyo enlace calza con `slug`. Solo baja precios: lo que ya cuesta menos o está
  // en preventa queda por fuera. La página muestra la oferta solo cuando este
  // script la anuncia, así que no hay que copiarla en lib/tienda.ts.
  ofertasPorCantidad: [
    {
      nombre: "Pikachus de 30th Celebration",
      slug: /^pikachu-\d+-30th-celebration$/,
      // Lo que la página escribe en el buscador para mostrarlos.
      buscar: "Pikachu",
      desde: 5,
      precio: 750,
    },
  ],
};

const HOJAS = {
  pedidos: "Pedidos web",
  catalogo: "Catálogo web",
  compras: "Compras",
  ventas: "Ventas",
  interesados: "Interesados",
};

const PRIMERA_FILA = 5;
const PENDIENTE = "Pendiente de pago";
const PAGADO = "Pagado";
const CLAVE_STOCK = "stock-vivo";
const CLAVE_VERSION = "stock-version";
// Todo pedido y toda edición de la hoja borran esta memoria, así que no atrasa nada.
const SEGUNDOS_STOCK = 60;

// Columnas de "Pedidos web", contando desde 1.
const COL = {
  numero: 1,
  fecha: 2,
  estado: 3,
  cliente: 4,
  whatsapp: 5,
  envio: 6,
  comprobante: 7,
  total: 8,
  productos: 9,
  ubicacion: 10,
  direccion: 11,
  correo: 12,
  subtotal: 13,
  descuento: 14,
  costoEnvio: 15,
  metodoPago: 16,
  guia: 17,
  notas: 18,
  enVentas: 19,
  detalle: 20,
  clave: 21,
};
const TOTAL_COLUMNAS = 21;

function libro() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function hoja(nombre) {
  return libro().getSheetByName(nombre);
}

/* ---------- Puertas de entrada ---------- */

function doGet(e) {
  const parametros = (e && e.parameter) || {};
  if (parametros.accion === "catalogo") {
    return ContentService.createTextOutput(catalogoEnCsv()).setMimeType(
      ContentService.MimeType.CSV,
    );
  }
  if (parametros.accion === "stock") {
    return ContentService.createTextOutput(stockEnVivo(parametros.version)).setMimeType(
      ContentService.MimeType.JSON,
    );
  }
  if (parametros.accion === "estado") {
    return responder(consultarPedido(parametros));
  }
  return responder({ ok: true, tienda: CONFIG.nombreTienda });
}

function doPost(e) {
  try {
    const datos = JSON.parse(e.postData.contents);
    // Campo escondido del formulario: solo los robots lo llenan.
    if (datos.sitio) return responder({ ok: true });

    const acciones = {
      pedido: crearPedido,
      comprobante: guardarComprobante,
      interesado: guardarInteresado,
    };
    const accion = acciones[datos.accion];
    if (!accion) return responder({ ok: false, error: "Acción desconocida." });
    if (!hayCupo()) {
      return responder({
        ok: false,
        error: "Estamos recibiendo muchos pedidos. Intentá en un rato.",
      });
    }
    return responder(conCandado(() => accion(datos)));
  } catch (error) {
    console.error(error);
    return responder({
      ok: false,
      error: "No pudimos guardar tu pedido. Intentá otra vez.",
    });
  }
}

function responder(datos) {
  return ContentService.createTextOutput(JSON.stringify(datos)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

/** Evita que dos personas escriban al mismo tiempo en la hoja. */
function conCandado(tarea) {
  const candado = LockService.getDocumentLock();
  candado.waitLock(20000);
  try {
    return tarea();
  } finally {
    SpreadsheetApp.flush();
    candado.releaseLock();
  }
}

/** Frena a quien mande pedidos falsos sin parar. */
function hayCupo() {
  const memoria = CacheService.getScriptCache();
  const hora = Utilities.formatDate(new Date(), "UTC", "yyyyMMddHH");
  const clave = "pedidos-" + hora;
  const cuenta = Number(memoria.get(clave) || 0);
  if (cuenta >= CONFIG.maxLlamadasPorHora) return false;
  memoria.put(clave, String(cuenta + 1), 3700);
  return true;
}

/**
 * Lo que de verdad se puede comprar ahora: stock menos lo apartado. Se guarda un
 * rato para que muchas visitas no lean la hoja al mismo tiempo. Si la página ya
 * tiene esta versión, responde "igual" y evita repetir todo el inventario.
 */
function stockEnVivo(versionDeLaPagina) {
  const memoria = CacheService.getScriptCache();
  const guardada = memoria.get(CLAVE_VERSION);
  const guardado = guardada ? memoria.get(CLAVE_STOCK) : null;
  if (guardado) return respuestaDeStock(guardado, guardada, versionDeLaPagina);

  const reservado = apartados(filasDePedidos());
  const todos = productosPorSlug();
  const productos = {};
  Object.values(todos).forEach((producto) => {
    productos[producto.slug] = {
      stock: Math.max(producto.stock - (reservado[producto.slug] || 0), 0),
      precio: producto.precio,
      peso: producto.peso,
    };
  });
  const ofertas = ofertasVigentes(todos);
  const contenido = JSON.stringify({ productos, ofertas });
  const version = Utilities.base64EncodeWebSafe(
    Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, contenido),
  );
  const respuesta = JSON.stringify({ ok: true, version, productos, ofertas });
  try {
    memoria.put(CLAVE_STOCK, respuesta, SEGUNDOS_STOCK);
    memoria.put(CLAVE_VERSION, version, SEGUNDOS_STOCK);
  } catch (error) {
    // Google guarda hasta 100 KB. Sin memoria funciona igual, solo que más lento.
    console.error(error);
  }
  return respuestaDeStock(respuesta, version, versionDeLaPagina);
}

function respuestaDeStock(respuesta, version, versionDeLaPagina) {
  return version === versionDeLaPagina ? '{"ok":true,"igual":true}' : respuesta;
}

function olvidarStock() {
  CacheService.getScriptCache().removeAll([CLAVE_STOCK, CLAVE_VERSION]);
}

/* ---------- Limpieza de lo que escribe la gente ---------- */

function texto(valor, maximo) {
  return String(valor === null || valor === undefined ? "" : valor)
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .trim()
    .slice(0, maximo);
}

/**
 * El apóstrofe hace que la hoja lo guarde como texto. Sin esto, alguien podría
 * escribir una fórmula como nombre y la hoja la ejecutaría.
 */
function comoTexto(valor) {
  return valor ? "'" + valor : "";
}

function sinApostrofe(valor) {
  return String(valor).replace(/^'/, "");
}

function soloDigitos(valor) {
  return String(valor === null || valor === undefined ? "" : valor).replace(/\D/g, "");
}

/** 88881234, 8888-1234 y +506 8888 1234 son el mismo número. */
function normalizarWhatsapp(valor) {
  const digitos = soloDigitos(valor);
  const local = digitos.length === 11 && digitos.startsWith("506") ? digitos.slice(3) : digitos;
  if (local.length !== 8) return "";
  return local.slice(0, 4) + "-" + local.slice(4);
}

function aSlug(valor) {
  return String(valor)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function colones(monto) {
  return "₡" + String(Math.round(monto)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/* ---------- Catálogo ---------- */

function filasDeCatalogo() {
  const pestana = hoja(HOJAS.catalogo);
  const ultima = pestana.getLastRow();
  const crudo = pestana.getRange(4, 1, Math.max(ultima - 3, 1), 17).getValues();
  const titulos = crudo[0].map((titulo) => String(titulo).trim());
  return crudo
    .slice(1)
    .map((fila) => Object.fromEntries(titulos.map((titulo, i) => [titulo, fila[i]])))
    .filter((fila) => fila.ID && fila.Producto);
}

function catalogoEnCsv() {
  const pestana = hoja(HOJAS.catalogo);
  const ultima = pestana.getLastRow();
  return pestana
    .getRange(4, 1, Math.max(ultima - 3, 1), 16)
    .getDisplayValues()
    .filter((fila, indice) => indice === 0 || fila[0])
    .map((fila) =>
      fila.map((celda) => '"' + String(celda).replace(/"/g, '""') + '"').join(","),
    )
    .join("\n");
}

/** Debe agrupar igual que scripts/traer-catalogo.mjs. */
function productosPorSlug() {
  const grupos = {};
  filasDeCatalogo().forEach((fila) => {
    const juego = String(fila.Juego).normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
    if (juego.trim() !== "pokemon") return;
    if (/^no$/i.test(String(fila["Publicado (sí/no)"]).trim())) return;

    const slug = aSlug(fila.Producto);
    const grupo = grupos[slug] || { slug, nombre: fila.Producto, stock: 0, lotes: [] };
    grupo.stock += Math.max(Number(fila["En stock"]) || 0, 0);
    grupo.lotes.push(fila);
    grupos[slug] = grupo;
  });

  Object.values(grupos).forEach((grupo) => {
    const recientes = grupo.lotes.slice().reverse();
    const ultimo = (columna) =>
      recientes.map((lote) => lote[columna]).find((valor) => valor !== "" && valor !== 0);
    const preventa = ultimo("Etiqueta") === "Preventa";
    const precio = Number(ultimo("Precio de venta (₡)") || ultimo("Precio sugerido (₡)")) || 0;
    grupo.nombre = String(ultimo("Nombre para mostrar") || grupo.nombre);
    grupo.preventa = preventa;
    grupo.precio = precio;
    grupo.precioCobrado = preventa ? Math.round(precio * CONFIG.adelantoPreventa) : precio;
    grupo.peso =
      Number(ultimo("Peso (g)")) ||
      CONFIG.pesos[ultimo("Categoría")] ||
      CONFIG.pesoSinCategoria;
  });
  return grupos;
}

/** Lo que sigue apartado por pedidos sin pagar que todavía están en plazo. */
function apartados(filasPedidos) {
  const limite = Date.now() - CONFIG.horasApartado * 3600 * 1000;
  const cuenta = {};
  filasPedidos.forEach((fila) => {
    if (fila[COL.estado - 1] !== PENDIENTE) return;
    if (new Date(fila[COL.fecha - 1]).getTime() < limite) return;
    leerDetalle(fila).lineas.forEach((linea) => {
      cuenta[linea.slug] = (cuenta[linea.slug] || 0) + linea.cantidad;
    });
  });
  return cuenta;
}

function leerDetalle(fila) {
  try {
    return JSON.parse(sinApostrofe(fila[COL.detalle - 1]));
  } catch (error) {
    return { lineas: [], descuento: 0, subtotal: 0 };
  }
}

/* ---------- Pedidos ---------- */

function leerPedidos() {
  const pestana = hoja(HOJAS.pedidos);
  const ultima = pestana.getLastRow();
  if (ultima < PRIMERA_FILA) return [];
  return pestana
    .getRange(PRIMERA_FILA, 1, ultima - PRIMERA_FILA + 1, TOTAL_COLUMNAS)
    .getValues()
    .map((fila, indice) => ({ fila, numeroFila: indice + PRIMERA_FILA }))
    .filter(({ fila }) => fila[COL.numero - 1]);
}

function filasDePedidos() {
  return leerPedidos().map(({ fila }) => fila);
}

function siguienteNumero(filas) {
  const mayor = filas.reduce((maximo, fila) => {
    const numero = Number(soloDigitos(fila[COL.numero - 1]));
    return numero > maximo ? numero : maximo;
  }, 0);
  return "TCG-" + String(mayor + 1).padStart(4, "0");
}

function calcularDescuento(codigo, subtotal) {
  const cupon = CONFIG.cupones[texto(codigo, 30).toUpperCase()];
  if (!cupon) return 0;
  return cupon.tipo === "porcentaje"
    ? Math.round((subtotal * cupon.valor) / 100)
    : Math.min(cupon.valor, subtotal);
}

/** Cada oferta con los productos que entran hoy. Las que no tienen ninguno no salen. */
function ofertasVigentes(productos) {
  return CONFIG.ofertasPorCantidad
    .map((oferta) => ({
      nombre: oferta.nombre,
      buscar: oferta.buscar || "",
      desde: oferta.desde,
      precio: oferta.precio,
      slugs: Object.values(productos)
        .filter(
          (producto) =>
            oferta.slug.test(producto.slug) &&
            !producto.preventa &&
            producto.precioCobrado > oferta.precio,
        )
        .map((producto) => producto.slug),
    }))
    .filter((oferta) => oferta.slugs.length > 0);
}

/**
 * Si el pedido junta las unidades que pide una oferta, cada una baja al precio de
 * la oferta. Debe calcular igual que aplicarOfertas en lib/carrito.ts.
 */
function aplicarOfertas(lineas, ofertas) {
  ofertas.forEach((oferta) => {
    const delGrupo = lineas.filter((linea) => oferta.slugs.includes(linea.slug));
    const unidades = delGrupo.reduce((suma, linea) => suma + linea.cantidad, 0);
    if (unidades < oferta.desde) return;
    delGrupo.forEach((linea) => {
      if (linea.precio <= oferta.precio) return;
      linea.precioNormal = linea.precioNormal || linea.precio;
      linea.precio = oferta.precio;
      linea.oferta = oferta.nombre;
    });
  });
}

/** La ubicación llega como "Provincia, Cantón, Distrito". */
function costoDeCorreos(ubicacion, gramos) {
  const [provincia, canton] = ubicacion.split(", ");
  const enGam = (CONFIG.cantonesGam[provincia] || []).includes(canton);
  const tarifa = enGam ? CONFIG.tarifaCorreos.gam : CONFIG.tarifaCorreos.resto;
  const kilos = Math.max(Math.ceil((gramos + CONFIG.pesoEmpaque) / 1000), 1);
  return tarifa.primerKilo + (kilos - 1) * tarifa.kiloAdicional;
}

function esCorreo(valor) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
}

function crearPedido(datos) {
  const cliente = texto(datos.cliente, 80);
  const whatsapp = normalizarWhatsapp(datos.whatsapp);
  const correo = texto(datos.correo, 120);
  const envio = CONFIG.envios[datos.envio];
  const pedidas = Array.isArray(datos.lineas) ? datos.lineas : [];

  if (cliente.length < 3) return { ok: false, error: "Escribí tu nombre completo." };
  if (!whatsapp) return { ok: false, error: "Revisá tu WhatsApp: deben ser 8 números." };
  if (!esCorreo(correo)) return { ok: false, error: "Revisá tu correo: ahí te llega la confirmación." };
  if (!envio) return { ok: false, error: "Elegí cómo te llega el pedido." };
  if (pedidas.length === 0) return { ok: false, error: "Tu carrito está vacío." };
  if (pedidas.length > CONFIG.maxLineasPorPedido) {
    return { ok: false, error: "Tu carrito tiene demasiados productos distintos. Dividilo en dos pedidos." };
  }

  const ubicacion = envio.pideDireccion ? texto(datos.ubicacion, 150) : "";
  const direccion = envio.pideDireccion
    ? texto(datos.direccion, 250)
    : "Retiro coordinado por WhatsApp";
  if (envio.pideDireccion && (!ubicacion || !direccion)) {
    return { ok: false, error: "Falta la dirección de entrega." };
  }

  const filas = filasDePedidos();
  const productos = productosPorSlug();
  const reservado = apartados(filas);
  const lineas = [];
  let gramos = 0;

  for (const pedida of pedidas) {
    const slug = texto(pedida.slug, 200);
    const cantidad = Math.floor(Number(pedida.cantidad));
    const producto = productos[slug];
    if (!producto || producto.precioCobrado <= 0) {
      return { ok: false, error: "Un producto de tu carrito ya no está disponible." };
    }
    if (!Number.isInteger(cantidad) || cantidad < 1) {
      return { ok: false, error: "Revisá las cantidades de tu carrito." };
    }
    if (cantidad > producto.stock - (reservado[slug] || 0)) {
      return { ok: false, agotado: slug, error: "Se acaba de agotar: " + producto.nombre + "." };
    }
    gramos += producto.peso * cantidad;
    lineas.push({
      slug,
      nombre: producto.nombre,
      cantidad,
      precio: producto.precioCobrado,
      preventa: producto.preventa,
      quedan: producto.stock - (reservado[slug] || 0) - cantidad,
    });
  }
  aplicarOfertas(lineas, ofertasVigentes(productos));

  const subtotal = lineas.reduce((suma, linea) => suma + linea.precio * linea.cantidad, 0);
  const descuento = calcularDescuento(datos.cupon, subtotal);
  const tarifa = envio.pideDireccion ? costoDeCorreos(ubicacion, gramos) : 0;
  const costoEnvio = subtotal >= CONFIG.envioGratisDesde ? 0 : tarifa;
  const total = subtotal - descuento + costoEnvio;
  const numero = siguienteNumero(filas);
  const clave = Utilities.getUuid();
  const resumen = lineas
    .map(
      (linea) =>
        linea.cantidad + " × " + linea.nombre + " (" + colones(linea.precio) +
        (linea.oferta ? ", oferta " + linea.oferta : "") + ")",
    )
    .join("\n");

  const fila = new Array(TOTAL_COLUMNAS).fill("");
  fila[COL.numero - 1] = numero;
  fila[COL.fecha - 1] = new Date();
  fila[COL.estado - 1] = PENDIENTE;
  fila[COL.cliente - 1] = comoTexto(cliente);
  fila[COL.whatsapp - 1] = comoTexto(whatsapp);
  fila[COL.envio - 1] = envio.nombre;
  fila[COL.total - 1] = total;
  fila[COL.productos - 1] = comoTexto(resumen);
  fila[COL.ubicacion - 1] = comoTexto(ubicacion);
  fila[COL.direccion - 1] = comoTexto(direccion);
  fila[COL.correo - 1] = comoTexto(correo);
  fila[COL.subtotal - 1] = subtotal;
  fila[COL.descuento - 1] = descuento;
  fila[COL.costoEnvio - 1] = costoEnvio;
  fila[COL.metodoPago - 1] = CONFIG.metodoPago;
  const cupon = descuento ? texto(datos.cupon, 30).toUpperCase() : "";
  fila[COL.detalle - 1] = comoTexto(JSON.stringify({ lineas, subtotal, descuento, cupon }));
  fila[COL.clave - 1] = clave;
  hoja(HOJAS.pedidos).appendRow(fila);
  olvidarStock();

  const montos = resumenDeMontos(subtotal, descuento, cupon, costoEnvio, total);
  const entrega = [
    ["Método", envio.nombre],
    ["Dirección", envio.pideDireccion ? ubicacion + ". " + direccion : ""],
  ];

  avisar(
    "Nuevo pedido " + numero + " · " + colones(total) + " · " + cliente,
    [
      "Entró un pedido nuevo. Falta confirmar el SINPE.",
      "",
      "Pedido: " + numero,
      "Cliente: " + cliente,
      "WhatsApp: " + whatsapp,
      correo ? "Correo: " + correo : "",
      "Envío: " + envio.nombre,
      envio.pideDireccion ? "Dirección: " + ubicacion + ". " + direccion : "",
      "",
      resumen,
      "",
      "Subtotal: " + colones(subtotal),
      descuento ? "Descuento: " + colones(descuento) : "",
      "Envío: " + colones(costoEnvio),
      "Total a recibir por SINPE: " + colones(total),
      "",
      "Cuando el SINPE entre, cambiá el Estado a Pagado en la pestaña Pedidos web.",
    ],
    correo,
    correoConDiseno({
      etiqueta: "Pedido nuevo",
      numero,
      fecha: fila[COL.fecha - 1],
      total,
      rotuloTotal: "Total a recibir por SINPE",
      caja: datosDePago(numero, fila[COL.fecha - 1]),
      cliente: [
        ["Nombre", cliente],
        ["WhatsApp", whatsapp],
        ["Correo", correo],
      ],
      entrega: envio.pideDireccion
        ? entrega.concat([["Peso", "Unos " + (gramos + CONFIG.pesoEmpaque) + " g con empaque"]])
        : entrega,
      lineas,
      resumen: montos,
      pasos: [
        "Esperá el comprobante del cliente. Te llega en otro correo.",
        "Revisá en tu banco que entró el monto exacto, con " + numero + " en el detalle.",
        "Cambiá el Estado a Pagado en Pedidos web. La venta pasa sola a Ventas.",
        "Escribile por WhatsApp para coordinar la entrega.",
      ],
      botones: botonesDelDueno(numero, whatsapp, cliente),
    }),
  );

  confirmarAlCliente({
    correo,
    numero,
    fecha: fila[COL.fecha - 1],
    total,
    cliente,
    whatsapp,
    entrega,
    lineas: lineas.map(({ quedan, ...linea }) => linea),
    resumen,
    montos,
  });

  return { ok: true, numero, clave, subtotal, descuento, costoEnvio, total, lineas };
}

function esRetiro(fila) {
  return fila[COL.envio - 1] === CONFIG.envios["retiro-omni"].nombre;
}

function entregaDeFila(fila) {
  return [
    ["Método", fila[COL.envio - 1]],
    ["Dirección", esRetiro(fila) ? "" : fila[COL.ubicacion - 1] + ". " + fila[COL.direccion - 1]],
  ];
}

function buscarFilaDePedido(numero) {
  const buscado = texto(numero, 20).toUpperCase();
  return leerPedidos().find(({ fila }) => fila[COL.numero - 1] === buscado) || null;
}

function guardarComprobante(datos) {
  const hallado = buscarFilaDePedido(datos.numero);
  const comprobante = texto(datos.comprobante, 60);
  if (!comprobante) return { ok: false, error: "Escribí el número de comprobante." };
  if (!hallado || hallado.fila[COL.clave - 1] !== texto(datos.clave, 60)) {
    return { ok: false, error: "No hallamos ese pedido." };
  }
  if (hallado.fila[COL.estado - 1] !== PENDIENTE) {
    return { ok: false, error: "Ese pedido ya no está pendiente de pago." };
  }

  hoja(HOJAS.pedidos)
    .getRange(hallado.numeroFila, COL.comprobante)
    .setValue(comoTexto(comprobante));

  const fila = hallado.fila;
  const numero = fila[COL.numero - 1];
  const cliente = fila[COL.cliente - 1];
  const detalle = leerDetalle(fila);
  avisar(
    "Comprobante de " + numero + " · " + colones(fila[COL.total - 1]) + " · " + cliente,
    [
      "El cliente dice que ya pagó. Revisá que el SINPE haya entrado.",
      "",
      "Pedido: " + numero,
      "Cliente: " + cliente,
      "WhatsApp: " + fila[COL.whatsapp - 1],
      "Comprobante SINPE: " + comprobante,
      "Monto que debió entrar: " + colones(fila[COL.total - 1]),
      "",
      "Si entró, cambiá el Estado a Pagado en la pestaña Pedidos web.",
    ],
    "",
    correoConDiseno({
      etiqueta: "Comprobante recibido",
      numero,
      fecha: fila[COL.fecha - 1],
      total: fila[COL.total - 1],
      rotuloTotal: "Monto que debió entrar",
      caja: datosDePago(numero, fila[COL.fecha - 1], comprobante),
      cliente: [
        ["Nombre", cliente],
        ["WhatsApp", fila[COL.whatsapp - 1]],
        ["Correo", fila[COL.correo - 1]],
      ],
      entrega: entregaDeFila(fila),
      lineas: detalle.lineas.map(({ quedan, ...linea }) => linea),
      resumen: resumenDeMontos(detalle.subtotal, detalle.descuento, detalle.cupon, fila[COL.costoEnvio - 1], fila[COL.total - 1]),
      pasos: [
        "Revisá en tu banco que entró el monto exacto, con " + numero + " en el detalle. El número de comprobante solo no prueba el pago.",
        "Si entró, cambiá el Estado a Pagado en Pedidos web. La venta pasa sola a Ventas.",
        "Escribile por WhatsApp para coordinar la entrega.",
      ],
      botones: botonesDelDueno(numero, fila[COL.whatsapp - 1], cliente),
    }),
  );
  return { ok: true };
}

function guardarInteresado(datos) {
  const nombre = texto(datos.nombre, 80);
  const contacto = texto(datos.contacto, 120);
  const producto = texto(datos.producto, 150);
  if (!nombre || !contacto) return { ok: false, error: "Faltan tus datos." };
  hoja(HOJAS.interesados).appendRow([
    new Date(),
    comoTexto(nombre),
    comoTexto(contacto),
    comoTexto(producto),
  ]);
  return { ok: true };
}

function consultarPedido(parametros) {
  const hallado = buscarFilaDePedido(parametros.numero);
  const whatsapp = normalizarWhatsapp(parametros.whatsapp);
  if (!hallado || !whatsapp || normalizarWhatsapp(hallado.fila[COL.whatsapp - 1]) !== whatsapp) {
    return { ok: false, error: "No hallamos ese pedido." };
  }
  const fila = hallado.fila;
  return {
    ok: true,
    pedido: {
      numero: fila[COL.numero - 1],
      estado: fila[COL.estado - 1],
      total: Number(fila[COL.total - 1]),
      envio: fila[COL.envio - 1],
      guia: String(fila[COL.guia - 1] || ""),
      lineas: leerDetalle(fila).lineas.map(({ nombre, cantidad }) => ({ nombre, cantidad })),
    },
  };
}

function escapar(valor) {
  return String(valor === null || valor === undefined ? "" : valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function botonDeCorreo(texto, enlace, fondo) {
  return (
    '<a href="' + escapar(enlace) + '" style="display:inline-block;margin:4px 8px 4px 0;' +
    "padding:12px 18px;border-radius:8px;background:" + fondo + ";color:#ffffff;" +
    'font-weight:bold;text-decoration:none;">' + escapar(texto) + "</a>"
  );
}

/** Hasta cuándo sigue apartado un pedido sin pagar. */
function finDelApartado(fecha) {
  return fechaLegible(new Date(fecha).getTime() + CONFIG.horasApartado * 3600 * 1000);
}

function datosDePago(numero, fecha, comprobante) {
  return [
    ["SINPE Móvil", CONFIG.sinpe],
    ["En el detalle", numero],
    ["Comprobante que escribió el cliente", comprobante],
    ["Apartado hasta", finDelApartado(fecha)],
  ];
}

function fechaLegible(fecha) {
  return Utilities.formatDate(new Date(fecha), libro().getSpreadsheetTimeZone(), "dd/MM/yyyy h:mm a");
}

function resumenDeMontos(subtotal, descuento, cupon, costoEnvio, total) {
  return [
    ["Subtotal", colones(subtotal)],
    ["Cupón " + (cupon || ""), descuento ? "−" + colones(descuento) : ""],
    ["Envío", costoEnvio ? colones(costoEnvio) : "Gratis"],
    ["Total", colones(total)],
  ];
}

function tituloDeCorreo(titulo) {
  return (
    '<h2 style="margin:22px 0 6px;padding-bottom:4px;border-bottom:2px solid #141414;font-size:15px;color:#c9201c;text-transform:uppercase;letter-spacing:.5px;">' +
    escapar(titulo) + "</h2>"
  );
}

/**
 * Los correos no aceptan hojas de estilo: todo va dentro de cada etiqueta.
 * Gmail en modo oscuro cambia los colores pero no las imágenes. Por eso el toldo
 * y los patrones son imágenes, las etiquetas llevan letra blanca sobre color
 * fuerte y ningún texto va directo sobre el amarillo.
 */
function correoConDiseno({ etiqueta, estado, colorEstado, saludo, numero, fecha, total, rotuloTotal, caja, tituloCliente, cliente, entrega, lineas, resumen, pasos, botones, pie }) {
  const filaDeDato = ([rotulo, valor]) =>
    valor
      ? '<tr><td style="width:96px;padding:5px 12px 5px 0;color:#444444;white-space:nowrap;vertical-align:top;">' +
        escapar(rotulo) + '</td><td style="padding:5px 0;font-weight:bold;">' + escapar(valor) + "</td></tr>"
      : "";
  const filaDeProducto = (linea) =>
    '<tr><td style="padding:9px 12px 9px 0;border-bottom:1px solid #e3d6ad;">' +
    '<div style="font-weight:bold;">' + escapar(linea.nombre) + "</div>" +
    '<div style="font-size:13px;color:#444444;">' + escapar(linea.cantidad) + " × " + escapar(colones(linea.precio)) +
    (linea.preventa ? " · Adelanto de preventa" : "") +
    (linea.oferta ? " · Oferta " + escapar(linea.oferta) + ", antes " + escapar(colones(linea.precioNormal)) : "") +
    (linea.quedan === undefined ? "" : " · " + (linea.quedan > 0 ? "Quedan " + escapar(linea.quedan) : "Era la última")) +
    '</div></td><td style="padding:9px 0;border-bottom:1px solid #e3d6ad;text-align:right;white-space:nowrap;font-weight:bold;vertical-align:top;">' +
    escapar(colones(linea.precio * linea.cantidad)) + "</td></tr>";
  const filaDeResumen = ([rotulo, valor], indice, todas) => {
    if (!valor) return "";
    const ultima = indice === todas.length - 1;
    const estilo = ultima ? "padding:8px 0 0;font-size:18px;font-weight:900;" : "padding:3px 0;";
    return (
      '<tr><td style="' + estilo + '">' + escapar(rotulo) +
      '</td><td style="' + estilo + 'text-align:right;">' + escapar(valor) + "</td></tr>"
    );
  };
  const paso = (textoPaso, indice) =>
    '<tr><td style="padding:5px 10px 5px 0;vertical-align:top;"><span style="display:inline-block;width:24px;height:24px;line-height:24px;text-align:center;border-radius:6px;background:#1437a8;color:#ffffff;font-weight:bold;font-size:13px;">' +
    (indice + 1) + '</span></td><td style="padding:5px 0;">' + escapar(textoPaso) + "</td></tr>";

  const imagenes = CONFIG.sitio + "correo/";
  const filaDeCaja = ([rotulo, valor]) =>
    valor ? escapar(rotulo) + ": <strong>" + escapar(valor) + "</strong>" : "";
  const patron = (archivo) => "background-image:url(" + imagenes + archivo + ");background-repeat:repeat;";

  return (
    '<div style="margin:0;padding:0;background-color:#ffce1f;font-family:Arial,Helvetica,sans-serif;color:#141414;">' +
    '<div style="height:16px;border-bottom:3px solid #141414;background-color:#c9201c;' + patron("toldo.png") + '"></div>' +
    '<div style="max-width:580px;margin:0 auto;padding:6px 12px 4px;">' +
    '<img src="' + imagenes + 'nombre.png" alt="POKEDEKE" width="556" style="display:block;width:100%;max-width:556px;height:auto;margin:0 auto;font-size:34px;font-weight:900;color:#c9201c;text-align:center;">' +
    "</div>" +
    '<div style="padding:0 0 24px;background-color:#ffce1f;' + patron("fondo.png") + '">' +
    '<div style="max-width:580px;margin:0 auto;padding:12px 12px 0;">' +
    '<div style="background-color:#fff4d6;' + patron("fondo-tarjeta.png") + 'border:3px solid #141414;border-radius:12px;padding:22px;">' +
    '<span style="display:inline-block;padding:4px 10px;border-radius:6px;background:#1437a8;color:#ffffff;font-size:13px;font-weight:bold;">' + escapar(etiqueta) + "</span> " +
    '<span style="display:inline-block;padding:4px 10px;border-radius:6px;background:' + (colorEstado || "#c9201c") + ';color:#ffffff;font-size:13px;font-weight:bold;">' + escapar(estado || PENDIENTE) + "</span>" +
    '<h1 style="margin:12px 0 0;font-size:30px;color:#1437a8;">' + escapar(numero) + "</h1>" +
    '<p style="margin:2px 0 14px;font-size:13px;color:#444444;">' + escapar(fechaLegible(fecha)) + "</p>" +
    (saludo ? '<p style="margin:0 0 14px;font-size:16px;line-height:1.45;">' + escapar(saludo) + "</p>" : "") +
    '<p style="margin:0;color:#444444;">' + escapar(rotuloTotal) + "</p>" +
    '<p style="margin:2px 0 12px;font-size:36px;font-weight:900;">' + escapar(colones(total)) + "</p>" +
    '<div style="padding:12px;border:2px solid #141414;border-radius:8px;background:#ffffff;font-size:14px;line-height:1.5;">' +
    caja.map(filaDeCaja).filter(Boolean).join("<br>") + "</div>" +
    (cliente
      ? tituloDeCorreo(tituloCliente || "Cliente") +
        '<table style="width:100%;border-collapse:collapse;font-size:15px;">' + cliente.map(filaDeDato).join("") + "</table>"
      : "") +
    tituloDeCorreo("Entrega") +
    '<table style="width:100%;border-collapse:collapse;font-size:15px;">' + entrega.map(filaDeDato).join("") + "</table>" +
    tituloDeCorreo("Productos") +
    '<table style="width:100%;border-collapse:collapse;font-size:15px;">' + lineas.map(filaDeProducto).join("") + "</table>" +
    '<table style="width:100%;border-collapse:collapse;font-size:15px;margin-top:8px;">' + resumen.map(filaDeResumen).join("") + "</table>" +
    tituloDeCorreo("Qué sigue") +
    '<table style="width:100%;border-collapse:collapse;font-size:15px;">' + pasos.map(paso).join("") + "</table>" +
    '<div style="margin-top:16px;">' + botones.join("") + "</div>" +
    '<p style="margin:16px 0 0;font-size:12px;color:#444444;">' + escapar(pie || "Aviso automático de la tienda. Los datos del cliente son solo para este pedido.") + "</p>" +
    "</div></div></div></div>"
  );
}

function botonesDelDueno(numero, whatsapp, cliente) {
  const digitos = soloDigitos(whatsapp);
  const primerNombre = String(cliente).split(" ")[0];
  const saludo = "¡Hola " + primerNombre + "! Te escribimos de " + CONFIG.nombreTienda + " por tu pedido " + numero + ".";
  const enlaceWhatsapp = "https://wa.me/506" + digitos + "?text=" + encodeURIComponent(saludo);
  const enlaceHoja = libro().getUrl() + "#gid=" + hoja(HOJAS.pedidos).getSheetId();
  return [
    digitos.length === 8 ? botonDeCorreo("Escribir por WhatsApp", enlaceWhatsapp, "#127a43") : "",
    botonDeCorreo("Abrir Pedidos web", enlaceHoja, "#1437a8"),
  ];
}

function botonesDelCliente(numero) {
  const mensaje = "¡Hola! Les escribo por mi pedido " + numero + ".";
  return [
    botonDeCorreo("Ver mi pedido", CONFIG.sitio + "pedido?numero=" + numero, "#1437a8"),
    botonDeCorreo("Escribinos por WhatsApp", "https://wa.me/" + CONFIG.whatsapp + "?text=" + encodeURIComponent(mensaje), "#127a43"),
  ];
}

function mandarCorreo(opciones) {
  try {
    MailApp.sendEmail({ name: CONFIG.nombreTienda, ...opciones });
  } catch (error) {
    // Un correo que falla no debe perder el pedido: ya quedó en la hoja.
    console.error(error);
  }
}

/**
 * Al cliente solo se le escribe desde la cuenta de la tienda: el correo personal
 * de quien administra la hoja nunca debe quedar a la vista.
 */
function mandarAlCliente(opciones) {
  const cuenta = Session.getEffectiveUser().getEmail().toLowerCase();
  if (cuenta !== CONFIG.correoAvisos) {
    console.error("No se le escribió al cliente: el script corre con otra cuenta.");
    return;
  }
  mandarCorreo({ replyTo: CONFIG.correoAvisos, ...opciones });
}

function avisar(asunto, lineas, responderA, html) {
  const opciones = {
    to: CONFIG.correoAvisos,
    subject: asunto,
    body: lineas.filter((linea, i) => linea || lineas[i - 1]).join("\n"),
    htmlBody: html,
  };
  if (esCorreo(responderA)) opciones.replyTo = responderA;
  mandarCorreo(opciones);
}

/** Las respuestas del cliente llegan al correo de la tienda. */
function confirmarAlCliente({ correo, numero, fecha, total, cliente, whatsapp, entrega, lineas, resumen, montos }) {
  const primerNombre = String(cliente).split(" ")[0];
  const pasos = [
    "Hacé el SINPE Móvil por el monto exacto, con " + numero + " en el detalle.",
    "Escribí el número de comprobante en la página. Si ya la cerraste, respondé este correo con ese número.",
    "Cuando confirmemos el pago te llega otro correo y te escribimos por WhatsApp.",
  ];
  mandarAlCliente({
    to: correo,
    subject: "Recibimos tu pedido " + numero + " · " + CONFIG.nombreTienda,
    body: [
      "¡Gracias, " + primerNombre + "! Recibimos tu pedido " + numero + ".",
      "",
      resumen,
      "",
      "Total a pagar: " + colones(total),
      "SINPE Móvil al " + CONFIG.sinpe + ", con " + numero + " en el detalle.",
      "Tus productos quedan apartados " + CONFIG.horasApartado + " horas.",
      "",
      "Qué sigue:",
      ...pasos,
    ].join("\n"),
    htmlBody: correoConDiseno({
      etiqueta: "Pedido recibido",
      saludo:
        "¡Gracias, " + primerNombre + "! Recibimos tu pedido y tus productos quedan apartados " +
        CONFIG.horasApartado + " horas mientras hacés el pago.",
      numero,
      fecha,
      total,
      rotuloTotal: "Total a pagar",
      caja: datosDePago(numero, fecha).filter(([rotulo]) => !rotulo.startsWith("Comprobante")),
      tituloCliente: "Tus datos",
      cliente: [
        ["Nombre", cliente],
        ["WhatsApp", whatsapp],
        ["Correo", correo],
      ],
      entrega,
      lineas,
      resumen: montos,
      pasos,
      botones: botonesDelCliente(numero),
      pie: "Si algún dato está mal, respondé este correo o escribinos. Tus datos son solo para este pedido.",
    }),
  });
}

function pasosTrasElPago(fila, lineas) {
  const pasos = esRetiro(fila)
    ? ["Te escribimos por WhatsApp para cuadrar el día y la hora del retiro."]
    : [
        "Te escribimos por WhatsApp para confirmar la entrega.",
        "Despachamos en 1 a 2 días hábiles y te pasamos el número de guía.",
      ];
  if (lineas.some((linea) => linea.preventa)) {
    pasos.unshift("Recibimos tu adelanto. Te avisamos cuando llegue la preventa para cobrar el resto.");
  }
  return pasos;
}

function confirmarPago(fila) {
  const correo = String(fila[COL.correo - 1]);
  if (!esCorreo(correo)) return;

  const numero = fila[COL.numero - 1];
  const primerNombre = String(fila[COL.cliente - 1]).split(" ")[0];
  const total = fila[COL.total - 1];
  const detalle = leerDetalle(fila);
  const pasos = pasosTrasElPago(fila, detalle.lineas);
  mandarAlCliente({
    to: correo,
    subject: "Pago confirmado de tu pedido " + numero + " · " + CONFIG.nombreTienda,
    body: [
      "¡Listo, " + primerNombre + "! Confirmamos tu pago del pedido " + numero + ".",
      "",
      "Total pagado: " + colones(total),
      "",
      "Qué sigue:",
      ...pasos,
    ].join("\n"),
    htmlBody: correoConDiseno({
      etiqueta: "Pago confirmado",
      estado: PAGADO,
      colorEstado: "#127a43",
      saludo: "¡Listo, " + primerNombre + "! Confirmamos tu pago. Gracias por comprar en " + CONFIG.nombreTienda + ".",
      numero,
      fecha: fila[COL.fecha - 1],
      total,
      rotuloTotal: "Total pagado",
      caja: [
        ["Pagaste por", fila[COL.metodoPago - 1]],
        ["Comprobante", fila[COL.comprobante - 1]],
      ],
      entrega: entregaDeFila(fila),
      lineas: detalle.lineas.map(({ quedan, ...linea }) => linea),
      resumen: resumenDeMontos(detalle.subtotal, detalle.descuento, detalle.cupon, fila[COL.costoEnvio - 1], total),
      pasos,
      botones: botonesDelCliente(numero),
      pie: "Si tenés alguna duda, respondé este correo o escribinos. Tus datos son solo para este pedido.",
    }),
  });
}

/* ---------- Pasar a Ventas ---------- */

/**
 * Correr una sola vez desde el editor, con la cuenta de la tienda. Google no
 * deja mandar correos desde un onEdit común: ocupa este activador instalado.
 */
function instalarAvisos() {
  ScriptApp.getProjectTriggers()
    .filter((activador) => activador.getHandlerFunction() === "alEditarHoja")
    .forEach((activador) => ScriptApp.deleteTrigger(activador));
  ScriptApp.newTrigger("alEditarHoja").forSpreadsheet(libro()).onEdit().create();
}

/** Corre con cada edición de la hoja, gracias a instalarAvisos(). */
function alEditarHoja(e) {
  const rango = e.range;
  const pestana = rango.getSheet().getName();
  if ([HOJAS.compras, HOJAS.ventas, HOJAS.catalogo, HOJAS.pedidos].includes(pestana)) {
    olvidarStock();
  }
  if (pestana !== HOJAS.pedidos) return;
  if (rango.getColumn() !== COL.estado || rango.getRow() < PRIMERA_FILA) return;
  if (rango.getNumRows() !== 1 || e.value !== PAGADO) return;

  const resultado = conCandado(() => pasarAVentas(rango.getRow(), e.oldValue));
  olvidarStock();
  libro().toast(resultado.aviso, CONFIG.nombreTienda, 8);
  if (resultado.fila) confirmarPago(resultado.fila);
}

/** De la compra más vieja a la más nueva, solo donde todavía haya stock. */
function repartirEnLotes(slug, cantidad, compras) {
  const reparto = [];
  let falta = cantidad;
  compras.forEach((compra) => {
    if (falta <= 0 || compra.slug !== slug || compra.stock <= 0) return;
    const toma = Math.min(compra.stock, falta);
    reparto.push({ producto: compra.producto, cantidad: toma });
    compra.stock -= toma;
    falta -= toma;
  });
  return falta > 0 ? null : reparto;
}

function leerCompras() {
  const pestana = hoja(HOJAS.compras);
  const ultima = pestana.getLastRow();
  return pestana
    .getRange(PRIMERA_FILA, 1, Math.max(ultima - PRIMERA_FILA + 1, 1), 22)
    .getValues()
    .filter((fila) => fila[0] && fila[2])
    .map((fila) => ({
      slug: aSlug(fila[2]),
      stock: Number(fila[15]) || 0,
      producto: fila[21],
    }));
}

/** Nunca se usa appendRow en Ventas: sus fórmulas llegan hasta abajo. */
function filasLibresDeVentas(cuantas) {
  const pestana = hoja(HOJAS.ventas);
  const total = pestana.getMaxRows() - PRIMERA_FILA + 1;
  const valores = pestana.getRange(PRIMERA_FILA, 1, total, 2).getValues();
  const libres = [];
  for (let i = 0; i < valores.length && libres.length < cuantas; i += 1) {
    if (!valores[i][0] && !valores[i][1]) libres.push(i + PRIMERA_FILA);
  }
  return libres.length === cuantas ? libres : null;
}

function fechaDeHoy() {
  const zona = libro().getSpreadsheetTimeZone();
  const dia = Utilities.formatDate(new Date(), zona, "dd/MM/yyyy");
  return Utilities.parseDate(dia + " 12:00", zona, "dd/MM/yyyy HH:mm");
}

function pasarAVentas(numeroFila, estadoAnterior) {
  const pestana = hoja(HOJAS.pedidos);
  const fila = pestana.getRange(numeroFila, 1, 1, TOTAL_COLUMNAS).getValues()[0];
  const numero = fila[COL.numero - 1];

  // Un pedido entra a Ventas una sola vez, aunque el Estado se cambie varias.
  if (fila[COL.enVentas - 1]) return { aviso: numero + " ya estaba en Ventas." };

  const detalle = leerDetalle(fila);
  const volver = (motivo) => {
    pestana.getRange(numeroFila, COL.estado).setValue(estadoAnterior || PENDIENTE);
    pestana.getRange(numeroFila, COL.notas).setValue(motivo);
    return { aviso: numero + " no pasó a Ventas. " + motivo };
  };
  if (detalle.lineas.length === 0) return volver("Falta el detalle del pedido.");

  const compras = leerCompras();
  const porcion = detalle.subtotal > 0 ? 1 - detalle.descuento / detalle.subtotal : 1;
  const nuevas = [];

  for (const linea of detalle.lineas) {
    const reparto = repartirEnLotes(linea.slug, linea.cantidad, compras);
    if (!reparto) return volver("No hay stock suficiente de " + linea.nombre + ".");
    reparto.forEach((lote) => {
      nuevas.push({
        producto: lote.producto,
        cantidad: lote.cantidad,
        precio: Math.round(linea.precio * porcion),
      });
    });
  }

  const libres = filasLibresDeVentas(nuevas.length);
  if (!libres) return volver("No quedan filas libres en Ventas.");

  const cliente = String(fila[COL.cliente - 1]);
  const notas = [
    numero,
    fila[COL.envio - 1],
    "SINPE " + (fila[COL.comprobante - 1] || "sin número"),
    "WhatsApp " + fila[COL.whatsapp - 1],
    detalle.lineas.some((linea) => linea.preventa) ? "Adelanto de preventa" : "",
    ...[...new Set(detalle.lineas.map((linea) => linea.oferta).filter(Boolean))].map(
      (oferta) => "Oferta " + oferta,
    ),
  ]
    .filter(Boolean)
    .join(" · ");
  const fecha = fechaDeHoy();
  const ventas = hoja(HOJAS.ventas);

  nuevas.forEach((venta, indice) => {
    ventas
      .getRange(libres[indice], 1, 1, 7)
      .setValues([
        [
          fecha,
          venta.producto,
          venta.cantidad,
          venta.precio,
          CONFIG.canal,
          comoTexto(cliente),
          comoTexto(notas),
        ],
      ]);
  });

  pestana
    .getRange(numeroFila, COL.enVentas)
    .setValue("Fila " + libres.join(", "));
  return { aviso: numero + " pasó a Ventas.", fila };
}
