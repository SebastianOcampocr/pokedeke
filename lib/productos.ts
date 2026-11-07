import catalogo from "@/datos/catalogo.json";
import { TIENDA } from "./tienda";

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
  stock: number;
  /** Gramos, según la hoja. Llega con el stock en vivo. */
  peso?: number;
  etiqueta?: "Nuevo" | "Preventa" | "Oferta";
  destacado?: boolean;
  parado?: boolean;
  vendidos: number;
  orden: number;
  fotos: string[];
  descripcion: string;
  /** Si existe, el carrito lleva aquí en vez de a la página del producto. */
  enlace?: string;
  /** Solo preventas: fecha en que llega al mezzanine. */
  llegada?: string;
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

export function esPreventa(producto: Producto) {
  return producto.etiqueta === "Preventa";
}

export function estaAgotado(producto: Producto) {
  return producto.stock <= 0;
}

/** En preventa se cobra solo el adelanto; lo demás, al precio completo. */
export function precioACobrar(producto: Producto) {
  return esPreventa(producto)
    ? Math.round(producto.precio * TIENDA.adelantoPreventa)
    : producto.precio;
}

export function valoresUnicos(campo: "juego" | "categoria" | "idioma") {
  return [...new Set(PRODUCTOS.map((producto) => producto[campo]))]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "es"));
}

export const novedades = () =>
  disponibles()
    .filter((producto) => !esPreventa(producto))
    .sort((a, b) => b.orden - a.orden);

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

/** Lo marcado como destacado en la hoja. Si no hay, lo de mayor precio. */
export function destacados(cantidad: number) {
  const marcados = disponibles().filter((producto) => producto.destacado);
  const lista =
    marcados.length > 0
      ? marcados
      : disponibles().sort((a, b) => b.precio - a.precio);
  return lista.slice(0, cantidad);
}

export const disponibles = () =>
  PRODUCTOS.filter((producto) => !estaAgotado(producto));

export const conFoto = (producto: Producto) => producto.fotos.length > 0;

const NOMBRES_DE_CATEGORIA = [
  { categoria: "ETB", texto: "ETB" },
  { categoria: "Booster box", texto: "Booster box" },
  { categoria: "Booster bundle", texto: "Bundles" },
  { categoria: "Booster pack", texto: "Sobres" },
  { categoria: "Blister / sleeved booster", texto: "Blisters" },
  { categoria: "Tin o caja de colección", texto: "Tins" },
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

export const hayPreventas = () => disponibles().some(esPreventa);
