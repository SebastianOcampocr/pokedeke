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
 * 5. "Avisame cuando vuelva": anota a quien espera un producto agotado y le
 *    escribe cuando vuelve a haber.
 * 6. Cuenta cuántas veces se ve y se agrega al carrito cada producto, en
 *    "Lo más visto", sin datos personales.
 * 7. Dos días después de marcar un pedido Entregado, le pide al cliente su
 *    opinión. Las opiniones marcadas para publicar salen en la portada.
 * 8. Pokedeke Busca: anota en "Solicitudes" lo que la gente pide y no está en
 *    la página, y avisa a la tienda una vez por hora si entró algo.
 * 9. Anota en "Búsquedas" qué se busca en la página y qué no dio resultados,
 *    sin datos de quién buscó.
 * 10. Cada 5 minutos, si el catálogo cambió, le pide a GitHub rearmar la página.
 * 11. Cada Domingo guarda una copia de respaldo de toda la hoja.
 * 12. Cada hora llena la pestaña "Demanda": qué mira, pide y busca la gente, con
 *     el stock de ese momento y una sugerencia.
 *
 * Los precios y el stock siempre se leen de la hoja: lo que manda el navegador
 * nunca se usa para calcular cuánto se cobra.
 *
 * Todo corre con la cuenta de la tienda: la implementación se crea desde esa
 * cuenta y ahí mismo se corre instalarAvisos() una vez (y otra vez cada vez que
 * este archivo traiga activadores nuevos).
 */

const CONFIG = {
  correoAvisos: "pokedekestore@gmail.com",
  // Servicio al cliente: las respuestas de los clientes van aquí (llega a la misma cuenta).
  correoCliente: "sac@pokedeke.store",
  nombreTienda: "Pokedeke",
  canal: "Página web",
  metodoPago: "SINPE Móvil",
  sinpe: "8781-2831",
  whatsapp: "50687812831",
  // Dirección de la página: si cambia, hay que cambiarla aquí. Los correos sacan
  // de aquí las imágenes y el enlace para ver el pedido.
  sitio: "https://pokedeke.store/",
  horasApartado: 24,
  adelantoPreventa: 0.5,
  envioGratisDesde: 50000,
  maxLlamadasPorHora: 60,
  // Avisos anónimos de la pestaña Carritos: llevan su propio límite para no
  // gastar el de los pedidos.
  maxCarritosPorHora: 600,
  maxComentariosPorHora: 30,
  maxAvisosPorHora: 60,
  // Cada visita a un producto cuenta una vez al día por navegador.
  maxVistasPorHora: 3000,
  // Google deja mandar unos 100 correos al día: cada revisión manda como mucho estos.
  maxCorreosPorRevision: 40,
  // Días después de marcar Entregado para pedir la opinión.
  diasParaOpinion: 2,
  // Las opiniones se piden de día, entre estas horas (hora de Costa Rica).
  horasParaEscribir: [9, 19],
  maxLineasPorPedido: 100,
  // Pago con tarjeta por PayPal: PayPal no cobra en colones, así que el total se
  // pasa a dólares con este tipo de cambio. Debe ser el mismo que muestra la página
  // (la página lo lee de aquí). Las llaves van en Propiedades del script:
  // PAYPAL_CLIENT_ID, PAYPAL_SECRET y PAYPAL_MODO ("sandbox" o "live").
  colonesPorDolar: 500,
  maxPagosPaypalPorHora: 120,
  maxSolicitudesPorHora: 40,
  maxVerificacionesPorHora: 600,
  // Consultas de "¿Cómo va mi pedido?": frena a quien pruebe números al azar.
  maxConsultasPorHora: 300,
  maxBusquedasPorHora: 1500,
  // Tope de términos distintos en la pestaña Búsquedas, para que nadie la llene de basura.
  maxTerminos: 3000,
  // De dónde sale la página: publicarSiCambio le pide a GitHub rearmarla. La llave
  // va en Propiedades del script, como GITHUB_TOKEN.
  repositorio: "SebastianOcampocr/pokedeke",
  flujo: "publicar-demo.yml",
  // Estos valores deben coincidir con lib/tienda.ts.
  // `despacho`: sale en los días de despacho (ver diaDeDespacho).
  envios: {
    correos: { nombre: "Correos de Costa Rica", pideDireccion: true, despacho: true },
    // El cliente elige una tienda de CONFIG.tiendas y el envío se suma al SINPE.
    // Con "Otra tienda" escribe cuál; el monto se le confirma por WhatsApp y va
    // en el mismo SINPE. La tienda queda en la columna Dirección.
    "entre-tiendas": {
      nombre: "Envío entre tiendas",
      pideDireccion: false,
      pideTienda: true,
      despacho: true,
    },
    "retiro-omni": { nombre: "Retiro en Edificio Omni", pideDireccion: false },
  },
  // Tiendas del envío entre tiendas. Debe coincidir con TIENDAS_DESTINO en lib/tienda.ts.
  tiendas: {
    "kira-barrio-chino": { nombre: "Kira Shop / Barrio Chino", detalle: "Costado este del Parque de las Garantías Sociales.", precio: 600 },
    "perron-zapote": { nombre: "Perron Store / Zapote", detalle: "Centro Comercial Plaza del Castillo.", precio: 800 },
    "omega-heredia": { nombre: "OMEGA Card Games Store / Heredia", detalle: "125 metros al norte de la Municipalidad de Heredia.", precio: 700 },
    "omega-alajuela": { nombre: "OMEGA Card Games Store / Alajuela", detalle: "175 metros al norte de la Municipalidad de Alajuela.", precio: 900 },
    "omega-cartago": { nombre: "OMEGA Card Games Store / Cartago", detalle: "100 metros noroeste de los Tribunales de Justicia de Cartago.", precio: 900 },
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
  carritos: "Carritos",
  comentarios: "Comentarios",
  avisos: "Avisos de stock",
  masVistos: "Lo más visto",
  solicitudes: "Solicitudes",
  busquedas: "Búsquedas",
  demanda: "Demanda",
  sistema: "Sistema",
  contenido: "Contenido",
  especiales: "Pedidos especiales",
};

// Sube con cada cambio: la página y las pruebas leen esta marca con un GET.
const VERSION = "2026-11-10-revision";
const ENTREGADO = "Entregado";
const PEDIDO_ESPECIAL = "Pedido especial";
// Estados del inventario. Los escribe la tienda en la columna "Estado en la página"
// de "Catálogo web"; vacío es Disponible. Solo Disponible se puede comprar.
const ESTADOS = {
  disponible: "Disponible",
  enCamino: "En camino",
  porConsultar: "Por consultar",
  agotado: "Agotado",
  noPublicado: "No publicado",
  // Pago anticipado del 100% para importar algo puntual. Solo vale si la tienda lo
  // escribe a mano en esa fila, con Precio de venta y fecha de entrega, y si la
  // propiedad PEDIDOS_ESPECIALES está en "si". Si no, se muestra como Por consultar.
  pedidoEspecial: "Pedido especial",
};
const COLUMNA_ESTADO = "Estado en la página";
// La fecha máxima de entrega de un pedido especial. Antes la columna se llamaba así:
const COLUMNAS_ENTREGA = ["Entrega máxima (pedido especial)", "Llega (preventas)"];
// Sube si cambian las condiciones: el pedido guarda cuál versión aceptó la persona.
const CONDICIONES_ESPECIAL = "condiciones-2026-11-10";

/** La recepción de pagos anticipados se enciende a mano con la propiedad PEDIDOS_ESPECIALES = si. */
function especialesActivos() {
  return PropertiesService.getScriptProperties().getProperty("PEDIDOS_ESPECIALES") === "si";
}

/** La fecha máxima de entrega escrita en la fila, o null. Acepta fecha de la hoja o dd/mm/yyyy. */
function entregaDe(fila) {
  const valor = COLUMNAS_ENTREGA.map((columna) => fila[columna]).find((celda) => celda !== undefined && celda !== "");
  if (esFecha(valor)) return valor;
  const partes = String(valor || "").trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  return partes ? new Date(Number(partes[3]), Number(partes[2]) - 1, Number(partes[1]), 12) : null;
}
// Formularios que piden la comprobación de Cloudflare cuando hay TURNSTILE_SECRET.
const CON_VERIFICACION = ["pedido", "solicitud", "comentario", "aviso", "interesado"];
const PRIMERA_FILA = 5;
const PENDIENTE = "Pendiente de pago";
const PAGADO = "Pagado";
// Lo pone solo el pago con tarjeta: así se distingue de un SINPE confirmado a mano.
const PAGADO_PAYPAL = "Pagado (PayPal)";
const METODO_TARJETA = "Tarjeta (PayPal)";
// Solo para pedidos especiales ya pagados: avisa al cliente que ya lo tenemos.
const CONSEGUIDO = "Conseguido";
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
    if (!hayCupo("consultas", CONFIG.maxConsultasPorHora)) {
      return responder({ ok: false, error: "Hay muchas consultas en este momento. Intentá en un rato o escribinos por WhatsApp." });
    }
    return responder(consultarPedido(parametros));
  }
  if (parametros.accion === "paypal") {
    return responder(configPaypalPublica());
  }
  if (parametros.accion === "extras") {
    return responder({ ok: true, opiniones: opinionesPublicadas(), masVistos: listaMasVistos() });
  }
  return responder({ ok: true, tienda: CONFIG.nombreTienda, version: VERSION });
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
      carrito: guardarCarrito,
      comentario: guardarComentario,
      aviso: guardarAviso,
      visto: anotarVisto,
      solicitud: guardarSolicitud,
      busqueda: anotarBusqueda,
      "paypal-crear": crearPagoPaypal,
      "paypal-capturar": capturarPagoPaypal,
    };
    const accion = acciones[datos.accion];
    if (!accion) return responder({ ok: false, error: "Acción desconocida." });
    if (CON_VERIFICACION.includes(datos.accion) && !esHumano(datos.verificacion)) {
      return responder({
        ok: false,
        verificar: true,
        error: "No pudimos comprobar que sos una persona. Recargá la página e intentá otra vez, o escribinos por WhatsApp.",
      });
    }
    if (datos.accion === "carrito") {
      if (!hayCupo("carritos", CONFIG.maxCarritosPorHora)) return responder({ ok: false });
      return responder(conCandado(() => accion(datos)));
    }
    if (datos.accion === "visto" || datos.accion === "busqueda") {
      // Si la hoja está ocupada, esta visita no se cuenta: no vale la pena esperar.
      const cupo =
        datos.accion === "visto"
          ? hayCupo("vistas", CONFIG.maxVistasPorHora)
          : hayCupo("busquedas", CONFIG.maxBusquedasPorHora);
      if (!cupo) return responder({ ok: false });
      return responder(siEstaLibre(() => accion(datos)));
    }
    if (datos.accion === "solicitud") {
      if (!hayCupo("solicitudes", CONFIG.maxSolicitudesPorHora)) {
        return responder({ ok: false, error: "Recibimos muchas solicitudes. Escribinos por WhatsApp." });
      }
      return responder(conCandado(() => accion(datos)));
    }
    if (datos.accion === "paypal-crear" || datos.accion === "paypal-capturar") {
      if (!hayCupo("paypal", CONFIG.maxPagosPaypalPorHora)) {
        return responder({ ok: false, error: "Hay muchos pagos en este momento. Intentá en un rato." });
      }
      // Crear no escribe en la hoja; capturar sí, y pasa la venta a Ventas.
      return responder(datos.accion === "paypal-crear" ? accion(datos) : conCandado(() => accion(datos)));
    }
    if (datos.accion === "aviso") {
      if (!hayCupo("avisos", CONFIG.maxAvisosPorHora)) {
        return responder({ ok: false, error: "Recibimos muchos avisos. Intentá en un rato." });
      }
      return responder(conCandado(() => accion(datos)));
    }
    if (datos.accion === "comentario") {
      if (!hayCupo("comentarios", CONFIG.maxComentariosPorHora)) {
        return responder({ ok: false, error: "Recibimos muchos comentarios. Intentá en un rato." });
      }
      return responder(conCandado(() => accion(datos)));
    }
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

/** Como conCandado, pero si la hoja está ocupada más de 5 segundos se rinde. */
function siEstaLibre(tarea) {
  const candado = LockService.getDocumentLock();
  if (!candado.tryLock(5000)) return { ok: false };
  try {
    return tarea();
  } finally {
    SpreadsheetApp.flush();
    candado.releaseLock();
  }
}

/**
 * Con la propiedad TURNSTILE_SECRET, los formularios deben traer la prueba de
 * Cloudflare Turnstile y aquí se le pregunta a Cloudflare si es buena. Sin la
 * propiedad no se pide nada. Si Cloudflare no responde, no pasa: es preferible
 * perder un rato de pedidos que llenar la hoja de pedidos falsos.
 */
function esHumano(prueba) {
  const secreto = PropertiesService.getScriptProperties().getProperty("TURNSTILE_SECRET");
  if (!secreto) return true;
  if (!prueba || typeof prueba !== "string") return false;
  if (!hayCupo("verificaciones", CONFIG.maxVerificacionesPorHora)) return false;
  try {
    const respuesta = UrlFetchApp.fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "post",
      payload: { secret: secreto, response: prueba.slice(0, 2100) },
      muteHttpExceptions: true,
    });
    return JSON.parse(respuesta.getContentText()).success === true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

/** Sin tildes ni mayúsculas, para comparar lo que alguien escribió a mano. */
function sinTildes(valor) {
  return String(valor == null ? "" : valor).normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
}

