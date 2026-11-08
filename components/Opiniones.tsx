import Link from "next/link";
import { OPINIONES } from "@/lib/extras";
import { IconoCheque } from "./Iconos";
import { Revelar } from "./Revelar";

/**
 * Opiniones reales de clientes: solo las que la persona dejó mostrar y la
 * tienda marcó para publicar en la hoja. Sin ninguna, no sale nada.
 */
export function Opiniones() {
  if (OPINIONES.length === 0) return null;

  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <Revelar efecto="sello">
          <h2 className="font-display text-[22px] text-rojo md:text-3xl">
            Lo que dicen de nosotros
          </h2>
        </Revelar>
        <Link
          href="/comentarios"
          className="min-h-11 content-center text-sm font-bold whitespace-nowrap text-azul underline-offset-4 hover:underline"
        >
          Dejá tu opinión
        </Link>
      </div>
      <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {OPINIONES.slice(0, 6).map((opinion, indice) => (
          <li
            key={`${opinion.fecha}-${indice}`}
            className="marco flex flex-col gap-2 bg-white p-4"
          >
            {opinion.estrellas ? (
              <p
                aria-label={`${opinion.estrellas} de 5 estrellas`}
                className="text-xl leading-none text-[#e0a800]"
              >
                {"★".repeat(opinion.estrellas)}
                <span className="text-gris-medio">
                  {"★".repeat(5 - opinion.estrellas)}
                </span>
              </p>
            ) : null}
            <blockquote className="leading-snug">“{opinion.comentario}”</blockquote>
            <p className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-bold">
              {opinion.nombre || "Cliente"}
              {opinion.compra ? (
                <span className="inline-flex items-center gap-1 text-verde-oscuro">
                  <IconoCheque tamano={16} />
                  Compró en Pokedeke
                </span>
              ) : null}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
