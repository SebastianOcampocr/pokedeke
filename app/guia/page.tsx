import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CabeceraPagina, ZonaBlanca } from "@/components/Estructura";
import { Escoger } from "@/components/Escoger";
import { Revelar } from "@/components/Revelar";
import { categoriasConProducto } from "@/lib/productos";
import { RUTA_BASE } from "@/lib/tienda";

export const metadata: Metadata = {
  title: "Guía", alternates: { canonical: "/guia" },
  description:
    "Qué es un sobre, una ETB o una booster box, y qué regalarle a quien ama Pokémon.",
};

const GLOSARIO = [
  {
    titulo: "Sobre",
    categoria: "Booster pack",
    foto: "/productos/sobre-perfect-order.webp",
    texto: "Unas 10 cartas al azar. Lo más barato para probar suerte.",
    ideal: "Un detalle o un antojo",
  },
  {
    titulo: "Blister",
    categoria: "Blister / sleeved booster",
    foto: "/productos/blister-3-sobres-perfect-order.webp",
    texto: "Tres sobres y una carta promocional asegurada.",
    ideal: "Un regalo pequeño",
  },
  {
    titulo: "Booster bundle",
    categoria: "Booster bundle",
    foto: "/productos/booster-bundle-ascended-heroes.webp",
    texto: "Seis sobres en un paquete, sin nada más. Listo para abrir de una.",
    ideal: "Abrir varios de un solo",
  },
  {
    titulo: "ETB",
    categoria: "ETB",
    foto: "/productos/etb-ascended-heroes.webp",
    texto:
      "Elite Trainer Box: la caja completa, con sobres, fundas, dados y separadores.",
    ideal: "El regalo que nunca falla",
  },
  {
    titulo: "Booster box",
    categoria: "Booster box",
    foto: "/productos/booster-box-chaos-rising.webp",
    texto: "La caja de la tienda: 36 sobres. Las japonesas suelen traer 30.",
    ideal: "Coleccionistas o abrir con los compas",
  },
  {
    titulo: "Tin",
    categoria: "Tin o caja de colección",
    foto: "/productos/tin-mega-charizard.webp",
    texto: "Lata de colección con sobres. Después sirve para guardar cartas.",
    ideal: "Regalar y que dure",
  },
  {
    titulo: "Mazo",
    categoria: "Mazos",
    foto: "/productos/battle-deck-mega-lucario-ex.webp",
    texto: "60 cartas listas para jugar, sin tener que armar nada.",
    ideal: "Aprender a jugar",
  },
  {
    titulo: "Sleeves",
    categoria: "Sleeves y fundas",
    foto: "/productos/sleeves-poke-ball.webp",
    texto:
      "Fundas plásticas para cada carta. Un mazo lleva 60 cartas, por eso vienen de 65 o más.",
    ideal: "Proteger un mazo o una carta buena",
  },
  {
    titulo: "Carta suelta",
    categoria: "Carta suelta (single)",
    foto: "/productos/pikachu-carta-suelta.webp",
    texto: "Una carta específica: sabés exactamente lo que estás comprando.",
    ideal: "Completar la colección",
  },
  {
    titulo: "Carta gradada",
    categoria: "Carta gradada",
    foto: "/productos/charizard-ex-gradada-10.webp",
    texto:
      "Una empresa la revisa, le pone nota del 1 al 10 y la sella en un estuche.",
    ideal: "Piezas de colección",
  },
];

const CONDICIONES = [
  { sigla: "Near Mint", texto: "Casi perfecta." },
  { sigla: "Lightly Played", texto: "Detallitos mínimos, solo visibles de cerca." },
  { sigla: "Gradada 10", texto: "Nota máxima: la carta está impecable." },
];

export default function PaginaGuia() {
  const conStock = categoriasConProducto().map(({ categoria }) => categoria);

  return (
    <>
      <CabeceraPagina
        titulo="Guía de Deke"
        texto="¿No sabés qué es una ETB? ¿Tenés que hacer un regalo? Aquí te ayudamos."
      />
      <ZonaBlanca>
        <div className="flex flex-col gap-12">
          <Escoger />

          <section className="flex flex-col gap-5">
            <h2 className="font-display text-[22px] text-rojo md:text-3xl">
              Qué es cada cosa
            </h2>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {GLOSARIO.map((entrada, indice) => {
                const contenido = (
                  <>
                    <span className="brillo relative block h-28 w-24 shrink-0 overflow-hidden rounded-md bg-crema">
                      <Image
                        src={`${RUTA_BASE}${entrada.foto}`}
                        alt=""
                        fill
                        sizes="96px"
                        className="object-contain p-1 mix-blend-multiply"
                      />
                    </span>
                    <span className="flex flex-col gap-1">
                      <span className="text-lg leading-tight font-extrabold">
                        {entrada.titulo}
                      </span>
                      <span className="text-[15px] leading-snug">
                        {entrada.texto}
                      </span>
                      <span className="text-[13px] font-bold text-azul">
                        Ideal para: {entrada.ideal}
                      </span>
                    </span>
                  </>
                );
                return (
                  <Revelar key={entrada.titulo} indice={indice}>
                    {conStock.includes(entrada.categoria) ? (
                      <Link
                        href={`/catalogo?categoria=${encodeURIComponent(entrada.categoria)}`}
                        className="marco tarjeta flex h-full gap-3 p-3"
                      >
                        {contenido}
                      </Link>
                    ) : (
                      <div className="marco flex h-full gap-3 p-3">{contenido}</div>
                    )}
                  </Revelar>
                );
              })}
            </div>
          </section>

          <section className="flex max-w-3xl flex-col gap-4">
            <h2 className="font-display text-[22px] text-rojo md:text-3xl">
              Cómo leer la condición de una carta
            </h2>
            <dl className="flex flex-col gap-2">
              {CONDICIONES.map((condicion) => (
                <div key={condicion.sigla} className="marco p-3">
                  <dt className="font-extrabold">{condicion.sigla}</dt>
                  <dd className="text-[15px]">{condicion.texto}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </ZonaBlanca>
    </>
  );
}
