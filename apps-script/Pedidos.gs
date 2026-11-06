/**
 * Servidor de Pokedeke. Vive adentro de la hoja "Control del negocio TCG",
 * en Extensiones > Apps Script. Hace cuatro cosas:
 *
 * 1. Recibe los pedidos de la página y los anota en "Pedidos web".
 * 2. Avisa por correo cuando entra un pedido o un comprobante.
 * 3. Cuando el Estado de un pedido pasa a "Pagado", anota la venta en "Ventas".
 * 4. Le entrega a GitHub el catálogo y a cada cliente el estado de su pedido.
 *
 * Los precios y el stock siempre se leen de la hoja: lo que manda el navegador
 * nunca se usa para calcular cuánto se cobra.
 */

const CONFIG = {
  correoAvisos: "pokedekestorecr@gmail.com",
  nombreTienda: "Pokedeke",
  canal: "Página web",
  metodoPago: "SINPE Móvil",
  horasApartado: 24,
  adelantoPreventa: 0.5,
  envioGratisDesde: 50000,
  maxLlamadasPorHora: 60,
  // Estos valores deben coincidir con lib/tienda.ts.
  envios: {
    correos: { nombre: "Correos de Costa Rica", costo: 2500, pideDireccion: true },
    "retiro-omni": { nombre: "Retiro en Edificio Omni", costo: 0, pideDireccion: false },
  },
  cupones: {
    TICO10: { tipo: "porcentaje", valor: 10 },
    BIENVENIDA: { tipo: "monto", valor: 2000 },
    SOBRE5: { tipo: "porcentaje", valor: 5 },
    DEKESHINY: { tipo: "porcentaje", valor: 15 },
  },
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
  const crudo = pestana.getRange(4, 1, Math.max(ultima - 3, 1), 16).getValues();
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

function crearPedido(datos) {
  const cliente = texto(datos.cliente, 80);
  const whatsapp = normalizarWhatsapp(datos.whatsapp);
  const envio = CONFIG.envios[datos.envio];
  const pedidas = Array.isArray(datos.lineas) ? datos.lineas.slice(0, 30) : [];

  if (cliente.length < 3) return { ok: false, error: "Escribí tu nombre completo." };
  if (!whatsapp) return { ok: false, error: "Revisá tu WhatsApp: deben ser 8 números." };
  if (!envio) return { ok: false, error: "Elegí cómo te llega el pedido." };
  if (pedidas.length === 0) return { ok: false, error: "Tu carrito está vacío." };

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
    lineas.push({
      slug,
      nombre: producto.nombre,
      cantidad,
      precio: producto.precioCobrado,
      preventa: producto.preventa,
    });
  }

  const subtotal = lineas.reduce((suma, linea) => suma + linea.precio * linea.cantidad, 0);
  const descuento = calcularDescuento(datos.cupon, subtotal);
  const costoEnvio = subtotal >= CONFIG.envioGratisDesde ? 0 : envio.costo;
  const total = subtotal - descuento + costoEnvio;
  const numero = siguienteNumero(filas);
  const clave = Utilities.getUuid();
  const correo = texto(datos.correo, 120);
  const resumen = lineas
    .map((linea) => linea.cantidad + " × " + linea.nombre + " (" + colones(linea.precio) + ")")
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
  fila[COL.detalle - 1] = comoTexto(JSON.stringify({ lineas, subtotal, descuento }));
  fila[COL.clave - 1] = clave;
  hoja(HOJAS.pedidos).appendRow(fila);

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
  );

  return { ok: true, numero, clave, subtotal, descuento, costoEnvio, total, lineas };
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

function avisar(asunto, lineas, responderA) {
  try {
    const opciones = {
      to: CONFIG.correoAvisos,
      subject: asunto,
      body: lineas.filter((linea, i) => linea || lineas[i - 1]).join("\n"),
      name: CONFIG.nombreTienda,
    };
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(responderA)) opciones.replyTo = responderA;
    MailApp.sendEmail(opciones);
  } catch (error) {
    // Un correo que falla no debe perder el pedido: ya quedó en la hoja.
    console.error(error);
  }
}

/* ---------- Pasar a Ventas ---------- */

/** Google lo corre solo cada vez que se edita la hoja. */
function onEdit(e) {
  const rango = e.range;
  if (rango.getSheet().getName() !== HOJAS.pedidos) return;
  if (rango.getColumn() !== COL.estado || rango.getRow() < PRIMERA_FILA) return;
  if (rango.getNumRows() !== 1 || e.value !== PAGADO) return;

  const aviso = conCandado(() => pasarAVentas(rango.getRow(), e.oldValue));
  libro().toast(aviso, CONFIG.nombreTienda, 8);
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
  if (fila[COL.enVentas - 1]) return numero + " ya estaba en Ventas.";

  const detalle = leerDetalle(fila);
  const volver = (motivo) => {
    pestana.getRange(numeroFila, COL.estado).setValue(estadoAnterior || PENDIENTE);
    pestana.getRange(numeroFila, COL.notas).setValue(motivo);
    return numero + " no pasó a Ventas. " + motivo;
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
  return numero + " pasó a Ventas.";
}
