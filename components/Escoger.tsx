"use client";

import { useEffect, useMemo, useState } from "react";
import { ganarLogro } from "@/lib/logros";
import {
  estaAgotado,
  esPreventa,
  PRODUCTOS,
  type Producto,
} from "@/lib/productos";
import { Deke } from "./Deke";
import { TarjetaProducto } from "./TarjetaProducto";

type Opcion = { id: string; texto: string; detalle?: string };

const PREGUNTAS: { id: string; titulo: string; opciones: Opcion[] }[] = [
  {
    id: "quien",
    titulo: "¿Para quién es?",
    opciones: [
      { id: "yo", texto: "Para mí", detalle: "Me lo merezco" },
      { id: "regalo", texto: "Es un regalo", detalle: "Para alguien grande" },
      { id: "nino", texto: "Para un chiquito", detalle: "Que ama Pokémon" },
    ],
  },
  {
    id: "gusto",
    titulo: "¿Qué es lo que más disfruta?",
    opciones: [
      { id: "abrir", texto: "Abrir sobres", detalle: "La emoción de abrirlos" },
      { id: "jugar", texto: "Jugar", detalle: "Mazos y partidas" },
      { id: "coleccionar", texto: "Coleccionar", detalle: "Cartas para guardar" },
      { id: "cuidar", texto: "Cuidar sus cartas", detalle: "Sleeves y accesorios" },
    ],
  },
  {
    id: "plata",
    titulo: "¿Cuánto querés gastar?",
    opciones: [
      { id: "10000", texto: "Hasta ₡10 000" },
      { id: "30000", texto: "Hasta ₡30 000" },
      { id: "80000", texto: "Hasta ₡80 000" },
      { id: "9999999", texto: "Sin límite", detalle: "Deke te quiere" },
    ],
  },
];

const CATEGORIAS: Record<string, string[]> = {
  abrir: [
    "Booster pack",
    "Blister / sleeved booster",
    "Booster bundle",
    "Tin o caja de colección",
    "Caja misteriosa",
    "ETB",
    "Booster box",
  ],
  jugar: ["Mazos", "Sleeves y fundas", "Accesorios", "ETB"],
  coleccionar: [
    "Carta suelta (single)",
    "Carta gradada",
    "Colección premium / UPC",
    "Accesorios",
  ],
  cuidar: ["Sleeves y fundas", "Accesorios"],
};

// Lo delicado y lo muy caro no es buen regalo para un chiquito.
const NO_PARA_NINOS = ["Carta gradada", "Booster box"];

function recomendar(respuestas: Record<string, string>): Producto[] {
  const tope = Number(respuestas.plata);
  const categorias = CATEGORIAS[respuestas.gusto] ?? [];

  return PRODUCTOS.filter(
    (producto) =>
      !estaAgotado(producto) &&
      !esPreventa(producto) &&
      categorias.includes(producto.categoria) &&
      producto.precio <= tope &&
      !(respuestas.quien === "nino" && NO_PARA_NINOS.includes(producto.categoria)),
  )
    .sort((a, b) => {
      // Lo que más se acerca al presupuesto luce mejor; dentro de eso, lo más vendido.
      const pesoA = a.vendidos + (a.precio / tope) * 8;
      const pesoB = b.vendidos + (b.precio / tope) * 8;
      return pesoB - pesoA;
    })
    .slice(0, 4);
}

export function Escoger() {
  const [respuestas, setRespuestas] = useState<Record<string, string>>({});
  const paso = PREGUNTAS.findIndex((pregunta) => !respuestas[pregunta.id]);
  const terminado = paso === -1;
  const pregunta = PREGUNTAS[paso];

  const resultados = useMemo(
    () => (terminado ? recomendar(respuestas) : []),
    [terminado, respuestas],
  );

  useEffect(() => {
    if (terminado) ganarLogro("guia");
  }, [terminado]);

  return (
    <section
      aria-label="Deke te ayuda a escoger"
      className="marco shadow-dura flex flex-col gap-5 bg-crema p-5 md:p-7"
    >
      <div className="flex items-center gap-4">
        <Deke
          animo={terminado ? "guino" : "feliz"}
          className="deke h-20 shrink-0 md:h-28"
        />
        <div className="min-w-0 overflow-x-clip">
          <p className="text-sm font-bold">
            {terminado ? "¡Listo!" : `Pregunta ${paso + 1} de ${PREGUNTAS.length}`}
          </p>
          <h2
            key={terminado ? "fin" : pregunta.id}
            className="sello font-display text-[24px] leading-tight text-azul md:text-3xl"
          >
            {terminado ? "Esto te recomienda Deke" : pregunta.titulo}
          </h2>
        </div>
      </div>

      {terminado ? (
        <>
          {resultados.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {resultados.map((producto) => (
                <TarjetaProducto key={producto.slug} producto={producto} />
              ))}
            </div>
          ) : (
            <p className="font-medium">
              Con ese presupuesto no hallé nada de eso. Probá subirlo un toque.
            </p>
          )}
          <button
            type="button"
            className="boton boton-amarillo boton-chico w-fit"
            onClick={() => setRespuestas({})}
          >
            Empezar otra vez
          </button>
        </>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {pregunta.opciones.map((opcion) => (
            <button
              key={opcion.id}
              type="button"
              className="marco tarjeta flex min-h-20 cursor-pointer flex-col justify-center p-3 text-left"
              onClick={() =>
                setRespuestas((previas) => ({
                  ...previas,
                  [pregunta.id]: opcion.id,
                }))
              }
            >
              <span className="text-[17px] leading-tight font-extrabold">
                {opcion.texto}
              </span>
              {opcion.detalle ? (
                <span className="text-sm text-gris">{opcion.detalle}</span>
              ) : null}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
