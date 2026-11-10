#!/usr/bin/env node
/**
 * Convierte la pestaña "Catálogo web" de la hoja en datos/catalogo.json.
 *
 * Lee esa pestaña desde el servidor de la hoja (variable PEDIDOS_URL) o desde un
 * archivo local con `--archivo ruta.csv`. Si Google no responde, deja el catálogo como
 * está. Si la pestaña cambió de forma, trae errores de fórmula o de golpe le falta
 * mucho de lo que había (el freno), falla y tampoco lo toca.
 *
 * También lleva datos/enlaces-viejos.json: si un producto cambia de nombre en la
 * hoja, su dirección vieja manda a la nueva.
 */
import { readFileSync } from "node:fs";
import { appendFile, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CARPETA_FOTOS = path.join(RAIZ, "public/productos");

const COLUMNAS_OBLIGATORIAS = [
  "ID",
  "Producto",
  "Categoría",
  "Juego",
  "En stock",
  "Precio sugerido (₡)",
  "Precio de venta (₡)",
];

const CORTAS = {
  ETB: "ETB",
  "Booster bundle": "Bundle",
  "Booster box": "Box",
  "Booster pack": "Sobre",
  "Blister / sleeved booster": "Blister",
  "Tin o caja de colección": "Tin",
  "Colección premium / UPC": "Premium",
  "Carta suelta (single)": "Suelta",
  "Carta gradada": "Gradada",
  Mazos: "Mazo",
  "Sleeves y fundas": "Sleeves",
  Accesorios: "Accesorio",
  Otro: "Otro",
};

const DESCRIPCIONES = {
  ETB: "Elite Trainer Box: la caja completa, con sobres, fundas, dados y separadores.",
  "Booster bundle": "Paquete de sobres listo para abrir de una.",
  "Booster box": "La caja de sobres completa.",
  "Booster pack": "Un sobre para probar suerte.",
  "Blister / sleeved booster": "Sobres en su empaque individual.",
  "Tin o caja de colección": "Lata o caja de colección con sobres.",
  "Colección premium / UPC": "Colección especial para quien quiere la pieza grande.",
};

const COLUMNAS_DE_NUMEROS = ["En stock", "Vendidas", "Precio sugerido (₡)", "Precio de venta (₡)"];

// "Preventa" y "Pedido especial" ya no se usan: lo que las tenga sale como Por consultar.
const ETIQUETAS = ["Nuevo", "Oferta"];
const ETIQUETAS_VIEJAS = ["Preventa", "Pedido especial"];

export const ESTADOS = {
  disponible: "Disponible",
  enCamino: "En camino",
  porConsultar: "Por consultar",
  agotado: "Agotado",
  noPublicado: "No publicado",
  pedidoEspecial: "Pedido especial",
};
const COLUMNA_ESTADO = "Estado en la página";
const COLUMNAS_ENTREGA = ["Entrega máxima (pedido especial)", "Llega (preventas)"];

/** La fecha máxima de entrega de un pedido especial (dd/mm/yyyy), como la entiende la página. */
function entregaDe(lote) {
  const texto = COLUMNAS_ENTREGA.map((columna) => lote[columna]).find((celda) => String(celda ?? "").trim());
  const partes = String(texto ?? "").trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!partes) return "";
  return partes[3] + "-" + partes[2].padStart(2, "0") + "-" + partes[1].padStart(2, "0");
}

/**
 * El estado de una fila de "Catálogo web". Vacío o Disponible se vende si hay
 * unidades; cualquier otra cosa no se vende aunque la hoja muestre stock. Debe
 * decidir igual que estadoDelLote en apps-script/Pedidos.gs.
 */
export function estadoDelLote(lote) {
  if (esNo(lote["Publicado (sí/no)"])) return ESTADOS.noPublicado;
  const escrito = sinAcentos(String(lote[COLUMNA_ESTADO] ?? "")).trim();
  if (!escrito) {
    return ETIQUETAS_VIEJAS.includes(String(lote.Etiqueta ?? "").trim())
      ? ESTADOS.porConsultar
      : ESTADOS.disponible;
  }
  return (
    Object.values(ESTADOS).find((estado) => sinAcentos(estado) === escrito) ?? ESTADOS.agotado
  );
}
const CARTAS = ["Carta suelta (single)", "Carta gradada"];

