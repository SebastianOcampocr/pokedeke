import { masVistos } from "./extras";
import { colones } from "./formato";
import type { TipoDeContenido } from "./plantillas";
import {
  destacados,
  disponibles,
  novedadesVariadas,
  porConsultar,
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
  if (producto.stock <= 0) return "";
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
