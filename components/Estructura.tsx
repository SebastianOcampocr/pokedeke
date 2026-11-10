import Link from "next/link";
import {
  categoriasConProducto,
} from "@/lib/productos";
import {
  ENLACE_GRUPO,
  INSTAGRAM,
  LEMA,
  LUGAR,
  TIENDA,
  TIENDA_ABIERTA,
  VENDER_ABIERTO,
} from "@/lib/tienda";
import { BotonCarrito } from "./BotonCarrito";
import { EnlaceFavoritos } from "./BotonFavorito";
import { Buscador } from "./Buscador";
import { Deke } from "./Deke";
import { IconoChat } from "./Iconos";
import { Revelar } from "./Revelar";

const ENLACES = [
  { href: "/catalogo", texto: "Catálogo" },
  { href: "/sobre", texto: "Sobre del día" },
  { href: "/caja-compartida", texto: "Caja compartida" },
  { href: "/busca", texto: "Lo buscamos" },
  { href: "/guia", texto: "Guía" },
  { href: "/nosotros", texto: "El Mezzanine" },
];

function LogoAnimado() {
  return (
    <span aria-hidden="true">
      {[...TIENDA.nombre].map((letra, indice) => (
        <span
          key={indice}
          className="logo-letra"
          style={{ "--i": indice } as React.CSSProperties}
        >
          {letra}
        </span>
      ))}
    </span>
  );
}

export function Encabezado() {
  return (
    <>
      {TIENDA_ABIERTA ? null : (
        <p className="relative z-10 bg-tinta px-4 py-1.5 text-center text-xs font-medium text-white">
          Demo: los pedidos son de prueba. No se cobra nada.
        </p>
      )}
      <header className="encabezado bg-amarillo">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 py-2 pr-2 pl-4">
          <Link href="/" aria-label={TIENDA.nombre} className="logo relative">
            <LogoAnimado />
          </Link>
          <nav aria-label="Principal" className="hidden gap-4 lg:flex xl:gap-5">
            {ENLACES.map((enlace) => (
              <Link
                key={enlace.href}
                href={enlace.href}
                className="min-h-11 min-w-11 content-center text-center text-sm font-bold whitespace-nowrap underline-offset-4 hover:underline xl:text-[15px]"
              >
                {enlace.texto}
              </Link>
            ))}
          </nav>
          <div className="flex gap-0.5">
            <Buscador />
            <EnlaceFavoritos />
            <BotonCarrito />
          </div>
        </div>
      </header>
      <div className="toldo" aria-hidden="true" />
    </>
  );
}

export function PiePagina() {
  return (
    <footer className="relative border-t-3 border-tinta bg-azul text-white">
      <span className="deke-paseo deke-camina" aria-hidden="true">
        <Deke className="w-full" />
      </span>
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 md:flex-row md:items-start md:justify-between">
        <div className="flex max-w-sm flex-col gap-2">
          <p className="font-display text-2xl">{TIENDA.nombre}</p>
          <p className="text-[15px] font-bold">{LEMA}</p>
          <p className="text-[15px] leading-snug">
            Tienda de Pokémon TCG en Costa Rica: cartas en colones, retiro en
            el {LUGAR.nombre}, San José, por Correos a todo el país o a la
            tienda que nos digás.
          </p>
          <p className="text-[15px]">
            Servicio al cliente:{" "}
            <a href={`mailto:${TIENDA.correo}`} className="font-bold underline underline-offset-2">
              {TIENDA.correo}
            </a>
          </p>
          <p className="text-[15px]">
            Instagram:{" "}
            <a
              href={INSTAGRAM.enlace}
              target="_blank"
              rel="noreferrer"
              className="font-bold underline underline-offset-2"
            >
              @{INSTAGRAM.usuario}
            </a>
          </p>
        </div>
        <nav aria-label="Ayuda" className="grid grid-cols-2 gap-x-8">
          <Link href="/nosotros" className="min-h-11 content-center underline-offset-4 hover:underline">
            El Mezzanine
          </Link>
          <Link href="/sobre" className="min-h-11 content-center underline-offset-4 hover:underline">
            Sobre del día
          </Link>
          <Link href="/caja-compartida" className="min-h-11 content-center underline-offset-4 hover:underline">
            Caja compartida
          </Link>
          <Link href="/cajas-misteriosas" className="min-h-11 content-center underline-offset-4 hover:underline">
            Cajas misteriosas
          </Link>
          <Link href="/cedula" className="min-h-11 content-center underline-offset-4 hover:underline">
            Cédula de Coleccionista
          </Link>
          {VENDER_ABIERTO ? (
            <Link href="/vender" className="min-h-11 content-center underline-offset-4 hover:underline">
              Vendenos tus cartas
            </Link>
          ) : null}
          <Link href="/busca" className="min-h-11 content-center underline-offset-4 hover:underline">
            Pokedeke Busca
          </Link>
          <Link href="/guia" className="min-h-11 content-center underline-offset-4 hover:underline">
            Guía de Deke
          </Link>
          <Link href="/pedido" className="min-h-11 content-center underline-offset-4 hover:underline">
            Ver mi pedido
          </Link>
          <Link href="/comentarios" className="min-h-11 content-center underline-offset-4 hover:underline">
            Danos tu opinión
          </Link>
          <Link href="/politicas#envios" className="min-h-11 content-center underline-offset-4 hover:underline">
            Envíos
          </Link>
          <Link href="/politicas#cambios" className="min-h-11 content-center underline-offset-4 hover:underline">
            Cambios y devoluciones
          </Link>
          <Link href="/politicas#terminos" className="min-h-11 content-center underline-offset-4 hover:underline">
            Términos
          </Link>
          <Link href="/politicas#privacidad" className="min-h-11 content-center underline-offset-4 hover:underline">
            Privacidad
          </Link>
        </nav>
      </div>
    </footer>
  );
}

