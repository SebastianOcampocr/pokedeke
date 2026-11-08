import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { BotonGrupo, Cinta } from "@/components/Estructura";
import { FotoProducto } from "@/components/FotoProducto";
import { Deke } from "@/components/Deke";
import { EncargoEEUU } from "@/components/EncargoEEUU";
import { Letrero } from "@/components/Letrero";
import { Opiniones } from "@/components/Opiniones";
import { ComoFunciona, ElMezzanine, QueBuscas } from "@/components/Marca";
import { Proximamente } from "@/components/Proximamente";
import { Revelar } from "@/components/Revelar";
import { SeViene } from "@/components/SeViene";
import { SobreDibujo } from "@/components/SobreDibujo";
import { SoloAqui } from "@/components/SoloAqui";
import { RejillaProductos } from "@/components/TarjetaProducto";
import { Vitrina } from "@/components/Vitrina";
import {
  cartasSueltas,
  categoriasConProducto,
  conFoto,
  destacados as elegirDestacados,
  disponibles,
  esPedidoEspecial,
  esPreventa,
  novedadesVariadas,
  type Producto,
} from "@/lib/productos";
import { masVistos } from "@/lib/extras";
import { LEMA, SITIO, TIENDA } from "@/lib/tienda";
import { DatosEstructurados } from "@/components/DatosEstructurados";

export const metadata: Metadata = { alternates: { canonical: "/" } };

function Seccion({
  titulo,
  enlace,
  productos,
  texto,
  children,
}: {
  titulo: string;
  enlace: string;
  productos: Producto[];
  texto?: string;
  /** Va debajo de los productos. */
  children?: ReactNode;
}) {
  if (productos.length === 0) return null;

  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <Revelar efecto="sello">
          <h2 className="font-display text-[22px] text-rojo md:text-3xl">
            {titulo}
          </h2>
        </Revelar>
        <Link
          href={enlace}
          className="min-h-11 content-center text-sm font-bold whitespace-nowrap text-azul underline-offset-4 hover:underline"
        >
          Ver todo
        </Link>
      </div>
      {texto ? (
        <p className="-mt-2 max-w-2xl leading-snug font-medium">{texto}</p>
      ) : null}
      <RejillaProductos productos={productos} />
      {children}
    </section>
  );
}

// La del centro es lo más grande de la pantalla al abrir: es la que mide
// Cloudflare (LCP). Por eso sale primero, baja con prioridad y las otras dos
// esperan. `sizes` es el ancho real de la foto (la caja menos el p-2), para no
// bajar la versión de 640 px en los celulares.
const PIEZAS_HERO = [
  {
    clase: "size-[min(27vw,7rem)] -rotate-6 lg:size-36 xl:size-40",
    sizes: "(min-width: 1280px) 144px, (min-width: 1024px) 128px, 96px",
    retraso: "300ms",
    k: "22px",
  },
  {
    clase: "z-10 size-[min(36vw,9rem)] rotate-2 lg:size-48 xl:size-56",
    sizes: "(min-width: 1280px) 208px, (min-width: 1024px) 176px, 128px",
    retraso: "150ms",
    k: "10px",
    prioridad: true,
  },
  {
    clase: "size-[min(27vw,7rem)] rotate-6 lg:size-36 xl:size-44",
    sizes: "(min-width: 1280px) 160px, (min-width: 1024px) 128px, 96px",
    retraso: "420ms",
    k: "30px",
  },
];

/** Los tres productos con foto de mayor precio: el del centro es el más caro. */
function VitrinaHero() {
  const [centro, ...otros] = elegirDestacados(99)
    .filter(conFoto)
    .slice(0, 3);
  const orden = [otros[0], centro, otros[1]];

  return (
    <div
      data-paralaje=""
      className="relative flex items-end justify-center -space-x-3 pt-2 max-[319px]:scale-[0.85]"
    >
      {PIEZAS_HERO.map((pieza, indice) => {
        const producto = orden[indice];
        if (!producto) return null;
        return (
          <Link
            key={producto.slug}
            href={`/producto/${producto.slug}`}
            aria-label={producto.nombre}
            style={
              { "--retraso": pieza.retraso, "--k": pieza.k } as CSSProperties
            }
            className={`repartir marco shadow-dura block overflow-hidden p-2 ${pieza.clase}`}
          >
            <span className="brillo brillo-solo relative block size-full">
              <FotoProducto
                producto={producto}
                alt=""
                sizes={pieza.sizes}
                prioridad={pieza.prioridad}
              />
            </span>
          </Link>
        );
      })}
      <Deke
        animo="guino"
        className="deke absolute -right-1 -bottom-6 z-20 h-14 lg:-right-3 lg:-bottom-9 lg:h-20"
      />
    </div>
  );
}

/** La invitación a abrir el sobre: lo más divertido de la página. */
function BandaSobre() {
  return (
    <Link
      href="/sobre"
      className="marco tarjeta group flex items-center gap-4 overflow-hidden bg-rojo p-4 text-white max-[319px]:flex-col max-[319px]:items-start md:gap-7 md:px-7"
    >
      <span className="brillo brillo-solo block w-20 shrink-0 -rotate-6 transition-transform group-hover:rotate-3 md:w-28">
        <SobreDibujo />
      </span>
      <span className="flex grow flex-col gap-1">
        <span className="font-display text-[22px] leading-none md:text-4xl">
          Abrí el sobre del día
        </span>
        <span className="text-[15px] leading-snug font-medium md:text-[17px]">
          Rasgalo, voltea las cartas y llená tu álbum.
        </span>
      </span>
      <span className="boton boton-amarillo hidden shrink-0 md:inline-flex">
        Probar suerte
      </span>
    </Link>
  );
}

