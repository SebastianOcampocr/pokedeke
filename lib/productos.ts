import catalogo from "@/datos/catalogo.json";
import { PEDIDOS_ESPECIALES, TOPE_DESTACADOS } from "./tienda";

/**
 * Lo manda la hoja. Disponible: está en el mezzanine y se puede comprar. En
 * camino: ya lo compramos y no ha llegado. Por consultar: no es nuestro, hay
 * que revisar si se consigue. Agotado: lo vendemos, pero hoy no hay.
 */
export type Estado =
  | "Disponible"
  | "En camino"
  | "Por consultar"
  | "Agotado"
  | "Pedido especial";

export type Producto = {
  id: string;
  slug: string;
  nombre: string;
  juego: string;
  categoria: string;
  categoriaCorta: string;
  idioma: string;
  precio: number;
  precioAntes?: number;
  /** Unidades que se pueden comprar hoy: 0 si no está Disponible. */
  stock: number;
  estado?: Estado;
  /** Solo pedido especial: fecha máxima de entrega (yyyy-mm-dd). `stock` son los cupos. */
  entrega?: string;
  /** Gramos, según la hoja. Llega con el stock en vivo. */
  peso?: number;
  etiqueta?: "Nuevo" | "Oferta";
  destacado?: boolean;
  parado?: boolean;
  vendidos: number;
  orden: number;
  fotos: string[];
  descripcion: string;
  /** Fotos que son del artículo mismo, no de referencia. En la hoja van con "real:" adelante. */
  fotosReales?: string[];
  /** Si existe, el carrito lleva aquí en vez de a la página del producto. */
  enlace?: string;
  /** Solo cartas sueltas y gradadas. */
  carta?: {
    coleccion: string;
    numero: string;
    rareza: string;
    condicion: string;
  };
  /** Tipo de energía del Pokémon, o de la energía básica. Los Entrenadores no tienen. */
  tipo?: TipoEnergia;
};

export const TIPOS_ENERGIA = [
  "Planta",
  "Fuego",
  "Agua",
  "Rayo",
  "Psíquico",
  "Lucha",
  "Oscuro",
  "Metálico",
  "Dragón",
  "Incoloro",
  "Hada",
] as const;

export type TipoEnergia = (typeof TIPOS_ENERGIA)[number];

/**
 * Todo el inventario sale de la pestaña "Catálogo web" de la hoja de Google.
 * scripts/traer-catalogo.mjs genera este archivo: no se edita a mano.
 */
export const PRODUCTOS = (catalogo as unknown as Producto[]).map((producto) =>
  // Con el pago anticipado apagado, el pedido especial se muestra como Por consultar.
  producto.estado === "Pedido especial" && !PEDIDOS_ESPECIALES
    ? { ...producto, estado: "Por consultar" as const, stock: 0, entrega: undefined }
    : producto,
);

export function buscarProducto(slug: string) {
  return PRODUCTOS.find((producto) => producto.slug === slug);
}

/** Cartas que se ven sueltas: sueltas y gradadas llevan el efecto holográfico. */
export function esCarta(producto: Producto) {
  return Boolean(producto.carta);
}

export const cartasSueltas = () =>
  PRODUCTOS.filter(
    (producto) => producto.categoria === "Carta suelta (single)",
  ).sort((a, b) => a.precio - b.precio);

