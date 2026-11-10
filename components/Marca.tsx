import Link from "next/link";
import {
  conFoto,
  disponibles,
  esCarta,
  type Producto,
} from "@/lib/productos";
import { LEMA, LUGAR, TIENDA } from "@/lib/tienda";
import { Contador } from "./Contador";
import { Deke } from "./Deke";
import { FotoProducto } from "./FotoProducto";
import { Revelar } from "./Revelar";

/** Lo sellado luce mejor en el estante; las cartas llenan lo que falte. */
function estantes() {
  const conImagen = disponibles().filter(conFoto);
  const piezas = [
    ...conImagen.filter((producto) => !esCarta(producto)),
    ...conImagen.filter(esCarta),
  ].slice(0, 8);
  return [piezas.slice(0, 4), piezas.slice(4)];
}

function Estanteria() {
  return (
    <div
      aria-hidden="true"
      className="marco shadow-dura relative flex flex-col gap-2 bg-crema p-3 pb-4"
    >
      {estantes().map((fila, indice) => (
        <div key={indice} className="flex flex-col">
          <div className="flex min-h-20 items-end justify-around gap-1 sm:min-h-28">
            {fila.map((producto) => (
              <div
                key={producto.slug}
                className="relative h-20 min-w-0 flex-1 sm:h-28"
              >
                <FotoProducto
                  producto={producto}
                  alt=""
                  sizes="130px"
                  className="object-bottom"
                />
              </div>
            ))}
            {indice === 1 ? (
              <Deke animo="guino" className="deke h-20 shrink-0 sm:h-28" />
            ) : null}
          </div>
          <div className="h-2.5 rounded-sm bg-tinta" />
        </div>
      ))}
    </div>
  );
}

const NUMEROS = [
  { valor: disponibles().length, texto: "productos disponibles ya" },
  {
    valor: disponibles().filter(esCarta).length,
    texto: "cartas para la vitrina",
  },
  { valor: 7, texto: "provincias con envío" },
  { valor: 1, texto: "mezzanine repleto" },
  { valor: 0, texto: "bodegas gigantes" },
];

