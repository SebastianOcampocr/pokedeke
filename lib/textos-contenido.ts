import { masVistos } from "./extras";
import { colones } from "./formato";
import type { TipoDeContenido } from "./plantillas";
import {
  cartasSueltas,
  destacados,
  disponibles,
  expansionDe,
  muestraCantidad,
  novedadesVariadas,
  paraPresupuesto,
  porConsultar,
  PRESUPUESTOS,
  selladosDisponibles,
  type Producto,
} from "./productos";
import { LUGAR, SITIO } from "./tienda";

/**
 * Los textos del Estudio de contenido. Son plantillas con varias versiones, no
 * inteligencia artificial: solo usan lo que el catálogo dice del producto
 * (nombre, precio, stock, colección, condición), así que no inventan nada.
 */
export const PREGUNTAS = [
  "¿Cuál fue tu primer Pokémon?",
  "¿Qué Pokémon te hizo empezar a coleccionar?",
  "¿Qué carta andás buscando?",
  "¿Japonés o inglés?",
  "¿Qué producto querés que consigamos?",
  "¿Abrís los sobres o los guardás sellados?",
];

const ENTREGA =
  "Retiro en el " + LUGAR.nombre + " o envío a todo el país. Pagás por SINPE Móvil o con tarjeta.";

function quedan(producto: Producto) {
  if (producto.stock <= 0 || !muestraCantidad(producto)) return "";
  return producto.stock === 1 ? "Queda 1." : "Quedan " + producto.stock + ".";
}

/** Lo que el catálogo sabe del producto, en un renglón. */
function detalle(producto: Producto) {
  if (producto.carta) {
    return [
      producto.carta.coleccion,
      producto.carta.numero ? "#" + producto.carta.numero : "",
      producto.idioma && producto.idioma !== "Otro" ? producto.idioma : "",
      producto.carta.condicion ? "Condición: " + producto.carta.condicion : "",
    ]
      .filter(Boolean)
      .join(" · ");
  }
  return producto.descripcion.split(/(?<=[.!?])\s/)[0] ?? "";
}