/** Para buscar sin que importen tildes ni mayúsculas. */
export function sinAcentos(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

export function coincide(producto: Producto, busqueda: string) {
  const texto = sinAcentos(busqueda.trim());
  if (!texto) return true;
  const campos = `${producto.nombre} ${producto.juego} ${producto.categoria} ${producto.categoriaCorta} ${producto.carta?.coleccion ?? ""} ${producto.carta?.rareza ?? ""}`;
  return sinAcentos(campos).includes(texto);
}

/** No se puede comprar ahora: agotado, en camino o por consultar. */
export function estaAgotado(producto: Producto) {
  return producto.stock <= 0;
}

/** Con unidades es Disponible; sin unidades, lo que diga la hoja. */
export function estadoDe(producto: Producto): Estado {
  if (producto.estado === "Pedido especial") return "Pedido especial";
  if (producto.stock > 0) return "Disponible";
  return producto.estado && producto.estado !== "Disponible"
    ? producto.estado
    : "Agotado";
}

/** Pedido especial con pago anticipado: no está en el mezzanine, se importa para quien paga. */
export const esPedidoEspecial = (producto: Producto) =>
  estadoDe(producto) === "Pedido especial";

/**
 * Las otras versiones del mismo producto (Day y Night de una UPC): mismo nombre
 * salvo la última palabra. Para escoger la versión exacta en la ficha.
 */
const VERSION = /\s+(Day|Night)(\s+Edition)?$/i;
export function versionesDe(producto: Producto) {
  if (!VERSION.test(producto.nombre)) return [];
  const base = producto.nombre.replace(VERSION, "");
  return PRODUCTOS.filter(
    (otro) => VERSION.test(otro.nombre) && otro.nombre.replace(VERSION, "") === base,
  );
}

export function nombreDeVersion(producto: Producto) {
  const version = producto.nombre.match(VERSION)?.[1]?.toLowerCase();
  if (!version) return "";
  const pokemon = /30th Celebration/i.test(producto.nombre)
    ? version === "day" ? " (Espeon)" : " (Umbreon)"
    : "";
  return (version === "day" ? "Day Edition" : "Night Edition") + pokemon;
}

export const esPorConsultar = (producto: Producto) =>
  estadoDe(producto) === "Por consultar";
export const estaEnCamino = (producto: Producto) =>
  estadoDe(producto) === "En camino";

export const porConsultar = () => PRODUCTOS.filter(esPorConsultar);
export const enCamino = () => PRODUCTOS.filter(estaEnCamino);

/** A dónde manda "Consultar disponibilidad": Pokedeke Busca con el producto ya puesto. */
export function enlaceBusca(producto: Producto) {
  const origen = esPorConsultar(producto)
    ? "consultar"
    : estaEnCamino(producto)
      ? "camino"
      : "agotado";
  return (
    "/busca?origen=" + origen +
    "&producto=" + encodeURIComponent(producto.nombre) +
    "&ref=" + encodeURIComponent(producto.slug)
  );
}

export function valoresUnicos(campo: "juego" | "categoria" | "idioma") {
  return [...new Set(PRODUCTOS.map((producto) => producto[campo]))]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "es"));
}

export const novedades = () => disponibles().sort((a, b) => b.orden - a.orden);

/** Lo más nuevo, sin repetir categoría mientras alcance. */
export function novedadesVariadas(cantidad: number) {
  const vistas = new Set<string>();
  const variadas = novedades()
    .filter((producto) => !producto.destacado)
    .filter((producto) => {
      if (vistas.has(producto.categoria)) return false;
      vistas.add(producto.categoria);
      return true;
    });
  const resto = novedades().filter(
    (producto) => !producto.destacado && !variadas.includes(producto),
  );
  return [...variadas, ...resto].slice(0, cantidad);
}

/**
 * Lo marcado como destacado en la hoja, del más caro al más barato: la portada
 * pone los tres primeros arriba, con el más caro al centro. Si no hay marcados,
 * lo de mayor precio.
 */
export function destacados(cantidad: number) {
  const alcanzables = disponibles().filter(
    (producto) => producto.precio <= TOPE_DESTACADOS,
  );
  const marcados = alcanzables.filter((producto) => producto.destacado);
  // Si lo marcado no alcanza, se completa con lo que más se vende dentro del tope.
  const relleno = alcanzables
    .filter((producto) => !producto.destacado && conFoto(producto))
    .sort((a, b) => b.vendidos - a.vendidos || b.precio - a.precio)
    .slice(0, Math.max(cantidad - marcados.length, 0));
  const lista = [...marcados, ...relleno].sort((a, b) => b.precio - a.precio);
  // Variados: primero uno de cada categoría (del más caro de cada una), después el
  // resto. Así cinco cartas carísimas no se comen la portada.
  const vistas = new Set<string>();
  const uno = lista.filter((producto) => {
    if (vistas.has(producto.categoria)) return false;
    vistas.add(producto.categoria);
    return true;
  });
  return [...uno, ...lista.filter((producto) => !uno.includes(producto))].slice(0, cantidad);
}

/** Lo que está en el mezzanine y se puede comprar ya. El pedido especial no cuenta. */
export const disponibles = () =>
  PRODUCTOS.filter((producto) => !estaAgotado(producto) && !esPedidoEspecial(producto));

