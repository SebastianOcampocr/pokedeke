"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { contarBusqueda } from "@/lib/api-pedidos";
import { Busca } from "./Busca";
import Link from "next/link";
import {
  categoriasConProducto,
  coincide,
  enCamino,
  esSellado,
  estadoDe,
  porConsultar,
  PRESUPUESTOS,
  PRODUCTOS,
  valoresUnicos,
} from "@/lib/productos";
import { useAgotadosAlFinal } from "@/lib/vivo";
import { Revelar } from "./Revelar";
import { TarjetaProducto } from "./TarjetaProducto";

const RANGOS = [
  { id: "", texto: "Cualquier precio", min: 0, max: Infinity },
  ...PRESUPUESTOS.map(({ id, corto, min, max }) => ({ id, texto: corto, min, max })),
];

const GRUPOS = [
  { id: "sellado", texto: "Solo sellados" },
  { id: "cartas", texto: "Solo cartas" },
];

const ORDENES = [
  { id: "nuevo", texto: "Lo más nuevo" },
  { id: "menor", texto: "Precio: de menor a mayor" },
  { id: "mayor", texto: "Precio: de mayor a menor" },
  { id: "vendidos", texto: "Más vendidos" },
];

const POR_TANDA = 24;
// Solo salen los filtros de estado que hoy tienen productos.
const ESTADOS_DE_FILTRO = [
  { estado: "Disponible", texto: "Disponible ya" },
  ...(enCamino().length > 0 ? [{ estado: "En camino", texto: "En camino" }] : []),
  ...(porConsultar().length > 0
    ? [{ estado: "Por consultar", texto: "Por consultar" }]
    : []),
];
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
  precioInicial = "",
  grupoInicial = "",
}: {
  categoriaInicial?: string;
  etiquetaInicial?: string;
  busquedaInicial?: string;
  precioInicial?: string;
  grupoInicial?: string;
}) {
  const [busqueda, setBusqueda] = useState(busquedaInicial);
  const [juego, setJuego] = useState("");
  const [categoria, setCategoria] = useState(categoriaInicial);
  const [idioma, setIdioma] = useState("");
  const [rango, setRango] = useState(
    RANGOS.some((opcion) => opcion.id === precioInicial) ? precioInicial : "",
  );
  // "sellado" o "cartas": junta varias categorías.
  const [grupo, setGrupo] = useState(
    GRUPOS.some((opcion) => opcion.id === grupoInicial) ? grupoInicial : "",
  );
  const [rareza, setRareza] = useState("");
  const [orden, setOrden] = useState("nuevo");
  // "Disponible", "En camino" o "Por consultar": muestra solo lo que está así.
  const [etiqueta, setEtiqueta] = useState(
    ESTADOS_DE_FILTRO.some(({ estado }) => estado === etiquetaInicial)
      ? etiquetaInicial
      : "",
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
        (!etiqueta || estadoDe(producto) === etiqueta) &&
        (!grupo ||
          (grupo === "sellado" ? esSellado(producto) : Boolean(producto.carta))) &&
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
  }, [busqueda, juego, categoria, idioma, rango, rareza, orden, etiqueta, grupo]);
  const resultados = useAgotadosAlFinal(encontrados);
  const listosYa = resultados.filter(
    (producto) => estadoDe(producto) === "Disponible",
  ).length;

  // Qué se busca y si hay: dos segundos sin escribir cuentan como búsqueda terminada.
  // Se cuenta contra todo el catálogo, sin los demás filtros.
  useEffect(() => {
    if (busqueda.trim().length < 3) return;
    const reloj = window.setTimeout(() => {
      const cuantos = PRODUCTOS.filter((producto) =>
        coincide(producto, busqueda),
      ).length;
      contarBusqueda(busqueda, cuantos, "catalogo");
    }, 2000);
    return () => window.clearTimeout(reloj);
  }, [busqueda]);

  const hayFiltros = Boolean(
    busqueda ||
      juego ||
      categoria ||
      idioma ||
      rango ||
      rareza ||
      etiqueta ||
      grupo,
  );

  // Al cambiar cualquier filtro se vuelve a la primera tanda.
  const clave = [busqueda, juego, categoria, idioma, rango, rareza, orden, etiqueta, grupo].join("|");
  const cantidad = tanda.clave === clave ? tanda.cantidad : POR_TANDA;
  const visibles = resultados.slice(0, cantidad);
  const restantes = resultados.length - visibles.length;

  function limpiar() {
    setBusqueda("");
    setJuego("");
    setCategoria("");
    setIdioma("");
    setRango("");
    setGrupo("");
    setRareza("");
    setEtiqueta("");
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
          <div className="flex flex-wrap gap-2">
            {GRUPOS.map(({ id, texto }) => (
              <button
                key={id}
                type="button"
                className="chip w-fit"
                aria-pressed={grupo === id}
                onClick={() => setGrupo((actual) => (actual === id ? "" : id))}
              >
                {texto}
              </button>
            ))}
            {ESTADOS_DE_FILTRO.map(({ estado, texto }) => (
              <button
                key={estado}
                type="button"
                className="chip w-fit"
                aria-pressed={etiqueta === estado}
                onClick={() =>
                  setEtiqueta((actual) => (actual === estado ? "" : estado))
                }
              >
                {texto}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <section aria-label="Resultados" className="min-w-0">
        {etiqueta === "Por consultar" ? (
          <p className="mb-4 rounded-md bg-crema p-3 leading-snug font-medium">
            Estos productos no están en el mezzanine: revisamos si los podemos
            conseguir y te confirmamos disponibilidad y precio antes de que
            pagués nada. Los precios son de referencia y pueden cambiar.
          </p>
        ) : null}
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
            {/* Sin filtros también se ven los agotados y los por consultar: así calza con la portada. */}
            {!hayFiltros && listosYa < resultados.length ? (
              <span className="font-medium"> · {listosYa} disponibles ya</span>
            ) : null}
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
          <div className="flex flex-col gap-5">
            <div className="marco bg-crema p-6">
              <p className="font-display text-xl text-azul">No hallamos nada</p>
              <p className="mt-2">
                Probá con otra palabra o quitá algún filtro. Y si de verdad no
                está, lo buscamos por vos.
              </p>
            </div>
            {(
              <Busca
                key={busqueda}
                origen="catalogo"
                productoInicial={busqueda.trim().slice(0, 150)}
                titulo="¿No encontraste lo que buscás?"
              />
            )}
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
      etiquetaInicial={parametros.get("estado") ?? ""}
      busquedaInicial={parametros.get("q") ?? ""}
      precioInicial={parametros.get("precio") ?? ""}
      grupoInicial={parametros.get("grupo") ?? ""}
    />
  );
}
