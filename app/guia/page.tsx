import type { Metadata } from "next";
import Link from "next/link";
import { CabeceraPagina, ZonaBlanca } from "@/components/Estructura";
import { Escoger } from "@/components/Escoger";
import { FotoProducto } from "@/components/FotoProducto";
import { Revelar } from "@/components/Revelar";
import { buscarProducto } from "@/lib/productos";

export const metadata: Metadata = {
  title: "Guía",
  description:
    "Qué es un sobre, una ETB o una booster box, y qué regalarle a quien ama Pokémon.",
};

const GLOSARIO = [
  {
    titulo: "Sobre",
    categoria: "Booster pack",
    slug: "sobre-perfect-order",
    texto: "Unas 10 cartas al azar. Lo más barato para probar suerte.",
    ideal: "Un detalle o un antojo",
  },
  {
    titulo: "Blister",
    categoria: "Blister / sleeved booster",
    slug: "blister-3-sobres-perfect-order",
    texto: "Tres sobres y una carta promocional asegurada.",
    ideal: "Un regalo pequeño",
  },
  {
    titulo: "Booster bundle",
    categoria: "Booster bundle",
    slug: "booster-bundle-ascended-heroes",
    texto: "Seis sobres en un paquete, sin nada más. Listo para abrir de una.",
    ideal: "Abrir varios de un solo",
  },
  {
    titulo: "ETB",
    categoria: "ETB",
    slug: "etb-ascended-heroes",
    texto:
      "Elite Trainer Box: la caja completa, con sobres, fundas, dados y separadores.",
    ideal: "El regalo que nunca falla",
  },
  {
    titulo: "Booster box",
    categoria: "Booster box",
    slug: "booster-box-chaos-rising",
    texto: "La caja de la tienda: 36 sobres. Las japonesas suelen traer 30.",
    ideal: "Coleccionistas o abrir con los compas",
  },
  {
    titulo: "Tin",
    categoria: "Tin o caja de colección",
    slug: "tin-mega-charizard",
    texto: "Lata de colección con sobres. Después sirve para guardar cartas.",
    ideal: "Regalar y que dure",
  },
  {
    titulo: "Mazo",
    categoria: "Mazos",
    slug: "battle-deck-mega-lucario-ex",
    texto: "60 cartas listas para jugar, sin tener que armar nada.",
    ideal: "Aprender a jugar",
  },
  {
    titulo: "Sleeves",
    categoria: "Sleeves y fundas",
    slug: "sleeves-poke-ball",
    texto:
      "Fundas plásticas para cada carta. Un mazo lleva 60 cartas, por eso vienen de 65 o más.",
    ideal: "Proteger un mazo o una carta buena",
  },
  {
    titulo: "Carta suelta",
    categoria: "Carta suelta (single)",
    slug: "pikachu-carta-suelta",
    texto: "Una carta específica: sabés exactamente lo que estás comprando.",
    ideal: "Completar la colección",
  },
  {
    titulo: "Carta gradada",
    categoria: "Carta gradada",
    slug: "charizard-ex-gradada-10",
    texto:
      "Una empresa la revisa, le pone nota del 1 al 10 y la sella en un estuche.",
    ideal: "Piezas de colección",
  },
];

const CONDICIONES = [
  { sigla: "Near Mint", texto: "Casi perfecta. Es como vienen nuestras sueltas." },
  { sigla: "Lightly Played", texto: "Detallitos mínimos, solo visibles de cerca." },
  { sigla: "Gradada 10", texto: "Nota máxima: la carta está impecable." },
];

export default function PaginaGuia() {
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
                const producto = buscarProducto(entrada.slug);
                if (!producto) return null;
                return (
                  <Revelar key={entrada.titulo} indice={indice}>
                    <Link
                      href={`/catalogo?categoria=${encodeURIComponent(entrada.categoria)}`}
                      className="marco tarjeta flex h-full gap-3 p-3"
                    >
                      <span className="brillo relative block h-28 w-24 shrink-0 overflow-hidden rounded-md bg-crema">
                        <FotoProducto
                          producto={producto}
                          alt=""
                          sizes="96px"
                          className="p-1"
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
                    </Link>
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
