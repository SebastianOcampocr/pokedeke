"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { contarBusqueda } from "@/lib/api-pedidos";
import { colones } from "@/lib/formato";
import { coincide, disponibles, estaAgotado, PRODUCTOS } from "@/lib/productos";
import { conDatosVivos, useInventarioVivo } from "@/lib/vivo";
import { Deke } from "./Deke";
import { FotoProducto } from "./FotoProducto";
import { IconoBuscar } from "./Iconos";

// Primeras palabras de lo que hay en stock, empezando por lo de mayor precio.
const SUGERENCIAS = [
  ...new Set(
    disponibles()
      .sort((a, b) => b.precio - a.precio)
      .map((producto) => producto.nombre.split(" ")[0]),
  ),
].slice(0, 5);
const MAXIMO = 6;

/** Buscador rápido del encabezado. Se abre con la lupa, con / o con Ctrl+K. */
export function Buscador() {
  const dialogo = useRef<HTMLDialogElement>(null);
  const [texto, setTexto] = useState("");
  const router = useRouter();

  const vivo = useInventarioVivo();

  const resultados = useMemo(() => {
    if (!texto.trim()) return [];
    return PRODUCTOS.filter((producto) => coincide(producto, texto))
      .map((producto) => conDatosVivos(producto, vivo))
      .sort(
      (a, b) =>
        Number(estaAgotado(a)) - Number(estaAgotado(b)) ||
        b.vendidos - a.vendidos,
    );
  }, [texto, vivo]);

  useEffect(() => {
    function alTeclear(evento: KeyboardEvent) {
      const objetivo = evento.target as HTMLElement;
      const escribiendo = /INPUT|TEXTAREA|SELECT/.test(objetivo.tagName);
      const atajo =
        (evento.key === "k" && (evento.ctrlKey || evento.metaKey)) ||
        (evento.key === "/" && !escribiendo);
      if (!atajo) return;
      evento.preventDefault();
      if (!dialogo.current?.open) dialogo.current?.showModal();
    }
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, []);

  // Qué se busca y si hay: dos segundos sin escribir cuentan como búsqueda terminada.
  const cuantos = resultados.length;
  useEffect(() => {
    if (texto.trim().length < 3) return;
    const reloj = window.setTimeout(
      () => contarBusqueda(texto, cuantos, "buscador"),
      2000,
    );
    return () => window.clearTimeout(reloj);
  }, [texto, cuantos]);

  function cerrar() {
    dialogo.current?.close();
    setTexto("");
  }

  const enlaceTodo = `/catalogo?q=${encodeURIComponent(texto.trim())}`;

  return (
    <>
      <button
        type="button"
        aria-label="Buscar"
        className="flex size-11 cursor-pointer items-center justify-center"
        onClick={() => dialogo.current?.showModal()}
      >
        <IconoBuscar />
      </button>

      <dialog
        ref={dialogo}
        aria-label="Buscar productos"
        className="buscador"
        onClick={(evento) => {
          if (evento.target === dialogo.current) cerrar();
        }}
        onClose={() => setTexto("")}
      >
        <form
          className="flex items-center gap-2 border-b-3 border-tinta p-3"
          onSubmit={(evento) => {
            evento.preventDefault();
            if (!texto.trim()) return;
            const destino =
              resultados.length === 1
                ? `/producto/${resultados[0].slug}`
                : enlaceTodo;
            cerrar();
            router.push(destino);
          }}
        >
          <IconoBuscar />
          <input
            type="search"
            aria-label="¿Qué andás buscando?"
            placeholder="¿Qué andás buscando?"
            className="min-h-11 w-full text-lg font-medium outline-none"
            autoFocus
            value={texto}
            onChange={(evento) => setTexto(evento.target.value)}
          />
          <button
            type="button"
            onClick={cerrar}
            className="min-h-11 cursor-pointer px-1 text-sm font-bold text-azul underline"
          >
            Cerrar
          </button>
        </form>

        {texto.trim() ? (
          <div aria-live="polite">
            {resultados.length > 0 ? (
              <ul>
                {resultados.slice(0, MAXIMO).map((producto) => (
                  <li key={producto.slug}>
                    <Link
                      href={`/producto/${producto.slug}`}
                      onClick={cerrar}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-crema"
                    >
                      <span className="relative size-12 shrink-0 overflow-hidden rounded-md bg-crema">
                        <FotoProducto
                          producto={producto}
                          alt=""
                          sizes="48px"
                          className="p-0.5"
                        />
                      </span>
                      <span className="min-w-0 grow">
                        <span className="block truncate font-bold">
                          {producto.nombre}
                        </span>
                        <span className="block text-[13px] text-gris">
                          {estaAgotado(producto)
                            ? "Agotado"
                            : producto.categoriaCorta}
                        </span>
                      </span>
                      <span className="font-extrabold whitespace-nowrap text-azul">
                        {colones(producto.precio)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col gap-3 p-4">
                <div className="flex items-center gap-3">
                  <Deke animo="triste" className="h-20 shrink-0" />
                  <p className="font-bold">
                    Deke revisó todo el mezzanine y no halló nada con esa
                    palabra. Si no lo tenemos, lo buscamos por vos.
                  </p>
                </div>
                <Link
                  href={
                    "/busca?origen=buscador&producto=" +
                    encodeURIComponent(texto.trim().slice(0, 150))
                  }
                  onClick={cerrar}
                  className="boton boton-verde"
                >
                  Buscar con Pokedeke
                </Link>
              </div>
            )}
            {resultados.length > MAXIMO ? (
              <Link
                href={enlaceTodo}
                onClick={cerrar}
                className="block border-t-2 border-tinta p-3 text-center font-extrabold text-azul underline"
              >
                Ver los {resultados.length} resultados
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-col gap-3 p-3">
            <div className="flex flex-wrap gap-2">
              {SUGERENCIAS.map((sugerencia) => (
                <button
                  key={sugerencia}
                  type="button"
                  className="chip"
                  onClick={() => setTexto(sugerencia)}
                >
                  {sugerencia}
                </button>
              ))}
            </div>
            <p className="hidden text-sm text-gris md:block">
              Atajo: apretá <kbd className="tecla">/</kbd> en cualquier página.
            </p>
          </div>
        )}
      </dialog>
    </>
  );
}
