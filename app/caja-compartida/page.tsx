import type { Metadata } from "next";
import { TableroCaja } from "@/components/CajaCompartida";
import { Pasos, Preguntas } from "@/components/ComoSirve";
import { Cuenta } from "@/components/Cuenta";
import { Deke } from "@/components/Deke";
import { CabeceraPagina, ZonaBlanca } from "@/components/Estructura";
import { FotoProducto } from "@/components/FotoProducto";
import { CAJA_COMPARTIDA, CUPO_COMPARTIDA } from "@/lib/caja-compartida";
import { colones, fechaCorta } from "@/lib/formato";
import { buscarProducto } from "@/lib/productos";

export const metadata: Metadata = {
  title: "Caja compartida",
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
      "Cuando se apartan los 36, o llega la fecha, cerramos la caja. Si no se llena, te devolvemos la plata.",
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
      "Claro. Entre más sobres, más cartas. Podés apartar los que queden libres.",
  },
];

export default function PaginaCajaCompartida() {
  const caja = buscarProducto(CAJA_COMPARTIDA.caja);
  const sobreSuelto = buscarProducto("sobre-chaos-rising");
  if (!caja || !sobreSuelto) return null;
  const libres = CAJA_COMPARTIDA.sobres - CAJA_COMPARTIDA.ocupados.length;

  const cuentas = [
    { rotulo: "La caja completa", monto: caja.precio },
    { rotulo: "Un sobre suelto", monto: sobreSuelto.precio },
  ];

  return (
    <>
      <CabeceraPagina
        titulo="Caja compartida"
        texto="Una caja trae 36 sobres. Comprás solo los que querás y la abrimos en vivo entre todos."
      />
      <ZonaBlanca>
        <div className="flex flex-col gap-10">
          <Pasos titulo="Cómo sirve" pasos={PASOS} />

          <section className="marco shadow-dura grid gap-5 bg-crema p-5 md:grid-cols-[220px_minmax(0,1fr)] md:p-7">
            <div className="brillo brillo-solo relative h-48 md:h-full">
              <FotoProducto producto={caja} alt={caja.nombre} sizes="220px" />
            </div>
            <div className="flex flex-col gap-3">
              <p className="w-fit -rotate-1 rounded-md border-2 border-tinta bg-rojo px-2 py-0.5 text-sm font-bold text-white">
                En vivo el {fechaCorta(CAJA_COMPARTIDA.fecha)}, 7 p. m.
              </p>
              <h2 className="font-display text-[26px] leading-none text-azul md:text-4xl">
                {CAJA_COMPARTIDA.nombre}
              </h2>
              <p className="text-[17px] font-medium">
                <strong>{colones(CUPO_COMPARTIDA.precio)}</strong> cada sobre.
                Quedan {libres} de {CAJA_COMPARTIDA.sobres}.
              </p>
              <dl className="flex flex-wrap gap-x-6 gap-y-1 text-[15px]">
                {cuentas.map((cuenta) => (
                  <div key={cuenta.rotulo} className="flex gap-1.5">
                    <dt>{cuenta.rotulo}:</dt>
                    <dd className="font-bold">{colones(cuenta.monto)}</dd>
                  </div>
                ))}
              </dl>
              <Cuenta llegada={CAJA_COMPARTIDA.fecha} />
            </div>
          </section>

          <div className="grid gap-8 lg:grid-cols-2">
            <TableroCaja />
            <div className="flex flex-col gap-4">
              <Preguntas titulo="Lo que siempre preguntan" preguntas={PREGUNTAS} />
              <div className="flex items-center gap-3">
                <Deke animo="guino" className="deke h-20 shrink-0" />
                <p className="font-medium">
                  Yo abro los sobres frente a todos, sin cortes ni enredos.
                </p>
              </div>
            </div>
          </div>
        </div>
      </ZonaBlanca>
    </>
  );
}
