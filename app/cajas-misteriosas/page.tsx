import type { Metadata } from "next";
import Link from "next/link";
import { Pasos, Preguntas } from "@/components/ComoSirve";
import { Deke } from "@/components/Deke";
import { CabeceraPagina, ZonaBlanca } from "@/components/Estructura";
import { FotoProducto } from "@/components/FotoProducto";
import { Linea } from "@/components/VistaCarrito";
import {
  CAJAS_MISTERIOSAS,
  EJEMPLO_MEDIANA,
  buscarCajaMisteriosa,
} from "@/lib/cajas-misteriosas";
import { colones } from "@/lib/formato";
import { buscarProducto } from "@/lib/productos";

export const metadata: Metadata = {
  title: "Cajas misteriosas",
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
  const ejemplo = EJEMPLO_MEDIANA.flatMap(({ slug, cantidad }) => {
    const producto = buscarProducto(slug);
    return producto ? [{ producto, cantidad }] : [];
  });
  const totalEjemplo = ejemplo.reduce(
    (suma, { producto, cantidad }) => suma + producto.precio * cantidad,
    0,
  );
  const mediana = buscarProducto("caja-misteriosa-mediana");
  const reglaMediana = buscarCajaMisteriosa("caja-misteriosa-mediana");

  return (
    <>
      <CabeceraPagina
        titulo="Cajas misteriosas"
        texto="No sabés qué traen, pero sí lo mínimo que valen."
      />
      <ZonaBlanca>
        <div className="flex flex-col gap-10">
          <Pasos titulo="Cómo funcionan" pasos={PASOS} />

          <section className="flex flex-col gap-4">
            <h2 className="font-display text-[22px] text-rojo md:text-3xl">
              Escogé tu caja
            </h2>
            <div className="grid gap-5 md:grid-cols-3">
              {CAJAS_MISTERIOSAS.map((caja) => {
                const producto = buscarProducto(caja.slug);
                if (!producto) return null;
                return (
                  <article
                    key={caja.slug}
                    className="marco shadow-dura flex flex-col gap-3 bg-crema p-4"
                  >
                    <div className="caja-sorpresa relative h-44">
                      <FotoProducto
                        producto={producto}
                        alt={producto.nombre}
                        sizes="(min-width: 768px) 33vw, 100vw"
                      />
                    </div>
                    <h3 className="font-display text-xl leading-tight text-azul">
                      {producto.nombre}
                    </h3>
                    <p className="text-[28px] leading-none font-extrabold">
                      {colones(producto.precio)}
                    </p>
                    <p className="w-fit -rotate-1 rounded-md border-2 border-tinta bg-amarillo px-2 py-0.5 text-sm font-bold">
                      Vale mínimo {colones(caja.valorMinimo)}
                    </p>
                    <div className="grow">
                      <p className="font-bold">Trae siempre:</p>
                      <ul className="mt-1 list-disc pl-5 text-[15px] leading-snug">
                        {caja.trae.map((cosa) => (
                          <li key={cosa}>{cosa}</li>
                        ))}
                      </ul>
                    </div>
                    <Link
                      href={`/producto/${producto.slug}`}
                      className="boton boton-rojo boton-chico"
                    >
                      Ver esta caja
                    </Link>
                  </article>
                );
              })}
            </div>
          </section>

          <div className="grid gap-8 lg:grid-cols-2">
            <section className="flex flex-col gap-3">
              <h2 className="font-display text-[22px] text-rojo md:text-3xl">
                Así se saca la cuenta
              </h2>
              <div className="marco flex flex-col gap-1.5 p-4">
                <p className="mb-1 text-sm text-gris">
                  Una Mediana de ejemplo. La tuya puede traer otras cosas.
                </p>
                {ejemplo.map(({ producto, cantidad }) => (
                  <Linea
                    key={producto.slug}
                    rotulo={`${cantidad} × ${producto.nombre}`}
                    monto={colones(producto.precio * cantidad)}
                  />
                ))}
                <div className="mt-1 flex flex-col gap-1 border-t-2 border-tinta pt-2">
                  <Linea rotulo="Valor de la caja" monto={colones(totalEjemplo)} fuerte />
                  {mediana ? (
                    <Linea rotulo="Pagaste" monto={colones(mediana.precio)} />
                  ) : null}
                  {reglaMediana ? (
                    <Linea
                      rotulo="Mínimo prometido"
                      monto={colones(reglaMediana.valorMinimo)}
                    />
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Deke animo="guino" className="deke h-20 shrink-0" />
                <p className="font-medium">
                  Nada de relleno: ni cartas dañadas ni montones de comunes.
                </p>
              </div>
            </section>
            <Preguntas titulo="Lo que siempre preguntan" preguntas={PREGUNTAS} />
          </div>
        </div>
      </ZonaBlanca>
    </>
  );
}