export const conFoto = (producto: Producto) => producto.fotos.length > 0;

const SELLADOS = [
  "ETB",
  "Booster box",
  "Booster bundle",
  "Booster pack",
  "Blister / sleeved booster",
  "Tin o caja de colección",
  "Colección premium / UPC",
  "Mazos",
];

/** Lo que viene cerrado de fábrica. */
export const esSellado = (producto: Producto) =>
  SELLADOS.includes(producto.categoria);

/** Los rangos de precio de la portada, del catálogo y del Estudio. */
export const PRESUPUESTOS = [
  { id: "joyitas", titulo: "Joyitas hasta ₡5 000", corto: "Hasta ₡5 000", min: 0, max: 5000 },
  { id: "diez", titulo: "Hasta ₡10 000", corto: "Hasta ₡10 000", min: 0, max: 10000 },
  { id: "regalos", titulo: "Regalos de ₡10 000 a ₡25 000", corto: "De ₡10 000 a ₡25 000", min: 10000, max: 25000 },
  { id: "medio", titulo: "De ₡25 000 a ₡50 000", corto: "De ₡25 000 a ₡50 000", min: 25000, max: 50000 },
  { id: "premium", titulo: "Premium: más de ₡50 000", corto: "Más de ₡50 000", min: 50000, max: Infinity },
];

export type Presupuesto = (typeof PRESUPUESTOS)[number];

export const alcanza = (presupuesto: Presupuesto, producto: Producto) =>
  producto.precio >= presupuesto.min && producto.precio <= presupuesto.max;

/**
 * Lo mejor que hoy se puede comprar con un presupuesto: primero lo destacado y
 * lo más vendido, después lo que más se acerca al tope. Sin repetir categoría
 * mientras alcance, para que no salgan cuatro cartas iguales.
 */
export function paraPresupuesto(id: string, cantidad: number) {
  const presupuesto = PRESUPUESTOS.find((opcion) => opcion.id === id);
  if (!presupuesto) return [];
  const candidatos = disponibles()
    .filter((producto) => alcanza(presupuesto, producto) && conFoto(producto))
    .sort(
      (a, b) =>
        Number(Boolean(b.destacado)) - Number(Boolean(a.destacado)) ||
        b.vendidos - a.vendidos ||
        b.precio - a.precio,
    );
  const vistas = new Set<string>();
  const variados = candidatos.filter((producto) => {
    if (vistas.has(producto.categoria)) return false;
    vistas.add(producto.categoria);
    return true;
  });
  const resto = candidatos.filter((producto) => !variados.includes(producto));
  return [...variados, ...resto].slice(0, cantidad);
}

/** Sellados que hoy se pueden comprar, lo más vendido y lo más nuevo primero. */
export const selladosDisponibles = () =>
  disponibles()
    .filter(esSellado)
    .sort((a, b) => b.vendidos - a.vendidos || b.orden - a.orden);

const VARIANTES_DE_CARTA =
  /\s+(Reverse Holo|Poké Ball|Poke Ball|Master Ball|Friend Ball|Energy Symbol|Quick Ball)$/i;
const PALABRAS_DE_SELLADO =
  /\b(etb|elite trainer box|booster|bundle|box|sobres?|blister|tin|mini tin|pok[eé]mon center|colecci[oó]n|collection|premium|ultra|super|caja|mazo|deck|display|y)\b/gi;

