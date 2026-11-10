"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { colones } from "@/lib/formato";
import { dibujarPlantilla, FORMATOS } from "@/lib/plantillas";
import { estaAgotado } from "@/lib/productos";
import {
  armarCarrusel,
  captionDeCarrusel,
  expansionesConProductos,
  filaParaContenido,
  hashtagsDe,
  TIPOS_DE_CARRUSEL,
  TOPES,
  type TipoDeCarrusel,
} from "@/lib/textos-contenido";
import { conDatosVivos, useInventarioVivo } from "@/lib/vivo";

const EXPANSIONES = expansionesConProductos();
// Instagram recorta los carruseles al formato de la primera lámina: 4:5 es el que más se ve.
const MEDIDA = FORMATOS[1];

function descargarLienzo(lienzo: HTMLCanvasElement, nombre: string) {
  return new Promise<void>((listo) => {
    lienzo.toBlob(
      (archivo) => {
        if (archivo) {
          const enlace = document.createElement("a");
          enlace.href = URL.createObjectURL(archivo);
          enlace.download = nombre;
          enlace.click();
          window.setTimeout(() => URL.revokeObjectURL(enlace.href), 2000);
        }
        listo();
      },
      "image/jpeg",
      0.92,
    );
  });
}

/**
 * Carruseles para Instagram con el mismo dibujo de las publicaciones: una
 * portada y hasta cinco productos que hoy se pueden comprar. Antes de bajar las
 * imágenes revisa con la hoja que sigan disponibles y con qué precio.
 */
