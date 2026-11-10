"use client";

import Link from "next/link";
import { useState } from "react";
import { useHidratado } from "@/lib/almacen";
import {
  aplicarCupon,
  cambiarCantidad,
  quitarCupon,
  useCarrito,
  type LineaCarrito,
} from "@/lib/carrito";
import { calcularTotales, colones, fechaCorta } from "@/lib/formato";
import {
  disponibles,
} from "@/lib/productos";
import { CUPONES } from "@/lib/tienda";
import { useInventarioVivo, useOfertasVivas } from "@/lib/vivo";
import { AgregarRapido } from "./AgregarRapido";
import { BarraEnvio } from "./BarraEnvio";
import { Cantidad } from "./Cantidad";
import { Deke } from "./Deke";
import { FotoProducto } from "./FotoProducto";
import { IconoBasurero } from "./Iconos";
import { cuandoSeEntrega } from "./PedidoEspecial";

export function CarritoVacio() {
  return (
    <div className="marco flex items-center gap-4 bg-crema p-6">
      <Deke animo="triste" className="h-28 shrink-0 md:h-36" />
      <div className="flex flex-col items-start gap-3">
        <p className="font-display text-2xl leading-tight text-azul">
          Tu carrito está vacío
        </p>
        <p>Deke te recomienda darte una vuelta por el catálogo.</p>
        <Link href="/catalogo" className="boton boton-rojo">
          Ver el catálogo
        </Link>
      </div>
    </div>
  );
}

export function Linea({
  rotulo,
  monto,
  fuerte = false,
}: {
  rotulo: string;
  monto: string;
  fuerte?: boolean;
}) {
  return (
    <div
      className={`flex justify-between gap-4 ${fuerte ? "text-2xl font-extrabold" : ""}`}
    >
      <span>{rotulo}</span>
      <span className="whitespace-nowrap">{monto}</span>
    </div>
  );
}

function FormularioCupon({ activo }: { activo: string | null }) {
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState(false);

  if (activo) {
    return (
      <p className="flex items-center justify-between gap-3 text-[15px]">
        <span>
          Cupón <strong>{activo}</strong> aplicado
        </span>
        <button
          type="button"
          className="min-h-11 font-bold underline"
          onClick={quitarCupon}
        >
          Quitar
        </button>
      </p>
    );
  }

  return (
    <form
      onSubmit={(evento) => {
        evento.preventDefault();
        setError(!aplicarCupon(codigo));
      }}
    >
      <label htmlFor="cupon" className="rotulo-campo">
        ¿Tenés un cupón?
      </label>
      <div className="flex gap-2">
        <input
          id="cupon"
          className="campo uppercase"
          value={codigo}
          onChange={(evento) => setCodigo(evento.target.value)}
        />
        <button type="submit" className="boton boton-amarillo boton-chico">
          Aplicar
        </button>
      </div>
      {error ? (
        <p role="alert" className="mt-1 text-sm font-bold text-rojo">
          Ese cupón no existe o ya venció.
        </p>
      ) : null}
    </form>
  );
}

const CATEGORIAS_COMPLEMENTO = ["Accesorios", "Sleeves y fundas", "Booster pack"];

/** Lo que casi siempre falta: se ofrece solo si no está en el carrito. */
function Complementos({ enCarrito }: { enCarrito: string[] }) {
  const opciones = disponibles()
    .filter(
      (producto) =>
        CATEGORIAS_COMPLEMENTO.includes(producto.categoria) &&
        !enCarrito.includes(producto.slug),
    )
    .sort((a, b) => a.precio - b.precio)
    .slice(0, 2);
  if (opciones.length === 0) return null;

  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-bold">¿Le sumamos algo?</h2>
      {opciones.map((producto) => (
        <article key={producto.slug} className="marco flex items-center gap-3 p-2">
          <div
            data-foto-tarjeta=""
            className="relative size-12 shrink-0 overflow-hidden rounded-md bg-white"
          >
            <FotoProducto
              producto={producto}
              alt=""
              sizes="48px"
              className="p-0.5"
            />
          </div>
          <div className="min-w-0 grow">
            <p className="truncate text-[15px] font-bold">{producto.nombre}</p>
            <p className="text-sm font-extrabold text-azul">
              {colones(producto.precio)}
            </p>
          </div>
          <AgregarRapido producto={producto} />
        </article>
      ))}
    </section>
  );
}

