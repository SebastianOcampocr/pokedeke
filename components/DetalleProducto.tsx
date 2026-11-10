"use client";

import Link from "next/link";
import { useLayoutEffect, useState, ViewTransition } from "react";
import { contarVisita } from "@/lib/api-pedidos";
import { agregarAlCarrito } from "@/lib/carrito";
import { colones } from "@/lib/formato";
import { useRouter } from "next/navigation";
import { useCarrito } from "@/lib/carrito";
import {
  enlaceBusca,
  esCarta,
  estaAgotado,
  estadoDe,
  nombreDeVersion,
  versionesDe,
  type Producto,
} from "@/lib/productos";
import { CondicionesEspeciales, cuandoSeEntrega } from "./PedidoEspecial";
import { enlaceCompartir, enlaceWhatsApp, TIENDA } from "@/lib/tienda";
import { useOfertaDe, useProductoVivo } from "@/lib/vivo";
import { volarAlCarrito } from "@/lib/volar";
import { BotonAvisame } from "./BotonAvisame";
import { BotonFavorito } from "./BotonFavorito";
import { Cantidad } from "./Cantidad";
import { FotoProducto } from "./FotoProducto";
import { IconoChat } from "./Iconos";

export function Galeria({ producto }: { producto: Producto }) {
  const [vista, setVista] = useState(0);
  // La foto voltea solo al cambiarla: al abrir la ficha se muestra de una vez,
  // porque es lo primero que el navegador mide para saber si la página es rápida.
  const [cambiada, setCambiada] = useState(false);
  const carta = esCarta(producto) && !estaAgotado(producto);
  const esReal = Boolean(
    producto.fotosReales?.includes(producto.fotos[vista] ?? ""),
  );

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
          className={`${cambiada ? "voltear " : ""}relative h-[310px] rounded-[7px] lg:h-[440px]`}
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
                // Una carta mide 5:7 dentro de un cuadro de 310 px (440 px en
                // pantallas grandes): no ocupa todo el ancho.
                sizes={
                  carta
                    ? "(min-width: 1024px) 315px, 225px"
                    : "(min-width: 1024px) 540px, 100vw"
                }
                prioridad
                className={carta ? "" : "px-5"}
              />
            </div>
          </div>
        </div>
      </ViewTransition>
      {esReal ? (
        <p className="px-3 text-sm font-bold text-verde-oscuro">
          Foto real de este artículo
        </p>
      ) : esCarta(producto) ? (
        <p className="px-3 text-sm text-gris">
          Imagen de referencia. Si querés ver la carta real, pedinos fotos por
          WhatsApp.
        </p>
      ) : null}
      {producto.fotos.length > 1 ? (
        <div className="flex gap-2 px-3 pb-3">
          {producto.fotos.map((foto, indice) => (
            <button
              key={foto}
              type="button"
              aria-label={`Ver foto ${indice + 1}`}
              aria-pressed={vista === indice}
              onClick={() => {
                setCambiada(true);
                setVista(indice);
              }}
              className={`relative size-14 overflow-hidden rounded-md border-2 bg-white transition-transform hover:-translate-y-0.5 ${
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

/** Precio y cuánto queda: se actualizan solos mientras la ficha esté abierta. */
export function PrecioYStock({ producto: guardado }: { producto: Producto }) {
  const producto = useProductoVivo(guardado);
  const oferta = useOfertaDe(producto.slug);
  const agotado = estaAgotado(producto);
  const estado = estadoDe(producto);

  return (
    <>
      {estado === "Por consultar" ? (
        <p className="mt-1 text-sm font-bold text-gris">Precio de referencia</p>
      ) : null}
      {estado === "Pedido especial" ? (
        <p className="mt-1 w-fit rounded-md border-2 border-tinta bg-azul px-2.5 py-1 text-sm font-bold text-white">
          🌎 Pedido especial desde Estados Unidos
        </p>
      ) : null}
      <p className="mt-1 flex flex-wrap items-baseline gap-x-3 text-4xl font-extrabold">
        {colones(producto.precio)}
        {producto.precioAntes ? (
          <s className="text-lg font-medium">{colones(producto.precioAntes)}</s>
        ) : null}
      </p>
      <p aria-live="polite" className="mb-3 text-[15px] font-bold">
        {estado === "Agotado" && "Agotado por ahora"}
        {estado === "En camino" && "En camino"}
        {estado === "Por consultar" && "Por consultar"}
        {estado === "Pedido especial" &&
          (agotado
            ? "Ya no quedan cupos para este pedido especial"
            : producto.stock === 1
              ? "Queda 1 cupo para importar"
              : `Quedan ${producto.stock} cupos para importar`)}
        {!agotado && estado !== "Pedido especial" && (producto.stock === 1 ? "Queda 1" : `Quedan ${producto.stock}`)}
      </p>
      {estado === "En camino" ? (
        <p className="mb-3 rounded-md bg-crema p-3 text-[15px] leading-snug font-medium">
          Ya lo compramos y viene para el mezzanine. Todavía no se puede
          comprar: pedí que te avisemos y te escribimos apenas llegue.
        </p>
      ) : null}
      {estado === "Por consultar" ? (
        <p className="mb-3 rounded-md bg-crema p-3 text-[15px] leading-snug font-medium">
          No lo tenemos en el mezzanine. Revisamos si lo podemos conseguir y te
          confirmamos disponibilidad y precio antes de que pagués nada. El
          precio de referencia es una guía y puede cambiar.
        </p>
      ) : null}
      {oferta && !agotado ? (
        <p className="mb-3 rounded-md bg-crema p-3 text-[15px] leading-snug font-medium">
          <strong>Oferta:</strong> llevando {oferta.desde} o más{" "}
          {oferta.nombre}, cada uno te queda en{" "}
          <strong>{colones(oferta.precio)}</strong>. Podés combinarlos.
        </p>
      ) : null}
    </>
  );
}

export function AccionesProducto({ producto: guardado }: { producto: Producto }) {
  const producto = useProductoVivo(guardado);
  const [cantidad, setCantidad] = useState(1);
  const [agregado, setAgregado] = useState(false);
  const agotado = estaAgotado(producto);
  const estado = estadoDe(producto);

  // Al volver a esta página el aviso ya no aplica: quizá el carrito cambió.
  useLayoutEffect(
    () => () => {
      setAgregado(false);
      setCantidad(1);
    },
    [],
  );

  if (estado === "Pedido especial") {
    return <AccionesEspeciales producto={producto} />;
  }

  return (
    <div className="flex flex-col gap-3">
      {estado === "Por consultar" ? (
        <Link href={enlaceBusca(producto)} className="boton boton-rojo">
          Consultar disponibilidad
        </Link>
      ) : agotado ? (
        <>
          <BotonAvisame
            nombreProducto={producto.nombre}
            slug={producto.slug}
            enCamino={estado === "En camino"}
            className="min-h-14 text-[17px]"
          />
          {estado === "Agotado" ? (
            <Link
              href={enlaceBusca(producto)}
              className="min-h-11 content-center font-bold underline underline-offset-2"
            >
              ¿Lo ocupás ya? Pedinos que lo busquemos
            </Link>
          ) : null}
        </>
      ) : (
        <>
          {producto.stock > 1 ? (
            <div className="flex items-center gap-3">
              <span className="font-bold">Cantidad</span>
              <Cantidad
                valor={Math.min(cantidad, producto.stock)}
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
              agregarAlCarrito(producto, Math.min(cantidad, producto.stock));
              setAgregado(true);
              volarAlCarrito();
            }}
          >
            Agregar al carrito
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

      <a
        href={enlaceWhatsApp(
          `¡Hola! Quisiera preguntar por ${producto.nombre}.`,
        )}
        target="_blank"
        rel="noreferrer"
        className="boton boton-blanco"
        onClick={() => contarVisita(producto.slug, "whatsapp")}
      >
        <IconoChat tamano={22} />
        Preguntar por WhatsApp
      </a>

      <div className="flex items-center justify-between gap-3">
        <a
          href={enlaceCompartir(
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

/**
 * Pedido especial con pago anticipado: se ve claro que no está en el mezzanine,
 * se escoge la versión exacta y se leen las condiciones antes de ir a pagar. En
 * el pago se vuelven a mostrar y hay que aceptarlas.
 */
function AccionesEspeciales({ producto }: { producto: Producto }) {
  const router = useRouter();
  const { lineas } = useCarrito();
  const versiones = versionesDe(producto);
  const version = nombreDeVersion(producto) || producto.nombre;
  const otros = lineas.filter((linea) => linea.producto.slug !== producto.slug);
  const sinCupos = producto.stock <= 0;

  return (
    <div className="flex flex-col gap-3">
      {versiones.length > 1 ? (
        <div>
          <p className="rotulo-campo">Escogé la versión</p>
          <div className="flex flex-wrap gap-2">
            {versiones.map((otra) => (
              <Link
                key={otra.slug}
                href={`/producto/${otra.slug}`}
                aria-current={otra.slug === producto.slug ? "page" : undefined}
                className={`chip ${otra.slug === producto.slug ? "bg-azul text-white" : ""}`}
              >
                {nombreDeVersion(otra)}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
      <div className="marco flex flex-col gap-2 bg-crema p-4">
        <p className="font-bold">📦 Producto importado bajo pedido</p>
        <p className="font-bold">💳 Pago anticipado del 100%</p>
        <p className="font-bold">
          🚚 Entrega {cuandoSeEntrega(producto.entrega)}
        </p>
        <p className="font-bold">✅ Si no podemos cumplir, te devolvemos el 100% de lo pagado</p>
        <details className="mt-1">
          <summary className="cursor-pointer font-bold text-azul underline underline-offset-2">
            Leer todas las condiciones
          </summary>
          <CondicionesEspeciales version={version} entrega={producto.entrega} className="mt-2" />
        </details>
      </div>
      {otros.length > 0 ? (
        <p role="alert" className="rounded-md bg-crema p-3 text-[15px] leading-snug font-bold">
          El pedido especial va en un pedido aparte. Terminá o vaciá primero lo que
          tenés en el carrito.
        </p>
      ) : null}
      {sinCupos ? (
        <Link href={enlaceBusca(producto)} className="boton boton-rojo">
          Consultar disponibilidad
        </Link>
      ) : (
        <button
          type="button"
          className="boton boton-rojo"
          disabled={otros.length > 0}
          onClick={() => {
            agregarAlCarrito(producto, 1);
            router.push("/pago");
          }}
        >
          Solicitar importación
        </button>
      )}
      <a
        href={enlaceWhatsApp(`¡Hola! Tengo una pregunta del pedido especial de ${producto.nombre}.`)}
        target="_blank"
        rel="noreferrer"
        className="boton boton-blanco"
        onClick={() => contarVisita(producto.slug, "whatsapp")}
      >
        <IconoChat tamano={22} />
        Preguntar por WhatsApp
      </a>
    </div>
  );
}
