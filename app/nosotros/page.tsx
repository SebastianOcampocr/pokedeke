import type { Metadata } from "next";
import Link from "next/link";
import { Deke } from "@/components/Deke";
import {
  BotonGrupo,
  CabeceraPagina,
  ZonaBlanca,
} from "@/components/Estructura";
import { LEMA, LUGAR, TIENDA } from "@/lib/tienda";

export const metadata: Metadata = {
  alternates: { canonical: "/nosotros" },
  title: "El Mezzanine",
  description: `La historia de ${TIENDA.nombre} y dónde retirar tu pedido en el ${LUGAR.nombre}.`,
};

const PROMESAS = [
  {
    titulo: "Si dice quedan 2, quedan 2",
    texto: "Lo que ves en la página es lo que tenemos en el mezzanine.",
  },
  {
    titulo: "Todo en colones",
    texto: "El precio que ves es el que pagás. El envío se suma antes de confirmar.",
  },
  {
    titulo: "Trato de persona a persona",
    texto: "¿Alguna duda? Escribinos por WhatsApp y te contesta alguien de aquí.",
  },
];

const PREGUNTAS = [
  {
    pregunta: "¿Tienen tienda física?",
    respuesta: `Todavía no: somos una tienda en línea. Entregamos en persona en el ${LUGAR.nombre}, ${LUGAR.zona}, con cita por WhatsApp, y enviamos a todo el país. Tener un local es el plan para más adelante.`,
  },
  {
    pregunta: "¿Dónde retiro mi pedido?",
    respuesta: `En el ${LUGAR.nombre}, ${LUGAR.zona}. No es una tienda abierta al público: cuadramos día y hora por WhatsApp y te lo entregamos ahí. El retiro es gratis.`,
  },
  {
    pregunta: "¿Hacen envíos?",
    respuesta:
      "Sí, por Correos de Costa Rica a todo el país o con envío entre tiendas a la tienda que nos digás. El de Correos se calcula en el carrito. El envío entre tiendas cuesta de ₡600 a ₡900 según la tienda y se paga en el mismo SINPE; si tu tienda no está en la lista, te confirmamos el precio por WhatsApp. Lo paga quien compra. Los envíos salen los Miércoles y Sábados: lo que pedís de Sábado a Martes sale el Miércoles, y de Miércoles a Viernes, el Sábado.",
  },
  {
    pregunta: "¿Cómo pago?",
    respuesta:
      "Por SINPE Móvil o transferencia: al terminar la compra te damos el monto exacto y nos mandás el comprobante. Si al pagar ves la opción, también podés pagar con tarjeta de débito o crédito por medio de PayPal, en dólares, y el pedido queda confirmado de una vez.",
  },
  {
    pregunta: "¿Cuánto tiempo tengo para pagar?",
    respuesta:
      "24 horas desde que hacés el pedido. Si no entra el pago en ese plazo, el pedido se cancela y el producto vuelve a quedar disponible.",
  },
  {
    pregunta: "¿Qué significa Disponible, En camino y Por consultar?",
    respuesta:
      "Disponible es lo que tenemos en el mezzanine: lo comprás y te lo mandamos. En camino es algo que ya compramos y todavía no nos llega: no se puede comprar aún, pero podés pedir que te avisemos. Por consultar es algo que no tenemos y que podemos buscar, aquí o en Estados Unidos: nos consultás, revisamos y te confirmamos disponibilidad y precio antes de que pagués nada.",
  },
  {
    pregunta: "¿Hacen apartados o preventas?",
    respuesta:
      "Por ahora no: ni apartados, ni adelantos, ni pagos en tractos. Si buscás algo que no está en la página, pedilo en Pokedeke Busca y revisamos si lo podemos conseguir.",
  },
  {
    pregunta: "¿Por qué algunos productos cuestan más?",
    respuesta:
      "Productos como las Ultra Premium Collection, las ETB de Pokémon Center o algunas cartas casi no se consiguen y tienen mucha demanda, así que su precio está alto en todas partes, también en Estados Unidos. Hacemos lo posible por conseguirlos al mejor precio, y las cartas sueltas las comparamos con el precio de mercado de TCGplayer.",
  },
  {
    pregunta: "¿Solo venden Pokémon?",
    respuesta:
      "Por ahora sí, y le estamos poniendo toda la energía. One Piece, Magic y otros vienen en camino.",
  },
];

