import type { Metadata } from "next";
import { Deke } from "@/components/Deke";
import { CabeceraPagina, ZonaBlanca } from "@/components/Estructura";
import { CalculadoraVenta } from "@/components/Vender";

export const metadata: Metadata = {
  title: "Vendenos tus cartas",
  description:
    "Te compramos cartas y colecciones de Pokémon. Calculá tu oferta y mandanos fotos.",
};

const PASOS = [
  { titulo: "Mandás fotos", texto: "Por WhatsApp, de frente y de espaldas." },
  { titulo: "Te damos precio", texto: "Te respondemos con una oferta clara." },
  { titulo: "Te pagamos", texto: "Por SINPE o en crédito de tienda, que rinde más." },
];

export default function PaginaVender() {
  return (
    <>
      <CabeceraPagina
        titulo="Vendenos tus cartas"
        texto="¿Tenés cartas guardadas en un cajón? Acá tienen mejor futuro."
      />
      <ZonaBlanca>
        <div className="flex flex-col gap-10">
          <CalculadoraVenta />
          <section className="flex flex-col gap-4">
            <h2 className="font-display text-[22px] text-rojo md:text-3xl">
              Así funciona
            </h2>
            <ol className="grid gap-4 md:grid-cols-3">
              {PASOS.map((paso, indice) => (
                <li key={paso.titulo} className="marco flex gap-3 p-3">
                  <span className="flex size-10 shrink-0 -rotate-3 items-center justify-center rounded-md border-2 border-tinta bg-azul font-display text-xl text-white">
                    {indice + 1}
                  </span>
                  <div>
                    <h3 className="font-extrabold">{paso.titulo}</h3>
                    <p className="text-[15px] leading-snug">{paso.texto}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
          <div className="flex items-center gap-3">
            <Deke animo="guino" className="deke h-20 shrink-0" />
            <p className="max-w-lg font-medium">
              También compramos colecciones enteras y producto sellado. Lo que
              entra aquí, Deke lo revisa con lupa.
            </p>
          </div>
        </div>
      </ZonaBlanca>
    </>
  );
}