/** La historia en corto: de dónde sale todo lo que vende Pokedeke. */
export function ElMezzanine() {
  return (
    <section className="border-y-3 border-tinta bg-amarillo">
      <div className="mx-auto grid max-w-6xl items-center gap-7 px-4 py-9 lg:grid-cols-2 lg:gap-12 lg:py-14">
        <div className="flex flex-col gap-3">
          <h2 className="font-display text-[34px] leading-none text-azul lg:text-5xl">
            {LEMA}
          </h2>
          <p className="max-w-lg text-[17px] leading-snug font-medium">
            Otros tienen bodega. Nosotros tenemos un mezzanine en el{" "}
            {LUGAR.nombre} y una carta con patas que lo cuida. De ahí sale cada
            pedido de {TIENDA.nombre}, empacado por nosotros. Somos tienda en
            línea: no hay local, pero podés retirar ahí con cita o te lo
            mandamos a todo el país.
          </p>
          <Link href="/nosotros" className="boton boton-rojo w-full md:w-fit">
            Conocé el mezzanine
          </Link>
        </div>
        <Revelar>
          <Estanteria />
        </Revelar>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:col-span-2 lg:grid-cols-5">
          {NUMEROS.map((numero) => (
            <div key={numero.texto} className="marco bg-crema p-3">
              <dd className="font-display text-3xl leading-none text-rojo md:text-4xl">
                <Contador valor={numero.valor} />
              </dd>
              <dt className="mt-1 text-[13px] leading-tight font-bold">
                {numero.texto}
              </dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

const PASOS = [
  {
    titulo: "Escogés",
    texto: "Buscá en el catálogo y armá tu carrito con lo que te guste.",
  },
  {
    titulo: "Pagás por SINPE o tarjeta",
    texto:
      "Por SINPE Móvil nos mandás el comprobante; con tarjeta queda confirmado de una vez.",
  },
  {
    titulo: "Te llega",
    texto: `Retirás en el ${LUGAR.nombre} o te lo mandamos por Correos o a la tienda que nos digás.`,
  },
];

export function ComoFunciona() {
  return (
    <section className="flex flex-col gap-5">
      <Revelar efecto="sello">
        <h2 className="font-display text-[22px] text-rojo md:text-3xl">
          Así de fácil
        </h2>
      </Revelar>
      <ol className="grid gap-5 md:grid-cols-3">
        {PASOS.map((paso, indice) => (
          <li key={paso.titulo}>
            <Revelar indice={indice}>
              <div className="marco flex h-full gap-3.5 bg-crema p-4">
                <span className="flex size-12 shrink-0 -rotate-3 items-center justify-center rounded-md border-2 border-tinta bg-azul font-display text-2xl text-white">
                  {indice + 1}
                </span>
                <div>
                  <h3 className="text-lg font-extrabold">{paso.titulo}</h3>
                  <p className="text-[15px] leading-snug">{paso.texto}</p>
                </div>
              </div>
            </Revelar>
          </li>
        ))}
      </ol>
    </section>
  );
}

const CAMINOS = [
  {
    titulo: "Quiero probar suerte",
    texto: "Sobres y blisters",
    categorias: ["Booster pack", "Blister / sleeved booster"],
    color: "bg-azul text-white",
  },
  {
    titulo: "Voy a abrir varios",
    texto: "Bundles y cajas",
    categorias: ["Booster bundle", "Booster box"],
    color: "bg-rojo text-white",
  },
  {
    titulo: "Ando buscando una carta",
    texto: "Sueltas y gradadas",
    categorias: ["Carta suelta (single)", "Carta gradada"],
    color: "bg-amarillo text-tinta",
  },
  {
    titulo: "Es para regalar",
    texto: "ETB y colecciones",
    categorias: ["ETB", "Colección premium / UPC", "Tin o caja de colección"],
    color: "bg-verde text-white",
  },
];

/** La categoría con algo en stock, y su pieza con foto para la tarjeta. */
function ejemploDe(categorias: string[]) {
  for (const categoria of categorias) {
    const opciones: Producto[] = disponibles().filter(
      (producto) => producto.categoria === categoria,
    );
    if (opciones.length > 0) {
      return { categoria, producto: opciones.find(conFoto) ?? opciones[0] };
    }
  }
  return null;
}

export function QueBuscas() {
  const caminos = CAMINOS.flatMap((camino) => {
    const ejemplo = ejemploDe(camino.categorias);
    return ejemplo ? [{ ...camino, ...ejemplo }] : [];
  });
  // Con un solo camino no hay nada que escoger.
  if (caminos.length < 2) return null;

  return (
    <section className="flex flex-col gap-5">
      <Revelar efecto="sello">
        <h2 className="font-display text-[22px] text-rojo md:text-3xl">
          ¿Qué andás buscando?
        </h2>
      </Revelar>
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {caminos.map((camino, indice) => (
          <Revelar key={camino.titulo} indice={indice}>
            <Link
              href={`/catalogo?categoria=${encodeURIComponent(camino.categoria)}`}
              className="marco tarjeta flex h-full flex-col overflow-hidden"
            >
              <span className={`flex grow flex-col p-3 ${camino.color}`}>
                <span className="text-[17px] leading-tight font-extrabold">
                  {camino.titulo}
                </span>
                <span className="text-sm font-medium">{camino.texto}</span>
              </span>
              <span className="brillo relative block h-28 shrink-0 border-t-3 border-tinta bg-crema lg:h-36">
                <FotoProducto
                  producto={camino.producto}
                  alt=""
                  sizes="(min-width: 1024px) 260px, 45vw"
                  className="p-2"
                />
              </span>
            </Link>
          </Revelar>
        ))}
      </div>
    </section>
  );
}