/** Título sobre el amarillo, igual en todas las páginas interiores. */
export function CabeceraPagina({
  titulo,
  texto,
}: {
  titulo: string;
  texto?: string;
}) {
  return (
    <section className="mx-auto w-full max-w-6xl overflow-x-clip px-4 pt-2 pb-6">
      <h1 className="sello w-fit origin-left font-display text-[34px] leading-none text-azul max-[319px]:text-[25px] md:text-5xl">
        {titulo}
      </h1>
      {texto ? (
        <p className="mt-2 max-w-xl text-[17px] leading-snug font-medium">
          {texto}
        </p>
      ) : null}
    </section>
  );
}

/** Zona blanca de contenido, con la raya negra del rótulo arriba. */
/**
 * `alta`: para páginas que se llenan en el navegador (carrito, pago, lista).
 * Reserva espacio para que el pie de página no salte cuando aparece el contenido.
 */
export function ZonaBlanca({
  children,
  alta = false,
}: {
  children: React.ReactNode;
  alta?: boolean;
}) {
  return (
    <div className="grow border-t-3 border-tinta bg-white">
      <div
        className={`mx-auto max-w-6xl px-4 pt-6 pb-14 md:pt-8 ${alta ? "min-h-[70svh]" : ""}`}
      >
        {children}
      </div>
    </div>
  );
}

const CINTA = [
  LEMA,
  ...categoriasConProducto().map(({ texto }) => texto),
  "Retiro en Edificio Omni",
  "Correos a todo el país",
  "Envío entre tiendas",
  "Envío gratis desde ₡50 000",
  "Pagá con SINPE Móvil",
  "Pagá con tarjeta",
  "Si no está, lo buscamos",
];

function TiraCinta() {
  return (
    <div className="flex shrink-0 items-center">
      {CINTA.map((texto) => (
        <span key={texto} className="flex items-center">
          <span className="px-5 font-display text-[15px] whitespace-nowrap">
            {texto}
          </span>
          <span className="size-2.5 rotate-45 bg-amarillo" />
        </span>
      ))}
    </div>
  );
}

/** Cinta de letrero que corre sola. Es adorno: repite lo que ya dice la página. */
export function Cinta() {
  return (
    <div className="cinta" aria-hidden="true">
      <div className="cinta-pista">
        <TiraCinta />
        <TiraCinta />
      </div>
    </div>
  );
}

export function BotonGrupo({ className = "" }: { className?: string }) {
  return (
    <a
      href={ENLACE_GRUPO}
      target="_blank"
      rel="noreferrer"
      className={`boton boton-verde ${className}`}
    >
      <IconoChat tamano={22} />
      Unirme al grupo de WhatsApp
    </a>
  );
}