/** Frena a quien mande pedidos falsos sin parar. */
function hayCupo(tipo, maximo) {
  const memoria = CacheService.getScriptCache();
  const hora = Utilities.formatDate(new Date(), "UTC", "yyyyMMddHH");
  const clave = (tipo || "pedidos") + "-" + hora;
  const cuenta = Number(memoria.get(clave) || 0);
  if (cuenta >= (maximo || CONFIG.maxLlamadasPorHora)) return false;
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
    const especial = producto.estado === ESTADOS.pedidoEspecial;
    productos[producto.slug] = {
      stock: Math.max((especial ? producto.cupos : producto.stock) - (reservado[producto.slug] || 0), 0),
      precio: producto.precio,
      peso: producto.peso,
      estado: producto.estado,
      ...(especial ? { entrega: fechaIso(producto.llegada) } : {}),
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
  CacheService.getScriptCache().removeAll([CLAVE_STOCK, CLAVE_VERSION, CLAVE_NOMBRES]);
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
  const crudo = pestana.getRange(4, 1, Math.max(ultima - 3, 1), Math.max(pestana.getLastColumn(), 17)).getValues();
  const titulos = crudo[0].map((titulo) => String(titulo).trim());
  return crudo
    .slice(1)
    .map((fila) => Object.fromEntries(titulos.map((titulo, i) => [titulo, fila[i]])))
    .filter((fila) => fila.ID && fila.Producto);
}

function esPokemon(juego) {
  return String(juego).normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim() === "pokemon";
}

/**
 * Lo que GitHub necesita para armar la página, y nada más: solo lo publicado, y
 * sin el precio sugerido de lo que ya tiene precio de venta (de ahí se podría
 * sacar cuánto costó). Esta dirección la puede abrir cualquiera.
 */
function catalogoEnCsv() {
  const pestana = hoja(HOJAS.catalogo);
  const ultima = pestana.getLastRow();
  const filas = pestana.getRange(4, 1, Math.max(ultima - 3, 1), Math.max(pestana.getLastColumn(), 16)).getDisplayValues();
  const titulos = filas[0].map((titulo) => String(titulo).trim());
  const juego = titulos.indexOf("Juego");
  const publicado = titulos.indexOf("Publicado (sí/no)");
  const sugerido = titulos.indexOf("Precio sugerido (₡)");
  const venta = titulos.indexOf("Precio de venta (₡)");
  const estado = titulos.indexOf(COLUMNA_ESTADO);
  return filas
    .filter((fila, indice) => {
      if (indice === 0) return true;
      if (!fila[0]) return false;
      if (publicado !== -1 && /^no$/i.test(String(fila[publicado]).trim())) return false;
      if (estado !== -1 && sinTildes(fila[estado]) === sinTildes(ESTADOS.noPublicado)) return false;
      return juego === -1 || esPokemon(fila[juego]);
    })
    .map((fila, indice) => {
      const copia = fila.slice();
      if (indice > 0 && sugerido !== -1 && venta !== -1 && String(copia[venta]).trim()) {
        copia[sugerido] = copia[venta];
      }
      return copia.map((celda) => '"' + String(celda).replace(/"/g, '""') + '"').join(",");
    })
    .join("\n");
}

/**
 * El estado de una fila de "Catálogo web". Vacío o Disponible se vende si hay
 * unidades. Cualquier otra cosa no se vende aunque la hoja muestre stock: así lo
 * que es de un proveedor o viene de camino nunca pasa por inventario propio. Las
 * etiquetas viejas "Preventa" y "Pedido especial" cuentan como Por consultar, y
 * un estado que no se entiende, como Agotado. Debe decidir igual que
 * estadoDelLote en scripts/traer-catalogo.mjs.
 */
function estadoDelLote(fila) {
  if (/^no$/.test(sinTildes(fila["Publicado (sí/no)"]))) return ESTADOS.noPublicado;
  const escrito = sinTildes(fila[COLUMNA_ESTADO]);
  if (!escrito) {
    const etiqueta = String(fila.Etiqueta || "").trim();
    return etiqueta === "Preventa" || etiqueta === PEDIDO_ESPECIAL ? ESTADOS.porConsultar : ESTADOS.disponible;
  }
  return Object.values(ESTADOS).find((estado) => sinTildes(estado) === escrito) || ESTADOS.agotado;
}

/** Debe agrupar igual que scripts/traer-catalogo.mjs. */
function productosPorSlug() {
  const grupos = {};
  filasDeCatalogo().forEach((fila) => {
    if (!esPokemon(fila.Juego)) return;
    let estado = estadoDelLote(fila);
    if (estado === ESTADOS.noPublicado) return;

    const slug = aSlug(fila.Producto);
    const grupo = grupos[slug] || { slug, nombre: fila.Producto, stock: 0, cupos: 0, vendidas: 0, lotes: [], estados: {} };
    // Solo cuenta lo que está en el mezzanine: lo demás no es para vender hoy.
    if (estado === ESTADOS.disponible) grupo.stock += Math.max(Number(fila["En stock"]) || 0, 0);
    // Pedido especial: "En stock" son los cupos que la tienda puede importar. Sin Precio
    // de venta escrito o sin una fecha de entrega futura no se vende: queda Por consultar.
    if (estado === ESTADOS.pedidoEspecial) {
      const entrega = entregaDe(fila);
      const precioFijo = Number(fila["Precio de venta (₡)"]) || 0;
      if (precioFijo > 0 && entrega && entrega.getTime() > Date.now()) {
        grupo.cupos += Math.max(Number(fila["En stock"]) || 0, 0);
        grupo.entrega = entrega;
        grupo.precioEspecial = precioFijo;
      } else {
        estado = ESTADOS.porConsultar;
      }
    }
    grupo.vendidas += Math.max(Number(fila.Vendidas) || 0, 0);
    grupo.estados[estado] = true;
    grupo.lotes.push(fila);
    grupos[slug] = grupo;
  });

  Object.values(grupos).forEach((grupo) => {
    const recientes = grupo.lotes.slice().reverse();
    const ultimo = (columna) =>
      recientes.map((lote) => lote[columna]).find((valor) => valor !== "" && valor !== 0);
    const precio = Number(ultimo("Precio de venta (₡)") || ultimo("Precio sugerido (₡)")) || 0;
    grupo.nombre = String(ultimo("Nombre para mostrar") || grupo.nombre);
    grupo.descripcion = String(ultimo("Descripción") || "");
    // La condición de la carta va en el nombre del pedido, los correos y Ventas: dos
    // cartas iguales con distinta condición no se pueden confundir.
    const condicion = grupo.descripcion.match(/Condición:[^.(]*\(([A-Z]{2,3})\)/);
    if (condicion && grupo.nombre.indexOf("(" + condicion[1] + ")") === -1) grupo.nombre += " · " + condicion[1];
    // Lo del mezzanine manda; después el pedido especial, solo si está encendido.
    const especial = grupo.estados[ESTADOS.pedidoEspecial] && grupo.cupos > 0 && especialesActivos();
    if (grupo.estados[ESTADOS.pedidoEspecial] && !especial) grupo.estados[ESTADOS.porConsultar] = true;
    grupo.estado =
      grupo.stock > 0
        ? ESTADOS.disponible
        : especial
          ? ESTADOS.pedidoEspecial
          : grupo.estados[ESTADOS.enCamino]
          ? ESTADOS.enCamino
          : grupo.estados[ESTADOS.porConsultar]
            ? ESTADOS.porConsultar
            : ESTADOS.agotado;
    grupo.precio = grupo.estado === ESTADOS.pedidoEspecial ? grupo.precioEspecial : precio;
    // Ya no hay adelantos ni apartados: todo se cobra completo.
    grupo.precioCobrado = grupo.precio;
    grupo.llegada = grupo.estado === ESTADOS.pedidoEspecial ? grupo.entrega : null;
    grupo.peso =
      Number(ultimo("Peso (g)")) ||
      CONFIG.pesos[ultimo("Categoría")] ||
      CONFIG.pesoSinCategoria;
  });
  return grupos;
}

/**
 * Unidades de pedidos sin pagar que siguen en plazo: no se le venden a otra persona
 * mientras tanto. Los pedidos especiales ya pagados también ocupan su cupo hasta
 * entregarse, porque pasan a Ventas recién al entregarlos.
 */
function apartados(filasPedidos) {
  const limite = Date.now() - CONFIG.horasApartado * 3600 * 1000;
  const cuenta = {};
  filasPedidos.forEach((fila) => {
    const estado = fila[COL.estado - 1];
    const enPlazo = estado === PENDIENTE && new Date(fila[COL.fecha - 1]).getTime() >= limite;
    const anticipo = [PAGADO, PAGADO_PAYPAL, CONSEGUIDO].includes(estado) && esAnticipo(fila);
    if (!enPlazo && !anticipo) return;
    leerDetalle(fila).lineas.forEach((linea) => {
      cuenta[linea.slug] = (cuenta[linea.slug] || 0) + linea.cantidad;
    });
  });
  return cuenta;
}

/** Pedido especial pagado que todavía no pasa a Ventas: la plata es del cliente hasta entregarlo. */
const ANTICIPO = "Anticipo";
function esAnticipo(fila) {
  return String(fila[COL.enVentas - 1]).indexOf(ANTICIPO) === 0;
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
            producto.estado === ESTADOS.disponible &&
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
  // Si la página manda dos veces el mismo intento (doble toque, mala señal), se
  // devuelve el pedido que ya se anotó en vez de hacer otro.
  const intento = texto(datos.intento, 60).replace(/[^\w-]/g, "");
  const memoria = CacheService.getScriptCache();
  if (intento) {
    const anterior = memoria.get("intento-" + intento);
    if (anterior) return JSON.parse(anterior);
  }
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
  // Envío entre tiendas: una tienda de la lista tiene precio fijo; "otra" se cuadra por WhatsApp.
  const tienda = envio.pideTienda ? CONFIG.tiendas[texto(datos.tienda, 60)] : null;
  const aparte = Boolean(envio.pideTienda && !tienda);
  if (envio.pideTienda && !tienda && texto(datos.tienda, 60) !== "otra") {
    return { ok: false, error: "Elegí en cuál tienda lo retirás." };
  }
  const direccion = tienda
    ? tienda.nombre + " (" + tienda.detalle + ")"
    : envio.pideDireccion || envio.pideTienda
      ? texto(datos.direccion, 250)
      : "Retiro coordinado por WhatsApp";
  if (envio.pideDireccion && (!ubicacion || !direccion)) {
    return { ok: false, error: "Falta la dirección de entrega." };
  }
  if (aparte && direccion.length < 3) {
    return { ok: false, error: "Escribí a qué tienda te lo enviamos." };
  }

  const filas = filasDePedidos();
  const productos = productosPorSlug();
  const reservado = apartados(filas);
  const lineas = [];
  let gramos = 0;
  // Un pedido especial va solo, con las condiciones aceptadas: no se mezcla con lo del mezzanine.
  const traeEspecial = pedidas.some((pedida) => (productos[texto(pedida.slug, 200)] || {}).estado === ESTADOS.pedidoEspecial);
  if (traeEspecial) {
    if (pedidas.length !== 1) {
      return { ok: false, error: "El pedido especial va en un pedido aparte: dejalo solo en el carrito." };
    }
    if (datos.aceptaCondiciones !== CONDICIONES_ESPECIAL) {
      return { ok: false, error: "Para hacer un pedido especial tenés que aceptar sus condiciones." };
    }
  }

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
    const especial = producto.estado === ESTADOS.pedidoEspecial;
    if (!especial && producto.estado !== ESTADOS.disponible && producto.estado !== ESTADOS.agotado) {
      return { ok: false, agotado: slug, error: producto.nombre + " no se puede comprar por ahora (" + producto.estado.toLowerCase() + "). Quitalo del carrito para seguir." };
    }
    const hay = (especial ? producto.cupos : producto.stock) - (reservado[slug] || 0);
    if (cantidad > hay) {
      return {
        ok: false,
        agotado: slug,
        error: especial ? "Ya no quedan cupos de " + producto.nombre + " para este pedido especial." : "Se acaba de agotar: " + producto.nombre + ".",
      };
    }
    gramos += producto.peso * cantidad;
    lineas.push({
      slug,
      nombre: producto.nombre,
      cantidad,
      precio: producto.precioCobrado,
      ...(especial ? { especial: true, llega: fechaIso(producto.llegada) } : {}),
      quedan: hay - cantidad,
    });
  }
  aplicarOfertas(lineas, ofertasVigentes(productos));

  const subtotal = lineas.reduce((suma, linea) => suma + linea.precio * linea.cantidad, 0);
  const descuento = calcularDescuento(datos.cupon, subtotal);
  const tarifa = envio.pideDireccion ? costoDeCorreos(ubicacion, gramos) : 0;
  // El envío entre tiendas lo pagamos al mandarlo: no entra en el envío gratis.
  const costoEnvio = envio.pideTienda
    ? (tienda ? tienda.precio : 0)
    : subtotal >= CONFIG.envioGratisDesde ? 0 : tarifa;
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
  // Eligió tarjeta en la página: el pago se confirma solo cuando PayPal cobra.
  const conTarjeta = datos.metodo === "tarjeta" && !aparte && llavesPaypal().listo;
  fila[COL.metodoPago - 1] = conTarjeta ? METODO_TARJETA : CONFIG.metodoPago;
  const cupon = descuento ? texto(datos.cupon, 30).toUpperCase() : "";
  fila[COL.detalle - 1] = comoTexto(JSON.stringify({ lineas, subtotal, descuento, cupon }));
  fila[COL.clave - 1] = clave;
  if (traeEspecial) {
    fila[COL.notas - 1] = "Pedido especial con pago anticipado. Aceptó las condiciones (" + CONDICIONES_ESPECIAL + ") el " + fechaLegible(fila[COL.fecha - 1]) + ".";
  }
  hoja(HOJAS.pedidos).appendRow(fila);
  if (traeEspecial) anotarPedidoEspecial(fila, lineas[0]);
  olvidarStock();
  try {
    anotarCarrito(
      texto(datos.carrito, 40),
      {
        resumen: lineas.map((linea) => linea.cantidad + " × " + linea.nombre).join("\n"),
        unidades: lineas.reduce((suma, linea) => suma + linea.cantidad, 0),
        total: subtotal - descuento,
        estado: "Pidió " + numero,
      },
      true,
    );
  } catch (error) {
    // La pestaña Carritos es solo para mirar: nunca debe frenar un pedido.
    console.error(error);
  }

  const montos = resumenDeMontos(subtotal, descuento, cupon, costoEnvio, total, aparte);
  const masEnvio = aparte ? " más el envío" : "";
  const especial = entregaEspecial(lineas);
  const despacho = envio.despacho && !especial ? textoDespacho(fila[COL.fecha - 1]) : "";
  const entrega = datosDeEntrega(envio, envio.nombre, ubicacion, direccion, despacho, aparte, especial);

  avisar(
    "Nuevo pedido " + numero + " · " + colones(total) + " · " + cliente,
    [
      conTarjeta
        ? "Entró un pedido nuevo. Eligió pagar con tarjeta (PayPal): si paga, pasa solo a " + PAGADO_PAYPAL + "."
        : "Entró un pedido nuevo. Falta confirmar el SINPE.",
      "",
      "Pedido: " + numero,
      "Cliente: " + cliente,
      "WhatsApp: " + whatsapp,
      correo ? "Correo: " + correo : "",
      "Envío: " + envio.nombre,
      envio.pideDireccion ? "Dirección: " + ubicacion + ". " + direccion : "",
      envio.pideTienda ? "Tienda: " + direccion : "",
      "",
      resumen,
      "",
      "Subtotal: " + colones(subtotal),
      descuento ? "Descuento: " + colones(descuento) : "",
      aparte
        ? "Envío: varía según la tienda. Confirmale el monto por WhatsApp; va en el mismo SINPE."
        : "Envío: " + colones(costoEnvio),
      "Total a recibir por SINPE: " + colones(total) + masEnvio,
      especial ? "Trae un pedido especial: se entrega " + especial + "." : "",
      "",
      "Cuando el SINPE entre, cambiá el Estado a Pagado en la pestaña Pedidos web.",
    ],
    correo,
    correoConDiseno({
      etiqueta: "Pedido nuevo",
      numero,
      fecha: fila[COL.fecha - 1],
      total,
      rotuloTotal: aparte ? "Productos (falta sumar el envío)" : "Total a recibir por SINPE",
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
      pasos: (aparte
        ? ["Escribile por WhatsApp con el costo del envío entre tiendas. El SINPE debe ser " + colones(total) + " más ese envío."]
        : []
      ).concat(conTarjeta ? [
        "Eligió pagar con tarjeta: cuando PayPal cobre, el pedido pasa solo a " + PAGADO_PAYPAL + " y a Ventas, y te llega otro correo.",
        "Si en un rato no paga, escribile por WhatsApp: también puede pagar por SINPE.",
      ] : [
        "Esperá el comprobante del cliente. Te llega en otro correo.",
        "Revisá en tu banco que entró el monto exacto, con " + numero + " en el detalle.",
        "Cambiá el Estado a Pagado en Pedidos web. La venta pasa sola a Ventas.",
      ]).concat([
        especial
          ? "Trae un pedido especial: entregalo " + especial + ". Si al final no se consigue, devolvele el 100% por el mismo medio con que pagó (SINPE o PayPal)."
          : despacho
            ? "Si paga a tiempo, despachalo el " + despacho + ". Antes de enviarlo, tomale fotos al producto y al empaque y mandáselas por WhatsApp."
            : "Escribile por WhatsApp para coordinar la entrega.",
      ]),
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
    precioAparte: aparte,
    despacho,
    especial,
    conTarjeta,
  });

  const respuesta = { ok: true, numero, clave, subtotal, descuento, costoEnvio, total, lineas };
  if (intento) {
    try {
      memoria.put("intento-" + intento, JSON.stringify(respuesta), 6 * 3600);
    } catch (error) {
      console.error(error);
    }
  }
  return respuesta;
}

function esRetiro(fila) {
  return fila[COL.envio - 1] === CONFIG.envios["retiro-omni"].nombre;
}

/** La opción de envío por el nombre que queda en Pedidos web. */
function envioPorNombre(nombre) {
  return Object.values(CONFIG.envios).find((envio) => envio.nombre === nombre) || {};
}

/** Envío a una tienda fuera de la lista: su costo se cuadró por WhatsApp y no está en el total. */
function envioAparte(fila) {
  return Boolean(envioPorNombre(fila[COL.envio - 1]).pideTienda && !Number(fila[COL.costoEnvio - 1]));
}

// Con mayúscula: así escribe la tienda los días y los meses.
const DIAS = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
// Días que faltan para despachar según el día del pedido (1 es lunes, 7 domingo).
const FALTAN_PARA_DESPACHO = { 1: 2, 2: 1, 3: 3, 4: 2, 5: 1, 6: 4, 7: 3 };

/**
 * Los envíos salen los miércoles y sábados: lo que se pide de sábado a martes
 * sale el miércoles, y de miércoles a viernes, el sábado. Debe calcular igual
 * que diaDeDespacho en lib/tienda.ts.
 */
function diaDeDespacho(desde) {
  const zona = libro().getSpreadsheetTimeZone();
  const dia = Number(Utilities.formatDate(new Date(desde), zona, "u"));
  return new Date(new Date(desde).getTime() + FALTAN_PARA_DESPACHO[dia] * 86400000);
}

/** La fecha de la hoja como "2026-12-05", para guardarla en el detalle del pedido. */
function fechaIso(valor) {
  if (!valor) return "";
  const fecha = valor instanceof Date ? valor : new Date(valor);
  if (isNaN(fecha.getTime())) return "";
  return Utilities.formatDate(fecha, libro().getSpreadsheetTimeZone(), "yyyy-MM-dd");
}

/**
 * "a más tardar el 5/12" si el pedido trae algo de pedido especial, "" si no. Con
 * varios, vale la fecha más tardía: todo se entrega junto.
 */
function entregaEspecial(lineas) {
  const especiales = (lineas || []).filter((linea) => linea.especial);
  if (especiales.length === 0) return "";
  const fechas = especiales.map((linea) => linea.llega).filter(Boolean).sort();
  if (fechas.length === 0) return "cuando llegue";
  const [anio, mes, dia] = fechas[fechas.length - 1].split("-");
  return "a más tardar el " + Number(dia) + "/" + Number(mes);
}

/** "Miércoles 11/11". */
function textoDespacho(desde) {
  const zona = libro().getSpreadsheetTimeZone();
  const fecha = diaDeDespacho(desde);
  return DIAS[Number(Utilities.formatDate(fecha, zona, "u"))] + " " + Utilities.formatDate(fecha, zona, "d/M");
}

function datosDeEntrega(envio, nombre, ubicacion, direccion, despacho, aparte, especial) {
  return [
    ["Método", nombre],
    ["Dirección", envio.pideDireccion ? ubicacion + ". " + direccion : ""],
    ["Tienda", envio.pideTienda ? direccion : ""],
    ["Costo del envío", aparte ? "Varía según la tienda, se confirma por WhatsApp" : ""],
    ["Sale el", despacho || ""],
    ["Se entrega", especial ? especial.charAt(0).toUpperCase() + especial.slice(1) + " (de Estados Unidos)" : ""],
  ];
}

/** El día de despacho se cuenta desde hoy: si el pago llegó tarde, sale en el siguiente. */
function entregaDeFila(fila) {
  const nombre = fila[COL.envio - 1];
  const envio = envioPorNombre(nombre);
  const especial = entregaEspecial(leerDetalle(fila).lineas);
  return datosDeEntrega(
    envio,
    nombre,
    fila[COL.ubicacion - 1],
    fila[COL.direccion - 1],
    envio.despacho && !especial ? textoDespacho(new Date()) : "",
    envioAparte(fila),
    especial,
  );
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
  const aparte = envioAparte(fila);
  avisar(
    "Comprobante de " + numero + " · " + colones(fila[COL.total - 1]) + " · " + cliente,
    [
      "El cliente dice que ya pagó. Revisá que el SINPE haya entrado.",
      "",
      "Pedido: " + numero,
      "Cliente: " + cliente,
      "WhatsApp: " + fila[COL.whatsapp - 1],
      "Comprobante SINPE: " + comprobante,
      "Monto que debió entrar: " + colones(fila[COL.total - 1]) + (aparte ? " más el envío que le confirmaste" : ""),
      "",
      "Si entró, cambiá el Estado a Pagado en la pestaña Pedidos web.",
    ],
    "",
    correoConDiseno({
      etiqueta: "Comprobante recibido",
      numero,
      fecha: fila[COL.fecha - 1],
      total: fila[COL.total - 1],
      rotuloTotal: aparte ? "Productos (más el envío que le confirmaste)" : "Monto que debió entrar",
      caja: datosDePago(numero, fila[COL.fecha - 1], comprobante),
      cliente: [
        ["Nombre", cliente],
        ["WhatsApp", fila[COL.whatsapp - 1]],
        ["Correo", fila[COL.correo - 1]],
      ],
      entrega: entregaDeFila(fila),
      lineas: detalle.lineas.map(({ quedan, ...linea }) => linea),
      resumen: resumenDeMontos(detalle.subtotal, detalle.descuento, detalle.cupon, fila[COL.costoEnvio - 1], fila[COL.total - 1], aparte),
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

/* ---------- Carritos: qué tiene la gente en el carrito, sin datos personales ---------- */

// Columnas de "Carritos", contando desde 1.
const COL_CARRITO = { id: 1, empezo: 2, ultima: 3, productos: 4, unidades: 5, total: 6, estado: 7 };
const ABIERTO = "Abierto";
const VACIADO = "Vaciado";

/** La página manda el carrito unos segundos después de cada cambio. Los precios salen de la hoja. */
function guardarCarrito(datos) {
  const pedidas = Array.isArray(datos.lineas) ? datos.lineas.slice(0, CONFIG.maxLineasPorPedido) : [];
  const productos = productosPorSlug();
  const lineas = [];
  pedidas.forEach((pedida) => {
    const producto = productos[texto(pedida && pedida.slug, 200)];
    const cantidad = Math.floor(Number(pedida && pedida.cantidad));
    if (!producto || !Number.isInteger(cantidad) || cantidad < 1) return;
    lineas.push({ slug: producto.slug, nombre: producto.nombre, cantidad: Math.min(cantidad, 99), precio: producto.precioCobrado });
  });
  aplicarOfertas(lineas, ofertasVigentes(productos));
  anotarCarrito(texto(datos.id, 40), {
    resumen: lineas.map((linea) => linea.cantidad + " × " + linea.nombre).join("\n"),
    unidades: lineas.reduce((suma, linea) => suma + linea.cantidad, 0),
    total: lineas.reduce((suma, linea) => suma + linea.precio * linea.cantidad, 0),
    estado: lineas.length ? ABIERTO : VACIADO,
  });
  return { ok: true };
}

/**
 * Una fila por carrito. Un carrito vacío que nunca tuvo nada no se anota, uno
 * vaciado guarda lo último que tuvo, y uno que terminó en pedido ya no cambia
 * salvo que lo marque el pedido mismo (`desdePedido`).
 */
function anotarCarrito(id, { resumen, unidades, total, estado }, desdePedido) {
  if (!/^[a-z0-9-]{8,40}$/.test(id)) return;
  const pestana = hoja(HOJAS.carritos);
  if (!pestana) return;
  const ultima = pestana.getLastRow();
  const ids = ultima >= PRIMERA_FILA ? pestana.getRange(PRIMERA_FILA, 1, ultima - PRIMERA_FILA + 1, 1).getValues() : [];
  const indice = ids.findIndex(([valor]) => String(valor) === id);
  const ahora = new Date();

  if (indice === -1) {
    if (estado === VACIADO) return;
    pestana.appendRow([id, ahora, ahora, comoTexto(resumen), unidades, total, estado]);
    return;
  }
  const fila = PRIMERA_FILA + indice;
  const anterior = String(pestana.getRange(fila, COL_CARRITO.estado, 1, 1).getValues()[0][0]);
  if (anterior.indexOf("Pidió") === 0 && !desdePedido) return;
  if (estado === VACIADO) {
    pestana.getRange(fila, COL_CARRITO.ultima, 1, 1).setValues([[ahora]]);
    pestana.getRange(fila, COL_CARRITO.estado, 1, 1).setValues([[estado]]);
    return;
  }
  pestana
    .getRange(fila, COL_CARRITO.ultima, 1, 5)
    .setValues([[ahora, comoTexto(resumen), unidades, total, estado]]);
}

/**
 * "Danos tu opinión": se guarda en Comentarios y le llega un correo a la tienda.
 * Si viene del correo de "¿Cómo te fue?", trae el pedido y su clave: así se sabe
 * que es una compra real. Sale en la portada solo si la persona dio permiso y
 * además alguien de la tienda pone sí en Publicar.
 */
function guardarComentario(datos) {
  const comentario = texto(datos.comentario, 1000);
  const calificacion = Math.floor(Number(datos.calificacion));
  const estrellas = calificacion >= 1 && calificacion <= 5 ? calificacion : "";
  const nombre = texto(datos.nombre, 80);
  const contacto = texto(datos.contacto, 120);
  if (comentario.length < 3) return { ok: false, error: "Escribí tu comentario." };
  const pestana = hoja(HOJAS.comentarios);
  if (!pestana) return { ok: false, error: "No pudimos guardarlo." };
  const pedido = pedidoVerificado(datos.pedido, datos.clave);
  const permiso = datos.permiso === true;
  pestana.appendRow([
    new Date(),
    estrellas,
    comoTexto(comentario),
    comoTexto(nombre),
    comoTexto(contacto),
    permiso ? "sí" : "no",
    "",
    pedido,
  ]);
  avisar(
    "Comentario nuevo" + (estrellas ? " · " + "★".repeat(estrellas) + "☆".repeat(5 - estrellas) : ""),
    [
      pedido ? "El cliente del pedido " + pedido + " dejó su opinión." : "Alguien dejó un comentario en la página.",
      "",
      estrellas ? "Calificación: " + estrellas + " de 5" : "",
      "Comentario: " + comentario,
      nombre ? "Nombre: " + nombre : "",
      contacto ? "Contacto: " + contacto : "",
      "",
      permiso
        ? "Dio permiso para mostrarlo. Si querés que salga en la portada, poné sí en la columna Publicar de la pestaña Comentarios."
        : "No dio permiso para mostrarlo en la página. Está en la pestaña Comentarios.",
    ],
    esCorreo(contacto) ? contacto : "",
  );
  return { ok: true };
}

/** El número del pedido si la clave calza; si no, vacío. */
function pedidoVerificado(numero, clave) {
  if (!numero || !clave) return "";
  const hallado = buscarFilaDePedido(numero);
  if (!hallado || hallado.fila[COL.clave - 1] !== texto(clave, 60)) return "";
  return hallado.fila[COL.numero - 1];
}

/** Con permiso y sí en Publicar, de la más nueva a la más vieja. Solo el primer nombre. */
function opinionesPublicadas() {
  const pestana = hoja(HOJAS.comentarios);
  if (!pestana || pestana.getLastRow() < PRIMERA_FILA) return [];
  const esSi = (valor) => /^s[ií]$/i.test(String(valor).trim());
  return pestana
    .getRange(PRIMERA_FILA, 1, pestana.getLastRow() - PRIMERA_FILA + 1, 8)
    .getValues()
    .filter((fila) => esSi(fila[5]) && esSi(fila[6]) && String(fila[2]).trim())
    .reverse()
    .slice(0, 12)
    .map((fila) => ({
      fecha: fila[0] instanceof Date ? Utilities.formatDate(fila[0], "UTC", "yyyy-MM-dd") : "",
      estrellas: Number(fila[1]) || 0,
      comentario: sinApostrofe(fila[2]),
      nombre: sinApostrofe(fila[3]).trim().split(/\s+/)[0] || "",
      compra: Boolean(String(fila[7]).trim()),
    }));
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

/* ---------- Avisame cuando vuelva ---------- */

// Columnas de "Avisos de stock", contando desde 1.
const COL_AVISO = { fecha: 1, producto: 2, nombre: 3, contacto: 4, estado: 5, avisado: 6, slug: 7 };
const ESPERANDO = "Esperando";
const AVISADO_POR_CORREO = "Avisado por correo";
const AVISALE_POR_WHATSAPP = "Avisale por WhatsApp";

/** Un producto agotado: la persona deja su correo o WhatsApp para el aviso. */
function guardarAviso(datos) {
  const pestana = hoja(HOJAS.avisos);
  if (!pestana) return { ok: false, error: "No pudimos guardarlo." };
  const producto = productosPorSlug()[texto(datos.slug, 200)];
  if (!producto) return { ok: false, error: "Ese producto ya no está en la página." };
  const nombre = texto(datos.nombre, 80);
  const escrito = texto(datos.contacto, 120);
  const contacto = esCorreo(escrito) ? escrito.toLowerCase() : normalizarWhatsapp(escrito);
  if (!contacto) return { ok: false, error: "Escribí un correo o un WhatsApp de 8 números." };

  const repetido = filasDeAvisos(pestana).some(
    ({ valores }) =>
      valores[COL_AVISO.estado - 1] === ESPERANDO &&
      valores[COL_AVISO.slug - 1] === producto.slug &&
      sinApostrofe(valores[COL_AVISO.contacto - 1]).toLowerCase() === contacto,
  );
  if (!repetido) {
    pestana.appendRow([
      new Date(),
      comoTexto(producto.nombre),
      comoTexto(nombre),
      comoTexto(contacto),
      ESPERANDO,
      "",
      producto.slug,
    ]);
  }
  return { ok: true, porCorreo: esCorreo(contacto) };
}

function filasDeAvisos(pestana) {
  const ultima = pestana.getLastRow();
  if (ultima < PRIMERA_FILA) return [];
  return pestana
    .getRange(PRIMERA_FILA, 1, ultima - PRIMERA_FILA + 1, 7)
    .getValues()
    .map((valores, indice) => ({ fila: PRIMERA_FILA + indice, valores }));
}

/**
 * Le escribe a quien esperaba un producto que volvió a haber (stock menos lo
 * apartado). Corre con cada edición de Compras, Ventas, Catálogo web o Pedidos
 * web, y cada hora por los apartados que vencen solos. Los que dejaron WhatsApp
 * le llegan a la tienda en un solo correo, con el mensaje listo para mandar.
 */
function revisarAvisos() {
  const pestana = hoja(HOJAS.avisos);
  if (!pestana) return;
  const esperando = filasDeAvisos(pestana).filter(
    ({ valores }) => valores[COL_AVISO.estado - 1] === ESPERANDO,
  );
  if (esperando.length === 0) return;

  const productos = productosPorSlug();
  const reservado = apartados(filasDePedidos());
  const hay = (slug) => productos[slug] && productos[slug].stock - (reservado[slug] || 0) > 0;
  const ahora = new Date();
  const porWhatsapp = [];
  let correos = 0;

  esperando.forEach(({ fila, valores }) => {
    const producto = productos[valores[COL_AVISO.slug - 1]];
    if (!hay(valores[COL_AVISO.slug - 1])) return;
    const nombre = sinApostrofe(valores[COL_AVISO.nombre - 1]);
    const contacto = sinApostrofe(valores[COL_AVISO.contacto - 1]);
    let estado = AVISALE_POR_WHATSAPP;
    if (esCorreo(contacto)) {
      if (correos >= CONFIG.maxCorreosPorRevision) return;
      if (!avisarQueVolvio(contacto, nombre, producto)) return;
      correos += 1;
      estado = AVISADO_POR_CORREO;
    } else {
      porWhatsapp.push({ nombre, contacto, producto });
    }
    pestana.getRange(fila, COL_AVISO.estado, 1, 2).setValues([[estado, ahora]]);
  });
  if (porWhatsapp.length > 0) avisarWhatsappsPendientes(porWhatsapp);
}

function avisarQueVolvio(correo, nombre, producto) {
  const enlace = sitio() + "producto/" + producto.slug;
  const saludo = nombre ? "¡Hola " + nombre.split(" ")[0] + "!" : "¡Hola!";
  const parrafos = [
    saludo + " Nos pediste que te avisáramos: " + producto.nombre + " ya está otra vez en la página, a " + colones(producto.precio) + ".",
    "Quedan pocas unidades, así que si lo querés, no te durmás.",
  ];
  const pie = "Es un solo aviso: no te vamos a escribir más por esto. Tus datos son solo para este aviso.";
  return mandarAlCliente({
    to: correo,
    subject: "¡Volvió " + producto.nombre + "! · " + CONFIG.nombreTienda,
    body: [...parrafos, "", enlace, "", pie].join("\n"),
    htmlBody: correoSencillo({
      etiqueta: "Volvió",
      titulo: producto.nombre,
      parrafos,
      botones: [botonDeCorreo("Verlo en la página", enlace, "#c9201c")],
      pie,
    }),
  });
}

/** A la tienda: un botón de WhatsApp por persona, con el mensaje ya escrito. */
function avisarWhatsappsPendientes(lista) {
  const enlaces = lista.map(({ nombre, contacto, producto }) => {
    const mensaje =
      "¡Hola" + (nombre ? " " + nombre.split(" ")[0] : "") + "! Te escribimos de " + CONFIG.nombreTienda +
      ": ya volvió " + producto.nombre + ", a " + colones(producto.precio) + ". Lo ves aquí: " +
      sitio() + "producto/" + producto.slug;
    return {
      texto: (nombre || contacto) + " · " + producto.nombre,
      enlace: "https://wa.me/506" + soloDigitos(contacto) + "?text=" + encodeURIComponent(mensaje),
    };
  });
  const parrafos = [
    "Estas personas pidieron que les avisáramos y dejaron WhatsApp. Tocá cada botón: el mensaje ya va escrito.",
    "Cuando les escribás, cambiá el Estado a Avisado en la pestaña Avisos de stock.",
  ];
  avisar(
    "Volvieron productos: avisale a " + lista.length + " por WhatsApp",
    [...parrafos, "", ...enlaces.map(({ texto: rotulo, enlace }) => rotulo + ": " + enlace)],
    "",
    correoSencillo({
      etiqueta: "Avisos de stock",
      titulo: "Avisales por WhatsApp",
      parrafos,
      botones: enlaces.map(({ texto: rotulo, enlace }) => botonDeCorreo(rotulo, enlace, "#127a43")),
      pie: "Aviso automático de la tienda.",
    }),
  );
}

/* ---------- Lo más visto: cuántas veces se ve y se agrega cada producto ---------- */

// Columnas de "Lo más visto", contando desde 1.
const COL_VISTO = { producto: 1, vistas: 2, carrito: 3, ultima: 4, slug: 5, whatsapp: 6 };
const CLAVE_NOMBRES = "nombres-productos";

/** Nombre de cada producto publicado, guardado un rato para no leer el catálogo con cada visita. */
function nombresDeProductos() {
  const memoria = CacheService.getScriptCache();
  const guardado = memoria.get(CLAVE_NOMBRES);
  if (guardado) return JSON.parse(guardado);
  const nombres = {};
  Object.values(productosPorSlug()).forEach((producto) => {
    nombres[producto.slug] = producto.nombre;
  });
  try {
    memoria.put(CLAVE_NOMBRES, JSON.stringify(nombres), 6 * 3600);
  } catch (error) {
    console.error(error);
  }
  return nombres;
}

/** La columna de consultas por WhatsApp llegó después: si la pestaña no la tiene, se la pone. */
function prepararColumnaWhatsapp(pestana) {
  if (pestana.getMaxColumns() < COL_VISTO.whatsapp) pestana.insertColumnAfter(COL_VISTO.whatsapp - 1);
  const titulo = pestana.getRange(PRIMERA_FILA - 1, COL_VISTO.whatsapp);
  if (!titulo.getValue()) titulo.setValue("Consultas por WhatsApp");
}

/**
 * La página manda una "vista" al abrir un producto, un "carrito" al agregarlo y
 * un "whatsapp" al tocar el botón de preguntar o apartar por WhatsApp, una vez
 * al día por navegador.
 */
function anotarVisto(datos) {
  const slug = texto(datos.slug, 200);
  const nombre = nombresDeProductos()[slug];
  const columnas = { vista: COL_VISTO.vistas, carrito: COL_VISTO.carrito, whatsapp: COL_VISTO.whatsapp };
  const columna = Object.prototype.hasOwnProperty.call(columnas, datos.tipo) ? columnas[datos.tipo] : 0;
  const pestana = hoja(HOJAS.masVistos);
  if (!nombre || !columna || !pestana) return { ok: false };
  if (columna === COL_VISTO.whatsapp) prepararColumnaWhatsapp(pestana);

  const ultima = pestana.getLastRow();
  const slugs =
    ultima >= PRIMERA_FILA
      ? pestana.getRange(PRIMERA_FILA, COL_VISTO.slug, ultima - PRIMERA_FILA + 1, 1).getValues()
      : [];
  const indice = slugs.findIndex(([valor]) => valor === slug);
  const ahora = new Date();
  if (indice === -1) {
    pestana.appendRow([
      comoTexto(nombre),
      columna === COL_VISTO.vistas ? 1 : 0,
      columna === COL_VISTO.carrito ? 1 : 0,
      ahora,
      slug,
    ].concat(columna === COL_VISTO.whatsapp ? [1] : []));
    return { ok: true };
  }
  const fila = PRIMERA_FILA + indice;
  const celda = pestana.getRange(fila, columna);
  celda.setValue((Number(celda.getValue()) || 0) + 1);
  pestana.getRange(fila, COL_VISTO.ultima).setValue(ahora);
  return { ok: true };
}

/** Para la portada: agregar al carrito pesa como tres vistas. */
function listaMasVistos() {
  const pestana = hoja(HOJAS.masVistos);
  if (!pestana || pestana.getLastRow() < PRIMERA_FILA) return [];
  const puntos = (producto) => producto.vistas + 3 * producto.agregados;
  return pestana
    .getRange(PRIMERA_FILA, 1, pestana.getLastRow() - PRIMERA_FILA + 1, 5)
    .getValues()
    .filter((fila) => fila[COL_VISTO.slug - 1])
    .map((fila) => ({
      slug: String(fila[COL_VISTO.slug - 1]),
      vistas: Number(fila[COL_VISTO.vistas - 1]) || 0,
      agregados: Number(fila[COL_VISTO.carrito - 1]) || 0,
    }))
    .sort((a, b) => puntos(b) - puntos(a))
    .slice(0, 40);
}

/* ---------- Pestañas que este script lleva solo ---------- */

/** Si la pestaña no existe todavía, la crea con sus títulos en la fila 4. */
function pestanaCon(nombre, ayuda, columnas) {
  const existente = hoja(nombre);
  if (existente) return existente;
  // De última, para no mover las pestañas de siempre.
  const nueva = libro().insertSheet(nombre, libro().getNumSheets());
  nueva.getRange(1, 1).setValue(nombre);
  nueva.getRange(2, 1).setValue(ayuda);
  nueva.getRange(PRIMERA_FILA - 1, 1, 1, columnas.length).setValues([columnas]);
  nueva.setFrozenRows(PRIMERA_FILA - 1);
  return nueva;
}

/* ---------- Pokedeke Busca ---------- */

// Columnas de "Solicitudes", contando desde 1.
const COL_SOLICITUD = { fecha: 1, producto: 2, cantidad: 3, detalle: 4, presupuesto: 5, origen: 6, estado: 7, notas: 8, slug: 9 };
const TITULOS_SOLICITUD = ["Fecha", "Qué busca", "Cantidad", "Enlace o detalle", "Presupuesto", "De dónde llegó", "Estado", "Notas", "Producto del catálogo"];
const AYUDA_SOLICITUDES =
  "Lo que la gente pide en Pokedeke Busca. La conversación sigue por WhatsApp; aquí queda qué se pidió. Cambiá el Estado a mano: Nueva, Revisando, Cotizada y al final Conseguida, No disponible o Cerrada. Nada se compra solo: cada solicitud la revisa una persona.";
// En orden: así se ve en el menú de la columna Estado.
const ESTADOS_SOLICITUD = ["Nueva", "Revisando", "Cotizada", "Conseguida", "No disponible", "Cerrada"];
const SOLICITUD_NUEVA = "Nueva";
const CLAVE_SOLICITUDES = "solicitudes-avisadas";
const ORIGENES = {
  portada: "Portada",
  busca: "Página Pokedeke Busca",
  catalogo: "Catálogo sin resultados",
  buscador: "Buscador sin resultados",
  agotado: "Producto agotado",
  consultar: "Producto por consultar",
  camino: "Producto en camino",
  eeuu: "Catálogo de Estados Unidos",
};

/** La columna del producto llegó después: si la pestaña no la tiene, se la pone. */
function prepararColumnaSolicitud(pestana) {
  if (pestana.getMaxColumns() < COL_SOLICITUD.slug) pestana.insertColumnAfter(COL_SOLICITUD.slug - 1);
  const titulo = pestana.getRange(PRIMERA_FILA - 1, COL_SOLICITUD.slug);
  if (!titulo.getValue()) titulo.setValue(TITULOS_SOLICITUD[COL_SOLICITUD.slug - 1]);
}

/**
 * "¿Buscás algo que no está aquí?": queda anotado aunque la persona no llegue a
 * mandar el WhatsApp. No lleva nombre ni contacto: la conversación sigue por
 * WhatsApp y aquí queda qué se está pidiendo. Nunca promete nada: la tienda
 * revisa y confirma disponibilidad y precio.
 */
function guardarSolicitud(datos) {
  const producto = texto(datos.producto, 150);
  if (producto.length < 3) return { ok: false, error: "Decinos qué producto andás buscando." };
  const cantidad = Math.min(Math.max(Math.floor(Number(datos.cantidad)) || 1, 1), 99);
  const origen = Object.prototype.hasOwnProperty.call(ORIGENES, datos.origen) ? ORIGENES[datos.origen] : "Otro";
  // Si viene de la ficha de un producto, queda con cuál: así cuenta en su demanda.
  const slug = aSlug(texto(datos.slug, 200));
  const pestana = pestanaCon(HOJAS.solicitudes, AYUDA_SOLICITUDES, TITULOS_SOLICITUD);
  prepararColumnaSolicitud(pestana);
  pestana.appendRow([
    new Date(),
    comoTexto(producto),
    cantidad,
    comoTexto(texto(datos.detalle, 300)),
    comoTexto(texto(datos.presupuesto, 40)),
    origen,
    SOLICITUD_NUEVA,
    "",
    slug && nombresDeProductos()[slug] ? slug : "",
  ]);
  return { ok: true };
}

/** Una vez por hora: si entraron solicitudes, un solo correo a la tienda con todas. */
function avisarSolicitudesNuevas() {
  const pestana = hoja(HOJAS.solicitudes);
  if (!pestana) return;
  const propiedades = PropertiesService.getScriptProperties();
  const ultima = pestana.getLastRow();
  const avisadas = Math.max(Number(propiedades.getProperty(CLAVE_SOLICITUDES)) || 0, PRIMERA_FILA - 1);
  if (ultima === avisadas) return;
  propiedades.setProperty(CLAVE_SOLICITUDES, String(ultima));
  // Si borraron filas, se empieza a contar desde donde quedó la pestaña.
  if (ultima < avisadas) return;
  const nuevas = pestana
    .getRange(avisadas + 1, 1, ultima - avisadas, COL_SOLICITUD.notas)
    .getValues()
    .filter((fila) => fila[COL_SOLICITUD.producto - 1]);
  if (nuevas.length === 0) return;

  const lineas = nuevas.slice(0, 20).map((fila) => {
    const extras = [
      fila[COL_SOLICITUD.detalle - 1] ? "detalle: " + fila[COL_SOLICITUD.detalle - 1] : "",
      fila[COL_SOLICITUD.presupuesto - 1] ? "presupuesto: " + fila[COL_SOLICITUD.presupuesto - 1] : "",
      String(fila[COL_SOLICITUD.origen - 1]),
    ].filter(Boolean);
    return fila[COL_SOLICITUD.cantidad - 1] + " × " + fila[COL_SOLICITUD.producto - 1] + " (" + extras.join("; ") + ")";
  });
  const titulo =
    nuevas.length === 1
      ? "Hay 1 solicitud nueva en Pokedeke Busca"
      : "Hay " + nuevas.length + " solicitudes nuevas en Pokedeke Busca";
  const cierre = "Quien la mandó sigue por WhatsApp. Si no escribió, igual queda como señal de qué anda buscando la gente.";
  avisar(
    titulo + " · " + CONFIG.nombreTienda,
    [titulo + ":", ""].concat(lineas).concat(["", cierre]),
    null,
    correoSencillo({
      etiqueta: "Pokedeke Busca",
      titulo,
      parrafos: lineas.concat([cierre]),
      botones: [botonDeCorreo("Abrir Solicitudes", libro().getUrl() + "#gid=" + pestana.getSheetId(), "#1437a8")],
      pie: "Este correo sale como mucho una vez por hora, solo si entró algo.",
    }),
  );
}

/* ---------- Qué busca la gente ---------- */

// Columnas de "Búsquedas", contando desde 1.
const COL_BUSQUEDA = { termino: 1, veces: 2, sinResultado: 3, resultados: 4, ultima: 5 };
const TITULOS_BUSQUEDA = ["Lo que buscaron", "Veces", "Veces sin resultados", "Productos que salieron la última vez", "Última vez"];
const AYUDA_BUSQUEDAS =
  "Lo que la gente escribe en el buscador y en el catálogo. Una fila por búsqueda, sin datos de quién buscó. Lo que tiene muchas veces sin resultados es lo que la gente quiere y no tenemos.";

/** "Charizárd  EX " y "charizard ex" son la misma búsqueda. */
function terminoDeBusqueda(valor) {
  return texto(valor, 80)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9#/&.' -]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
}

/**
 * La página avisa qué se buscó y cuántos productos salieron, una vez al día por
 * navegador y búsqueda.
 */
function anotarBusqueda(datos) {
  const termino = terminoDeBusqueda(datos.texto);
  if (termino.length < 3) return { ok: false };
  const resultados = Math.min(Math.max(Math.floor(Number(datos.resultados)) || 0, 0), 9999);
  const pestana = pestanaCon(HOJAS.busquedas, AYUDA_BUSQUEDAS, TITULOS_BUSQUEDA);
  const cuantos = Math.max(pestana.getLastRow() - PRIMERA_FILA + 1, 0);
  const terminos = cuantos ? pestana.getRange(PRIMERA_FILA, COL_BUSQUEDA.termino, cuantos, 1).getValues() : [];
  const indice = terminos.findIndex(([valor]) => String(valor) === termino);
  const ahora = new Date();
  if (indice === -1) {
    if (cuantos >= CONFIG.maxTerminos) return { ok: false };
    pestana.appendRow([comoTexto(termino), 1, resultados === 0 ? 1 : 0, resultados, ahora]);
    return { ok: true };
  }
  const fila = PRIMERA_FILA + indice;
  const cuenta = pestana.getRange(fila, COL_BUSQUEDA.veces, 1, 2).getValues()[0];
  pestana
    .getRange(fila, COL_BUSQUEDA.veces, 1, 4)
    .setValues([[(Number(cuenta[0]) || 0) + 1, (Number(cuenta[1]) || 0) + (resultados === 0 ? 1 : 0), resultados, ahora]]);
  return { ok: true };
}

/* ---------- Demanda: qué quiere la gente ---------- */

const TITULOS_DEMANDA = ["Prioridad", "Qué", "Estado", "Stock", "Vendidas", "Vistas", "Al carrito", "WhatsApp", "Avisame", "Búsquedas sin resultado", "Solicitudes (Busca)", "Última señal", "Sugerencia", "Enlace"];
const AYUDA_DEMANDA =
  "Se llena sola cada hora con lo que pasa en la página. Es una pista para decidir qué revisar y qué publicar, no una orden: con pocos datos puede equivocarse. Una vista o una búsqueda no es una venta: lo vendido de verdad está en la columna Vendidas. No escribás aquí: se borra y se vuelve a llenar.";
// Puntos: una vista vale 1; agregarlo al carrito, 3; preguntar por WhatsApp, 4; pedir aviso o
// pedirlo en Busca, 5; buscarlo sin encontrarlo, 1.
const PUNTOS_ALTA = 10;
const PUNTOS_MEDIA = 4;
const SOLICITUDES_CERRADAS = ["Conseguida", "No disponible", "Cerrada", "No se consiguió"];

function prioridadDe(puntos) {
  return puntos >= PUNTOS_ALTA ? "Alta" : puntos >= PUNTOS_MEDIA ? "Media" : "Baja";
}

function esFecha(valor) {
  return Object.prototype.toString.call(valor) === "[object Date]";
}

function masReciente(actual, otra) {
  if (!esFecha(otra)) return actual;
  return !actual || otra.getTime() > actual.getTime() ? otra : actual;
}

/**
 * Corre sola cada hora: junta en la pestaña Demanda lo que la gente mira, agrega
 * al carrito, pregunta, espera, busca sin encontrar y pide en Busca, con el stock
 * de este momento y una sugerencia. Solo sugiere: comprar o no lo decide la tienda.
 */
function actualizarDemanda() {
  const productos = productosPorSlug();
  const reservado = apartados(filasDePedidos());
  const senales = {};
  const de = (slug) => (senales[slug] = senales[slug] || { vistas: 0, carrito: 0, whatsapp: 0, avisos: 0, solicitudes: 0, ultima: null });

  const vistos = hoja(HOJAS.masVistos);
  if (vistos && vistos.getLastRow() >= PRIMERA_FILA) {
    const columnas = Math.min(vistos.getMaxColumns(), COL_VISTO.whatsapp);
    vistos
      .getRange(PRIMERA_FILA, 1, vistos.getLastRow() - PRIMERA_FILA + 1, columnas)
      .getValues()
      .forEach((fila) => {
        const slug = String(fila[COL_VISTO.slug - 1]);
        if (!slug) return;
        const senal = de(slug);
        senal.vistas += Number(fila[COL_VISTO.vistas - 1]) || 0;
        senal.carrito += Number(fila[COL_VISTO.carrito - 1]) || 0;
        senal.whatsapp += Number(fila[COL_VISTO.whatsapp - 1]) || 0;
        senal.ultima = masReciente(senal.ultima, fila[COL_VISTO.ultima - 1]);
      });
  }
  const avisos = hoja(HOJAS.avisos);
  if (avisos) {
    filasDeAvisos(avisos).forEach(({ valores }) => {
      const slug = String(valores[COL_AVISO.slug - 1]);
      if (!slug || valores[COL_AVISO.estado - 1] !== ESPERANDO) return;
      const senal = de(slug);
      senal.avisos += 1;
      senal.ultima = masReciente(senal.ultima, valores[COL_AVISO.fecha - 1]);
    });
  }

  // Las solicitudes abiertas: las que salieron de la ficha de un producto cuentan para ese producto.
  const sueltas = [];
  const solicitudes = hoja(HOJAS.solicitudes);
  if (solicitudes && solicitudes.getLastRow() >= PRIMERA_FILA) {
    const columnas = Math.min(solicitudes.getMaxColumns(), COL_SOLICITUD.slug);
    solicitudes
      .getRange(PRIMERA_FILA, 1, solicitudes.getLastRow() - PRIMERA_FILA + 1, columnas)
      .getValues()
      .forEach((fila) => {
        if (SOLICITUDES_CERRADAS.includes(String(fila[COL_SOLICITUD.estado - 1]))) return;
        const slug = String(fila[COL_SOLICITUD.slug - 1] || "");
        if (!slug || !productos[slug]) {
          sueltas.push(fila);
          return;
        }
        const senal = de(slug);
        senal.solicitudes += 1;
        senal.ultima = masReciente(senal.ultima, fila[COL_SOLICITUD.fecha - 1]);
      });
  }

  const filas = [];
  const stockDe = (slug) => Math.max(productos[slug].stock - (reservado[slug] || 0), 0);
  Object.keys(senales).forEach((slug) => {
    // Lo que ya no está publicado no se sugiere.
    if (!productos[slug]) return;
    const senal = senales[slug];
    const puntos = senal.vistas + 3 * senal.carrito + 4 * senal.whatsapp + 5 * senal.avisos + 5 * senal.solicitudes;
    if (puntos === 0) return;
    const stock = stockDe(slug);
    const estado = stock > 0 ? ESTADOS.disponible : productos[slug].estado === ESTADOS.disponible ? ESTADOS.agotado : productos[slug].estado;
    const sugerencia =
      estado === ESTADOS.porConsultar
        ? "Es por consultar y hay interés: revisar si se puede conseguir."
        : estado === ESTADOS.enCamino
          ? "Viene en camino y ya hay interés: avisar cuando llegue."
          : estado === ESTADOS.agotado
            ? "Se agotó y lo siguen buscando: revisar si conviene reponerlo."
            : puntos >= PUNTOS_ALTA
              ? "Hay interés y hay stock: darle prioridad en el contenido."
              : "Tiene interés: buen candidato para una publicación.";
    filas.push({
      puntos,
      celdas: [prioridadDe(puntos), comoTexto(productos[slug].nombre), estado, stock, productos[slug].vendidas, senal.vistas, senal.carrito, senal.whatsapp, senal.avisos, "", senal.solicitudes || "", senal.ultima || "", sugerencia, sitio() + "producto/" + slug],
    });
  });

  // Lo que no está en la página: búsquedas que hoy siguen sin dar nada y solicitudes abiertas.
  const fuera = {};
  const deFuera = (termino, nombre) => (fuera[termino] = fuera[termino] || { nombre, sin: 0, solicitudes: 0, ultima: null });
  const busquedas = hoja(HOJAS.busquedas);
  if (busquedas && busquedas.getLastRow() >= PRIMERA_FILA) {
    busquedas
      .getRange(PRIMERA_FILA, 1, busquedas.getLastRow() - PRIMERA_FILA + 1, 5)
      .getValues()
      .forEach((fila) => {
        const termino = String(fila[COL_BUSQUEDA.termino - 1]);
        const sin = Number(fila[COL_BUSQUEDA.sinResultado - 1]) || 0;
        if (!termino || sin === 0 || Number(fila[COL_BUSQUEDA.resultados - 1]) > 0) return;
        const senal = deFuera(termino, termino);
        senal.sin += sin;
        senal.ultima = masReciente(senal.ultima, fila[COL_BUSQUEDA.ultima - 1]);
      });
  }
  sueltas.forEach((fila) => {
    const producto = String(fila[COL_SOLICITUD.producto - 1]);
    const termino = terminoDeBusqueda(producto);
    if (!termino) return;
    const senal = deFuera(termino, producto);
    senal.nombre = producto;
    senal.solicitudes += 1;
    senal.ultima = masReciente(senal.ultima, fila[COL_SOLICITUD.fecha - 1]);
  });
  Object.keys(fuera).forEach((termino) => {
    const senal = fuera[termino];
    const puntos = senal.sin + 5 * senal.solicitudes;
    filas.push({
      puntos,
      celdas: [prioridadDe(puntos), comoTexto(senal.nombre), "No está en la página", "", "", "", "", "", "", senal.sin || "", senal.solicitudes || "", senal.ultima || "",
        senal.solicitudes ? "Lo pidieron en Busca: revisar si se puede conseguir." : "Lo buscan y no está: revisar si se puede conseguir.", ""],
    });
  });
  filas.sort((a, b) => b.puntos - a.puntos);

  // Lo que tiene stock y nadie ha mirado: lo de más valor primero.
  const quietos = Object.keys(productos)
    .filter((slug) => !senales[slug] && stockDe(slug) >= 3)
    .sort((a, b) => productos[b].precio * stockDe(b) - productos[a].precio * stockDe(a))
    .slice(0, 10)
    .map((slug) => ({
      puntos: 0,
      celdas: ["Sin movimiento", comoTexto(productos[slug].nombre), ESTADOS.disponible, stockDe(slug), productos[slug].vendidas, 0, 0, 0, 0, "", "", "", "Tiene stock y nadie lo ha mirado: darle visibilidad con contenido.", sitio() + "producto/" + slug],
    }));

  const todas = filas.concat(quietos).map((fila) => fila.celdas);
  const pestana = pestanaCon(HOJAS.demanda, AYUDA_DEMANDA, TITULOS_DEMANDA);
  // Los títulos se reescriben: la pestaña pudo nacer con una versión vieja de las columnas.
  pestana.getRange(2, 1).setValue(AYUDA_DEMANDA);
  pestana.getRange(PRIMERA_FILA - 1, 1, 1, TITULOS_DEMANDA.length).setValues([TITULOS_DEMANDA]);
  const viejas = pestana.getLastRow() - PRIMERA_FILA + 1;
  if (viejas > 0) pestana.getRange(PRIMERA_FILA, 1, viejas, TITULOS_DEMANDA.length).clearContent();
  if (todas.length > 0) pestana.getRange(PRIMERA_FILA, 1, todas.length, TITULOS_DEMANDA.length).setValues(todas);
  const ahora = Utilities.formatDate(new Date(), libro().getSpreadsheetTimeZone(), "dd/MM/yyyy HH:mm");
  pestana.getRange(3, 1).setValue("Actualizado: " + ahora + ". Con señales: " + filas.length + ".");
  return todas.length;
}

/* ---------- Pedidos especiales: pago anticipado para importar algo puntual ---------- */

// Columnas de "Pedidos especiales", contando desde 1. Una fila por pedido especial; lo
// demás del pedido (dirección, correo, productos) sigue en Pedidos web.
const COL_ESPECIAL = { pedido: 1, fecha: 2, producto: 3, cliente: 4, whatsapp: 5, precio: 6, pagado: 7, fechaPago: 8, entrega: 9, proveedor: 10, adquisicion: 11, seguimiento: 12, devolucion: 13, notas: 14 };
const TITULOS_ESPECIAL = ["Pedido", "Fecha del pedido", "Producto y versión", "Cliente", "WhatsApp", "Precio acordado (₡)", "Monto pagado (₡)", "Fecha de pago", "Entrega máxima", "Proveedor", "Adquisición", "Seguimiento", "Devolución", "Notas"];
const AYUDA_ESPECIAL =
  "Pedidos con pago anticipado del 100%. La plata es del cliente hasta entregarlo: pasa a Ventas recién cuando el pedido se marca Entregado en Pedidos web. Llená Proveedor, Adquisición y Seguimiento. Si no se consigue, poné Adquisición en No se consiguió o Cancelado: la devolución queda pendiente. Marcá Devolución en Devuelto solo cuando el banco o PayPal confirme.";
const ADQUISICION = ["Esperando pago", "Por comprar al proveedor", "Comprado al proveedor", "En tránsito", "Recibido en el mezzanine", "Entregado", "No se consiguió", "Cancelado"];
const SIN_ADQUISICION = ["No se consiguió", "Cancelado"];
const DEVOLUCION_PENDIENTE = "Pendiente de devolver";
const DEVUELTO = "Devuelto (confirmado)";

function pestanaEspeciales() {
  return pestanaCon(HOJAS.especiales, AYUDA_ESPECIAL, TITULOS_ESPECIAL);
}

/** Al crearse el pedido especial: una fila con lo acordado. */
function anotarPedidoEspecial(fila, linea) {
  pestanaEspeciales().appendRow([
    fila[COL.numero - 1],
    fila[COL.fecha - 1],
    comoTexto(linea.nombre),
    fila[COL.cliente - 1],
    fila[COL.whatsapp - 1],
    linea.precio * linea.cantidad,
    "",
    "",
    linea.llega ? new Date(linea.llega + "T12:00:00") : "",
    "",
    "Esperando pago",
    "",
    "",
    linea.cantidad > 1 ? linea.cantidad + " unidades" : "",
  ]);
}

function filaDeEspecial(numero) {
  const pestana = hoja(HOJAS.especiales);
  if (!pestana || pestana.getLastRow() < PRIMERA_FILA) return 0;
  const pedidos = pestana.getRange(PRIMERA_FILA, 1, pestana.getLastRow() - PRIMERA_FILA + 1, 1).getValues();
  const indice = pedidos.findIndex(([valor]) => String(valor) === String(numero));
  return indice === -1 ? 0 : PRIMERA_FILA + indice;
}

function marcarEspecial(numero, { adquisicion, devolucion }) {
  const numeroFila = filaDeEspecial(numero);
  if (!numeroFila) return;
  const pestana = hoja(HOJAS.especiales);
  if (adquisicion) pestana.getRange(numeroFila, COL_ESPECIAL.adquisicion).setValue(adquisicion);
  if (devolucion) pestana.getRange(numeroFila, COL_ESPECIAL.devolucion).setValue(devolucion);
}

function marcarPagoEspecial(numero, monto) {
  const numeroFila = filaDeEspecial(numero);
  if (!numeroFila) return;
  hoja(HOJAS.especiales).getRange(numeroFila, COL_ESPECIAL.pagado, 1, 2).setValues([[Number(monto) || 0, new Date()]]);
  marcarEspecial(numero, { adquisicion: "Por comprar al proveedor" });
}

/**
 * Si no se consigue o se cancela, la devolución queda pendiente y a la tienda le
 * llega cómo devolver. Al marcar Devuelto (cuando el banco o PayPal ya lo
 * confirmó), se le avisa al cliente. Nunca se da por devuelto solo.
 */
function alEditarEspecial(numeroFila, columna, valor) {
  const pestana = hoja(HOJAS.especiales);
  const fila = pestana.getRange(numeroFila, 1, 1, TITULOS_ESPECIAL.length).getValues()[0];
  const numero = fila[COL_ESPECIAL.pedido - 1];
  const pagado = Number(fila[COL_ESPECIAL.pagado - 1]) || 0;
  const hallado = buscarFilaDePedido(numero);
  if (columna === COL_ESPECIAL.adquisicion && SIN_ADQUISICION.includes(valor)) {
    if (!pagado) return numero + ": no hay pago registrado, no hay nada que devolver.";
    if (fila[COL_ESPECIAL.devolucion - 1]) return "";
    pestana.getRange(numeroFila, COL_ESPECIAL.devolucion).setValue(DEVOLUCION_PENDIENTE);
    const comprobante = hallado ? String(hallado.fila[COL.comprobante - 1]) : "";
    const porPaypal = comprobante.indexOf("PayPal") === 0;
    avisar("Devolver " + colones(pagado) + " del pedido especial " + numero, [
      "El pedido especial " + numero + " (" + sinApostrofe(fila[COL_ESPECIAL.producto - 1]) + ") quedó como " + valor + ".",
      "Hay que devolverle al cliente el 100% de lo que pagó: " + colones(pagado) + ", sin rebajos.",
      porPaypal
        ? "Pagó con PayPal (" + comprobante + "): hacé el reembolso completo desde tu cuenta de PayPal."
        : "Pagó por SINPE: devolvé por SINPE Móvil al número desde el que pagó (WhatsApp registrado: " + fila[COL_ESPECIAL.whatsapp - 1] + ").",
      "Cuando el banco o PayPal confirme la devolución, cambiá Devolución a «" + DEVUELTO + "» en la pestaña Pedidos especiales. Ahí le avisamos al cliente.",
    ]);
    return "Devolución pendiente: te mandamos un correo con cómo hacerla.";
  }
  if (columna === COL_ESPECIAL.devolucion && valor === DEVUELTO) {
    if (!hallado) return "";
    pestana.getRange(numeroFila, COL_ESPECIAL.notas).setValue(comoTexto("Devolución confirmada el " + fechaLegible(new Date()) + ". " + sinApostrofe(fila[COL_ESPECIAL.notas - 1])));
    hoja(HOJAS.pedidos).getRange(hallado.numeroFila, COL.notas).setValue("Pedido especial devuelto: " + colones(pagado) + " el " + fechaLegible(new Date()) + ".");
    const correo = String(hallado.fila[COL.correo - 1]).replace(/^'/, "");
    if (!esCorreo(correo)) return "Devolución anotada. El pedido no tiene correo: avisale por WhatsApp.";
    const primerNombre = String(hallado.fila[COL.cliente - 1]).replace(/^'/, "").split(" ")[0];
    const parrafos = [
      "Hola " + primerNombre + ". Te devolvimos " + colones(pagado) + " del pedido especial " + numero + ", por el mismo medio con que pagaste.",
      "Sentimos no haber podido traerlo. Si querés, te avisamos si vuelve a aparecer.",
    ];
    mandarAlCliente({
      to: correo,
      subject: "Te devolvimos tu pago del pedido " + numero + " · " + CONFIG.nombreTienda,
      body: parrafos.join("\n\n"),
      htmlBody: correoSencillo({ etiqueta: "Devolución", titulo: "Te devolvimos tu pago", parrafos, botones: botonesDelCliente(numero), pie: "Si no ves el dinero en unos días, respondé este correo." }),
    });
    return "Devolución anotada y le avisamos al cliente.";
  }
  return "";
}

/** Para Sistema: lo que se le debe a clientes de pedidos especiales y lo que hay que atender. */
function resumenDeEspeciales() {
  const pestana = hoja(HOJAS.especiales);
  const resumen = { retenido: 0, porComprar: 0, devolver: 0, devolverMonto: 0, alertas: [] };
  if (!pestana || pestana.getLastRow() < PRIMERA_FILA) return resumen;
  pestana
    .getRange(PRIMERA_FILA, 1, pestana.getLastRow() - PRIMERA_FILA + 1, TITULOS_ESPECIAL.length)
    .getValues()
    .forEach((fila) => {
      const pagado = Number(fila[COL_ESPECIAL.pagado - 1]) || 0;
      const adquisicion = String(fila[COL_ESPECIAL.adquisicion - 1]);
      const devolucion = String(fila[COL_ESPECIAL.devolucion - 1]);
      if (!pagado || adquisicion === "Entregado" || devolucion === DEVUELTO) return;
      resumen.retenido += pagado;
      if (adquisicion === "Por comprar al proveedor") resumen.porComprar += 1;
      if (devolucion === DEVOLUCION_PENDIENTE) {
        resumen.devolver += 1;
        resumen.devolverMonto += pagado;
        resumen.alertas.push("Pedido especial " + fila[COL_ESPECIAL.pedido - 1] + ": falta devolver " + colones(pagado) + ".");
      }
      const entrega = fila[COL_ESPECIAL.entrega - 1];
      if (esFecha(entrega) && entrega.getTime() < Date.now() && !SIN_ADQUISICION.includes(adquisicion)) {
        resumen.alertas.push("Pedido especial " + fila[COL_ESPECIAL.pedido - 1] + ": pasó la entrega máxima (" + fechaIso(entrega) + "). Ofrecé la devolución del 100%.");
      }
    });
  return resumen;
}

/* ---------- Contenido: lo que se va a publicar en redes ---------- */

// Columnas de "Contenido", contando desde 1. Es también el calendario: se ordena por Fecha.
const COL_CONTENIDO = { fecha: 1, tipo: 2, que: 3, productos: 4, texto: 5, estado: 6, revision: 7, enlace: 8, notas: 9 };
const TITULOS_CONTENIDO = ["Para cuándo", "Tipo", "Qué se publica", "Productos y precio al crearlo", "Texto", "Estado", "Revisión de inventario", "Enlace de la publicación", "Notas"];
const AYUDA_CONTENIDO =
  "Lo que se va a publicar. Pegá aquí la fila que te da el Estudio y cambiá el Estado: Borrador, Revisión, Aprobado, Programado, Publicado. Cada hora (y al aprobar) se revisa que lo anunciado siga disponible y al mismo precio; si no, pasa a Error y no se debe publicar.";
const ESTADOS_CONTENIDO = ["Borrador", "Revisión", "Aprobado", "Programado", "Publicado", "Error"];
const CONTENIDO_A_REVISAR = ["Revisión", "Aprobado", "Programado"];

/** "etb-x=35600; carta-y=1500" → [{ slug, precio }]. */
function productosDeContenido(celda) {
  return String(celda || "")
    .split(/[;\n]+/)
    .map((parte) => parte.trim().match(/^([a-z0-9-]+)\s*=\s*(\d+)$/))
    .filter(Boolean)
    .map((partes) => ({ slug: partes[1], precio: Number(partes[2]) }));
}

/** Lo que cambió desde que se hizo la publicación. Vacío si todo sigue igual. */
function problemasDeContenido(lista, productos, reservado) {
  const problemas = [];
  lista.forEach(({ slug, precio }) => {
    const producto = productos[slug];
    if (!producto) return problemas.push(slug + " ya no está en la página");
    const libres = producto.stock - (reservado[slug] || 0);
    if (producto.estado !== ESTADOS.disponible || libres <= 0) {
      problemas.push(producto.nombre + " ya no está disponible (" + (producto.estado === ESTADOS.disponible ? "agotado" : producto.estado.toLowerCase()) + ")");
    } else if (producto.precio !== precio) {
      problemas.push(producto.nombre + " cambió de precio: " + colones(precio) + " → " + colones(producto.precio));
    }
  });
  return problemas;
}

/**
 * Revisa lo que está en Revisión, Aprobado o Programado. Si algo anunciado se
 * agotó o cambió de precio, lo anota; lo Aprobado o Programado pasa a Error para
 * que nadie publique disponibilidad falsa. Con `soloFila`, revisa solo esa fila.
 */
function revisarContenido(soloFila) {
  const pestana = hoja(HOJAS.contenido);
  if (!pestana || pestana.getLastRow() < PRIMERA_FILA) return 0;
  const productos = productosPorSlug();
  const reservado = apartados(filasDePedidos());
  const desde = soloFila || PRIMERA_FILA;
  const cuantas = soloFila ? 1 : pestana.getLastRow() - PRIMERA_FILA + 1;
  const filas = pestana.getRange(desde, 1, cuantas, TITULOS_CONTENIDO.length).getValues();
  const ahora = fechaYHora(Date.now());
  let errores = 0;
  filas.forEach((fila, indice) => {
    const estado = String(fila[COL_CONTENIDO.estado - 1]).trim();
    if (!CONTENIDO_A_REVISAR.includes(estado)) return;
    const lista = productosDeContenido(fila[COL_CONTENIDO.productos - 1]);
    if (lista.length === 0) return;
    const problemas = problemasDeContenido(lista, productos, reservado);
    const numero = desde + indice;
    if (problemas.length === 0) {
      pestana.getRange(numero, COL_CONTENIDO.revision).setValue("Todo sigue igual · " + ahora);
      return;
    }
    errores += 1;
    const nota = comoTexto(problemas.join(". ") + ". Revisado " + ahora + (estado === "Revisión" ? "" : ". Estaba " + estado + "."));
    pestana.getRange(numero, COL_CONTENIDO.revision).setValue(nota);
    if (estado !== "Revisión") pestana.getRange(numero, COL_CONTENIDO.estado).setValue("Error");
  });
  return errores;
}

/* ---------- Sistema: cómo está el inventario y la sincronización ---------- */

const TITULOS_SISTEMA = ["Qué", "Valor", "Detalle"];
const AYUDA_SISTEMA =
  "Se llena sola cada hora y cada vez que cambia el inventario. De aquí saca sus números la pestaña Inicio. No escribás aquí: se borra y se vuelve a llenar.";
const CLAVE_FECHA_PUBLICADO = "catalogo-publicado-fecha";
const CLAVE_FECHA_RESPALDO = "respaldo-fecha";

function fechaYHora(valor) {
  if (!valor) return "";
  return Utilities.formatDate(new Date(Number(valor) || valor), libro().getSpreadsheetTimeZone(), "dd/MM/yyyy HH:mm");
}

/** Lo que dice la página armada de sí misma: cuándo se armó y con cuántos productos. */
function paginaArmada() {
  const memoria = CacheService.getScriptCache();
  const guardado = memoria.get("pagina-armada");
  if (guardado) return JSON.parse(guardado);
  try {
    const respuesta = UrlFetchApp.fetch(sitio() + "sincronizado.json", { muteHttpExceptions: true });
    if (respuesta.getResponseCode() !== 200) return null;
    const datos = JSON.parse(respuesta.getContentText());
    if (!datos || !datos.fecha) return null;
    // Se guarda 5 minutos: editar la hoja varias veces seguidas no vuelve a preguntar.
    memoria.put("pagina-armada", JSON.stringify({ fecha: datos.fecha, productos: datos.productos }), 300);
    return datos;
  } catch (error) {
    console.error(error);
    return null;
  }
}

/**
 * Cuenta el inventario por estado, anota cuándo se armó la página por última vez
 * y junta las alertas. Solo usa lo que ya está en la hoja y en la página.
 */
function actualizarSistema() {
  const productos = Object.values(productosPorSlug());
  const reservado = apartados(filasDePedidos());
  const cuenta = { [ESTADOS.disponible]: 0, [ESTADOS.enCamino]: 0, [ESTADOS.porConsultar]: 0, [ESTADOS.agotado]: 0, [ESTADOS.pedidoEspecial]: 0 };
  let unidades = 0;
  const alertas = [];
  productos.forEach((producto) => {
    cuenta[producto.estado] += 1;
    if (producto.estado === ESTADOS.disponible) {
      unidades += Math.max(producto.stock - (reservado[producto.slug] || 0), 0);
      if (!producto.precio) alertas.push(producto.nombre + " tiene unidades pero no tiene precio: no sale en la página.");
    }
  });

  // Una descripción que promete fecha de entrega en algo que no está en el mezzanine confunde.
  productos.forEach((producto) => {
    if (producto.estado === ESTADOS.disponible || producto.estado === ESTADOS.pedidoEspecial) return;
    if (/se entrega|te la traemos|te lo traemos|llega el|preventa/i.test(producto.descripcion || "")) {
      alertas.push(producto.nombre + " está " + producto.estado.toLowerCase() + " pero su descripción promete entrega o llegada: revisá la Descripción.");
    }
  });

  let sinPublicar = 0;
  const validos = Object.values(ESTADOS).map(sinTildes);
  filasDeCatalogo().forEach((fila, indice) => {
    if (!esPokemon(fila.Juego)) return;
    if (estadoDelLote(fila) === ESTADOS.noPublicado) sinPublicar += 1;
    const escrito = sinTildes(fila[COLUMNA_ESTADO]);
    if (escrito && !validos.includes(escrito)) {
      alertas.push("Fila " + (indice + PRIMERA_FILA) + " de Catálogo web: el estado \"" + fila[COLUMNA_ESTADO] + "\" no se entiende y no se vende. Usá el menú de la celda.");
    }
    ["En stock", "Precio sugerido (₡)", "Precio de venta (₡)"].forEach((columna) => {
      if (String(fila[columna]).charAt(0) === "#") {
        alertas.push("Fila " + (indice + PRIMERA_FILA) + " de Catálogo web: la columna " + columna + " tiene un error de fórmula (" + fila[columna] + ").");
      }
    });
  });

  const contenido = hoja(HOJAS.contenido);
  if (contenido && contenido.getLastRow() >= PRIMERA_FILA) {
    contenido
      .getRange(PRIMERA_FILA, 1, contenido.getLastRow() - PRIMERA_FILA + 1, TITULOS_CONTENIDO.length)
      .getValues()
      .forEach((fila, indice) => {
        if (String(fila[COL_CONTENIDO.estado - 1]).trim() !== "Error") return;
        alertas.push("Contenido, fila " + (indice + PRIMERA_FILA) + " (" + fila[COL_CONTENIDO.que - 1] + "): " + fila[COL_CONTENIDO.revision - 1]);
      });
  }

  const propiedades = PropertiesService.getScriptProperties();
  const pagina = paginaArmada();
  const conPrecio = productos.filter((producto) => producto.precio > 0).length;
  if (!pagina) {
    alertas.push("No se pudo leer cuándo se armó la página por última vez.");
  } else if (Number(pagina.productos) !== conPrecio) {
    alertas.push("La página muestra " + pagina.productos + " productos y la hoja tiene " + conPrecio + ": falta que se vuelva a armar.");
  }

  const especiales = resumenDeEspeciales();
  especiales.alertas.forEach((alerta) => alertas.push(alerta));

  const filas = [
    ["Productos disponibles", cuenta[ESTADOS.disponible], unidades + " unidades en el mezzanine"],
    ["Productos en camino", cuenta[ESTADOS.enCamino], "Comprados, todavía no llegan"],
    ["Productos por consultar", cuenta[ESTADOS.porConsultar], "No son nuestros: se consultan"],
    ["Productos agotados", cuenta[ESTADOS.agotado], ""],
    ["Filas sin publicar", sinPublicar, ""],
    ["Pedido especial a la venta", cuenta[ESTADOS.pedidoEspecial] || 0, especialesActivos() ? "Pago anticipado encendido" : "Pago anticipado apagado"],
    ["Anticipos de clientes (no es ganancia)", especiales.retenido, "Pedidos especiales pagados y sin entregar"],
    ["Pedidos especiales por comprar", especiales.porComprar, ""],
    ["Devoluciones pendientes", especiales.devolver, especiales.devolverMonto ? colones(especiales.devolverMonto) + " por devolver" : ""],
    ["Inventario revisado", fechaYHora(Date.now()), ""],
    ["La página se armó", pagina ? fechaYHora(pagina.fecha) : "Sin dato", pagina ? pagina.productos + " productos en la página" : ""],
    ["Publicación pedida a GitHub", fechaYHora(propiedades.getProperty(CLAVE_FECHA_PUBLICADO)) || "Sin dato", ""],
    ["Último respaldo", fechaYHora(propiedades.getProperty(CLAVE_FECHA_RESPALDO)) || "Sin dato", ""],
    ["Versión del servidor", VERSION, esPrueba() ? "Hoja de prueba" : ""],
    ["Alertas", alertas.length, alertas.length ? "" : "Todo en orden"],
  ].concat(alertas.slice(0, 30).map((alerta) => ["Alerta", comoTexto(alerta), ""]));

  const pestana = pestanaCon(HOJAS.sistema, AYUDA_SISTEMA, TITULOS_SISTEMA);
  const viejas = pestana.getLastRow() - PRIMERA_FILA + 1;
  if (viejas > 0) pestana.getRange(PRIMERA_FILA, 1, viejas, TITULOS_SISTEMA.length).clearContent();
  pestana.getRange(PRIMERA_FILA, 1, filas.length, TITULOS_SISTEMA.length).setValues(filas);
  return alertas.length;
}

/* ---------- ¿Cómo te fue? ---------- */

const PREFIJO_OPINION = "opinion:";

/** Al marcar Entregado: se guarda cuándo, y tareasCadaHora() escribe días después. */
function programarOpinion(numero) {
  PropertiesService.getScriptProperties().setProperty(PREFIJO_OPINION + numero, String(Date.now()));
}

function pedirOpiniones() {
  const hora = Number(Utilities.formatDate(new Date(), libro().getSpreadsheetTimeZone(), "H"));
  if (hora < CONFIG.horasParaEscribir[0] || hora >= CONFIG.horasParaEscribir[1]) return;
  const propiedades = PropertiesService.getScriptProperties();
  const limite = Date.now() - CONFIG.diasParaOpinion * 24 * 3600 * 1000;
  const pendientes = Object.entries(propiedades.getProperties()).filter(
    ([clave, cuando]) => clave.indexOf(PREFIJO_OPINION) === 0 && Number(cuando) <= limite,
  );
  if (pendientes.length === 0) return;

  const pedidos = leerPedidos();
  pendientes.slice(0, CONFIG.maxCorreosPorRevision).forEach(([clave]) => {
    const numero = clave.slice(PREFIJO_OPINION.length);
    const hallado = pedidos.find(({ fila }) => fila[COL.numero - 1] === numero);
    // Si el Estado cambió (por ejemplo, a Cancelado), no se escribe.
    if (hallado && hallado.fila[COL.estado - 1] === ENTREGADO) pedirOpinion(hallado.fila);
    propiedades.deleteProperty(clave);
  });
}

function pedirOpinion(fila) {
  const correo = String(fila[COL.correo - 1]);
  if (!esCorreo(correo)) return false;
  const numero = fila[COL.numero - 1];
  const primerNombre = String(fila[COL.cliente - 1]).split(" ")[0];
  const enlace =
    sitio() + "comentarios?pedido=" + encodeURIComponent(numero) +
    "&clave=" + encodeURIComponent(fila[COL.clave - 1]);
  const nombres = leerDetalle(fila).lineas.map((linea) => linea.nombre);
  const queLlevaste = nombres.length === 1 ? nombres[0] : nombres.length + " productos";
  const parrafos = [
    "Ya tenés tu pedido " + numero + " (" + queLlevaste + "). ¿Llegó bien? ¿Qué te pareció?",
    "Contanos en un minuto: nos ayuda a mejorar y a que más gente se anime a comprarnos.",
    "Si algo llegó mal, respondé este correo y lo arreglamos.",
  ];
  const pie = "Te escribimos una sola vez por este pedido.";
  return mandarAlCliente({
    to: correo,
    subject: "¿Cómo te fue con tu pedido " + numero + "? · " + CONFIG.nombreTienda,
    body: ["¡Hola " + primerNombre + "!", "", ...parrafos, "", "Dejá tu opinión aquí: " + enlace, "", pie].join("\n"),
    htmlBody: correoSencillo({
      etiqueta: "Tu opinión",
      titulo: "¿Cómo te fue, " + primerNombre + "?",
      parrafos,
      botones: [botonDeCorreo("Dejar mi opinión", enlace, "#c9201c")],
      pie,
    }),
  });
}

/** Corre sola cada hora, gracias a instalarAvisos(). */
function tareasCadaHora() {
  try {
    conCandado(() => revisarAvisos());
  } catch (error) {
    console.error(error);
  }
  try {
    avisarSolicitudesNuevas();
  } catch (error) {
    console.error(error);
  }
  try {
    actualizarDemanda();
  } catch (error) {
    console.error(error);
  }
  try {
    revisarContenido();
  } catch (error) {
    console.error(error);
  }
  try {
    actualizarSistema();
  } catch (error) {
    console.error(error);
  }
  pedirOpiniones();
}

/* ---------- Publicación y respaldo ---------- */

const CLAVE_PUBLICADO = "catalogo-publicado";

function huellaDe(contenido) {
  return Utilities.base64EncodeWebSafe(
    Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, contenido, Utilities.Charset.UTF_8),
  );
}

/**
 * Corre sola cada 5 minutos, gracias a instalarAvisos(). Si el catálogo cambió
 * desde la última vez, le pide a GitHub rearmar la página: así lo nuevo sale en
 * minutos y no depende del reloj de GitHub. Ocupa la propiedad GITHUB_TOKEN (una
 * llave que solo puede correr la publicación de este repositorio); sin ella no
 * hace nada. Devuelve qué pasó, para verlo al correrla a mano.
 */
function publicarSiCambio() {
  const propiedades = PropertiesService.getScriptProperties();
  const llave = propiedades.getProperty("GITHUB_TOKEN");
  if (!llave) return "Falta la propiedad GITHUB_TOKEN: no se pidió nada.";
  const huella = huellaDe(catalogoEnCsv());
  if (propiedades.getProperty(CLAVE_PUBLICADO) === huella) return "El catálogo no ha cambiado.";
  const respuesta = UrlFetchApp.fetch(
    "https://api.github.com/repos/" + CONFIG.repositorio + "/actions/workflows/" + CONFIG.flujo + "/dispatches",
    {
      method: "post",
      contentType: "application/json",
      headers: {
        Authorization: "Bearer " + llave,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      payload: JSON.stringify({ ref: "main" }),
      muteHttpExceptions: true,
    },
  );
  const codigo = respuesta.getResponseCode();
  if (codigo !== 204) {
    console.error("GitHub respondió " + codigo + ": " + respuesta.getContentText().slice(0, 300));
    return "GitHub respondió " + codigo + ": revisá la llave GITHUB_TOKEN.";
  }
  propiedades.setProperty(CLAVE_PUBLICADO, huella);
  propiedades.setProperty(CLAVE_FECHA_PUBLICADO, String(Date.now()));
  return "Listo: se pidió rearmar la página. Tarda unos 3 minutos.";
}

/**
 * Corre sola cada Domingo, gracias a instalarAvisos(): deja en el Drive de la
 * tienda una copia completa de la hoja, "Respaldo Pokedeke 2026-11-15". Las
 * copias viejas se pueden borrar a mano.
 */
function respaldarHoja() {
  const fecha = Utilities.formatDate(new Date(), libro().getSpreadsheetTimeZone(), "yyyy-MM-dd");
  libro().copy("Respaldo " + CONFIG.nombreTienda + " " + fecha);
  PropertiesService.getScriptProperties().setProperty(CLAVE_FECHA_RESPALDO, String(Date.now()));
}

/* ---------- Pago con tarjeta por PayPal ---------- */

/** Las llaves viven en Propiedades del script: nunca en este archivo ni en la página. */
function llavesPaypal() {
  const propiedades = PropertiesService.getScriptProperties();
  const clientId = propiedades.getProperty("PAYPAL_CLIENT_ID") || "";
  const secreto = propiedades.getProperty("PAYPAL_SECRET") || "";
  const modo = propiedades.getProperty("PAYPAL_MODO") === "live" ? "live" : "sandbox";
  return { clientId, secreto, modo, listo: Boolean(clientId && secreto) };
}

/** Lo que la página necesita para mostrar el botón. El Client ID es público. */
function configPaypalPublica() {
  const llaves = llavesPaypal();
  if (!llaves.listo) return { ok: false };
  return { ok: true, clientId: llaves.clientId, modo: llaves.modo, colonesPorDolar: CONFIG.colonesPorDolar };
}

/** ₡120 000 a ₡500 son 240.00. Siempre con dos decimales, como lo pide PayPal. */
function montoEnDolares(colonesTotal) {
  return (Math.round((Number(colonesTotal) / CONFIG.colonesPorDolar) * 100) / 100).toFixed(2);
}

function apiPaypal(metodo, ruta, cuerpo, idempotencia) {
  const llaves = llavesPaypal();
  const base = llaves.modo === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
  const memoria = CacheService.getScriptCache();
  const claveToken = "paypal-token-" + llaves.modo;
  let token = memoria.get(claveToken);
  if (!token) {
    const respuesta = UrlFetchApp.fetch(base + "/v1/oauth2/token", {
      method: "post",
      payload: { grant_type: "client_credentials" },
      headers: { Authorization: "Basic " + Utilities.base64Encode(llaves.clientId + ":" + llaves.secreto) },
      muteHttpExceptions: true,
    });
    const datos = JSON.parse(respuesta.getContentText() || "{}");
    if (!datos.access_token) throw new Error("PayPal no dio permiso: revisá PAYPAL_CLIENT_ID, PAYPAL_SECRET y PAYPAL_MODO.");
    token = datos.access_token;
    memoria.put(claveToken, token, Math.max(Math.min(Number(datos.expires_in) || 3600, 21600) - 300, 60));
  }
  const encabezados = { Authorization: "Bearer " + token };
  if (idempotencia) encabezados["PayPal-Request-Id"] = idempotencia;
  const respuesta = UrlFetchApp.fetch(base + ruta, {
    method: metodo,
    contentType: "application/json",
    payload: cuerpo ? JSON.stringify(cuerpo) : undefined,
    headers: encabezados,
    muteHttpExceptions: true,
  });
  return { estado: respuesta.getResponseCode(), datos: JSON.parse(respuesta.getContentText() || "{}") };
}

/** El pedido tiene que existir, ser de quien tiene la clave y estar pendiente con el monto ya fijo. */
function pedidoParaPagar(datos) {
  const hallado = buscarFilaDePedido(datos.numero);
  if (!hallado || hallado.fila[COL.clave - 1] !== texto(datos.clave, 60)) {
    return { error: "No hallamos ese pedido." };
  }
  if (envioAparte(hallado.fila)) {
    return { error: "Este pedido lleva un envío que se confirma por WhatsApp: pagalo por SINPE cuando te pasemos el total." };
  }
  return { hallado };
}

/** La página pide crear el cobro; el monto sale de la hoja, nunca del navegador. */
function crearPagoPaypal(datos) {
  if (!llavesPaypal().listo) return { ok: false, error: "El pago con tarjeta todavía no está activo." };
  const { hallado, error } = pedidoParaPagar(datos);
  if (error) return { ok: false, error };
  const fila = hallado.fila;
  if (fila[COL.estado - 1] !== PENDIENTE) return { ok: false, error: "Ese pedido ya no está pendiente de pago." };
  const limite = Date.now() - CONFIG.horasApartado * 3600 * 1000;
  if (new Date(fila[COL.fecha - 1]).getTime() < limite) {
    return { ok: false, error: "El plazo para pagar este pedido ya venció. Hacé el pedido otra vez." };
  }
  const numero = fila[COL.numero - 1];
  const dolares = montoEnDolares(fila[COL.total - 1]);
  const respuesta = apiPaypal(
    "post",
    "/v2/checkout/orders",
    {
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: numero,
          custom_id: numero,
          description: "Pedido " + numero + " · " + CONFIG.nombreTienda,
          amount: { currency_code: "USD", value: dolares },
        },
      ],
      application_context: {
        brand_name: CONFIG.nombreTienda,
        shipping_preference: "NO_SHIPPING",
        user_action: "PAY_NOW",
      },
    },
    "crear-" + numero + "-" + dolares,
  );
  if (respuesta.estado >= 300 || !respuesta.datos.id) {
    console.error(JSON.stringify(respuesta.datos));
    return { ok: false, error: "PayPal no respondió. Intentá otra vez o pagá por SINPE." };
  }
  return { ok: true, id: respuesta.datos.id, dolares };
}

/**
 * La persona aprobó el pago en PayPal: aquí se cobra de verdad. Solo si PayPal
 * confirma el monto completo, el pedido pasa a Pagado y a Ventas, como si se
 * hubiera cambiado el Estado a mano.
 */
function capturarPagoPaypal(datos) {
  if (!llavesPaypal().listo) return { ok: false, error: "El pago con tarjeta todavía no está activo." };
  const { hallado, error } = pedidoParaPagar(datos);
  if (error) return { ok: false, error };
  const numeroFila = hallado.numeroFila;
  const fila = hallado.fila;
  const numero = fila[COL.numero - 1];
  // Si ya quedó pagado (por ejemplo, la página reintentó), no se cobra dos veces.
  if (String(fila[COL.comprobante - 1]).indexOf("PayPal") === 0 && fila[COL.estado - 1] !== PENDIENTE) {
    return { ok: true, numero };
  }
  const orden = texto(datos.orden, 40);
  if (!/^[A-Z0-9]{8,30}$/.test(orden)) return { ok: false, error: "Pago no válido." };

  const respuesta = apiPaypal("post", "/v2/checkout/orders/" + orden + "/capture", {}, "capturar-" + orden);
  const unidad = (respuesta.datos.purchase_units || [])[0] || {};
  const captura = ((unidad.payments || {}).captures || [])[0] || {};
  const esperado = montoEnDolares(fila[COL.total - 1]);
  const calza =
    respuesta.estado < 300 &&
    captura.status === "COMPLETED" &&
    captura.custom_id === numero &&
    captura.amount && captura.amount.currency_code === "USD" && captura.amount.value === esperado;
  if (!calza) {
    console.error(JSON.stringify(respuesta.datos));
    const pendiente = captura.status === "PENDING";
    avisar(
      (pendiente ? "Pago con PayPal en revisión: " : "Revisá un pago con PayPal: ") + numero,
      [
        "PayPal no confirmó el pago completo del pedido " + numero + ".",
        "Estado de PayPal: " + (captura.status || respuesta.datos.name || "sin respuesta"),
        "Monto esperado: $" + esperado + (captura.amount ? " · cobrado: " + captura.amount.currency_code + " " + captura.amount.value : ""),
        "Orden de PayPal: " + orden,
        "",
        "Revisalo en tu cuenta de PayPal antes de cambiar el Estado.",
      ],
    );
    return {
      ok: false,
      error: pendiente
        ? "PayPal está revisando tu pago. Te escribimos apenas se confirme."
        : "No se pudo completar el cobro. No se te cobró nada: probá otra vez o pagá por SINPE.",
    };
  }

  const desglose = captura.seller_receivable_breakdown || {};
  const comision = desglose.paypal_fee ? desglose.paypal_fee.value : "";
  const neto = desglose.net_amount ? desglose.net_amount.value : "";
  const pestana = hoja(HOJAS.pedidos);
  pestana.getRange(numeroFila, COL.comprobante).setValue(comoTexto("PayPal " + captura.id));
  pestana.getRange(numeroFila, COL.metodoPago).setValue("PayPal (tarjeta)");
  pestana
    .getRange(numeroFila, COL.notas)
    .setValue(
      comoTexto(
        "Pagado con PayPal: $" + esperado + (comision ? " · comisión $" + comision + " · te queda $" + neto : "") + " · orden " + orden,
      ),
    );
  pestana.getRange(numeroFila, COL.estado).setValue(PAGADO_PAYPAL);
  const resultado = pasarAVentas(numeroFila, PAGADO_PAYPAL);
  olvidarStock();
  if (!resultado.fila) {
    // La plata ya entró: el pedido queda pagado aunque falte pasarlo a Ventas.
    pestana.getRange(numeroFila, COL.estado).setValue(PAGADO_PAYPAL);
    pestana.getRange(numeroFila, COL.notas).setValue(comoTexto("Pagado con PayPal ($" + esperado + "), pero no pasó a Ventas: " + resultado.aviso));
  }
  const filaFinal = pestana.getRange(numeroFila, 1, 1, TOTAL_COLUMNAS).getValues()[0];
  confirmarPago(filaFinal);
  avisar(
    "Pago con tarjeta: " + numero + " · $" + esperado,
    [
      "Entró un pago con PayPal del pedido " + numero + ": $" + esperado + ".",
      comision ? "Comisión de PayPal: $" + comision + " · te queda $" + neto + "." : "",
      resultado.fila ? "Ya está en " + PAGADO_PAYPAL + " y pasó a Ventas. Al cliente le llegó el correo de gracias." : "OJO: quedó " + PAGADO_PAYPAL + " pero no pasó a Ventas: " + resultado.aviso,
      "",
      "Coordiná la entrega como siempre.",
    ],
  );
  return { ok: true, numero };
}

/** Correr una vez desde el editor después de pegar las llaves: dice si PayPal responde. */
function probarPaypal() {
  const llaves = llavesPaypal();
  if (!llaves.listo) {
    console.log("Faltan las llaves: agregá PAYPAL_CLIENT_ID y PAYPAL_SECRET en Propiedades del script.");
    return;
  }
  CacheService.getScriptCache().remove("paypal-token-" + llaves.modo);
  const respuesta = apiPaypal("get", "/v1/identity/oauth2/userinfo?schema=paypalv1.1");
  console.log(
    respuesta.estado < 300
      ? "PayPal conectado en modo " + llaves.modo + "."
      : "PayPal respondió " + respuesta.estado + ": revisá las llaves y el modo.",
  );
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
      especial: entregaEspecial(leerDetalle(fila).lineas),
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

/** Hasta cuándo se puede pagar un pedido. */
function finDelApartado(fecha) {
  return fechaLegible(new Date(fecha).getTime() + CONFIG.horasApartado * 3600 * 1000);
}

function datosDePago(numero, fecha, comprobante) {
  return [
    ["SINPE Móvil", CONFIG.sinpe],
    ["En el detalle", numero],
    ["Comprobante que escribió el cliente", comprobante],
    ["Pagá antes del", finDelApartado(fecha)],
  ];
}

function fechaLegible(fecha) {
  return Utilities.formatDate(new Date(fecha), libro().getSpreadsheetTimeZone(), "dd/MM/yyyy h:mm a");
}

/** Con `aparte`, el envío se confirma por WhatsApp y no está en estos montos. */
function resumenDeMontos(subtotal, descuento, cupon, costoEnvio, total, aparte) {
  return [
    ["Subtotal", colones(subtotal)],
    ["Cupón " + (cupon || ""), descuento ? "−" + colones(descuento) : ""],
    ["Envío", aparte ? "Se confirma por WhatsApp" : costoEnvio ? colones(costoEnvio) : "Gratis"],
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
    (linea.especial ? " · De Estados Unidos, se entrega " + entregaEspecial([linea]) : "") +
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

  const filaDeCaja = ([rotulo, valor]) =>
    valor ? escapar(rotulo) + ": <strong>" + escapar(valor) + "</strong>" : "";

  return marcoDeCorreo(
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
    '<p style="margin:16px 0 0;font-size:12px;color:#444444;">' + escapar(pie || "Aviso automático de la tienda. Los datos del cliente son solo para este pedido.") + "</p>",
  );
}

/** El toldo, el nombre y la tarjeta crema de todos los correos; `interior` va adentro de la tarjeta. */
function marcoDeCorreo(interior) {
  const imagenes = sitio() + "correo/";
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
    interior +
    "</div></div></div></div>"
  );
}

/** Correo corto: etiqueta, título, unos párrafos y botones. */
function correoSencillo({ etiqueta, titulo, parrafos, botones, pie }) {
  return marcoDeCorreo(
    '<span style="display:inline-block;padding:4px 10px;border-radius:6px;background:#1437a8;color:#ffffff;font-size:13px;font-weight:bold;">' + escapar(etiqueta) + "</span>" +
    '<h1 style="margin:12px 0 14px;font-size:26px;line-height:1.2;color:#1437a8;">' + escapar(titulo) + "</h1>" +
    parrafos.map((parrafo) => '<p style="margin:0 0 12px;font-size:16px;line-height:1.45;">' + escapar(parrafo) + "</p>").join("") +
    '<div style="margin-top:16px;">' + botones.join("") + "</div>" +
    '<p style="margin:16px 0 0;font-size:12px;color:#444444;">' + escapar(pie) + "</p>",
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
    botonDeCorreo("Ver mi pedido", sitio() + "pedido?numero=" + numero, "#1437a8"),
    botonDeCorreo("Escribinos por WhatsApp", "https://wa.me/" + CONFIG.whatsapp + "?text=" + encodeURIComponent(mensaje), "#127a43"),
  ];
}

/** Devuelve si salió. */
/** La hoja de prueba lleva la propiedad MODO_PRUEBA = si: sus correos lo dicen en el asunto. */
function esPrueba() {
  return PropertiesService.getScriptProperties().getProperty("MODO_PRUEBA") === "si";
}

/** La página a la que apuntan los correos. La hoja de prueba la cambia con la propiedad SITIO. */
function sitio() {
  return PropertiesService.getScriptProperties().getProperty("SITIO") || CONFIG.sitio;
}

function mandarCorreo(opciones) {
  try {
    const asunto = (esPrueba() ? "[PRUEBA] " : "") + opciones.subject;
    MailApp.sendEmail({ name: CONFIG.nombreTienda, ...opciones, subject: asunto });
    return true;
  } catch (error) {
    // Un correo que falla no debe perder el pedido: ya quedó en la hoja.
    console.error(error);
    return false;
  }
}

/**
 * Al cliente solo se le escribe desde la cuenta de la tienda: el correo personal
 * de quien administra la hoja nunca debe quedar a la vista. Devuelve si salió.
 */
function mandarAlCliente(opciones) {
  const cuenta = Session.getEffectiveUser().getEmail().toLowerCase();
  if (cuenta !== CONFIG.correoAvisos) {
    console.error("No se le escribió al cliente: el script corre con otra cuenta.");
    return false;
  }
  return mandarCorreo({ replyTo: CONFIG.correoCliente, ...opciones });
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
function confirmarAlCliente({ correo, numero, fecha, total, cliente, whatsapp, entrega, lineas, resumen, montos, precioAparte, despacho, especial, conTarjeta }) {
  const primerNombre = String(cliente).split(" ")[0];
  const pasos = conTarjeta
    ? [
        "Pagá con tarjeta en la página, en el botón de PayPal: se cobra en dólares ($" + montoEnDolares(total) + ").",
        "Si PayPal no te dejó o se te cerró la página, podés pagar por SINPE Móvil al " + CONFIG.sinpe + " con " + numero + " en el detalle, y respondé este correo con el comprobante.",
        "Apenas entre el pago te llega otro correo.",
      ]
    : (precioAparte
    ? [
        "Esperá nuestro WhatsApp con el costo del envío entre tiendas.",
        "Hacé un solo SINPE Móvil por los productos más el envío, con " + numero + " en el detalle.",
      ]
    : ["Hacé el SINPE Móvil por el monto exacto, con " + numero + " en el detalle."]
  ).concat([
    "Escribí el número de comprobante en la página. Si ya la cerraste, respondé este correo con ese número.",
    "Cuando confirmemos el pago te llega otro correo y te escribimos por WhatsApp.",
  ]);
  const etiquetaPago = conTarjeta ? "Pagás con tarjeta (PayPal)" : "";
  if (especial) {
    pasos.push(
      "Tu pedido trae productos que importamos de Estados Unidos: se entrega " + especial +
        ". No lo tenemos en el mezzanine: lo compramos al proveedor cuando entre tu pago. Si no lo conseguimos, el proveedor cancela o no llega a esa fecha, te devolvemos el 100% por el mismo medio, sin rebajos. Podés cancelarlo dentro de los 8 días hábiles desde que pagaste y te devolvemos todo.",
    );
  } else if (despacho) {
    pasos.push("Los envíos salen los Miércoles y Sábados: si pagás a tiempo, tu pedido sale el " + despacho + ".");
  }
  mandarAlCliente({
    to: correo,
    subject: "Recibimos tu pedido " + numero + " · " + CONFIG.nombreTienda,
    body: [
      "¡Gracias, " + primerNombre + "! Recibimos tu pedido " + numero + ".",
      "",
      resumen,
      "",
      precioAparte
        ? "Tus productos suman " + colones(total) + ". El envío entre tiendas te lo confirmamos por WhatsApp y va en el mismo SINPE."
        : "Total a pagar: " + colones(total),
      "SINPE Móvil al " + CONFIG.sinpe + ", con " + numero + " en el detalle.",
      "Tenés " + CONFIG.horasApartado + " horas para hacer el pago.",
      "",
      "Qué sigue:",
      ...pasos,
    ].join("\n"),
    htmlBody: correoConDiseno({
      etiqueta: "Pedido recibido",
      saludo:
        "¡Gracias, " + primerNombre + "! Recibimos tu pedido. Tenés " +
        CONFIG.horasApartado + " horas para hacer el pago.",
      numero,
      fecha,
      total,
      rotuloTotal: precioAparte ? "Tus productos suman (más el envío)" : "Total a pagar",
      caja: conTarjeta
        ? [["Pagás con", etiquetaPago], ["Se cobra", "$" + montoEnDolares(total) + " (" + colones(total) + ")"], ["Pagá antes del", finDelApartado(fecha)]]
        : datosDePago(numero, fecha).filter(([rotulo]) => !rotulo.startsWith("Comprobante")),
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
  const envio = envioPorNombre(fila[COL.envio - 1]);
  const despacho = envio.despacho ? textoDespacho(new Date()) : "";
  const especial = entregaEspecial(lineas);
  if (especial) {
    return [
      "Recibimos tu pago del pedido especial. Ahora hacemos la compra al proveedor y te vamos contando por WhatsApp. Se entrega " + especial + ".",
      "Si por algo no lo podemos traer, te devolvemos el 100% por el mismo medio: SINPE Móvil a la misma cuenta o PayPal a la misma tarjeta.",
    ];
  }
  const pasos = esRetiro(fila)
    ? ["Te escribimos por WhatsApp para cuadrar el día y la hora del retiro."]
    : envio.pideTienda
      ? [
          "Lo enviamos el " + despacho + " a la tienda que nos dijiste. Antes te mandamos por WhatsApp fotos de cómo va empacado.",
          "Lo que tarda en llegar depende de la tienda.",
        ]
      : [
          "Sale el " + despacho + ". Los envíos salen los Miércoles y Sábados.",
          "Te escribimos por WhatsApp con fotos de cómo va empacado y el número de guía.",
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
  const aparte = envioAparte(fila);
  // Pagó con tarjeta por PayPal: el correo le da las gracias y le dice cuánto se cobró en dólares.
  const conPaypal = String(fila[COL.comprobante - 1]).indexOf("PayPal") === 0;
  const dolares = montoEnDolares(total);
  const saludo = conPaypal
    ? "¡Gracias por tu compra, " + primerNombre + "! Recibimos tu pago con tarjeta por PayPal y tu pedido ya está confirmado."
    : "¡Listo, " + primerNombre + "! Confirmamos tu pago. Gracias por comprar en " + CONFIG.nombreTienda + ".";
  mandarAlCliente({
    to: correo,
    subject: conPaypal
      ? "¡Gracias por tu compra con PayPal! " + numero + " · " + CONFIG.nombreTienda
      : "Pago confirmado de tu pedido " + numero + " · " + CONFIG.nombreTienda,
    body: [
      conPaypal ? saludo + " (pedido " + numero + ")" : "¡Listo, " + primerNombre + "! Confirmamos tu pago del pedido " + numero + ".",
      "",
      conPaypal
        ? "Se cobró: $" + dolares + " (" + colones(total) + "). En tu estado de cuenta sale como PayPal."
        : aparte ? "Productos: " + colones(total) + ", más el envío que cuadramos por WhatsApp." : "Total pagado: " + colones(total),
      "",
      "Qué sigue:",
      ...pasos,
    ].join("\n"),
    htmlBody: correoConDiseno({
      etiqueta: conPaypal ? "Gracias por tu compra" : "Pago confirmado",
      estado: conPaypal ? PAGADO_PAYPAL : PAGADO,
      colorEstado: "#127a43",
      saludo,
      numero,
      fecha: fila[COL.fecha - 1],
      total,
      rotuloTotal: aparte ? "Productos (el envío fue aparte)" : "Total pagado",
      caja: conPaypal
        ? [
            ["Pagaste con", "Tarjeta (PayPal)"],
            ["Se cobró", "$" + dolares + " (" + colones(total) + ")"],
            ["Comprobante de PayPal", String(fila[COL.comprobante - 1]).replace(/^PayPal /, "")],
          ]
        : [
            ["Pagaste por", fila[COL.metodoPago - 1]],
            ["Comprobante", fila[COL.comprobante - 1]],
          ],
      entrega: entregaDeFila(fila),
      lineas: detalle.lineas.map(({ quedan, ...linea }) => linea),
      resumen: resumenDeMontos(detalle.subtotal, detalle.descuento, detalle.cupon, fila[COL.costoEnvio - 1], total, aparte),
      pasos,
      botones: botonesDelCliente(numero),
      pie: conPaypal
        ? "En tu estado de cuenta el cobro aparece como PayPal. Si tenés alguna duda, respondé este correo o escribinos."
        : "Si tenés alguna duda, respondé este correo o escribinos. Tus datos son solo para este pedido.",
    }),
  });
}

/**
 * Quien administra la tienda cambia el Estado a "Conseguido" cuando ya tiene el
 * pedido especial. Solo escribe si el pedido trae uno y ya está pagado. Devuelve
 * el aviso para la hoja.
 */
function avisarConseguido(fila) {
  const numero = fila[COL.numero - 1];
  const detalle = leerDetalle(fila);
  const especial = entregaEspecial(detalle.lineas);
  if (!especial) return numero + " no trae un pedido especial: no se mandó correo.";
  if (!fila[COL.enVentas - 1]) return numero + " todavía no está pagado: marcalo Pagado primero. No se mandó correo.";
  const correo = String(fila[COL.correo - 1]);
  if (!esCorreo(correo)) return numero + " no tiene correo: avisale por WhatsApp.";

  const primerNombre = String(fila[COL.cliente - 1]).split(" ")[0];
  const nombres = detalle.lineas.filter((linea) => linea.especial).map((linea) => linea.nombre).join(", ");
  const pasos = [
    "Ya tenemos " + nombres + ". Se entrega " + especial + ".",
    "Te escribimos por WhatsApp para coordinar la entrega.",
  ];
  mandarAlCliente({
    to: correo,
    subject: "¡Ya tenemos tu producto de Estados Unidos! " + numero + " · " + CONFIG.nombreTienda,
    body: [
      "¡Buenas noticias, " + primerNombre + "! Ya tenemos lo que te trajimos de Estados Unidos (pedido " + numero + ") y pronto está listo para entregar.",
      "",
      "Qué sigue:",
      ...pasos,
    ].join("\n"),
    htmlBody: correoConDiseno({
      etiqueta: "De Estados Unidos",
      estado: CONSEGUIDO,
      colorEstado: "#127a43",
      saludo: "¡Buenas noticias, " + primerNombre + "! Ya tenemos lo que te trajimos de Estados Unidos y pronto está listo para entregar.",
      numero,
      fecha: fila[COL.fecha - 1],
      total: fila[COL.total - 1],
      rotuloTotal: "Total pagado",
      caja: [["Se entrega", especial]],
      entrega: entregaDeFila(fila),
      lineas: detalle.lineas.map(({ quedan, ...linea }) => linea),
      resumen: resumenDeMontos(detalle.subtotal, detalle.descuento, detalle.cupon, fila[COL.costoEnvio - 1], fila[COL.total - 1], envioAparte(fila)),
      pasos,
      botones: botonesDelCliente(numero),
      pie: "Si tenés alguna duda, respondé este correo o escribinos. Tus datos son solo para este pedido.",
    }),
  });
  return "Le avisamos a " + primerNombre + " que ya conseguiste su pedido especial " + numero + ".";
}

/* ---------- Pasar a Ventas ---------- */

/**
 * Correr desde el editor, con la cuenta de la tienda, una vez y otra vez cada
 * vez que este archivo traiga activadores nuevos. Google no deja mandar correos
 * desde un onEdit común: ocupa estos activadores instalados.
 */
function instalarAvisos() {
  const propios = ["alEditarHoja", "tareasCadaHora", "publicarSiCambio", "respaldarHoja"];
  ScriptApp.getProjectTriggers()
    .filter((activador) => propios.includes(activador.getHandlerFunction()))
    .forEach((activador) => ScriptApp.deleteTrigger(activador));
  ScriptApp.newTrigger("alEditarHoja").forSpreadsheet(libro()).onEdit().create();
  ScriptApp.newTrigger("tareasCadaHora").timeBased().everyHours(1).create();
  ScriptApp.newTrigger("publicarSiCambio").timeBased().everyMinutes(5).create();
  ScriptApp.newTrigger("respaldarHoja").timeBased().onWeekDay(ScriptApp.WeekDay.SUNDAY).atHour(3).create();
}

/** Corre con cada edición de la hoja, gracias a instalarAvisos(). */
function alEditarHoja(e) {
  const rango = e.range;
  const pestana = rango.getSheet().getName();
  if ([HOJAS.compras, HOJAS.ventas, HOJAS.catalogo, HOJAS.pedidos].includes(pestana)) {
    olvidarStock();
    // Si volvió a haber algo que alguien esperaba, le avisa.
    try {
      conCandado(() => revisarAvisos());
    } catch (error) {
      console.error(error);
    }
    if (pestana !== HOJAS.pedidos) {
      try {
        actualizarSistema();
      } catch (error) {
        console.error(error);
      }
    }
  }
  if (pestana === HOJAS.especiales && rango.getNumRows() === 1 && rango.getRow() >= PRIMERA_FILA) {
    const aviso = alEditarEspecial(rango.getRow(), rango.getColumn(), String(e.value || ""));
    if (aviso) libro().toast(aviso, CONFIG.nombreTienda, 10);
    return;
  }
  if (pestana === HOJAS.contenido && rango.getColumn() === COL_CONTENIDO.estado && rango.getNumRows() === 1 && rango.getRow() >= PRIMERA_FILA) {
    if (CONTENIDO_A_REVISAR.includes(String(e.value))) {
      const errores = revisarContenido(rango.getRow());
      libro().toast(
        errores ? "Ojo: algo de esta publicación cambió. Mirá la columna Revisión de inventario." : "Revisado: lo anunciado sigue disponible y al mismo precio.",
        CONFIG.nombreTienda,
        8,
      );
    }
    return;
  }
  if (pestana !== HOJAS.pedidos) return;
  if (rango.getColumn() !== COL.estado || rango.getRow() < PRIMERA_FILA) return;
  if (rango.getNumRows() !== 1) return;
  if (e.value === ENTREGADO) {
    const numero = hoja(HOJAS.pedidos).getRange(rango.getRow(), COL.numero).getValue();
    if (!numero) return;
    const filaEntregada = hoja(HOJAS.pedidos).getRange(rango.getRow(), 1, 1, TOTAL_COLUMNAS).getValues()[0];
    if (esAnticipo(filaEntregada)) {
      const resultado = conCandado(() => pasarAVentas(rango.getRow(), e.oldValue, true));
      if (resultado.fila) marcarEspecial(numero, { adquisicion: "Entregado" });
      olvidarStock();
      libro().toast(resultado.aviso, CONFIG.nombreTienda, 8);
    }
    programarOpinion(numero);
    libro().toast(
      "En " + CONFIG.diasParaOpinion + " días le pedimos su opinión por correo a " + numero + ".",
      CONFIG.nombreTienda,
      8,
    );
    return;
  }
  if (e.value === CONSEGUIDO) {
    const fila = hoja(HOJAS.pedidos).getRange(rango.getRow(), 1, 1, TOTAL_COLUMNAS).getValues()[0];
    libro().toast(avisarConseguido(fila), CONFIG.nombreTienda, 8);
    return;
  }
  if (e.value !== PAGADO && e.value !== PAGADO_PAYPAL) return;

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

function pasarAVentas(numeroFila, estadoAnterior, alEntregar) {
  const pestana = hoja(HOJAS.pedidos);
  const fila = pestana.getRange(numeroFila, 1, 1, TOTAL_COLUMNAS).getValues()[0];
  const numero = fila[COL.numero - 1];
  const detalle = leerDetalle(fila);
  const especial = detalle.lineas.some((linea) => linea.especial);

  // Pedido especial pagado: la plata queda como anticipo del cliente, no como venta,
  // hasta que se entregue (o se devuelva). Así no se cuenta como ganancia antes de tiempo.
  if (especial && !alEntregar) {
    if (fila[COL.enVentas - 1]) return { aviso: numero + " ya estaba anotado." };
    pestana.getRange(numeroFila, COL.enVentas).setValue(ANTICIPO + ": pasa a Ventas al entregarlo");
    marcarPagoEspecial(numero, fila[COL.total - 1]);
    return { aviso: numero + " quedó pagado como anticipo. Pasa a Ventas cuando lo entreguen.", fila };
  }
  // Un pedido entra a Ventas una sola vez, aunque el Estado se cambie varias.
  if (fila[COL.enVentas - 1] && !(alEntregar && esAnticipo(fila))) return { aviso: numero + " ya estaba en Ventas." };

  const volver = (motivo) => {
    if (alEntregar) {
      pestana.getRange(numeroFila, COL.notas).setValue(motivo);
      return { aviso: numero + " no pasó a Ventas. " + motivo };
    }
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
    String(fila[COL.comprobante - 1]).indexOf("PayPal") === 0
      ? fila[COL.comprobante - 1]
      : "SINPE " + (fila[COL.comprobante - 1] || "sin número"),
    "WhatsApp " + fila[COL.whatsapp - 1],
    detalle.lineas.some((linea) => linea.preventa) ? "Adelanto de preventa" : "",
    detalle.lineas.some((linea) => linea.especial) ? "Pedido especial (" + entregaEspecial(detalle.lineas) + ")" : "",
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