export function leerCsv(texto) {
  const filas = [];
  let fila = [];
  let celda = "";
  let entreComillas = false;

  for (let i = 0; i < texto.length; i += 1) {
    const letra = texto[i];
    if (entreComillas) {
      if (letra === '"' && texto[i + 1] === '"') {
        celda += '"';
        i += 1;
      } else if (letra === '"') {
        entreComillas = false;
      } else {
        celda += letra;
      }
    } else if (letra === '"') {
      entreComillas = true;
    } else if (letra === ",") {
      fila.push(celda);
      celda = "";
    } else if (letra === "\n") {
      fila.push(celda);
      filas.push(fila);
      fila = [];
      celda = "";
    } else if (letra !== "\r") {
      celda += letra;
    }
  }
  if (celda || fila.length > 0) {
    fila.push(celda);
    filas.push(fila);
  }
  return filas;
}

const sinAcentos = (texto) =>
  texto.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

export const aSlug = (texto) =>
  sinAcentos(texto)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** "₡50.000" y "50000" dan 50000. Lo que no sea un monto da 0. */
export function aMonto(texto) {
  return Number(String(texto ?? "").split(",")[0].replace(/\D/g, "")) || 0;
}

function aEntero(texto) {
  return Number.parseInt(String(texto ?? "").replace(/[^\d-]/g, ""), 10) || 0;
}

const esSi = (texto) => /^s[ií]$/i.test(String(texto ?? "").trim());
const esNo = (texto) => /^no$/i.test(String(texto ?? "").trim());

/** Mismas palabras en cualquier orden: "preventa-" no cuenta como palabra. */
function claveDeFoto(slug) {
  return slug
    .replace(/^preventa-/, "")
    .split("-")
    .filter(Boolean)
    .sort()
    .join("-");
}

async function fotosGuardadas() {
  const nombres = (await readdir(CARPETA_FOTOS))
    .filter((nombre) => nombre.endsWith(".webp"))
    .map((nombre) => nombre.replace(/\.webp$/, ""))
    .sort();
  const existentes = new Set(nombres);
  const porClave = new Map();

  for (const nombre of nombres) {
    // etb-x-2 es otra vista de etb-x, pero battle-academy-2 es su propio producto.
    const vista = nombre.match(/^(.+)-(\d)$/);
    const base = vista && existentes.has(vista[1]) ? vista[1] : nombre;
    const clave = claveDeFoto(base);
    porClave.set(clave, [...(porClave.get(clave) ?? []), nombre]);
  }
  return { existentes, porClave };
}

/**
 * Las fotos de la celda "Fotos (URL)". Una que empieza con "real:" es del
 * artículo mismo (el frente o el reverso de esa carta): la página lo dice.
 */
