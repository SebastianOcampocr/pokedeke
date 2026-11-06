import Link from "next/link";
import { colones, fechaCorta } from "@/lib/formato";
import { esPreventa, PRODUCTOS, type Producto } from "@/lib/productos";
import { Cuenta } from "./Cuenta";
import { FotoProducto } from "./FotoProducto";

function porLlegada(a: Producto, b: Producto) {
  return (a.llegada ?? "").localeCompare(b.llegada ?? "");
}

/** Lo próximo que aterriza, con reloj para que dé ganas de apartar. */
export function SeViene() {
  const preventas = PRODUCTOS.filter(esPreventa).sort(porLlegada);
  const proxima = preventas[0];
  if (!proxima?.llegada) return null;
  const otras = preventas.filter((otra) => otra.slug !== proxima.slug).slice(0, 4);

  return (
    <section className="marco shadow-dura grid grid-cols-[minmax(0,1fr)] overflow-hidden bg-crema lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="flex min-w-0 flex-col gap-3 p-5 md:p-7">
        <p className="w-fit -rotate-1 rounded-md border-2 border-tinta bg-rojo px-2 py-0.5 text-sm font-bold text-white">
          Se viene
        </p>
        <h2 className="font-display text-[26px] leading-none break-words text-azul md:text-4xl">
          {proxima.nombre}
        </h2>
        <p className="font-medium">
          Llega el {fechaCorta(proxima.llegada)}. Apartá con 50%:{" "}
          <strong>{colones(Math.round(proxima.precio / 2))}</strong> hoy y el
          resto cuando aterrice.
        </p>
        <Cuenta llegada={proxima.llegada} />
        <Link
          href={`/producto/${proxima.slug}`}
          className="boton boton-rojo mt-1 w-full md:w-fit"
        >
          Apartar la mía
        </Link>
      </div>
      <div className="flex items-center gap-3 border-t-3 border-tinta bg-white p-4 lg:border-t-0 lg:border-l-3">
        <div className="brillo brillo-solo relative h-44 w-2/5 shrink-0 lg:h-64">
          <FotoProducto
            producto={proxima}
            alt=""
            sizes="(min-width: 1024px) 240px, 40vw"
          />
        </div>
        <ul className="flex min-w-0 grow flex-col gap-1">
          {otras.map((otra) => (
            <li key={otra.slug}>
              <Link
                href={`/producto/${otra.slug}`}
                className="block rounded-md px-2 py-1.5 hover:bg-crema"
              >
                <span className="block truncate text-[15px] font-bold">
                  {otra.nombre}
                </span>
                <span className="block text-[13px] text-gris">
                  {otra.llegada ? `Llega el ${fechaCorta(otra.llegada)}` : ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
