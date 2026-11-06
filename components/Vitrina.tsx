import Link from "next/link";
import { colones } from "@/lib/formato";
import { cartasSueltas } from "@/lib/productos";
import { Deke } from "./Deke";
import { FotoProducto } from "./FotoProducto";

/** Las cartas más caras, con foil: pasá el mouse o el dedo por encima. */
export function Vitrina() {
  const cartas = cartasSueltas().slice(-10).reverse();

  return (
    <section className="border-y-3 border-tinta bg-azul-oscuro text-white">
      <div className="mx-auto max-w-6xl pt-8">
        <div className="flex items-end justify-between gap-4 px-4">
          <div>
            <h2 className="font-display text-[26px] leading-none text-amarillo md:text-4xl">
              La vitrina
            </h2>
            <p className="mt-1 text-[15px] font-medium text-white">
              Pasá el dedo por encima y mirá cómo brillan.
            </p>
          </div>
          <Link
            href={`/catalogo?categoria=${encodeURIComponent("Carta suelta (single)")}`}
            className="min-h-11 content-center text-sm font-bold whitespace-nowrap text-amarillo underline underline-offset-4"
          >
            Ver todas
          </Link>
        </div>
        <div className="vitrina" tabIndex={0} aria-label="Cartas en vitrina">
          {cartas.map((carta) => (
            <Link
              key={carta.slug}
              href={`/producto/${carta.slug}`}
              className="block w-[150px] md:w-[178px]"
            >
              <div
                data-holo="foil"
                className="relative aspect-[5/7] overflow-hidden rounded-[4.5%/3.2%]"
              >
                <FotoProducto
                  producto={carta}
                  alt=""
                  sizes="178px"
                  className="mix-blend-normal"
                />
              </div>
              <p className="mt-2 truncate text-sm font-bold">
                {carta.nombre.replace(" (carta suelta)", "")}
              </p>
              <p className="font-extrabold text-amarillo">
                {colones(carta.precio)}
              </p>
            </Link>
          ))}
          <div className="flex w-[150px] flex-col items-center justify-center gap-2 text-center md:w-[178px]">
            <Deke animo="guino" className="deke h-24" />
            <p className="text-sm font-bold">
              Estas no se tocan sin permiso mío.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