/** "Umbreon ex #161 (Prismatic Evolutions)" → "Umbreon". */
function pokemon(producto: Producto) {
  if (!producto.carta) return "";
  return producto.nombre.replace(/\s*#.*$/, "").split(" ")[0] ?? "";
}

const etiqueta = (texto: string) =>
  "#" + texto.normalize("NFD").replace(/\p{M}/gu, "").replace(/[^A-Za-z0-9]/g, "");

const POR_CATEGORIA: Record<string, string> = {
  ETB: "#EliteTrainerBox",
  Bundle: "#BoosterBundle",
  Box: "#BoosterBox",
  Sobre: "#BoosterPack",
  Blister: "#BoosterPack",
  Tin: "#PokemonTin",
  Premium: "#PokemonCollection",
  Suelta: "#PokemonCards",
  Gradada: "#GradedCards",
};

export function hashtagsDe(producto?: Producto) {
  const base = ["#PokemonTCG", "#PokemonCostaRica", "#TCGCostaRica", "#CartasPokemon", "#Pokedeke"];
  if (!producto) return base.join(" ");
  const propios = [
    pokemon(producto) ? etiqueta(pokemon(producto)) : "",
    producto.carta?.coleccion ? etiqueta(producto.carta.coleccion) : "",
    POR_CATEGORIA[producto.categoriaCorta] ?? "",
  ].filter((texto) => texto.length > 2);
  return [...new Set([...propios, ...base])].slice(0, 9).join(" ");
}

const enlaceDe = (producto: Producto) => SITIO + "/producto/" + producto.slug;

function cuerpo(producto: Producto) {
  return [detalle(producto), colones(producto.precio) + ". " + quedan(producto)]
    .map((linea) => linea.trim())
    .filter(Boolean)
    .join("\n\n");
}

const CIERRES = [
  "Está en pokedeke.store, enlace en el perfil. " + ENTREGA,
  "Pedilo en pokedeke.store o escribinos por aquí. " + ENTREGA,
  "Lo encontrás en pokedeke.store. " + ENTREGA,
];

/** Varias formas de decir lo mismo: `version` escoge cuál, para no repetirse. */
export function captionDe(
  tipo: TipoDeContenido,
  version: number,
  producto?: Producto,
  motivo = "",
  pregunta = PREGUNTAS[0],
) {
  if (tipo === "pregunta" || !producto) {
    const extra = /consigamos/.test(pregunta)
      ? " Y si ya andás buscando algo, pedilo en pokedeke.store/busca."
      : "";
    return pregunta + "\n\nContanos en los comentarios." + extra;
  }
  const cierre = CIERRES[version % CIERRES.length];
  const nombre = producto.nombre;
  const aperturas: Record<Exclude<TipoDeContenido, "pregunta">, string[]> = {
    disponible: [
      nombre + ", disponible en Pokedeke.",
      "¿Andabas buscando " + nombre + "? Aquí está.",
      "Para la colección: " + nombre + ".",
    ],
    nuevo: [
      "Recién llegado al mezzanine: " + nombre + ".",
      "Nuevo en Pokedeke: " + nombre + ".",
      "Acaba de entrar: " + nombre + ".",
    ],
    pick: [
      "Pokedeke Pick: " + nombre + ".",
      "Si nos preguntan qué escogeríamos hoy: " + nombre + ".",
    ],
    eeuu: [
      "¿Andás buscando " + nombre + "? Lo consultamos por vos.",
      "De los que casi no se consiguen en Costa Rica: " + nombre + ".",
    ],
  };
  const opciones = aperturas[tipo];
  const partes = [opciones[version % opciones.length]];
  if (tipo === "pick") {
    partes.push(motivo.trim() || "[Escribí aquí por qué lo escogerían: es lo que hace un Pick.]");
  }
  if (tipo === "eeuu") {
    partes.push(
      "No lo tenemos en el mezzanine, pero revisamos si lo podemos conseguir. Te confirmamos disponibilidad y precio antes de que pagués nada.",
      detalle(producto),
      "Pedilo en pokedeke.store/busca o escribinos por aquí.",
    );
    return partes.filter(Boolean).join("\n\n");
  }
  partes.push(cuerpo(producto), cierre);
  return partes.filter(Boolean).join("\n\n");
}

export function altDe(tipo: TipoDeContenido, producto?: Producto, pregunta = "") {
  if (tipo === "pregunta" || !producto) {
    return "Rótulo amarillo de Pokedeke con la pregunta: " + pregunta;
  }
  return (
    "Foto de " + producto.nombre + ", " + producto.categoria.toLowerCase() +
    " de Pokémon TCG, sobre un rótulo amarillo de Pokedeke. Precio: " + colones(producto.precio) + "."
  );
}

/** Para pegar en los grupos de WhatsApp. */
export function whatsappDe(producto: Producto) {
  return ["*" + producto.nombre + "*", [colones(producto.precio), quedan(producto)].filter(Boolean).join(" · "), enlaceDe(producto)].join("\n");
}

export type IdeaDeReel = {
  hook: string;
  escenas: string[];
  enPantalla: string;
  cta: string;
  duracion: string;
  audio: string;
};

/** Un guion corto para grabar con el celular: la idea, no el video. */
export function reelDe(tipo: TipoDeContenido, version: number, producto?: Producto): IdeaDeReel | null {
  if (tipo === "pregunta" || !producto) return null;
  const carta = Boolean(producto.carta);
  const hooks = [
    ...(tipo === "nuevo" ? ["Esto acaba de llegar al mezzanine."] : []),
    ...(pokemon(producto) ? ["Si te gusta " + pokemon(producto) + ", mirá esto."] : []),
    carta ? "¿La agregarías a tu colección?" : "¿Lo abrirías o lo guardarías sellado?",
    "Si coleccionás Pokémon, mirá esto.",
  ];
  return {
    hook: hooks[version % hooks.length],
    escenas: [
      "Mostrar " + producto.nombre + " completo, de frente.",
      carta ? "Acercamiento lento al arte y al brillo, moviendo la carta con la luz." : "Darle vuelta: frente, lados y lo que trae por detrás.",
      carta && producto.carta?.condicion ? "Mostrar esquinas y bordes: la condición es " + producto.carta.condicion + "." : "Un detalle que solo se ve de cerca.",
      "Precio en pantalla: " + colones(producto.precio) + ".",
      "Cerrar con la pregunta del inicio viendo a cámara o con el producto en la mano.",
    ],
    enPantalla: producto.nombre + " · " + colones(producto.precio),
    cta: "Encontralo en pokedeke.store (enlace en el perfil).",
    duracion: "10 a 15 segundos",
    audio: "Un audio en tendencia tranquilo; que no tape el momento del precio.",
  };
}

export type Sugerencia = {
  dia: string;
  tipo: TipoDeContenido;
  producto?: Producto;
  pregunta?: string;
  porQue: string;
};

/**
 * Cinco publicaciones para la semana, con lo que hay hoy en el catálogo. Cambia
 * cada semana (`semana` es el número de semana) para no repetir productos.
 */
export function planDeLaSemana(semana: number): Sugerencia[] {
  const elegir = <T,>(lista: T[], salto = 0) =>
    lista.length ? lista[(semana + salto) % lista.length] : undefined;
  const usados = new Set<string>();
  const sinRepetir = (lista: Producto[]) => lista.filter((producto) => !usados.has(producto.slug));
  const tomar = (producto?: Producto) => {
    if (producto) usados.add(producto.slug);
    return producto;
  };

  const pick = tomar(elegir(destacados(8)));
  const nuevo = tomar(elegir(sinRepetir(novedadesVariadas(6))));
  const visto = tomar(elegir(sinRepetir(masVistos(8))));
  const importado = tomar(elegir(sinRepetir(porConsultar())));
  const plan: (Sugerencia | null)[] = [
    pick ? { dia: "Lunes", tipo: "pick", producto: pick, porQue: "Está marcado como destacado en la hoja." } : null,
    nuevo ? { dia: "Miércoles", tipo: "nuevo", producto: nuevo, porQue: "Es de lo último que entró." } : null,
    { dia: "Jueves", tipo: "pregunta", pregunta: elegir(PREGUNTAS), porQue: "No todo es vender: una pregunta trae comentarios." },
    visto
      ? { dia: "Viernes", tipo: "disponible", producto: visto, porQue: "Es de lo más visto en la página y hay stock." }
      : null,
    importado
      ? { dia: "Domingo", tipo: "eeuu", producto: importado, porQue: "Está por consultar: sirve para medir si hay interés antes de conseguirlo." }
      : null,
  ];
  return plan.filter((sugerencia): sugerencia is Sugerencia => sugerencia !== null);
}

/* ---------- Carruseles ---------- */

export const TIPOS_DE_CARRUSEL = [
  { id: "presupuesto", nombre: "Por presupuesto" },
  { id: "baratas", nombre: "Cinco cartas económicas" },
  { id: "novedades", nombre: "Novedades de la semana" },
  { id: "expansion", nombre: "De una expansión" },
  { id: "regalos", nombre: "Ideas para regalar" },
  { id: "sellados", nombre: "Sellados disponibles" },
] as const;
export type TipoDeCarrusel = (typeof TIPOS_DE_CARRUSEL)[number]["id"];

/** Los presupuestos que el Estudio ofrece para "¿Tenés ₡10 000?". */
export const TOPES = PRESUPUESTOS.filter((presupuesto) => Number.isFinite(presupuesto.max));

export type Carrusel = {
  rotulo: string;
  titulo: string;
  subtitulo: string;
  productos: Producto[];
  /** Lo que se escribe en la pestaña Contenido, columna "Qué se publica". */
  que: string;
};

/** Las expansiones con al menos tres productos que hoy se pueden comprar. */
export function expansionesConProductos() {
  const grupos = new Map<string, { nombre: string; productos: Producto[] }>();
  for (const producto of disponibles()) {
    const clave = expansionDe(producto);
    if (clave.length < 4) continue;
    const grupo = grupos.get(clave) ?? { nombre: producto.carta?.coleccion || clave, productos: [] };
    if (producto.carta?.coleccion) grupo.nombre = producto.carta.coleccion;
    grupo.productos.push(producto);
    grupos.set(clave, grupo);
  }
  return [...grupos.entries()]
    .filter(([, grupo]) => grupo.productos.length >= 3)
    .sort((a, b) => b[1].productos.length - a[1].productos.length)
    .map(([clave, grupo]) => ({ clave, nombre: grupo.nombre, productos: grupo.productos }));
}

const conFotoPropia = (producto: Producto) =>
  Boolean(producto.fotos[0]) && !/^https?:/.test(producto.fotos[0]);

/**
 * Los productos de cada carrusel salen del catálogo de hoy: solo lo que se puede
 * comprar y con foto propia (las de otros sitios no se pueden poner en la imagen).
 */
export function armarCarrusel(tipo: TipoDeCarrusel, opcion: string): Carrusel | null {
  const cinco = (lista: Producto[]) => lista.filter(conFotoPropia).slice(0, 5);
  if (tipo === "presupuesto") {
    const tope = TOPES.find((presupuesto) => presupuesto.id === opcion) ?? TOPES[1];
    const productos = cinco(paraPresupuesto(tope.id, 20));
    return {
      rotulo: "POR PRESUPUESTO",
      titulo: "¿Tenés " + colones(tope.max) + "? Mirá estas opciones",
      subtitulo: "Deslizá para verlas",
      productos,
      que: "¿Tenés " + colones(tope.max) + "?",
    };
  }
  if (tipo === "baratas") {
    const productos = cinco(cartasSueltas().filter((carta) => carta.stock > 0));
    return { rotulo: "ECONÓMICAS", titulo: "Cinco cartas que no te vacían la billetera", subtitulo: "Deslizá para verlas", productos, que: "Cinco cartas económicas" };
  }
  if (tipo === "novedades") {
    return { rotulo: "RECIÉN LLEGADO", titulo: "Lo nuevo de la semana en el mezzanine", subtitulo: "Deslizá para verlo", productos: cinco(novedadesVariadas(20)), que: "Novedades de la semana" };
  }
  if (tipo === "expansion") {
    const expansiones = expansionesConProductos();
    const elegida = expansiones.find((expansion) => expansion.clave === opcion) ?? expansiones[0];
    if (!elegida) return null;
    return {
      rotulo: "EXPANSIÓN",
      titulo: elegida.nombre + ": lo que tenemos",
      subtitulo: "Deslizá para verlo",
      productos: cinco(elegida.productos.sort((a, b) => b.precio - a.precio)),
      que: "Expansión " + elegida.nombre,
    };
  }
  if (tipo === "regalos") {
    return { rotulo: "PARA REGALAR", titulo: "Ideas para regalar de ₡10 000 a ₡25 000", subtitulo: "Deslizá para verlas", productos: cinco(paraPresupuesto("regalos", 20)), que: "Ideas para regalar" };
  }
  return { rotulo: "SELLADOS", titulo: "Sellados listos para enviar", subtitulo: "Deslizá para verlos", productos: cinco(selladosDisponibles()), que: "Sellados disponibles" };
}

/** El texto del carrusel: un renglón por producto con su precio de hoy. */
export function captionDeCarrusel(carrusel: Carrusel, version: number) {
  const lista = carrusel.productos
    .map((producto, indice) => indice + 1 + ". " + producto.nombre + " · " + colones(producto.precio))
    .join("\n");
  return [carrusel.titulo, lista, CIERRES[version % CIERRES.length]].join("\n\n");
}

/**
 * La fila para pegar en la pestaña Contenido (separada por tabulaciones: al
 * pegarla en la hoja, cada dato cae en su columna). Lleva el precio de cada
 * producto en este momento: la hoja revisa después si cambió.
 */
export function filaParaContenido(tipo: string, que: string, productos: Producto[], texto: string) {
  return [
    "",
    tipo,
    que,
    productos.map((producto) => producto.slug + "=" + producto.precio).join("; "),
    texto.replace(/\s+/g, " ").slice(0, 400),
    "Borrador",
  ].join("\t");
}