/** Si ya lleva algo de una oferta, le dice cuánto le falta para que aplique. */
function FaltaParaOferta({ lineas }: { lineas: LineaCarrito[] }) {
  const vivo = useInventarioVivo();
  const ofertas = useOfertasVivas();
  if (!vivo) return null;
  const avisos = ofertas.flatMap((oferta) => {
    const delGrupo = lineas.filter((linea) =>
      oferta.slugs.includes(linea.producto.slug),
    );
    const lleva = delGrupo.reduce((suma, linea) => suma + linea.cantidad, 0);
    const hay = oferta.slugs.reduce(
      (suma, slug) => suma + (vivo[slug]?.stock ?? 0),
      0,
    );
    if (lleva === 0 || lleva >= oferta.desde || hay < oferta.desde) return [];
    const faltan = oferta.desde - lleva;
    return [
      <p
        key={oferta.nombre}
        className="rounded-md bg-crema p-3 text-[15px] leading-snug font-medium"
      >
        Llevá {faltan === 1 ? "1 más" : `${faltan} más`} de los{" "}
        {oferta.nombre} y cada uno te queda en{" "}
        <strong>{colones(oferta.precio)}</strong>.{" "}
        {oferta.buscar ? (
          <Link
            href={`/catalogo?q=${encodeURIComponent(oferta.buscar)}`}
            className="font-bold underline"
          >
            Ver cuáles hay
          </Link>
        ) : null}
      </p>,
    ];
  });
  return avisos.length > 0 ? <>{avisos}</> : null;
}

export function VistaCarrito() {
  const hidratado = useHidratado();
  const { lineas, cupon } = useCarrito();

  if (!hidratado) return <p>Cargando tu carrito…</p>;
  if (lineas.length === 0) return <CarritoVacio />;

  const totales = calcularTotales(lineas, cupon, 0);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
      <div className="flex min-w-0 flex-col gap-4">
      <BarraEnvio subtotal={totales.subtotal} />
      <FaltaParaOferta lineas={lineas} />
      <ul className="flex flex-col gap-4">
        {lineas.map(({ producto, cantidad, precio, precioNormal }) => (
          <li key={producto.slug} className="marco flex gap-3 p-3">
            <Link
              href={producto.enlace ?? `/producto/${producto.slug}`}
              tabIndex={-1}
              aria-hidden="true"
              className="relative h-24 w-20 shrink-0 overflow-hidden rounded-md bg-white"
            >
              <FotoProducto
                producto={producto}
                alt=""
                sizes="80px"
                className="p-1"
              />
            </Link>
            <div className="flex min-w-0 grow flex-col gap-2">
              <div>
                <Link
                  href={producto.enlace ?? `/producto/${producto.slug}`}
                  className="leading-tight font-extrabold underline-offset-2 hover:underline"
                >
                  {producto.nombre}
                </Link>
                <p className="text-sm text-gris">
                  {producto.estado === "Pedido especial" ? (
                    `${colones(precio)} c/u · Pedido especial, se entrega ${cuandoSeEntrega(producto.entrega)}`
                  ) : precioNormal ? (
                    <>
                      <s>{colones(precioNormal)}</s>{" "}
                      <strong className="text-verde-oscuro">
                        {colones(precio)} c/u
                      </strong>{" "}
                      por la oferta
                    </>
                  ) : (
                    `${colones(precio)} c/u`
                  )}
                </p>
                {cantidad > producto.stock ? (
                  <p role="alert" className="text-sm font-bold text-rojo">
                    {producto.stock === 0
                      ? "Se acaba de agotar."
                      : `Solo queda${producto.stock === 1 ? "" : "n"} ${producto.stock}.`}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Cantidad
                  valor={cantidad}
                  maximo={producto.stock}
                  nombre={producto.nombre}
                  alCambiar={(valor) => cambiarCantidad(producto, valor)}
                />
                <button
                  type="button"
                  aria-label={`Quitar ${producto.nombre} del carrito`}
                  className="flex size-11 shrink-0 items-center justify-center text-rojo"
                  onClick={() => cambiarCantidad(producto, 0)}
                >
                  <IconoBasurero />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <Complementos
        enCarrito={lineas.map((linea) => linea.producto.slug)}
      />
      </div>

      <aside className="marco shadow-dura flex flex-col gap-3 p-4">
        {CUPONES.length > 0 ? (
          <FormularioCupon activo={cupon?.codigo ?? null} />
        ) : null}
        <div className="flex flex-col gap-1.5 border-t-2 border-tinta pt-3">
          <Linea rotulo="Subtotal" monto={colones(totales.subtotal)} />
          {totales.descuento > 0 ? (
            <Linea
              rotulo="Descuento"
              monto={`−${colones(totales.descuento)}`}
            />
          ) : null}
          <Linea rotulo="Total" monto={colones(totales.total)} fuerte />
          <p className="text-sm text-gris">El envío se suma en el siguiente paso.</p>
        </div>
        <Link href="/pago" className="boton boton-rojo">
          Ir a pagar
        </Link>
      </aside>
    </div>
  );
}
