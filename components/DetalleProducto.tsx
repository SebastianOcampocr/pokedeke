"use client";

import Link from "next/link";
import { useLayoutEffect, useState, ViewTransition } from "react";
import { agregarAlCarrito } from "@/lib/carrito";
import { colones } from "@/lib/formato";
import {
  esCarta,
  esPreventa,
  estaAgotado,
  precioACobrar,
  type Producto,
} from "@/lib/productos";
import { enlaceWhatsApp, TIENDA } from "@/lib/tienda";
import { volarAlCarrito } from "@/lib/volar";
import { BotonAvisame } from "./BotonAvisame";
import { BotonFavorito } from "./BotonFavorito";
import { Tractos } from "./Tractos";
import { Cantidad } from "./Cantidad";
import { FotoProducto } from "./FotoProducto";
import { IconoChat } from "./Iconos";

export function Galeria({ producto }: { producto: Producto }) {
  const [vista, setVista] = useState(0);
  const carta = esCarta(producto) && !estaAgotado(producto);

  return (
    <div className="flex flex-col gap-3 overflow-x-clip">
      <ViewTransition
        name={`foto-${producto.slug}`}
        share="morph"
        default="none"
      >
        <div
          key={vista}
          data-foto-principal=""
          className="voltear relative h-[310px] rounded-[7px] lg:h-[440px]"
        >
          <div className="absolute inset-0 flex justify-center py-4">
            <div
              data-holo={carta ? "foil" : "suave"}
              className={`relative h-full ${carta ? "aspect-[5/7]" : "w-full"}`}
            >
              <FotoProducto
                producto={producto}
                indice={vista}
                alt={producto.nombre}
                sizes="(min-width: 1024px) 540px, 100vw"
                prioridad
                className={carta ? "" : "px-5"}
              />
            </div>
          </div>
        </div>
      </ViewTransition>
      {producto.fotos.length > 1 ? (
        <div className="flex gap-2 px-3 pb-3">
          {producto.fotos.map((foto, indice) => (
            <button
              key={foto}
              type="button"
              aria-label={`Ver foto ${indice + 1}`}
              aria-pressed={vista === indice}
              onClick={() => setVista(indice)}
              className={`relative size-14 overflow-hidden rounded-md border-2 bg-crema transition-transform hover:-translate-y-0.5 ${
                vista === indice ? "border-azul" : "border-tinta/25"
              }`}
            >
              <FotoProducto
                producto={producto}
                indice={indice}
                alt=""
                sizes="56px"
                className="p-1"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function AccionesProducto({ producto }: { producto: Producto }) {
  const [cantidad, setCantidad] = useState(1);
  const [agregado, setAgregado] = useState(false);
  const agotado = estaAgotado(producto);

  // Al volver a esta página el aviso ya no aplica: quizá el carrito cambió.
  useLayoutEffect(
    () => () => {
      setAgregado(false);
      setCantidad(1);
    },
    [],
  );

  const preventa = esPreventa(producto);
  const porcentaje = Math.round(TIENDA.adelantoPreventa * 100);

  return (
    <div className="flex flex-col gap-3">
      {preventa ? (
        <p className="rounded-md bg-crema p-3 text-[15px] leading-snug font-medium">
          Apartás con {porcentaje}%:{" "}
          <strong>{colones(precioACobrar(producto))}</strong> hoy y el resto
          cuando llegue.
        </p>
      ) : null}

      {agotado ? (
        <BotonAvisame
          nombreProducto={producto.nombre}
          className="min-h-14 text-[17px]"
        />
      ) : (
        <>
          {producto.stock > 1 ? (
            <div className="flex items-center gap-3">
              <span className="font-bold">Cantidad</span>
              <Cantidad
                valor={cantidad}
                maximo={producto.stock}
                nombre={producto.nombre}
                alCambiar={setCantidad}
              />
            </div>
          ) : null}
          <button
            type="button"
            className="boton boton-rojo"
            onClick={() => {
              agregarAlCarrito(producto, cantidad);
              setAgregado(true);
              volarAlCarrito();
            }}
          >
            {preventa ? "Apartar con adelanto" : "Agregar al carrito"}
          </button>
          {agregado ? (
            <p role="status" className="aparecer font-bold text-verde-oscuro">
              Listo, ya está en tu carrito.{" "}
              <Link href="/carrito" className="underline">
                Ver carrito
              </Link>
            </p>
          ) : null}
        </>
      )}

      <Tractos producto={producto} />

      <a
        href={enlaceWhatsApp(
          `¡Hola! Quisiera preguntar por ${producto.nombre}.`,
        )}
        target="_blank"
        rel="noreferrer"
        className="boton boton-blanco"
      >
        <IconoChat tamano={22} />
        Preguntar por WhatsApp
      </a>

      <div className="flex items-center justify-between gap-3">
        <a
          href={enlaceWhatsApp(
            `Mirá esto en ${TIENDA.nombre}: ${producto.nombre}, ${colones(producto.precio)}.`,
          )}
          target="_blank"
          rel="noreferrer"
          className="min-h-11 content-center font-bold underline underline-offset-2"
        >
          Mandárselo a un compa
        </a>
        <label className="flex items-center gap-1 font-bold">
          <BotonFavorito slug={producto.slug} nombre={producto.nombre} />
          Mi lista
        </label>
      </div>
    </div>
  );
}
