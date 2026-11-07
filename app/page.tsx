import Link from "next/link";
import type { CSSProperties } from "react";
import { BotonGrupo, Cinta } from "@/components/Estructura";
import { FotoProducto } from "@/components/FotoProducto";
import { Deke } from "@/components/Deke";
import { Letrero } from "@/components/Letrero";
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
  esPreventa,
  novedadesVariadas,
  type Producto,
} from "@/lib/productos";
import { LEMA } from "@/lib/tienda";

function Seccion({
  titulo,
  enlace,
  productos,
}: {
  titulo: string;
  enlace: string;
  productos: Producto[];
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
      <RejillaProductos productos={productos} />
    </section>
  );
}

const PIEZAS_HERO = [
  {
    clase: "size-[min(27vw,7rem)] -rotate-6 lg:size-36 xl:size-40",
    retraso: "650ms",
    k: "22px",
  },
  {
    clase: "z-10 size-[min(36vw,9rem)] rotate-2 lg:size-48 xl:size-56",
    retraso: "800ms",
    k: "10px",
  },
  {
    clase: "size-[min(27vw,7rem)] rotate-6 lg:size-36 xl:size-44",
    retraso: "950ms",
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
                sizes="(min-width: 1024px) 224px, 144px"
                prioridad
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
  const recientes = novedadesVariadas(4);
  const hayCartas = cartasSueltas().length > 0;

  return (
    <>
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
            style={{ animationDelay: "520ms" }}
          >
            Todo lo de Pokémon TCG en colones. Retirá en el Edificio Omni o te
            lo mandamos por Correos a todo el país.
          </p>
          <div className="aparecer" style={{ animationDelay: "620ms" }}>
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
        </div>
      </div>

      <Vitrina />
      <ElMezzanine />

      <div className="bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-8 md:py-10">
          <SeViene />
          <Seccion
            titulo="Preventas"
            enlace="/catalogo?etiqueta=Preventa"
            productos={preventas}
          />
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
