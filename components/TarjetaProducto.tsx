"use client";

import Link from "next/link";
import { ViewTransition } from "react";
import { colones } from "@/lib/formato";
import {
  enlaceBusca,
  esCarta,
  estaAgotado,
  estadoDe,
  muestraCantidad,
  siglaDeCondicion,
  type Producto,
} from "@/lib/productos";
import { useAgotadosAlFinal, useProductoVivo } from "@/lib/vivo";
import { AgregarRapido } from "./AgregarRapido";
import { BotonAvisame } from "./BotonAvisame";
import { BotonFavorito } from "./BotonFavorito";
import { FotoProducto } from "./FotoProducto";
import { IconoTipo } from "./IconoTipo";
import { Revelar } from "./Revelar";

export function Calcomania({ producto: guardado }: { producto: Producto }) {
  const producto = useProductoVivo(guardado);
  const estado = estadoDe(producto);
  if (estado === "Pedido especial") {
    return <span className="calcomania -rotate-2 bg-azul">De EE. UU.</span>;
  }
  if (estado === "En camino" || estado === "Por consultar") {
    return <span className="calcomania -rotate-2 bg-azul">{estado}</span>;
  }
  if (estaAgotado(producto)) return null;

  if (producto.precioAntes) {
    const rebaja = Math.round((1 - producto.precio / producto.precioAntes) * 100);
    return (
      <span className="estrella">
        <span>−{rebaja}%</span>
      </span>
    );
  }
  if (producto.stock <= 3 && muestraCantidad(producto)) {
    return (
      <span className="calcomania rotate-3 bg-rojo">
        {producto.stock === 1 ? "¡Queda 1!" : `¡Quedan ${producto.stock}!`}
      </span>
    );
  }
  if (producto.etiqueta) {
    return (
      <span className="calcomania -rotate-2 bg-rojo">{producto.etiqueta}</span>
    );
  }
  return null;
}

export function Precio({ producto }: { producto: Producto }) {
  return (
    <p className="mt-1 flex flex-wrap items-baseline gap-x-2 text-[22px] font-extrabold text-azul">
      {colones(producto.precio)}
      {producto.precioAntes ? (
        <s className="text-sm font-medium text-gris">
          {colones(producto.precioAntes)}
        </s>
      ) : null}
    </p>
  );
}

function FotoTarjeta({
  producto,
  viaja,
}: {
  producto: Producto;
  viaja: boolean;
}) {
  const carta = esCarta(producto) && !estaAgotado(producto);
  const foto = carta ? (
    <div data-holo="foil" className="relative mx-auto aspect-[5/7] h-full">
      <FotoProducto
        producto={producto}
        alt=""
        sizes="(min-width: 1024px) 140px, 84px"
        className="p-1"
      />
    </div>
  ) : (
    <FotoProducto
      producto={producto}
      alt=""
      sizes="(min-width: 1024px) 260px, 96px"
      className="p-1.5 lg:p-3"
    />
  );

  const sorpresa = producto.categoria === "Caja misteriosa";
  const caja = (
    <div className={`absolute inset-0 ${sorpresa ? "caja-sorpresa" : ""}`}>
      {foto}
    </div>
  );
  if (!viaja) return caja;

  return (
    <ViewTransition
      name={`foto-${producto.slug}`}
      share="morph"
      default="none"
    >
      {caja}
    </ViewTransition>
  );
}

export function TarjetaProducto({
  producto: guardado,
  viaja = true,
}: {
  producto: Producto;
  /** Apagalo si el mismo producto puede salir dos veces en la página. */
  viaja?: boolean;
}) {
  const producto = useProductoVivo(guardado);
  const estado = estadoDe(producto);
  // Agotado se apaga; en camino y por consultar se ven normales, pero no se compran.
  const agotado = estado === "Agotado";
  const enlace = `/producto/${producto.slug}`;
  const detalle = [
    // En camino y por consultar ya lo dice la calcomanía.
    agotado ? "Agotado" : null,
    producto.categoriaCorta,
    producto.idioma === "Otro" ? null : producto.idioma || null,
    siglaDeCondicion(producto) || null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <article
      className={`marco relative flex h-full items-center gap-3.5 p-3 lg:flex-col lg:items-stretch ${
        agotado ? "bg-gris-claro" : "tarjeta"
      }`}
    >
      <div className="relative shrink-0">
        <Link
          href={enlace}
          tabIndex={-1}
          aria-hidden="true"
          data-foto-tarjeta=""
          data-holo={esCarta(producto) ? undefined : "suave"}
          className={`brillo relative block h-[116px] w-24 overflow-hidden rounded-md lg:h-48 lg:w-full ${
            agotado ? "bg-gris-medio" : "bg-white"
          }`}
        >
          <FotoTarjeta producto={producto} viaja={viaja} />
          {agotado ? <span className="sello-agotado">Agotado</span> : null}
        </Link>
        <BotonFavorito
          slug={producto.slug}
          nombre={producto.nombre}
          className="absolute -top-1.5 -left-1.5 z-[3]"
        />
        {producto.tipo ? (
          <IconoTipo
            tipo={producto.tipo}
            className="absolute -right-1.5 -bottom-1.5 z-[3]"
          />
        ) : null}
      </div>
      <div className="flex min-w-0 grow flex-col gap-0.5">
        <span
          className={`text-[13px] text-gris ${agotado ? "font-bold" : "font-medium"}`}
        >
          {detalle}
        </span>
        <h3 className="text-[17px] leading-tight font-extrabold">
          <Link href={enlace} className="block py-1 underline-offset-2 hover:underline">
            {producto.nombre}
          </Link>
        </h3>
        {estado === "Pedido especial" ? (
          <div className="mt-auto flex flex-wrap items-end justify-between gap-2">
            <p className="mt-1 leading-tight">
              <span className="block text-[13px] font-bold text-gris">
                Pedido especial
              </span>
              <span className="text-[19px] font-extrabold text-azul">
                {colones(producto.precio)}
              </span>
            </p>
            <Link href={enlace} className="boton boton-amarillo boton-chico">
              Ver condiciones
            </Link>
          </div>
        ) : estado === "Por consultar" ? (
          <div className="mt-auto flex flex-wrap items-end justify-between gap-2">
            <p className="mt-1 leading-tight">
              <span className="block text-[13px] font-bold text-gris">
                Precio de referencia
              </span>
              <span className="text-[19px] font-extrabold text-azul">
                {colones(producto.precio)}
              </span>
            </p>
            <Link href={enlaceBusca(producto)} className="boton boton-amarillo boton-chico">
              Consultar
            </Link>
          </div>
        ) : estado !== "Disponible" ? (
          <BotonAvisame
            nombreProducto={producto.nombre}
            slug={producto.slug}
            enCamino={estado === "En camino"}
            className="mt-2"
          />
        ) : (
          <div className="mt-auto flex flex-wrap items-end justify-between gap-2">
            <Precio producto={producto} />
            <AgregarRapido producto={producto} />
          </div>
        )}
      </div>
      <Calcomania producto={producto} />
    </article>
  );
}

export function RejillaProductos({ productos }: { productos: Producto[] }) {
  const ordenados = useAgotadosAlFinal(productos);

  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
      {ordenados.map((producto, indice) => (
        <Revelar key={producto.slug} indice={indice}>
          <TarjetaProducto producto={producto} />
        </Revelar>
      ))}
    </div>
  );
}