export function Carrusel({ Copiar }: { Copiar: (props: { texto: string; rotulo?: string }) => React.ReactNode }) {
  const vivo = useInventarioVivo();
  const [tipo, setTipo] = useState<TipoDeCarrusel>("presupuesto");
  const [tope, setTope] = useState(TOPES[1]?.id ?? "");
  const [expansion, setExpansion] = useState(EXPANSIONES[0]?.clave ?? "");
  const [version, setVersion] = useState(0);
  const [bajando, setBajando] = useState(false);
  const laminas = useRef<(HTMLCanvasElement | null)[]>([]);

  const base = useMemo(
    () => armarCarrusel(tipo, tipo === "expansion" ? expansion : tope),
    [tipo, tope, expansion],
  );
  // Con los datos de este momento: el precio que sale es el que se cobra hoy.
  const productos = useMemo(
    () => (base ? base.productos.map((producto) => conDatosVivos(producto, vivo)) : []),
    [base, vivo],
  );
  const problemas = vivo
    ? productos.filter(estaAgotado).map((producto) => producto.nombre + " ya no está disponible")
    : [];
  const carrusel = base ? { ...base, productos } : null;
  const alcanza = productos.length >= 3;
  const sePuedeBajar = Boolean(vivo) && alcanza && problemas.length === 0;
  const huella = productos.map((producto) => producto.slug + producto.precio).join("|");

  useEffect(() => {
    if (!carrusel || !alcanza) return;
    let vigente = true;
    void (async () => {
      const [portada, ...resto] = laminas.current;
      if (portada && vigente) {
        await dibujarPlantilla(portada, {
          formato: MEDIDA,
          tipo: "disponible",
          portada: { rotulo: carrusel.rotulo, titulo: carrusel.titulo, subtitulo: carrusel.subtitulo },
        });
      }
      for (const [indice, producto] of carrusel.productos.entries()) {
        const lienzo = resto[indice];
        if (lienzo && vigente) {
          await dibujarPlantilla(lienzo, { formato: MEDIDA, tipo: "disponible", producto });
        }
      }
    })();
    return () => {
      vigente = false;
    };
    // Se vuelve a dibujar solo si cambian los productos o sus precios.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [huella, carrusel?.titulo]);

  const caption = carrusel ? captionDeCarrusel(carrusel, version) : "";
  const fila = carrusel
    ? filaParaContenido("Carrusel", carrusel.que, productos, carrusel.titulo)
    : "";

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-display text-[22px] text-rojo md:text-3xl">
        Armá un carrusel
      </h2>
      <div className="flex flex-wrap gap-2">
        {TIPOS_DE_CARRUSEL.map((opcion) => (
          <button
            key={opcion.id}
            type="button"
            className="chip"
            aria-pressed={tipo === opcion.id}
            onClick={() => {
              setTipo(opcion.id);
              setVersion(0);
            }}
          >
            {opcion.nombre}
          </button>
        ))}
      </div>
      {tipo === "presupuesto" ? (
        <div className="flex flex-wrap gap-2">
          {TOPES.map((opcion) => (
            <button
              key={opcion.id}
              type="button"
              className="chip"
              aria-pressed={tope === opcion.id}
              onClick={() => setTope(opcion.id)}
            >
              ¿Tenés {colones(opcion.max)}?
            </button>
          ))}
        </div>
      ) : null}
      {tipo === "expansion" ? (
        <div>
          <label htmlFor="carrusel-expansion" className="rotulo-campo">
            Expansión
          </label>
          <select
            id="carrusel-expansion"
            className="campo max-w-sm"
            value={expansion}
            onChange={(evento) => setExpansion(evento.target.value)}
          >
            {EXPANSIONES.map((opcion) => (
              <option key={opcion.clave} value={opcion.clave}>
                {opcion.nombre} ({opcion.productos.length})
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {!alcanza ? (
        <p className="marco bg-crema p-4 font-medium">
          Hoy no hay al menos tres productos disponibles con foto propia para este
          carrusel. Probá con otro.
        </p>
      ) : (
        <>
          <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
            {[null, ...productos].map((producto, indice) => (
              <canvas
                key={producto?.slug ?? "portada"}
                ref={(lienzo) => {
                  laminas.current[indice] = lienzo;
                }}
                aria-label={producto ? "Lámina de " + producto.nombre : "Portada del carrusel"}
                className="marco w-[200px] shrink-0 snap-start md:w-[240px]"
              />
            ))}
          </div>
          {!vivo ? (
            <p role="alert" className="font-bold text-rojo">
              Todavía no se pudo revisar el inventario en vivo: esperá un momento
              antes de bajar las imágenes.
            </p>
          ) : null}
          {problemas.length > 0 ? (
            <p role="alert" className="font-bold text-rojo">
              {problemas.join(". ")}. No lo publiqués así: escogé otro carrusel.
            </p>
          ) : null}
          <button
            type="button"
            className="boton boton-rojo w-fit"
            disabled={!sePuedeBajar || bajando}
            onClick={async () => {
              setBajando(true);
              for (const [indice, lienzo] of laminas.current.entries()) {
                if (!lienzo || indice > productos.length) continue;
                await descargarLienzo(lienzo, "pokedeke-carrusel-" + tipo + "-" + (indice + 1) + ".jpg");
                await new Promise((listo) => setTimeout(listo, 400));
              }
              setBajando(false);
            }}
          >
            {bajando ? "Bajando…" : "Descargar las " + (productos.length + 1) + " imágenes"}
          </button>
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="marco flex flex-col gap-3 p-4">
              <h3 className="font-display text-lg text-rojo">Texto del carrusel</h3>
              <textarea
                key={caption}
                className="campo text-[15px]"
                rows={9}
                defaultValue={caption}
                aria-label="Texto del carrusel"
              />
              <div className="flex flex-wrap gap-2">
                <Copiar texto={caption + "\n\n" + hashtagsDe()} rotulo="Copiar con hashtags" />
                <button
                  type="button"
                  className="boton boton-blanco boton-chico w-fit"
                  onClick={() => setVersion((actual) => actual + 1)}
                >
                  Otra versión
                </button>
              </div>
            </div>
            <div className="marco flex flex-col gap-3 p-4">
              <h3 className="font-display text-lg text-rojo">Para la pestaña Contenido</h3>
              <p className="text-[15px] leading-snug">
                Copiá esta fila y pegala en la primera fila libre de la pestaña
                Contenido. Lleva el precio de hoy de cada producto: la hoja avisa
                si algo se agota o cambia de precio antes de publicarlo.
              </p>
              <Copiar texto={fila} rotulo="Copiar la fila" />
            </div>
          </div>
        </>
      )}
    </section>
  );
}
