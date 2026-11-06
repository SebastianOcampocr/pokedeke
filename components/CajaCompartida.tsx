"use client";

import { useState } from "react";
import { useHidratado } from "@/lib/almacen";
import { agregarAlCarrito, cambiarCantidad } from "@/lib/carrito";
import { lanzarConfeti } from "@/lib/confeti";
import { apartarCupos, soltarCupos, useCupos } from "@/lib/cupos";
import { CAJA_COMPARTIDA, CUPO_COMPARTIDA } from "@/lib/caja-compartida";
import { colones } from "@/lib/formato";
import { ganarLogro } from "@/lib/logros";
import { sonar } from "@/lib/sonido";
import Link from "next/link";

const NUMEROS = Array.from(
  { length: CAJA_COMPARTIDA.sobres },
  (_, indice) => indice + 1,
);

export function TableroCaja() {
  const hidratado = useHidratado();
  const { mios } = useCupos();
  const [elegidos, setElegidos] = useState<number[]>([]);

  const propios = hidratado ? mios : [];
  const libres = NUMEROS.filter(
    (numero) =>
      !CAJA_COMPARTIDA.ocupados.includes(numero) &&
      !propios.includes(numero) &&
      !elegidos.includes(numero),
  );
  const total = elegidos.length * CUPO_COMPARTIDA.precio;

  function alternar(numero: number) {
    setElegidos((previos) =>
      previos.includes(numero)
        ? previos.filter((otro) => otro !== numero)
        : [...previos, numero],
    );
  }

  function sumarSiguiente() {
    if (libres.length === 0) return;
    setElegidos((previos) => [...previos, libres[0]]);
    sonar("voltear");
  }

  function apartar() {
    agregarAlCarrito(CUPO_COMPARTIDA, elegidos.length);
    apartarCupos(elegidos);
    setElegidos([]);
    ganarLogro("compartida");
    lanzarConfeti(30);
    sonar("premio");
  }

  return (
    <section aria-label="Escogé tus sobres" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm font-bold">
        <span className="flex items-center gap-1.5">
          <span className="size-4 rounded-sm border-2 border-tinta bg-white" />
          Libre
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-4 rounded-sm border-2 border-tinta bg-amarillo" />
          Elegido
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-4 rounded-sm border-2 border-tinta bg-rojo" />
          Tuyo
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-4 rounded-sm border-2 border-tinta bg-gris-medio" />
          Ya apartado
        </span>
      </div>

      <div className="grid max-w-md grid-cols-6 gap-1.5 max-[319px]:grid-cols-5">
        {NUMEROS.map((numero) => {
          const ocupado = CAJA_COMPARTIDA.ocupados.includes(numero);
          const mio = propios.includes(numero);
          const elegido = elegidos.includes(numero);
          const estado = ocupado
            ? "ocupado"
            : mio
              ? "mio"
              : elegido
                ? "elegido"
                : "libre";
          return (
            <button
              key={numero}
              type="button"
              className="cupo"
              data-estado={estado}
              disabled={ocupado || mio}
              aria-pressed={elegido}
              aria-label={`Sobre ${numero}, ${estado}`}
              onClick={() => alternar(numero)}
            >
              {numero}
            </button>
          );
        })}
      </div>

      <div className="flex max-w-md flex-col gap-3">
        <button
          type="button"
          className="boton boton-amarillo boton-chico"
          disabled={libres.length === 0}
          onClick={sumarSiguiente}
        >
          Dame el siguiente libre
        </button>
        <button
          type="button"
          className="boton boton-rojo"
          disabled={elegidos.length === 0}
          onClick={apartar}
        >
          {elegidos.length === 0
            ? "Escogé al menos un sobre"
            : `Apartar ${elegidos.length === 1 ? "1 sobre" : `${elegidos.length} sobres`} por ${colones(total)}`}
        </button>
        {propios.length > 0 ? (
          <div role="status" className="marco aparecer flex flex-col gap-1 bg-crema p-3">
            <p className="font-bold">
              {propios.length === 1
                ? `Tu sobre: ${propios[0]}`
                : `Tus sobres: ${propios.join(", ")}`}
            </p>
            <div className="flex flex-wrap gap-x-4">
              <Link href="/carrito" className="min-h-11 content-center font-bold text-azul underline">
                Ir al carrito
              </Link>
              <button
                type="button"
                className="min-h-11 cursor-pointer font-bold underline"
                onClick={() => {
                  cambiarCantidad(CUPO_COMPARTIDA, 0);
                  soltarCupos();
                }}
              >
                Soltar mis sobres
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