function fotosDelProducto(nombre, celda, { existentes, porClave }, avisos, reales = []) {
  const propias = String(celda ?? "")
    .split(/[\s,;]+/)
    .filter(Boolean)
    .flatMap((escrita) => {
      const esReal = /^real:/i.test(escrita);
      const foto = escrita.replace(/^real:/i, "");
      let ruta = "";
      if (/^https?:\/\//.test(foto)) ruta = foto;
      else if (existentes.has(foto.replace(/\.webp$/, ""))) ruta = "/productos/" + foto.replace(/\.webp$/, "") + ".webp";
      if (!ruta) {
        avisos.push(`${nombre}: no existe la foto "${foto}".`);
        return [];
      }
      if (esReal) reales.push(ruta);
      return [ruta];
    });
  if (propias.length > 0) return propias;

  const texto = sinAcentos(nombre)
    .replace(/elite trainer box/g, "etb")
    .replace(/booster pack/g, "sobre");
  return (porClave.get(claveDeFoto(aSlug(texto))) ?? []).map(
    (archivo) => `/productos/${archivo}.webp`,
  );
}

/** "Unown #? (Unseen Forces)" también vale: algunas cartas se numeran con ? o !. */
function datosDeCarta(nombre) {
  const partes = nombre.match(/#\s*([\w/?!-]+)\s*(?:\((.+)\))?\s*$/);
  return {
    coleccion: partes?.[2]?.trim() ?? "",
    numero: partes?.[1] ?? "",
    rareza: "",
    condicion: "",
  };
}

/**
 * Las cartas usadas dicen su condición en la descripción: "Condición: Lightly
 * Played (LP)." Las que no la dicen son Near Mint, recién salidas del sobre.
 */
export const condicionDe = (descripcion) =>
  descripcion.match(/Condición:\s*([^.]+?)\s*\./)?.[1] ?? "";

const TIPOS = "Planta|Fuego|Agua|Rayo|Psíquico|Lucha|Oscuro|Metálico|Dragón|Incoloro|Hada";
const TIPO_EN_DESCRIPCION = new RegExp(`\\btipo (${TIPOS})\\b`);
const TIPO_DE_ENERGIA = {
  Planta: "Planta",
  Fuego: "Fuego",
  Agua: "Agua",
  Rayo: "Rayo",
  Psíquica: "Psíquico",
  Lucha: "Lucha",
  Oscura: "Oscuro",
  Metálica: "Metálico",
};
// Cartas de antes del control cuya descripción no dice el tipo (revisado en TCGplayer).
const TIPO_A_MANO = {
  "Rotom #197 (Destined Rivals)": "Rayo",
  "Eevee ex #174 (Promo)": "Incoloro",
  "Nidorina #101 (Promo)": "Oscuro",
  "Sylveon ex #100 (Promo)": "Psíquico",
  "Mew ex #066 (30th Celebration)": "Psíquico",
  "Umbreon ex #60 (Prismatic Evolutions)": "Oscuro",
  "Solgaleo GX #158 (Chinese 30th Celebration)": "Metálico",
  "Greninja BREAK #41 (30th Celebration)": "Agua",
  "Rayquaza EX #85 (30th Celebration)": "Dragón",
  "Pikachu ex #150 (30th Celebration)": "Rayo",
  "Espeon V #513 (Chinese Gem Pack 2)": "Psíquico",
  "Altaria GX #96 (Chinese CSM1cC)": "Dragón",
};

// Tipo de cada Pokémon por nombre ("Pikachu": "Rayo"), sacado de las cartas de TCGdex que ya
// se bajaron. Sirve para las cartas cuya descripción no dice el tipo, como las chinas.
const TIPOS_POKEMON = JSON.parse(readFileSync(path.join(RAIZ, "datos/tipos-pokemon.json"), "utf8"));
const VARIANTES = /\s+(Reverse Holo|Poké Ball|Master Ball|Friend Ball|Energy Symbol|Quick Ball)$/i;
const ENTRENADOR = /^(Carta de Entrenador|Son 2 cartas)/;

/** "Pikachu ex Poké Ball #047 (Set)" → "Pikachu ex". */
export const pokemonDe = (nombre) => nombre.replace(/\s*#.*$/, "").replace(VARIANTES, "").trim();

/**
 * Las cartas de Pokémon sin tipo en la descripción lo toman de otra carta del
 * mismo Pokémon en el catálogo y, si no hay, de datos/tipos-pokemon.json. Así
 * una carta nueva sale con su ícono sin tocar nada.
 */
export function completarTipos(productos) {
  const conocidos = new Map();
  for (const p of productos) {
    if (!p.tipo || !p.carta) continue;
    const nombre = pokemonDe(p.nombre);
    const cuenta = conocidos.get(nombre) ?? {};
    cuenta[p.tipo] = (cuenta[p.tipo] ?? 0) + 1;
    conocidos.set(nombre, cuenta);
  }
  for (const p of productos) {
    if (p.tipo || !p.carta || ENTRENADOR.test(p.descripcion ?? "")) continue;
    const nombre = pokemonDe(p.nombre);
    const cuenta = conocidos.get(nombre);
    const tipo = cuenta
      ? Object.entries(cuenta).sort((a, b) => b[1] - a[1])[0][0]
      : TIPOS_POKEMON[nombre];
    if (tipo) p.tipo = tipo;
  }
  return productos;
}

/** Tipo de energía: de las energías básicas por su nombre y de las cartas por su descripción. */
export function tipoDe(nombre, descripcion, carta) {
  const energia = nombre.match(/^Energía (\S+)$/);
  if (energia) return TIPO_DE_ENERGIA[energia[1]];
  if (!carta) return undefined;
  return TIPO_A_MANO[nombre] ?? descripcion.match(TIPO_EN_DESCRIPCION)?.[1];
}

function descripcionDe(producto, carta) {
  if (carta?.coleccion && carta.numero) {
    return `Carta de la colección ${carta.coleccion}, número ${carta.numero}.`;
  }
  return DESCRIPCIONES[producto] ?? "";
}

export function armarCatalogo(textoCsv, fotos) {
  const filas = leerCsv(textoCsv);
  const indiceTitulos = filas.findIndex(
    (fila) => fila[0]?.trim() === "ID" && fila.includes("Producto"),
  );
  if (indiceTitulos === -1) {
    throw new Error('No hallé la fila de títulos de "Catálogo web".');
  }

  const titulos = filas[indiceTitulos].map((titulo) => titulo.trim());
  const faltan = COLUMNAS_OBLIGATORIAS.filter(
    (columna) => !titulos.includes(columna),
  );
  if (faltan.length > 0) {
    throw new Error(`Faltan columnas en "Catálogo web": ${faltan.join(", ")}.`);
  }

  const lotes = filas
    .slice(indiceTitulos + 1)
    .map((fila) => Object.fromEntries(titulos.map((t, i) => [t, fila[i] ?? ""])))
    .filter((fila) => fila.ID?.trim() && fila.Producto?.trim());
  if (lotes.length === 0) {
    throw new Error('"Catálogo web" vino sin productos.');
  }
  // #REF!, #N/A y compañía: una fórmula rota no debe volverse "agotado" o "sin precio".
  const rotas = lotes.filter((lote) =>
    COLUMNAS_DE_NUMEROS.some((columna) => String(lote[columna] ?? "").trim().startsWith("#")),
  );
  if (rotas.length > 0) {
    throw new Error(
      '"Catálogo web" tiene ' + rotas.length + " filas con errores de fórmula (por ejemplo " +
        rotas[0].Producto.trim() + "): no se publica hasta arreglarlas.",
    );
  }

  const avisos = [];
  const grupos = new Map();
  lotes.forEach((lote, indice) => {
    const nombre = lote.Producto.trim();
    if (sinAcentos(lote.Juego ?? "").trim() !== "pokemon") return;
    const estado = estadoDelLote(lote);
    if (estado === ESTADOS.noPublicado) return;

    const clave = aSlug(nombre);
    const grupo = grupos.get(clave) ?? { clave, nombre, lotes: [], orden: 0, stock: 0, cupos: 0, estados: new Set() };
    // Solo cuenta lo que está en el mezzanine: lo demás no es para vender hoy.
    if (estado === ESTADOS.disponible) grupo.stock += Math.max(aEntero(lote["En stock"]), 0);
    // Pedido especial: "En stock" son los cupos para importar. Sin Precio de venta o sin
    // fecha de entrega futura no se vende: queda Por consultar. Igual que Pedidos.gs.
    let estadoFinal = estado;
    if (estado === ESTADOS.pedidoEspecial) {
      const entrega = entregaDe(lote);
      if (aMonto(lote["Precio de venta (₡)"]) > 0 && entrega && entrega > new Date().toISOString().slice(0, 10)) {
        grupo.cupos += Math.max(aEntero(lote["En stock"]), 0);
        grupo.entrega = entrega;
        grupo.precioEspecial = aMonto(lote["Precio de venta (₡)"]);
      } else {
        estadoFinal = ESTADOS.porConsultar;
      }
    }
    grupo.estados.add(estadoFinal);
    grupo.lotes.push(lote);
    grupo.orden = indice + 1;
    grupos.set(clave, grupo);
  });

  const productos = [...grupos.values()].flatMap((grupo) => {
    const recientes = [...grupo.lotes].reverse();
    const ultimo = (columna) =>
      recientes.map((lote) => lote[columna]?.trim()).find(Boolean) ?? "";

    const precio =
      recientes.map((lote) => aMonto(lote["Precio de venta (₡)"])).find(Boolean) ||
      recientes.map((lote) => aMonto(lote["Precio sugerido (₡)"])).find(Boolean) ||
      0;
    if (!precio) {
      avisos.push(`${grupo.nombre}: quedó fuera porque no tiene precio.`);
      return [];
    }

    const categoria = ultimo("Categoría") || "Otro";
    const carta = CARTAS.includes(categoria) ? datosDeCarta(grupo.nombre) : undefined;
    const etiqueta = ETIQUETAS.find((opcion) => opcion === ultimo("Etiqueta"));
    const especial = grupo.stock === 0 && grupo.cupos > 0;
    const estado =
      grupo.stock > 0
        ? ESTADOS.disponible
        : especial
          ? ESTADOS.pedidoEspecial
          : grupo.estados.has(ESTADOS.enCamino)
          ? ESTADOS.enCamino
          : grupo.estados.has(ESTADOS.porConsultar)
            ? ESTADOS.porConsultar
            : ESTADOS.agotado;
    const fotosReales = [];
    const fotosFinales = fotosDelProducto(
      grupo.nombre,
      ultimo("Fotos (URL)"),
      fotos,
      avisos,
      fotosReales,
    );
    if (fotosFinales.length === 0) {
      avisos.push(`${grupo.nombre}: todavía no tiene foto.`);
    }
    const descripcion = ultimo("Descripción") || descripcionDe(categoria, carta);
    if (carta) carta.condicion = condicionDe(descripcion);
    const tipo = tipoDe(grupo.nombre, descripcion, carta);

    return [
      {
        id: grupo.lotes[0].ID.trim(),
        slug: grupo.clave,
        nombre: ultimo("Nombre para mostrar") || grupo.nombre,
        juego: "Pokémon",
        categoria,
        categoriaCorta: CORTAS[categoria] ?? categoria,
        idioma: ultimo("Idioma"),
        precio: especial ? grupo.precioEspecial : precio,
        // Lo que se puede comprar hoy: 0 si está en camino, por consultar o agotado. En un
        // pedido especial, los cupos para importar.
        stock: especial ? grupo.cupos : grupo.stock,
        estado,
        ...(especial ? { entrega: grupo.entrega } : {}),
        ...(etiqueta ? { etiqueta } : {}),
        ...(esSi(ultimo("Destacado (sí/no)")) ? { destacado: true } : {}),
        vendidos: grupo.lotes.reduce(
          (suma, lote) => suma + aEntero(lote.Vendidas),
          0,
        ),
        orden: grupo.orden,
        fotos: fotosFinales,
        ...(fotosReales.length > 0 ? { fotosReales } : {}),
        descripcion,
        ...(carta ? { carta } : {}),
        ...(tipo ? { tipo } : {}),
      },
    ];
  });

  return { productos: completarTipos(productos), avisos };
}

const ejemplos = (productos) =>
  productos
    .slice(0, 3)
    .map((producto) => producto.nombre ?? producto.slug)
    .join(", ");

/**
 * El freno: si de golpe falta mucho de lo que había, es más probable una fórmula
 * rota en la hoja que una decisión. Devuelve los motivos para no publicar; vacío
 * si todo se ve normal. Con catálogos chiquitos no aplica.
 */
export function revisarCambio(previos, nuevos) {
  if (previos.length < 20) return [];
  const motivos = [];
  const actuales = new Map(nuevos.map((producto) => [producto.slug, producto]));
  const ids = new Set(nuevos.map((producto) => producto.id));

  // Un producto que solo cambió de nombre sigue estando: se reconoce por su ID.
  const perdidos = previos.filter(
    (producto) => !actuales.has(producto.slug) && !ids.has(producto.id),
  );
  if (perdidos.length > Math.max(10, previos.length * 0.15)) {
    motivos.push(
      "Desaparecieron " + perdidos.length + " de " + previos.length +
        " productos (por ejemplo " + ejemplos(perdidos) + ").",
    );
  }

  const conStock = previos.filter((producto) => producto.stock > 0);
  // Pasar algo a "En camino" o "Por consultar" es una decisión, no un error de la hoja.
  const agotados = conStock.filter((producto) => {
    const actual = actuales.get(producto.slug);
    return actual?.stock === 0 && (actual.estado ?? ESTADOS.agotado) === ESTADOS.agotado;
  });
  if (conStock.length >= 20 && agotados.length > conStock.length * 0.5) {
    motivos.push(
      "Se agotaron de golpe " + agotados.length + " de " + conStock.length +
        " productos (por ejemplo " + ejemplos(agotados) + ").",
    );
  }

  const regalados = previos.filter((producto) => {
    const actual = actuales.get(producto.slug);
    return actual && producto.precio >= 1000 && actual.precio < producto.precio * 0.2;
  });
  if (regalados.length > Math.max(5, previos.length * 0.05)) {
    motivos.push(
      regalados.length + " productos bajaron de precio más de un 80% de golpe (por ejemplo " +
        ejemplos(regalados) + ").",
    );
  }
  return motivos;
}

/**
 * Si un producto cambió de nombre en la hoja, cambia su dirección: aquí queda
 * la vieja apuntando a la nueva, para que los enlaces compartidos y los de
 * Google sigan sirviendo. El producto se reconoce por su ID.
 */
export function enlacesViejos(previos, nuevos, guardados = {}) {
  const porId = new Map(nuevos.map((producto) => [producto.id, producto.slug]));
  const vigentes = new Set(nuevos.map((producto) => producto.slug));
  const enlaces = { ...guardados };
  for (const previo of previos) {
    const nuevo = porId.get(previo.id);
    if (nuevo && nuevo !== previo.slug) enlaces[previo.slug] = nuevo;
  }
  // Cadena A → B → C: A va directo a C.
  for (const [viejo, destino] of Object.entries(enlaces)) {
    if (!vigentes.has(destino) && enlaces[destino]) enlaces[viejo] = enlaces[destino];
  }
  // Una dirección que volvió a existir ya no se redirige, y una sin destino tampoco.
  for (const viejo of Object.keys(enlaces)) {
    if (vigentes.has(viejo) || !vigentes.has(enlaces[viejo])) delete enlaces[viejo];
  }
  return Object.fromEntries(Object.entries(enlaces).sort());
}

async function leerJson(ruta, siFalta) {
  try {
    return JSON.parse(await readFile(ruta, "utf8"));
  } catch {
    return siFalta;
  }
}

async function descargar(url) {
  for (let intento = 1; intento <= 3; intento += 1) {
    try {
      const respuesta = await fetch(url, {
        redirect: "follow",
        signal: AbortSignal.timeout(20_000),
      });
      if (respuesta.ok) return await respuesta.text();
      console.log(`Intento ${intento}: Google respondió ${respuesta.status}.`);
    } catch (error) {
      console.log(`Intento ${intento}: ${error.message}`);
    }
    await new Promise((listo) => setTimeout(listo, 3000 * intento));
  }
  return null;
}

function opcion(nombre) {
  const indice = process.argv.indexOf(`--${nombre}`);
  return indice === -1 ? undefined : process.argv[indice + 1];
}

async function principal() {
  const archivo = opcion("archivo");
  const salida = opcion("salida") ?? path.join(RAIZ, "datos/catalogo.json");
  const url = process.env.PEDIDOS_URL && `${process.env.PEDIDOS_URL}?accion=catalogo`;

  if (!archivo && !url) {
    console.log("Falta PEDIDOS_URL: el catálogo se queda como está.");
    return;
  }

  const texto = archivo ? await readFile(archivo, "utf8") : await descargar(url);
  if (texto === null) {
    console.log("::warning::Google no respondió: el catálogo se queda como está.");
    return;
  }

  const previos = await leerJson(salida, []);
  const { productos, avisos } = armarCatalogo(texto, await fotosGuardadas());
  if (process.env.PERMITIR_CAMBIO_GRANDE !== "si") {
    const motivos = revisarCambio(previos, productos);
    if (motivos.length > 0) {
      throw new Error(
        "Freno del catálogo: " + motivos.join(" ") +
          " La página se queda como está. Si el cambio fue a propósito, corré Publicar demo a mano con la casilla de permitir un cambio grande.",
      );
    }
  }
  await writeFile(salida, `${JSON.stringify(productos, null, 2)}\n`);

  const rutaEnlaces = path.join(path.dirname(salida), "enlaces-viejos.json");
  const enlaces = enlacesViejos(previos, productos, await leerJson(rutaEnlaces, {}));
  await writeFile(rutaEnlaces, JSON.stringify(enlaces, null, 2) + "\n");

  const resumen = [
    `Catálogo: ${productos.length} productos, ${productos.filter((p) => p.stock > 0).length} con stock.`,
    ...avisos.map((aviso) => `- ${aviso}`),
  ].join("\n");
  console.log(resumen);
  if (process.env.GITHUB_STEP_SUMMARY) {
    await appendFile(process.env.GITHUB_STEP_SUMMARY, `${resumen}\n`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  principal().catch((error) => {
    console.error(`::error::${error.message}`);
    process.exit(1);
  });
}
