"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  categoriasConProducto,
  coincide,
  PRODUCTOS,
  valoresUnicos,
} from "@/lib/productos";
import { enlaceWhatsApp } from "@/lib/tienda";
import { useAgotadosAlFinal } from "@/lib/vivo";
import { Revelar } from "./Revelar";
import { TarjetaProducto } from "./TarjetaProducto";

const RANGOS = [
  { id: "", texto: "Cualquier precio", min: 0, max: Infinity },
  { id: "bajo", texto: "Hasta ₡10 000", min: 0, max: 10000 },
  { id: "medio", texto: "De ₡10 000 a ₡50 000", min: 10000, max: 50000 },
  { id: "alto", texto: "Más de ₡50 000", min: 50000, max: Infinity },
];

const ORDENES = [
  { id: "nuevo", texto: "Lo más nuevo" },
  { id: "menor", texto: "Precio: de menor a mayor" },
  { id: "mayor", texto: "Precio: de mayor a menor" },
  { id: "vendidos", texto: "Más vendidos" },
];

const POR_TANDA = 24;
const SUELTAS = "Carta suelta (single)";

const CATEGORIAS_RAPIDAS = categoriasConProducto();

const RAREZAS = [
  ...new Set(PRODUCTOS.flatMap((producto) => producto.carta?.rareza || [])),
].sort((a, b) => a.localeCompare(b, "es"));

function Selector({
  id,
  rotulo,
  valor,
  alCambiar,
  opciones,
}: {
  id: string;
  rotulo: string;
  valor: string;
  alCambiar: (valor: string) => void;
  opciones: { id: string; texto: string }[];
}) {
  return (
    <div>
      <label htmlFor={id} className="rotulo-campo">
        {rotulo}
      </label>
      <select
        id={id}
        className="campo"
        value={valor}
        onChange={(evento) => alCambiar(evento.target.value)}
      >
        {opciones.map((opcion) => (
          <option key={opcion.id} value={opcion.id}>
            {opcion.texto}
          </option>
        ))}
      </select>
    </div>
  );
}

const conTodos = (valores: string[], texto: string) => [
  { id: "", texto },
  ...valores.map((valor) => ({ id: valor, texto: valor })),
];

