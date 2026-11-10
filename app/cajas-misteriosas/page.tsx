import type { Metadata } from "next";
import { Pasos, Preguntas } from "@/components/ComoSirve";
import { Deke } from "@/components/Deke";
import { BotonGrupo, CabeceraPagina, ZonaBlanca } from "@/components/Estructura";

export const metadata: Metadata = {
  title: "Cajas misteriosas", alternates: { canonical: "/cajas-misteriosas" },
  description:
    "No sabés qué traen, pero sí lo mínimo que valen. Deke las arma a mano y adentro viene la lista con el precio de cada cosa.",
};

const PASOS = [
  {
    titulo: "Escogés el tamaño",
    texto: "Cada caja dice qué trae siempre y cuánto vale como mínimo.",
  },
  {
    titulo: "Deke la arma a mano",
    texto:
      "Sumamos cada cosa al precio de la tienda. Si no llega al mínimo, se le agrega algo hasta que llegue.",
  },
  {
    titulo: "Te llega cerrada",
    texto: "Por Correos o en el retiro del Omni, sellada para que nadie te arruine la sorpresa.",
  },
  {
    titulo: "La abrís y sacás la cuenta",
    texto: "Adentro viene una lista con todo lo que trae y el precio de cada cosa.",
  },
];

const PREGUNTAS = [
  {
    pregunta: "¿Hay alguna caja premiada?",
    respuesta:
      "No. Todas las cajas de un mismo tamaño valen parecido, así que nadie paga para que a otra persona le salga el premio.",
  },
  {
    pregunta: "¿Y si ya tengo lo que me sale?",
    respuesta:
      "Escribinos antes de comprar y te decimos qué colecciones ya tenés cubiertas para no repetirte. Si igual te sale repetida, la podés cambiar en Vendenos tus cartas.",
  },
  {
    pregunta: "¿Y si viene algo dañado o falta algo?",
    respuesta: "Te lo reponemos. Por eso la lista va adentro de la caja.",
  },
  {
    pregunta: "¿Sirve para regalar?",
    respuesta:
      "Sí. Por fuera va cerrada y sin precios, y la lista va adentro. Si querés, la quitamos.",
  },
];

export default function PaginaCajasMisteriosas() {
  return (
    <>
      <CabeceraPagina
        titulo="Cajas misteriosas"
        texto="Próximamente: no sabés qué traen, pero sí lo mínimo que valen."
      />
      <ZonaBlanca>
        <div className="flex flex-col gap-10">
          <Pasos titulo="Cómo van a funcionar" pasos={PASOS} />
          <section className="marco shadow-dura flex flex-col gap-3 bg-crema p-5 md:p-7">
            <p className="w-fit -rotate-1 rounded-md border-2 border-tinta bg-rojo px-2 py-0.5 text-sm font-bold text-white">
              Próximamente
            </p>
            <h2 className="font-display text-[26px] leading-none text-azul md:text-4xl">
              Deke todavía las está armando
            </h2>
            <p className="max-w-2xl text-[17px] font-medium">
              Cuando salgan las primeras, avisamos por el grupo de WhatsApp.
            </p>
            <BotonGrupo className="w-full md:w-fit" />
          </section>
          <Preguntas titulo="Lo que siempre preguntan" preguntas={PREGUNTAS} />
          <div className="flex items-center gap-3">
            <Deke animo="guino" className="deke h-20 shrink-0" />
            <p className="font-medium">
              Nada de relleno: ni cartas dañadas ni montones de comunes.
            </p>
          </div>
        </div>
      </ZonaBlanca>
    </>
  );
}
