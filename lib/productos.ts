import { CUPO_COMPARTIDA, inventarioNuevo } from "./inventario";
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
  etiqueta?: "Nuevo" | "Preventa" | "Oferta";
  destacado?: boolean;
  parado?: boolean;
  vendidos: number;
  orden: number;
  fotos: string[];
  descripcion: string;
  /** Si existe, el carrito lleva aquí en vez de a la página del producto. */
  enlace?: string;
  /** Solo preventas: fecha de muestra en que llega al mezzanine. */
  llegada?: string;
  /** Solo cartas sueltas y gradadas. */
  carta?: {
    coleccion: string;
    numero: string;
    rareza: string;
    condicion: string;
  };
};

// Catálogo de muestra para la demo: los precios y el stock no son reales.
const PRODUCTOS_BASE: Producto[] = [
  {
    id: "C001",
    slug: "etb-ascended-heroes",
    nombre: "ETB Ascended Heroes",
    juego: "Pokémon",
    categoria: "ETB",
    categoriaCorta: "ETB",
    idioma: "Español",
    precio: 45000,
    stock: 2,
    etiqueta: "Nuevo",
    destacado: true,
    vendidos: 14,
    orden: 17,
    fotos: [
      "/productos/etb-ascended-heroes.webp",
      "/productos/etb-ascended-heroes-2.webp",
      "/productos/etb-ascended-heroes-3.webp",
    ],
    descripcion:
      "Sellada de fábrica. Trae sobres, fundas, dados y la caja para guardar tus cartas. Buena para abrir o para dejarla en la vitrina.",
  },
  {
    id: "C002",
    slug: "booster-bundle-prismatic-evolutions",
    nombre: "Booster Bundle Prismatic Evolutions",
    juego: "Pokémon",
    categoria: "Booster bundle",
    categoriaCorta: "Bundle",
    idioma: "Inglés",
    precio: 28500,
    stock: 6,
    destacado: true,
    vendidos: 22,
    orden: 16,
    fotos: ["/productos/booster-bundle-prismatic-evolutions.webp"],
    descripcion:
      "El paquete de sobres para los que quieren abrir varios de un solo. Sellado y listo para abrir.",
  },
  {
    id: "C015",
    slug: "preventa-etb-delta-reign",
    nombre: "ETB Delta Reign",
    juego: "Pokémon",
    categoria: "ETB",
    categoriaCorta: "ETB",
    idioma: "Inglés",
    precio: 48000,
    stock: 6,
    etiqueta: "Preventa",
    llegada: "2026-12-11T12:00:00-06:00",
    vendidos: 3,
    orden: 15,
    fotos: ["/productos/preventa-etb-delta-reign.webp"],
    descripcion:
      "Apartá la tuya con un adelanto y pagás el resto cuando llegue. Los cupos son limitados.",
  },
  {
    id: "C016",
    slug: "preventa-booster-box-delta-reign",
    nombre: "Booster Box Delta Reign",
    juego: "Pokémon",
    categoria: "Booster box",
    categoriaCorta: "Box",
    idioma: "Inglés",
    precio: 78000,
    stock: 4,
    etiqueta: "Preventa",
    llegada: "2026-12-11T12:00:00-06:00",
    vendidos: 5,
    orden: 14,
    fotos: ["/productos/preventa-booster-box-delta-reign.webp"],
    descripcion:
      "Caja completa y sellada. Apartá con adelanto y te avisamos apenas aterrice en Costa Rica.",
  },
  {
    id: "C017",
    slug: "booster-box-30th-celebration",
    nombre: "Booster Box 30th Celebration",
    juego: "Pokémon",
    categoria: "Booster box",
    categoriaCorta: "Box",
    idioma: "Japonés",
    precio: 89000,
    stock: 2,
    destacado: true,
    vendidos: 6,
    orden: 13,
    fotos: ["/productos/booster-box-30th-celebration.webp"],
    descripcion:
      "La caja japonesa del aniversario 30. Sellada, para abrirla con los compas o guardarla de colección.",
  },
  {
    id: "C009",
    slug: "coleccion-especial-charizard-ex",
    nombre: "Colección especial Charizard ex",
    juego: "Pokémon",
    categoria: "Colección premium / UPC",
    categoriaCorta: "Premium",
    idioma: "Español",
    precio: 62000,
    precioAntes: 69000,
    stock: 5,
    etiqueta: "Oferta",
    vendidos: 9,
    orden: 12,
    fotos: [
      "/productos/coleccion-especial-charizard-ex.webp",
      "/productos/coleccion-especial-charizard-ex-2.webp",
    ],
    descripcion:
      "Una colección para regalar o para darse el gusto. Viene sellada y con cartas promocionales.",
  },
  {
    id: "C018",
    slug: "ultra-premium-terapagos-ex",
    nombre: "Ultra-Premium Terapagos ex",
    juego: "Pokémon",
    categoria: "Colección premium / UPC",
    categoriaCorta: "UPC",
    idioma: "Español",
    precio: 118000,
    stock: 3,
    vendidos: 4,
    orden: 11,
    fotos: ["/productos/ultra-premium-terapagos-ex.webp"],
    descripcion:
      "La colección grande, para coleccionistas en serio. Sellada de fábrica.",
  },
  {
    id: "C011",
    slug: "pikachu-gradada-10",
    nombre: "Pikachu gradada 10",
    juego: "Pokémon",
    categoria: "Carta gradada",
    categoriaCorta: "Gradada",
    idioma: "Inglés",
    precio: 135000,
    stock: 1,
    destacado: true,
    vendidos: 2,
    orden: 10,
    fotos: ["/productos/pikachu-gradada-10.webp"],
    carta: {
      coleccion: "151",
      numero: "173/165",
      rareza: "Illustration Rare",
      condicion: "Gradada 10",
    },
    descripcion:
      "Carta gradada con nota 10. Pieza única: cuando se va, se fue.",
  },
  {
    id: "C010",
    slug: "charizard-ex-carta-suelta",
    nombre: "Charizard ex (carta suelta)",
    juego: "Pokémon",
    categoria: "Carta suelta (single)",
    categoriaCorta: "Suelta",
    idioma: "Inglés",
    precio: 158000,
    stock: 3,
    vendidos: 8,
    orden: 9,
    fotos: ["/productos/charizard-ex-carta-suelta.webp"],
    carta: {
      coleccion: "151",
      numero: "199/165",
      rareza: "Special Illustration Rare",
      condicion: "Near Mint",
    },
    descripcion:
      "Carta en excelente estado, guardada en funda y toploader desde que salió del sobre.",
  },
  {
    id: "C019",
    slug: "umbreon-vmax-carta-suelta",
    nombre: "Umbreon VMAX (carta suelta)",
    juego: "Pokémon",
    categoria: "Carta suelta (single)",
    categoriaCorta: "Suelta",
    idioma: "Inglés",
    precio: 585000,
    stock: 1,
    vendidos: 3,
    orden: 8,
    fotos: ["/productos/umbreon-vmax-carta-suelta.webp"],
    carta: {
      coleccion: "Evolving Skies",
      numero: "215/203",
      rareza: "Secret Rare",
      condicion: "Near Mint",
    },
    descripcion:
      "Una de las favoritas de los coleccionistas. Guardada en funda y toploader.",
  },
  {
    id: "C003",
    slug: "sobre-perfect-order",
    nombre: "Sobre Perfect Order",
    juego: "Pokémon",
    categoria: "Booster pack",
    categoriaCorta: "Sobre",
    idioma: "Español",
    precio: 4500,
    stock: 24,
    vendidos: 40,
    orden: 7,
    fotos: ["/productos/sobre-perfect-order.webp"],
    descripcion:
      "Un sobre para probar suerte, con uno de los diseños al azar. Si te sale algo bueno, contanos en el grupo.",
  },
  {
    id: "C005",
    slug: "sobre-chaos-rising",
    nombre: "Sobre Chaos Rising",
    juego: "Pokémon",
    categoria: "Booster pack",
    categoriaCorta: "Sobre",
    idioma: "Español",
    precio: 4800,
    stock: 15,
    vendidos: 18,
    orden: 6,
    fotos: ["/productos/sobre-chaos-rising.webp"],
    descripcion:
      "Sobre con empaque protector, con uno de los diseños al azar.",
  },
  {
    id: "C020",
    slug: "portafolio-pikachu-9-bolsillos",
    nombre: "Portafolio Pikachu 9 bolsillos",
    juego: "Pokémon",
    categoria: "Accesorios",
    categoriaCorta: "Accesorio",
    idioma: "Otro",
    precio: 16500,
    stock: 5,
    parado: true,
    vendidos: 1,
    orden: 5,
    fotos: ["/productos/portafolio-pikachu-9-bolsillos.webp"],
    descripcion: "Para tener tu colección ordenada y a mano.",
  },
  {
    id: "C012",
    slug: "dragon-shield-sleeves-x100",
    nombre: "Dragon Shield Sleeves x100",
    juego: "Pokémon",
    categoria: "Sleeves y fundas",
    categoriaCorta: "Sleeves",
    idioma: "Otro",
    precio: 5500,
    stock: 12,
    parado: true,
    vendidos: 11,
    orden: 4,
    fotos: ["/productos/dragon-shield-sleeves-x100.webp"],
    descripcion: "Cien fundas mate para que tus cartas no sufran.",
  },
  {
    id: "C013",
    slug: "toploaders-ultra-pro-x25",
    nombre: "Toploaders Ultra Pro x25",
    juego: "Pokémon",
    categoria: "Accesorios",
    categoriaCorta: "Accesorio",
    idioma: "Otro",
    precio: 3500,
    stock: 9,
    vendidos: 13,
    orden: 3,
    fotos: ["/productos/toploaders-ultra-pro-x25.webp"],
    descripcion: "Protección rígida para las cartas que más cuidás.",
  },
  {
    id: "C008",
    slug: "tin-mega-moonlit",
    nombre: "Tin Mega Moonlit",
    juego: "Pokémon",
    categoria: "Tin o caja de colección",
    categoriaCorta: "Tin",
    idioma: "Español",
    precio: 18500,
    stock: 0,
    vendidos: 12,
    orden: 2,
    fotos: [
      "/productos/tin-mega-moonlit.webp",
      "/productos/tin-mega-moonlit-2.webp",
    ],
    descripcion:
      "Lata de colección con sobres adentro. Se nos acabó, pero podés pedir que te avisemos.",
  },
  {
    id: "C021",
    slug: "booster-bundle-destined-rivals",
    nombre: "Booster Bundle Destined Rivals",
    juego: "Pokémon",
    categoria: "Booster bundle",
    categoriaCorta: "Bundle",
    idioma: "Inglés",
    precio: 31000,
    stock: 0,
    vendidos: 7,
    orden: 1,
    fotos: ["/productos/booster-bundle-destined-rivals.webp"],
    descripcion:
      "Agotado por ahora: dejá tus datos y te avisamos cuando vuelva a entrar.",
  },
  {
    id: "C022",
    slug: "mew-ex-carta-suelta",
    nombre: "Mew ex dorada (carta suelta)",
    juego: "Pokémon",
    categoria: "Carta suelta (single)",
    categoriaCorta: "Suelta",
    idioma: "Inglés",
    precio: 11500,
    stock: 1,
    etiqueta: "Nuevo",
    vendidos: 4,
    orden: 37,
    fotos: ["/productos/mew-ex-carta-suelta.webp"],
    carta: {
      coleccion: "151",
      numero: "205/165",
      rareza: "Hyper Rare",
      condicion: "Near Mint",
    },
    descripcion:
      "La dorada de Mew, guardada en funda y toploader desde el primer día.",
  },
  {
    id: "C023",
    slug: "peluche-jolteon-20cm",
    nombre: "Peluche Jolteon 20 cm",
    juego: "Pokémon",
    categoria: "Figuras y peluches",
    categoriaCorta: "Peluche",
    idioma: "Otro",
    precio: 14000,
    stock: 3,
    vendidos: 14,
    orden: 36,
    fotos: ["/productos/peluche-jolteon-20cm.webp"],
    descripcion:
      "Suavecito y listo para la repisa. Buen regalo para quien todavía no juega.",
  },
  {
    id: "C024",
    slug: "blister-3-sobres-perfect-order",
    nombre: "Blister 3 sobres Perfect Order",
    juego: "Pokémon",
    categoria: "Blister / sleeved booster",
    categoriaCorta: "Blister",
    idioma: "Español",
    precio: 14500,
    stock: 8,
    vendidos: 7,
    orden: 35,
    fotos: ["/productos/blister-3-sobres-perfect-order.webp"],
    descripcion:
      "Tres sobres y una carta promocional en un mismo blister.",
  },
  {
    id: "C025",
    slug: "playmat-greninja",
    nombre: "Playmat Greninja",
    juego: "Pokémon",
    categoria: "Accesorios",
    categoriaCorta: "Accesorio",
    idioma: "Otro",
    precio: 16500,
    stock: 4,
    vendidos: 1,
    orden: 34,
    fotos: ["/productos/playmat-greninja.webp"],
    descripcion:
      "Para jugar con estilo y cuidar tus cartas en la mesa.",
  },
  {
    id: "C026",
    slug: "tin-mega-charizard",
    nombre: "Tin Mega Charizard",
    juego: "Pokémon",
    categoria: "Tin o caja de colección",
    categoriaCorta: "Tin",
    idioma: "Español",
    precio: 17500,
    stock: 4,
    etiqueta: "Nuevo",
    vendidos: 10,
    orden: 33,
    fotos: ["/productos/tin-mega-charizard.webp"],
    descripcion:
      "Lata de colección con sobres adentro. Diseño al azar.",
  },
  {
    id: "C027",
    slug: "battle-deck-mega-lucario-ex",
    nombre: "League Battle Deck Mega Lucario ex",
    juego: "Pokémon",
    categoria: "Mazos",
    categoriaCorta: "Mazo",
    idioma: "Español",
    precio: 16000,
    stock: 4,
    vendidos: 3,
    orden: 32,
    fotos: ["/productos/battle-deck-mega-lucario-ex.webp"],
    descripcion:
      "Mazo listo para jugar. Ideal para aprender o entrar a un torneo.",
  },
  {
    id: "C028",
    slug: "build-and-battle-delta-reign",
    nombre: "Build & Battle Delta Reign",
    juego: "Pokémon",
    categoria: "Mazos",
    categoriaCorta: "Mazo",
    idioma: "Español",
    precio: 13500,
    stock: 5,
    vendidos: 13,
    orden: 31,
    fotos: ["/productos/build-and-battle-delta-reign.webp"],
    descripcion:
      "Armá tu propio mazo desde cero y salí a jugar.",
  },
  {
    id: "C029",
    slug: "gengar-vmax-carta-suelta",
    nombre: "Gengar VMAX (carta suelta)",
    juego: "Pokémon",
    categoria: "Carta suelta (single)",
    categoriaCorta: "Suelta",
    idioma: "Inglés",
    precio: 285000,
    stock: 1,
    vendidos: 6,
    orden: 30,
    fotos: ["/productos/gengar-vmax-carta-suelta.webp"],
    carta: {
      coleccion: "Fusion Strike",
      numero: "271/264",
      rareza: "Secret Rare",
      condicion: "Near Mint",
    },
    descripcion:
      "Una de las ilustraciones más buscadas. Guardada en funda y toploader.",
  },
  {
    id: "C030",
    slug: "pikachu-vmax-carta-suelta",
    nombre: "Pikachu VMAX (carta suelta)",
    juego: "Pokémon",
    categoria: "Carta suelta (single)",
    categoriaCorta: "Suelta",
    idioma: "Inglés",
    precio: 58000,
    stock: 2,
    vendidos: 16,
    orden: 29,
    fotos: ["/productos/pikachu-vmax-carta-suelta.webp"],
    carta: {
      coleccion: "Vivid Voltage",
      numero: "188/185",
      rareza: "Secret Rare",
      condicion: "Near Mint",
    },
    descripcion:
      "Pikachu en versión arcoíris, en excelente estado.",
  },
  {
    id: "C031",
    slug: "figura-pikachu-30-aniversario",
    nombre: "Figura Pikachu 30 aniversario",
    juego: "Pokémon",
    categoria: "Figuras y peluches",
    categoriaCorta: "Figura",
    idioma: "Otro",
    precio: 9000,
    stock: 6,
    vendidos: 9,
    orden: 28,
    fotos: ["/productos/figura-pikachu-30-aniversario.webp"],
    descripcion:
      "Figura de colección de la línea japonesa del aniversario 30.",
  },
  {
    id: "C032",
    slug: "figura-umbreon-30-aniversario",
    nombre: "Figura Umbreon 30 aniversario",
    juego: "Pokémon",
    categoria: "Figuras y peluches",
    categoriaCorta: "Figura",
    idioma: "Otro",
    precio: 11500,
    stock: 5,
    vendidos: 2,
    orden: 27,
    fotos: ["/productos/figura-umbreon-30-aniversario.webp"],
    descripcion:
      "Figura con acabado brillante para tu vitrina.",
  },
  {
    id: "C033",
    slug: "blind-box-eevee-dream-painting",
    nombre: "Blind box Eevee & Friends",
    juego: "Pokémon",
    categoria: "Figuras y peluches",
    categoriaCorta: "Blind box",
    idioma: "Otro",
    precio: 7500,
    stock: 9,
    vendidos: 12,
    orden: 26,
    fotos: ["/productos/blind-box-eevee-dream-painting.webp"],
    descripcion:
      "Caja sorpresa: te toca una figura al azar de la colección.",
  },
  {
    id: "C034",
    slug: "booster-box-storm-emeralda",
    nombre: "Booster Box Storm Emeralda",
    juego: "Pokémon",
    categoria: "Booster box",
    categoriaCorta: "Box",
    idioma: "Japonés",
    precio: 52000,
    stock: 3,
    vendidos: 5,
    orden: 25,
    fotos: ["/productos/booster-box-storm-emeralda.webp"],
    descripcion:
      "Caja japonesa sellada, para abrir o guardar.",
  },
  {
    id: "C035",
    slug: "mini-tin-prismatic-evolutions",
    nombre: "Mini tin Prismatic Evolutions",
    juego: "Pokémon",
    categoria: "Tin o caja de colección",
    categoriaCorta: "Mini tin",
    idioma: "Español",
    precio: 9500,
    stock: 10,
    vendidos: 15,
    orden: 24,
    fotos: ["/productos/mini-tin-prismatic-evolutions.webp"],
    descripcion:
      "Latita con sobres. Diseño al azar.",
  },
  {
    id: "C036",
    slug: "poster-collection-mega-lucario",
    nombre: "Colección póster Mega Lucario",
    juego: "Pokémon",
    categoria: "Colección premium / UPC",
    categoriaCorta: "Premium",
    idioma: "Español",
    precio: 24500,
    stock: 3,
    vendidos: 8,
    orden: 23,
    fotos: ["/productos/poster-collection-mega-lucario.webp"],
    descripcion:
      "Colección con sobres, carta promocional y póster.",
  },
  {
    id: "C037",
    slug: "blister-3-sobres-chaos-rising",
    nombre: "Blister 3 sobres Chaos Rising",
    juego: "Pokémon",
    categoria: "Blister / sleeved booster",
    categoriaCorta: "Blister",
    idioma: "Español",
    precio: 14500,
    stock: 6,
    vendidos: 1,
    orden: 22,
    fotos: ["/productos/blister-3-sobres-chaos-rising.webp"],
    descripcion:
      "Tres sobres y una carta promocional en un mismo blister.",
  },
  {
    id: "C038",
    slug: "funda-accesorios-prismatic",
    nombre: "Accessory Pouch Prismatic Evolutions",
    juego: "Pokémon",
    categoria: "Accesorios",
    categoriaCorta: "Accesorio",
    idioma: "Español",
    precio: 21000,
    stock: 3,
    vendidos: 11,
    orden: 21,
    fotos: ["/productos/funda-accesorios-prismatic.webp"],
    descripcion:
      "Colección con sobres y un estuche para llevar tus cartas.",
  },
  {
    id: "C039",
    slug: "mini-portfolio-q3",
    nombre: "Mini portafolio con sobre",
    juego: "Pokémon",
    categoria: "Accesorios",
    categoriaCorta: "Accesorio",
    idioma: "Español",
    precio: 6500,
    stock: 7,
    vendidos: 4,
    orden: 20,
    fotos: ["/productos/mini-portfolio-q3.webp"],
    descripcion:
      "Portafolio pequeño para 60 cartas, con un sobre de regalo.",
  },
  {
    id: "C040",
    slug: "deck-box-mew",
    nombre: "Deck box Mew",
    juego: "Pokémon",
    categoria: "Accesorios",
    categoriaCorta: "Accesorio",
    idioma: "Otro",
    precio: 6000,
    stock: 6,
    vendidos: 14,
    orden: 19,
    fotos: ["/productos/deck-box-mew.webp"],
    descripcion:
      "Caja para guardar tu mazo con estilo.",
  },
  {
    id: "C041",
    slug: "sleeves-energia-rayo",
    nombre: "Sleeves Energía Rayo x65",
    juego: "Pokémon",
    categoria: "Sleeves y fundas",
    categoriaCorta: "Sleeves",
    idioma: "Otro",
    precio: 5000,
    stock: 10,
    vendidos: 7,
    orden: 18,
    fotos: ["/productos/sleeves-energia-rayo.webp"],
    descripcion:
      "Fundas con diseño de energía para tu mazo.",
  },
];