export function Catalogo({
  categoriaInicial = "",
  etiquetaInicial = "",
  busquedaInicial = "",
}: {
  categoriaInicial?: string;
  etiquetaInicial?: string;
  busquedaInicial?: string;
}) {
  const [busqueda, setBusqueda] = useState(busquedaInicial);
  const [juego, setJuego] = useState("");
  const [categoria, setCategoria] = useState(categoriaInicial);
  const [idioma, setIdioma] = useState("");
  const [rango, setRango] = useState("");
  const [rareza, setRareza] = useState("");
  const [orden, setOrden] = useState("nuevo");
  const [soloPreventas, setSoloPreventas] = useState(
    etiquetaInicial === "Preventa",
  );
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const [tanda, setTanda] = useState({ clave: "", cantidad: POR_TANDA });

  const encontrados = useMemo(() => {
    const limites = RANGOS.find((opcion) => opcion.id === rango) ?? RANGOS[0];
    const filtrados = PRODUCTOS.filter(
      (producto) =>
        (!juego || producto.juego === juego) &&
        (!categoria || producto.categoria === categoria) &&
        (!idioma || producto.idioma === idioma) &&
        (!rareza || producto.carta?.rareza === rareza) &&
        (!soloPreventas || producto.etiqueta === "Preventa") &&
        producto.precio >= limites.min &&
        producto.precio <= limites.max &&
        coincide(producto, busqueda),
    );
    return filtrados.sort((a, b) => {
      if (orden === "menor") return a.precio - b.precio;
      if (orden === "mayor") return b.precio - a.precio;
      if (orden === "vendidos") return b.vendidos - a.vendidos;
      return b.orden - a.orden;
    });
  }, [busqueda, juego, categoria, idioma, rango, rareza, orden, soloPreventas]);
  const resultados = useAgotadosAlFinal(encontrados);

  const hayFiltros = Boolean(
    busqueda ||
      juego ||
      categoria ||
      idioma ||
      rango ||
      rareza ||
      soloPreventas,
  );

  // Al cambiar cualquier filtro se vuelve a la primera tanda.
  const clave = [busqueda, juego, categoria, idioma, rango, rareza, orden, soloPreventas].join("|");
  const cantidad = tanda.clave === clave ? tanda.cantidad : POR_TANDA;
  const visibles = resultados.slice(0, cantidad);
  const restantes = resultados.length - visibles.length;

  function limpiar() {
    setBusqueda("");
    setJuego("");
    setCategoria("");
    setIdioma("");
    setRango("");
    setRareza("");
    setSoloPreventas(false);
  }

  return (
    <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-8">
      <aside className="flex flex-col gap-4">
        <div>
          <label htmlFor="busqueda" className="rotulo-campo">
            Buscar
          </label>
          <input
            id="busqueda"
            type="search"
            className="campo"
            placeholder="Buscá por nombre…"
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
          />
        </div>

        <button
          type="button"
          className="boton boton-amarillo boton-chico lg:hidden"
          aria-expanded={filtrosAbiertos}
          aria-controls="filtros"
          onClick={() => setFiltrosAbiertos((abierto) => !abierto)}
        >
          {filtrosAbiertos ? "Ocultar filtros" : "Filtrar y ordenar"}
        </button>

        <div
          id="filtros"
          className={`flex-col gap-4 lg:flex ${filtrosAbiertos ? "flex" : "hidden"}`}
        >
          {/* Aparece solo cuando el catálogo tenga más de un juego. */}
          {valoresUnicos("juego").length > 1 ? (
            <Selector
              id="filtro-juego"
              rotulo="Juego"
              valor={juego}
              alCambiar={setJuego}
              opciones={conTodos(valoresUnicos("juego"), "Todos los juegos")}
            />
          ) : null}
          <Selector
            id="filtro-categoria"
            rotulo="Categoría"
            valor={categoria}
            alCambiar={setCategoria}
            opciones={conTodos(valoresUnicos("categoria"), "Todas las categorías")}
          />
          <Selector
            id="filtro-idioma"
            rotulo="Idioma"
            valor={idioma}
            alCambiar={setIdioma}
            opciones={conTodos(valoresUnicos("idioma"), "Todos los idiomas")}
          />
          <Selector
            id="filtro-precio"
            rotulo="Precio"
            valor={rango}
            alCambiar={setRango}
            opciones={RANGOS}
          />
          {RAREZAS.length > 0 &&
          (categoria === SUELTAS || categoria === "Carta gradada") ? (
            <Selector
              id="filtro-rareza"
              rotulo="Rareza"
              valor={rareza}
              alCambiar={setRareza}
              opciones={conTodos(RAREZAS, "Todas las rarezas")}
            />
          ) : null}
          <Selector
            id="filtro-orden"
            rotulo="Ordenar por"
            valor={orden}
            alCambiar={setOrden}
            opciones={ORDENES}
          />
          <button
            type="button"
            className="chip w-fit"
            aria-pressed={soloPreventas}
            onClick={() => setSoloPreventas((activo) => !activo)}
          >
            Solo preventas
          </button>
        </div>
      </aside>

      <section aria-label="Resultados" className="min-w-0">
        <nav
          aria-label="Categorías"
          className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0"
        >
          {CATEGORIAS_RAPIDAS.map((opcion) => (
            <button
              key={opcion.categoria}
              type="button"
              className="chip"
              aria-pressed={categoria === opcion.categoria}
              onClick={() =>
                setCategoria(
                  categoria === opcion.categoria ? "" : opcion.categoria,
                )
              }
            >
              {opcion.texto}
            </button>
          ))}
        </nav>

        {categoria === "Caja misteriosa" ? (
          <Link
            href="/cajas-misteriosas"
            className="mb-2 block min-h-11 content-center font-bold text-azul underline"
          >
            Cómo funcionan las cajas misteriosas
          </Link>
        ) : null}

        <div className="mb-5 flex min-h-11 items-center justify-between gap-3">
          <p aria-live="polite" className="font-bold">
            {resultados.length === 1
              ? "1 producto"
              : `${resultados.length} productos`}
          </p>
          {hayFiltros ? (
            <button
              type="button"
              onClick={limpiar}
              className="min-h-11 font-bold text-azul underline"
            >
              Limpiar filtros
            </button>
          ) : null}
        </div>

        {resultados.length > 0 ? (
          <>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {visibles.map((producto, indice) => (
                <Revelar key={producto.slug} indice={indice}>
                  <TarjetaProducto producto={producto} />
                </Revelar>
              ))}
            </div>
            {restantes > 0 ? (
              <button
                type="button"
                className="boton boton-amarillo mt-6 w-full"
                onClick={() =>
                  setTanda({ clave, cantidad: cantidad + POR_TANDA })
                }
              >
                Ver más ({restantes} en el mezzanine)
              </button>
            ) : null}
          </>
        ) : (
          <div className="marco bg-crema p-6">
            <p className="font-display text-xl text-azul">No hallamos nada</p>
            <p className="mt-2">
              Probá con otra palabra o{" "}
              <a
                href={enlaceWhatsApp("¡Hola! Estoy buscando un producto.")}
                target="_blank"
                rel="noreferrer"
                className="font-bold underline underline-offset-2"
              >
                escribinos por WhatsApp
              </a>
              : tal vez lo tenemos en camino.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

/** Lee los filtros que vienen en el link, como /catalogo?categoria=ETB. */
export function CatalogoDesdeEnlace() {
  const parametros = useSearchParams();
  return (
    <Catalogo
      key={parametros.toString()}
      categoriaInicial={parametros.get("categoria") ?? ""}
      etiquetaInicial={parametros.get("etiqueta") ?? ""}
      busquedaInicial={parametros.get("q") ?? ""}
    />
  );
}
