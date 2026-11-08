import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Fragment, Suspense } from "react";
import {
  AccionesProducto,
  Galeria,
  PrecioYStock,
} from "@/components/DetalleProducto";
import { Cuenta } from "@/components/Cuenta";
import { IconoTipo } from "@/components/IconoTipo";
import { Calcomania, RejillaProductos } from "@/components/TarjetaProducto";
import { VistosRecientes } from "@/components/VistosRecientes";
import { colones, fechaCorta } from "@/lib/formato";
import { buscarProducto, estaAgotado, PRODUCTOS } from "@/lib/productos";
import { ENVIO_GRATIS_DESDE, ENVIOS, TARIFA_CORREOS } from "@/lib/tienda";

export function generateStaticParams() {
  // GitHub Pages no acepta una lista vacía: esta ruta da "no encontrado".
  if (PRODUCTOS.length === 0) return [{ slug: "sin-productos" }];
  return PRODUCTOS.map((producto) => ({ slug: producto.slug }));
}

export async function generateMetadata(
  props: PageProps<"/producto/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const producto = buscarProducto(slug);
  if (!producto) return { title: "Producto no encontrado" };
  return {
    title: producto.nombre,
    description: `${colones(producto.precio)} · ${producto.descripcion}`,
    openGraph: {
      title: `${producto.nombre} · ${colones(producto.precio)}`,
      description: producto.descripcion,
    },
  };
}

export default function PaginaProducto(props: PageProps<"/producto/[slug]">) {
  return (
    <Suspense fallback={<EsqueletoProducto />}>
      <ContenidoProducto params={props.params} />
    </Suspense>
  );
}

function EsqueletoProducto() {
  return (
    <section className="mx-auto grid w-full max-w-6xl gap-6 px-4 pt-2 pb-7 lg:grid-cols-2 lg:gap-10">
      <div className="marco shadow-dura h-[380px] lg:h-[520px]" />
      <div className="flex flex-col gap-3">
        <div className="h-5 w-40 rounded bg-tinta/15" />
        <div className="h-16 rounded bg-tinta/15" />
        <div className="h-10 w-44 rounded bg-tinta/15" />
      </div>
    </section>
  );
}

async function ContenidoProducto({
  params,
}: {
  params: PageProps<"/producto/[slug]">["params"];
}) {
  const { slug } = await params;
  const producto = buscarProducto(slug);
  if (!producto) notFound();

  const datosDeCarta = producto.carta
    ? [
        { rotulo: "Colección", valor: producto.carta.coleccion },
        { rotulo: "Número", valor: producto.carta.numero },
        { rotulo: "Rareza", valor: producto.carta.rareza },
        { rotulo: "Condición", valor: producto.carta.condicion },
      ].filter(({ valor }) => valor)
    : [];
  const relacionados = PRODUCTOS.filter(
    (otro) => otro.slug !== producto.slug && !estaAgotado(otro),
  )
    .sort(
      (a, b) =>
        Number(b.categoria === producto.categoria) -
          Number(a.categoria === producto.categoria) ||
        b.vendidos - a.vendidos,
    )
    .slice(0, 4);

  return (
    <>
      <section className="mx-auto grid w-full max-w-6xl gap-6 px-4 pt-2 pb-7 md:grid-cols-2 lg:gap-10 lg:pb-10">
        <div className="marco shadow-dura relative self-start">
          <Galeria producto={producto} />
          <Calcomania producto={producto} />
        </div>

        <div className="flex flex-col gap-2">
          <p className="flex flex-wrap items-center gap-x-1.5 text-sm font-medium">
            <Link
              href={`/catalogo?categoria=${encodeURIComponent(producto.categoria)}`}
              className="underline underline-offset-2"
            >
              {producto.categoriaCorta}
            </Link>
            {!producto.idioma || producto.idioma === "Otro" ? null : (
              <span>· {producto.idioma}</span>
            )}
            {producto.tipo ? (
              <span className="inline-flex items-center gap-1">
                · <IconoTipo tipo={producto.tipo} tamano={20} /> {producto.tipo}
              </span>
            ) : null}
          </p>
          <h1 className="font-display text-3xl leading-[1.05] text-azul lg:text-[42px]">
            {producto.nombre}
          </h1>
          <PrecioYStock producto={producto} />
          {producto.llegada ? (
            <div className="marco mb-3 flex w-fit flex-col gap-2 bg-crema p-3">
              <p className="font-bold">
                Llega al mezzanine el {fechaCorta(producto.llegada)}
              </p>
              <Cuenta llegada={producto.llegada} />
            </div>
          ) : null}
          <AccionesProducto producto={producto} />
        </div>
      </section>

      <div className="grow border-t-3 border-tinta bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-7 lg:py-10">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
            <section>
              <h2 className="font-display text-xl text-rojo">De qué se trata</h2>
              {producto.descripcion ? (
                <p className="mt-2 leading-relaxed">{producto.descripcion}</p>
              ) : null}
              {datosDeCarta.length > 0 ? (
                <dl className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 text-[15px]">
                  {datosDeCarta.map(({ rotulo, valor }) => (
                    <Fragment key={rotulo}>
                      <dt className="font-bold">{rotulo}</dt>
                      <dd>{valor}</dd>
                    </Fragment>
                  ))}
                </dl>
              ) : null}
            </section>
            <section>
              <h2 className="mb-2 font-display text-xl text-rojo">
                Cómo te llega
              </h2>
              {ENVIOS.map((envio, indice) => (
                <div
                  key={envio.id}
                  className={`flex justify-between gap-4 py-2.5 text-[15px] ${
                    indice < ENVIOS.length - 1 ? "border-b-2 border-tinta" : ""
                  }`}
                >
                  <span>{envio.nombre}</span>
                  <span className="font-bold whitespace-nowrap">
                    {envio.precioAparte
                      ? envio.precioAparte
                      : envio.pideDireccion
                        ? `Desde ${colones(TARIFA_CORREOS.gam.primerKilo)}`
                        : "Gratis"}
                  </span>
                </div>
              ))}
              <p className="mt-2 text-sm text-gris">
                Correos va gratis en compras desde {colones(ENVIO_GRATIS_DESDE)}.
              </p>
            </section>
          </div>

          {relacionados.length > 0 ? (
            <section className="flex flex-col gap-5">
              <h2 className="font-display text-[22px] text-rojo">
                También te puede gustar
              </h2>
              <RejillaProductos productos={relacionados} />
            </section>
          ) : null}

          <VistosRecientes slug={producto.slug} />
        </div>
      </div>
    </>
  );
}
