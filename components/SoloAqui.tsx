import Image from "next/image";
import Link from "next/link";
import { RUTA_BASE, VENDER_ABIERTO } from "@/lib/tienda";
import { Deke } from "./Deke";
import { Revelar } from "./Revelar";

function MiniCupos() {
  return (
    <span
      aria-hidden="true"
      className="grid w-[76px] shrink-0 grid-cols-4 gap-1"
    >
      {[1, 2, 3, 4, 5, 6, 7, 8].map((numero) => (
        <span
          key={numero}
          className={`flex aspect-square items-center justify-center rounded-sm border-2 border-tinta text-[10px] font-extrabold ${
            numero === 3 ? "bg-rojo text-white" : "bg-white text-tinta"
          }`}
        >
          {numero}
        </span>
      ))}
    </span>
  );
}

function MiniCedula() {
  return (
    <span
      aria-hidden="true"
      className="flex h-[58px] w-[86px] shrink-0 -rotate-3 flex-col overflow-hidden rounded-md border-2 border-tinta bg-crema"
    >
      <span className="h-3 bg-rojo" />
      <span className="flex items-center gap-1 p-1">
        <Deke className="h-8" />
        <span className="flex grow flex-col gap-1">
          <span className="h-1.5 rounded-sm bg-tinta" />
          <span className="h-1.5 w-2/3 rounded-sm bg-gris" />
        </span>
      </span>
    </span>
  );
}

function MiniCaja() {
  return (
    <span className="caja-sorpresa relative block size-[72px] shrink-0">
      <Image
        src={`${RUTA_BASE}/productos/caja-misteriosa-mediana.webp`}
        alt=""
        fill
        sizes="72px"
        className="object-contain mix-blend-multiply"
      />
    </span>
  );
}

function MiniMonedas() {
  return (
    <span
      aria-hidden="true"
      className="flex size-[64px] shrink-0 rotate-6 items-center justify-center rounded-full border-3 border-tinta bg-amarillo font-display text-3xl text-rojo"
    >
      ₡
    </span>
  );
}

const IDEAS = [
  {
    href: "/caja-compartida",
    titulo: "Caja compartida",
    texto: "Próximamente: una caja, 36 sobres, comprás el tuyo y la abrimos en vivo.",
    Arte: MiniCupos,
  },
  {
    href: "/cedula",
    titulo: "Cédula de Coleccionista",
    texto: "Sacá la tuya, juntá stickers y compartila.",
    Arte: MiniCedula,
  },
  {
    href: "/cajas-misteriosas",
    titulo: "Cajas misteriosas",
    texto: "Próximamente: no sabés qué traen, pero sí lo mínimo que valen.",
    Arte: MiniCaja,
  },
  ...(VENDER_ABIERTO
    ? [
        {
          href: "/vender",
          titulo: "Vendenos tus cartas",
          texto: "Calculá cuánto te damos por esa carta guardada.",
          Arte: MiniMonedas,
        },
      ]
    : []),
];

/** Lo que no hay en otra tienda: la razón para volver a Pokedeke. */
export function SoloAqui() {
  return (
    <section className="flex flex-col gap-5">
      <Revelar efecto="sello">
        <h2 className="font-display text-[22px] text-rojo md:text-3xl">
          Solo en Pokedeke
        </h2>
      </Revelar>
      <div className="grid gap-5 md:grid-cols-2">
        {IDEAS.map(({ href, titulo, texto, Arte }, indice) => (
          <Revelar key={href} indice={indice}>
            <Link
              href={href}
              className="marco tarjeta flex h-full items-center gap-4 bg-crema p-4 max-[319px]:flex-col max-[319px]:items-start"
            >
              <Arte />
              <span className="flex flex-col gap-0.5">
                <span className="text-lg leading-tight font-extrabold">
                  {titulo}
                </span>
                <span className="text-[15px] leading-snug">{texto}</span>
              </span>
            </Link>
          </Revelar>
        ))}
      </div>
    </section>
  );
}
