import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BuscaDesdeEnlace } from "@/components/Busca";
import { CabeceraPagina, ZonaBlanca } from "@/components/Estructura";

export const metadata: Metadata = {
  alternates: { canonical: "/busca" },
  title: "Pokedeke Busca",
  description:
    "¿No encontrás un producto de Pokémon TCG en Costa Rica? Decinos cuál y lo buscamos por vos: te confirmamos disponibilidad y precio por WhatsApp.",
};

const PASOS = [
  {
    titulo: "Nos decís qué buscás",
    texto:
      "Una carta, una caja o un set. Entre más detalle, mejor: idioma, condición o un enlace.",
  },
  {
    titulo: "Lo buscamos",
    texto:
      "Revisamos si lo podemos conseguir y te escribimos por WhatsApp con disponibilidad y precio.",
  },
  {
    titulo: "Vos decidís",
    texto: "Si te sirve, lo pedís. Si no, no pasa nada: preguntar no cuesta.",
  },
];

const CLARO = [
  "No siempre se puede: si no lo conseguimos, te lo decimos de una vez.",
  "No pagás nada hasta que te confirmemos el precio.",
  "Por ahora buscamos solo productos de Pokémon TCG.",
];

export default function PaginaBusca() {
  return (
    <>
      <CabeceraPagina
        titulo="Pokedeke Busca"
        texto="¿No lo encontrás? Preguntale a Pokedeke."
      />
      <ZonaBlanca>
        <div className="flex max-w-3xl flex-col gap-10">
          <Suspense fallback={null}>
            <BuscaDesdeEnlace />
          </Suspense>

          <section className="flex flex-col gap-5">
            <h2 className="font-display text-[22px] text-rojo md:text-3xl">
              Cómo funciona
            </h2>
            <ol className="grid gap-5 md:grid-cols-3">
              {PASOS.map((paso, indice) => (
                <li key={paso.titulo} className="marco flex gap-3.5 bg-crema p-4">
                  <span className="flex size-12 shrink-0 -rotate-3 items-center justify-center rounded-md border-2 border-tinta bg-azul font-display text-2xl text-white">
                    {indice + 1}
                  </span>
                  <div>
                    <h3 className="text-lg font-extrabold">{paso.titulo}</h3>
                    <p className="text-[15px] leading-snug">{paso.texto}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-display text-[22px] text-rojo md:text-3xl">
              Para que quede claro
            </h2>
            <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[17px] leading-snug">
              {CLARO.map((linea) => (
                <li key={linea}>{linea}</li>
              ))}
            </ul>
            <Link href="/catalogo" className="boton boton-amarillo mt-2 w-full md:w-fit">
              Ver lo que ya tenemos
            </Link>
          </section>
        </div>
      </ZonaBlanca>
    </>
  );
}