export default function PaginaNosotros() {
  return (
    <>
      <CabeceraPagina titulo="El Mezzanine" texto={`${LEMA}.`} />
      <ZonaBlanca>
        <div className="flex flex-col gap-12">
          <section className="grid items-center gap-6 md:grid-cols-[minmax(0,1fr)_220px] md:gap-10">
            <div className="flex max-w-2xl flex-col gap-3 text-[17px] leading-relaxed">
              <h2 className="font-display text-[22px] text-rojo md:text-3xl">
                Cómo arrancó esto
              </h2>
              <p>
                {TIENDA.nombre} nació de dos personas a las que Pokémon les
                apasiona desde siempre. Entre sobres abiertos, cajas y
                colecciones, las cartas se fueron acumulando hasta llenar el
                mezzanine, y nos sobraban muchas.
              </p>
              <p>
                En Octubre de 2026 empezamos a venderlas por los grupos de
                WhatsApp y Facebook de TCG Costa Rica, y de ahí salió la tienda:
                un lugar para que esas cartas lleguen a quien las va a
                disfrutar.
              </p>
              <p>
                Hicimos esta página para que tengás todo a mano: qué hay, cuánto
                cuesta y cuántos quedan, sin andar preguntando en el grupo.
              </p>
              <p>
                Sí, leíste bien: mezzanine. Aquí no hay bodega ni montacargas,
                pero sí una carta con patas que se llama Deke y se toma el
                trabajo muy en serio.
              </p>
            </div>
            <Deke animo="feliz" className="deke mx-auto h-44 md:h-56" />
          </section>

          <section className="marco shadow-dura flex flex-col gap-3 bg-crema p-5 md:p-7">
            <h2 className="font-display text-[22px] text-azul md:text-3xl">
              Dónde estamos
            </h2>
            <p className="text-[17px] leading-snug">
              <strong>
                {LUGAR.nombre}, {LUGAR.zona}.
              </strong>{" "}
              Ahí entregamos los pedidos y ahí tenemos todo el producto, en
              nuestro mezzanine. Cuadramos día y hora por WhatsApp.
            </p>
            <a
              href={LUGAR.mapa}
              target="_blank"
              rel="noreferrer"
              className="boton boton-azul w-full md:w-fit"
            >
              Ver en Google Maps
            </a>
          </section>

          <section className="flex flex-col gap-5">
            <h2 className="font-display text-[22px] text-rojo md:text-3xl">
              Lo que te prometemos
            </h2>
            <div className="grid gap-5 md:grid-cols-3">
              {PROMESAS.map((promesa) => (
                <div key={promesa.titulo} className="marco p-4">
                  <h3 className="text-lg leading-tight font-extrabold">
                    {promesa.titulo}
                  </h3>
                  <p className="mt-1 text-[15px] leading-snug">{promesa.texto}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="flex max-w-3xl flex-col gap-4">
            <h2 className="font-display text-[22px] text-rojo md:text-3xl">
              Preguntas de siempre
            </h2>
            <div className="flex flex-col gap-3">
              {PREGUNTAS.map((item) => (
                <details key={item.pregunta} className="pregunta marco">
                  <summary>{item.pregunta}</summary>
                  <p>{item.respuesta}</p>
                </details>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <p className="text-[17px] font-medium">
              ¿Querés enterarte primero de lo que entra?
            </p>
            <div className="flex flex-col gap-3 md:flex-row">
              <BotonGrupo className="w-full md:w-fit" />
              <Link href="/catalogo" className="boton boton-amarillo w-full md:w-fit">
                Ver el catálogo
              </Link>
            </div>
          </section>
        </div>
      </ZonaBlanca>
    </>
  );
}