/** "Pikachu ex Poké Ball #047 (Set)" → "pikachu ex". Vacío si no es una carta. */
export function pokemonDe(producto: Producto) {
  if (!producto.carta) return "";
  return sinAcentos(
    producto.nombre.replace(/\s*#.*$/, "").replace(VARIANTES_DE_CARTA, ""),
  ).trim();
}

/**
 * La expansión: en las cartas es su colección; en lo sellado, lo que queda del
 * nombre al quitarle el tipo de producto ("ETB Prismatic Evolutions").
 */
export function expansionDe(producto: Producto) {
  if (producto.carta) return sinAcentos(producto.carta.coleccion).trim();
  if (!esSellado(producto)) return "";
  return sinAcentos(producto.nombre)
    .replace(PALABRAS_DE_SELLADO, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const mismaExpansion = (a: string, b: string) =>
  a.length >= 4 && b.length >= 4 && (a === b || a.includes(b) || b.includes(a));

/**
 * "También te puede gustar": reglas sencillas con lo que ya dice el catálogo. Pesa
 * más el mismo Pokémon y la misma expansión; después la categoría, el tipo de
 * energía y un precio parecido. Solo lo que se puede comprar. Si el producto es
 * una carta y hay sellado de su expansión (o al revés), entra al menos uno.
 */
export function relacionados(producto: Producto, cantidad: number) {
  const pokemon = pokemonDe(producto);
  const expansion = expansionDe(producto);
  const puntos = (otro: Producto) =>
    (pokemon && pokemonDe(otro) === pokemon ? 5 : 0) +
    (mismaExpansion(expansion, expansionDe(otro)) ? 4 : 0) +
    (otro.categoria === producto.categoria ? 2 : 0) +
    (producto.tipo && otro.tipo === producto.tipo ? 1 : 0) +
    (otro.precio >= producto.precio * 0.5 && otro.precio <= producto.precio * 2 ? 1 : 0);
  const candidatos = disponibles()
    .filter((otro) => otro.slug !== producto.slug)
    .map((otro) => ({ otro, puntos: puntos(otro) }))
    .sort((a, b) => b.puntos - a.puntos || b.otro.vendidos - a.otro.vendidos);
  const elegidos = candidatos.slice(0, cantidad).map(({ otro }) => otro);
  const delOtroLado = candidatos.find(
    ({ otro }) =>
      esSellado(otro) !== esSellado(producto) &&
      (esSellado(otro) || Boolean(otro.carta)) &&
      mismaExpansion(expansion, expansionDe(otro)),
  )?.otro;
  if (delOtroLado && !elegidos.includes(delOtroLado) && elegidos.length === cantidad) {
    elegidos[cantidad - 1] = delOtroLado;
  }
  return elegidos;
}

/**
 * Las cartas usadas traen su condición ("Lightly Played (LP)"); sin condición es
 * Near Mint. Devuelve la sigla ("LP") o "" si está como nueva.
 */
export function siglaDeCondicion(producto: Producto) {
  const condicion = producto.carta?.condicion ?? "";
  if (!condicion || /near mint|\bNM\b/i.test(condicion)) return "";
  return condicion.match(/\(([A-Z]{2,3})\)/)?.[1] ?? condicion;
}

export const esUsada = (producto: Producto) => siglaDeCondicion(producto) !== "";

/**
 * La condición para mostrar junto al nombre: "MP", "LP" y también "NM" cuando la
 * hoja la escribió. Así dos cartas iguales con distinta condición no se confunden
 * en el buscador, el carrito ni el pago. "" si la hoja no dice nada.
 */
export function condicionCorta(producto: Producto) {
  const condicion = producto.carta?.condicion ?? "";
  if (!condicion) return "";
  return condicion.match(/\(([A-Z]{2,3})\)/)?.[1] ?? condicion;
}

const NOMBRES_DE_CATEGORIA = [
  { categoria: "ETB", texto: "ETB" },
  { categoria: "Booster box", texto: "Booster box" },
  { categoria: "Booster bundle", texto: "Bundles" },
  { categoria: "Booster pack", texto: "Sobres" },
  { categoria: "Blister / sleeved booster", texto: "Blisters" },
  { categoria: "Tin o caja de colección", texto: "Cajas y tins" },
  { categoria: "Colección premium / UPC", texto: "Colecciones" },
  { categoria: "Mazos", texto: "Mazos" },
  { categoria: "Carta suelta (single)", texto: "Cartas sueltas" },
  { categoria: "Carta gradada", texto: "Gradadas" },
  { categoria: "Caja misteriosa", texto: "Cajas misteriosas" },
  { categoria: "Sleeves y fundas", texto: "Sleeves" },
  { categoria: "Accesorios", texto: "Accesorios" },
  { categoria: "Otro", texto: "Otros" },
];

/** Solo las categorías que hoy tienen algo para vender. */
export const categoriasConProducto = () =>
  NOMBRES_DE_CATEGORIA.filter(({ categoria }) =>
    disponibles().some((producto) => producto.categoria === categoria),
  );