/** Por ahora no se venden. Para que vuelvan, quitá la categoría de esta lista. */
const CATEGORIAS_EN_PAUSA = ["Figuras y peluches"];

export const PRODUCTOS: Producto[] = [
  ...PRODUCTOS_BASE,
  ...inventarioNuevo(PRODUCTOS_BASE.length + 1),
].filter((producto) => !CATEGORIAS_EN_PAUSA.includes(producto.categoria));

export function buscarProducto(slug: string) {
  if (slug === CUPO_COMPARTIDA.slug) return CUPO_COMPARTIDA;
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
  const campos = `${producto.nombre} ${producto.juego} ${producto.categoria} ${producto.carta?.coleccion ?? ""} ${producto.carta?.rareza ?? ""}`;
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
  return [...new Set(PRODUCTOS.map((producto) => producto[campo]))].sort(
    (a, b) => a.localeCompare(b, "es"),
  );
}

/** Lo más nuevo sin repetir categoría, para que la portada se vea variada. */
export function novedadesVariadas(cantidad: number) {
  const vistas = new Set<string>();
  return novedades()
    .filter((producto) => !producto.destacado)
    .filter((producto) => {
      if (vistas.has(producto.categoria)) return false;
      vistas.add(producto.categoria);
      return true;
    })
    .slice(0, cantidad);
}

export const novedades = () =>
  [...PRODUCTOS]
    .filter((producto) => !esPreventa(producto) && !estaAgotado(producto))
    .sort((a, b) => b.orden - a.orden);
