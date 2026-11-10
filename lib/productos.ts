import catalogo from "@/datos/catalogo.json";

/**
 * Lo manda la hoja. Disponible: está en el mezzanine y se puede comprar. En
 * camino: ya lo compramos y no ha llegado. Por consultar: no es nuestro, hay
 * que revisar si se consigue. Agotado: lo vendemos, pero hoy no hay.
 */
export type Estado = "Disponible" | "En camino" | "Por consultar" | "Agotado";

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
  /** Gramos, según la hoja. Llega con el stock en vivo. */
  peso?: number;
  etiqueta?: "Nuevo" | "Oferta";
  destacado?: boolean;
  parado?: boolean;
  vendidos: number;
  orden: number;
  fotos: string[];
  descripcion: string;
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
export const PRODUCTOS = catalogo as unknown as Producto[];

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
  if (producto.stock > 0) return "Disponible";
  return producto.estado && producto.estado !== "Disponible"
    ? producto.estado
    : "Agotado";
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
  const marcados = disponibles().filter((producto) => producto.destacado);
  const lista = marcados.length > 0 ? marcados : disponibles();
  return lista.sort((a, b) => b.precio - a.precio).slice(0, cantidad);
}

export const disponibles = () =>
  PRODUCTOS.filter((producto) => !estaAgotado(producto));

export const conFoto = (producto: Producto) => producto.fotos.length > 0;

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
