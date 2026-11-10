import type { Metadata } from "next";
import { Pasos, Preguntas } from "@/components/ComoSirve";
import { Deke } from "@/components/Deke";
import { BotonGrupo, CabeceraPagina, ZonaBlanca } from "@/components/Estructura";

export const metadata: Metadata = {
  title: "Caja compartida", alternates: { canonical: "/caja-compartida" },
  description:
    "Una caja trae 36 sobres. Comprá solo los que querás, la abrimos en vivo y lo que salga en tu sobre es tuyo.",
};

const PASOS = [
  {
    titulo: "Escogés tu sobre",
    texto:
      "La caja trae 36 sobres y cada número es uno de ellos. Agarrás uno o varios.",
  },
  {
    titulo: "Se llena la caja",
    texto:
      "Cuando se venden los 36, o llega la fecha, cerramos la caja. Si no se llena, te devolvemos la plata.",
  },
  {
    titulo: "La abrimos en vivo",
    texto:
      "Avisamos el link por el grupo de WhatsApp. Los sobres salen en orden: el primero es el 1 y el último, el 36.",
  },
  {
    titulo: "Te llevás lo tuyo",
    texto:
      "Todas las cartas de tu sobre son tuyas. Te las mandamos por Correos o las retirás en el Omni.",
  },
];

const PREGUNTAS = [
  {
    pregunta: "¿Qué pasa si no me sale nada bueno?",
    respuesta:
      "Igual te llevás tu sobre con todas sus cartas. Aquí no hay sorteo: cada número es un sobre y cada persona se lleva el suyo.",
  },
  {
    pregunta: "¿Y si no puedo ver el en vivo?",
    respuesta:
      "Queda grabado y te pasamos el video con el momento de tu sobre. Tus cartas te esperan igual.",
  },
  {
    pregunta: "¿Y si la caja no se llena?",
    respuesta:
      "Te devolvemos toda la plata por SINPE o pasás tus sobres a la siguiente caja. Vos escogés.",
  },
  {
    pregunta: "¿Puedo comprar varios sobres?",
    respuesta:
      "Claro. Entre más sobres, más cartas. Podés comprar los que queden libres.",
  },
];

export default function PaginaCajaCompartida() {
  return (
    <>
      <CabeceraPagina
        titulo="Caja compartida"
        texto="Próximamente: una caja trae 36 sobres. Comprás solo los que querás y la abrimos en vivo entre todos."
      />
      <ZonaBlanca>
        <div className="flex flex-col gap-10">
          <Pasos titulo="Cómo va a servir" pasos={PASOS} />
          <section className="marco shadow-dura flex flex-col gap-3 bg-crema p-5 md:p-7">
            <p className="w-fit -rotate-1 rounded-md border-2 border-tinta bg-rojo px-2 py-0.5 text-sm font-bold text-white">
              Próximamente
            </p>
            <h2 className="font-display text-[26px] leading-none text-azul md:text-4xl">
              Todavía no hay una caja abierta
            </h2>
            <p className="max-w-2xl text-[17px] font-medium">
              Cuando armemos la primera, avisamos por el grupo de WhatsApp con
              la fecha y el precio de cada sobre.
            </p>
            <BotonGrupo className="w-full md:w-fit" />
          </section>
          <Preguntas titulo="Lo que siempre preguntan" preguntas={PREGUNTAS} />
          <div className="flex items-center gap-3">
            <Deke animo="guino" className="deke h-20 shrink-0" />
            <p className="font-medium">
              Yo abro los sobres frente a todos, sin cortes ni enredos.
            </p>
          </div>
        </div>
      </ZonaBlanca>
    </>
  );
}