export default function Inicio() {
  const destacados = elegirDestacados(8);
  const preventas = disponibles().filter(esPreventa).slice(0, 4);
  const especiales = disponibles().filter(esPedidoEspecial).slice(0, 4);
  const recientes = novedadesVariadas(4);
  // Sin repetir lo que ya sale más arriba.
  const vistos = masVistos(
    4,
    [...destacados, ...recientes].map((producto) => producto.slug),
  );
  const hayCartas = cartasSueltas().length > 0;

  return (
    <>
      <DatosEstructurados
        datos={{
          "@context": "https://schema.org",
          "@type": "Store",
          name: TIENDA.nombre,
          alternateName: [`${TIENDA.nombre} Store`, "Pokedeke TCG"],
          description: "Tienda de Pokémon TCG en Costa Rica: cartas sueltas, sobres, ETB y cajas en colones.",
          url: SITIO,
          logo: `${SITIO}/icon.svg`,
          email: TIENDA.correo,
          telephone: `+${TIENDA.whatsapp}`,
          currenciesAccepted: "CRC",
          paymentAccepted: "SINPE Móvil",
          areaServed: { "@type": "Country", name: "Costa Rica" },
          address: { "@type": "PostalAddress", addressLocality: "San José", addressCountry: "CR" },
        }}
      />
      <section className="relative mx-auto grid w-full max-w-6xl items-center gap-8 px-4 pt-[60px] pb-7 md:grid-cols-2 md:py-10">
        <div className="absolute top-2 right-4 z-10 [--mecate:26px] md:top-9 md:[--mecate:54px] lg:right-[46%]">
          <Letrero />
        </div>
        <div className="flex flex-col gap-3.5">
          <p className="aparecer w-fit -rotate-1 rounded-md border-2 border-tinta bg-azul px-2.5 py-1 text-sm font-bold text-white">
            {LEMA}
          </p>
          <h1 className="titulo-rotulo font-display text-[46px] leading-none text-azul lg:text-7xl">
            <span className="sello inline-block">Cartas,</span>{" "}
            <span
              className="sello inline-block"
              style={{ animationDelay: "170ms" }}
            >
              sobres
            </span>{" "}
            <span
              className="sello inline-block"
              style={{ animationDelay: "340ms" }}
            >
              y cajas
            </span>
          </h1>
          <p
            className="aparecer max-w-md text-[17px] leading-snug font-medium"
            style={{ animationDelay: "200ms" }}
          >
            Desde cartas de ₡500 hasta cajas que no se consiguen en Costa Rica.
            Pagás por SINPE Móvil y te lo mandamos a todo el país.
          </p>
          <div className="aparecer" style={{ animationDelay: "280ms" }}>
            <BotonGrupo className="w-full md:w-fit" />
          </div>
        </div>
        <VitrinaHero />
      </section>

      <Cinta />

      <div className="bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-6 md:py-10">
          <nav
            aria-label="Elegí una categoría"
            className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0"
          >
            {categoriasConProducto().map((atajo) => (
              <Link
                key={atajo.categoria}
                href={`/catalogo?categoria=${encodeURIComponent(atajo.categoria)}`}
                className="chip"
              >
                {atajo.texto}
              </Link>
            ))}
            <Link href="/catalogo" className="chip">
              Ver todo
            </Link>
          </nav>

          <Seccion
            titulo="Destacados"
            enlace="/catalogo"
            productos={destacados}
          />
          {hayCartas ? <BandaSobre /> : null}
          <SoloAqui />
          <QueBuscas />
          <Seccion
            titulo="Recién llegado"
            enlace="/catalogo"
            productos={recientes}
          />
          <Seccion
            titulo="Lo más visto"
            enlace="/catalogo"
            productos={vistos}
            texto="Lo que más está mirando la gente en la página."
          />
        </div>
      </div>

      <Vitrina />
      <ElMezzanine />

      <div className="bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-8 md:py-10">
          <SeViene />
          <Seccion
            titulo="Te lo traemos de Estados Unidos"
            enlace="/catalogo?etiqueta=Pedido%20especial"
            productos={especiales}
            texto="Lo que casi no se consigue en Costa Rica, lo importamos para vos. Apartalo pagando el 100%: si al final no lo podemos traer, te devolvemos todo."
          >
            <EncargoEEUU />
          </Seccion>
          <Seccion
            titulo="Preventas"
            enlace="/catalogo?etiqueta=Preventa"
            productos={preventas}
          />
          <Opiniones />
          <ComoFunciona />
          <Proximamente />
        </div>
      </div>

      <section className="border-t-3 border-tinta bg-amarillo">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 md:flex-row md:items-center md:justify-between">
          <h2 className="font-display text-[28px] leading-none text-azul">
            Lo nuevo sale primero en el grupo
          </h2>
          <BotonGrupo className="w-full md:w-fit" />
        </div>
      </section>
    </>
  );
}
