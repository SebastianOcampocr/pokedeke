"use client";

import { useEffect, useRef, useState } from "react";
import { useAlbum } from "@/lib/album";
import { crearAlmacen, useHidratado } from "@/lib/almacen";
import { dibujarCedula, numeroCedula, PROVINCIAS, TIPOS } from "@/lib/cedula";
import { ganarLogro, LOGROS, rangoPorLogros, useLogros } from "@/lib/logros";
import { cartasSueltas } from "@/lib/productos";

type Datos = { nombre: string; provincia: string; tipo: string };

const INICIO: Datos = { nombre: "", provincia: "San José", tipo: "Eléctrico" };
const almacen = crearAlmacen<Datos>("demo-cedula", () => INICIO, INICIO);

function Stickers() {
  const hidratado = useHidratado();
  const { ganados } = useLogros();
  const propios = hidratado ? ganados : [];

  return (
    <section aria-labelledby="titulo-stickers" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <h2
          id="titulo-stickers"
          className="font-display text-[22px] text-rojo md:text-3xl"
        >
          Tus stickers
        </h2>
        <p className="font-extrabold">
          {propios.length} de {LOGROS.length}
        </p>
      </div>
      <ul className="grid gap-3 md:grid-cols-2">
        {LOGROS.map((logro) => {
          const ganado = propios.includes(logro.id);
          return (
            <li key={logro.id} className="marco flex items-center gap-3 p-3">
              <span
                className="sticker"
                data-bloqueado={ganado ? undefined : ""}
              >
                {ganado ? logro.marca : "?"}
              </span>
              <span>
                <span className="block leading-tight font-extrabold">
                  {ganado || logro.id !== "shiny" ? logro.titulo : "Secreto"}
                </span>
                <span className="block text-sm text-gris">
                  {ganado || logro.id !== "shiny"
                    ? logro.texto
                    : "Deke sabe. Tocalo varias veces."}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function Cedula() {
  const hidratado = useHidratado();
  const datos = almacen.usar();
  const { cartas } = useAlbum();
  const { ganados } = useLogros();
  const lienzo = useRef<HTMLCanvasElement>(null);
  const [compartible, setCompartible] = useState(false);

  const todas = cartasSueltas();
  const enAlbum = todas.filter((carta) => cartas.includes(carta.slug)).length;
  const rango = rangoPorLogros(ganados.length);
  const stickers = LOGROS.filter((logro) => ganados.includes(logro.id)).map(
    (logro) => logro.marca as string,
  );
  const clave = stickers.join("");

  useEffect(() => {
    if (!hidratado || !lienzo.current) return;
    void dibujarCedula(lienzo.current, {
      ...datos,
      rango,
      cartas: enAlbum,
      totalCartas: todas.length,
      stickers: clave ? stickers : [],
    });
    // `stickers` cambia solo cuando cambia `clave`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hidratado, datos, rango, enAlbum, todas.length, clave]);

  useEffect(() => {
    const prueba = new File([""], "cedula.png", { type: "image/png" });
    setCompartible(Boolean(navigator.canShare?.({ files: [prueba] })));
  }, []);

  function cambiar(campo: keyof Datos, valor: string) {
    almacen.guardar((previo) => ({ ...previo, [campo]: valor }));
  }

  function aArchivo() {
    return new Promise<Blob | null>((resolver) =>
      lienzo.current?.toBlob(resolver, "image/png"),
    );
  }

  const nombreArchivo = `cedula-${numeroCedula(datos.nombre || "Pokedeke")}.png`;

  async function descargar() {
    const archivo = await aArchivo();
    if (!archivo) return;
    const enlace = document.createElement("a");
    enlace.href = URL.createObjectURL(archivo);
    enlace.download = nombreArchivo;
    enlace.click();
    URL.revokeObjectURL(enlace.href);
    ganarLogro("cedula");
  }

  async function compartir() {
    const archivo = await aArchivo();
    if (!archivo) return;
    try {
      await navigator.share({
        files: [new File([archivo], nombreArchivo, { type: "image/png" })],
        title: "Mi Cédula de Coleccionista",
      });
      ganarLogro("cedula");
    } catch {
      // Cerrar el menú de compartir no es un error.
    }
  }

  return (
    <div className="flex flex-col gap-12">
      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
        <form
          className="flex flex-col gap-3"
          onSubmit={(evento) => evento.preventDefault()}
        >
          <div>
            <label htmlFor="cedula-nombre" className="rotulo-campo">
              Tu nombre o apodo
            </label>
            <input
              id="cedula-nombre"
              className="campo"
              maxLength={28}
              placeholder="Como te dicen en el grupo"
              value={datos.nombre}
              onChange={(evento) => cambiar("nombre", evento.target.value)}
            />
          </div>
          <div>
            <label htmlFor="cedula-provincia" className="rotulo-campo">
              Provincia
            </label>
            <select
              id="cedula-provincia"
              className="campo"
              value={datos.provincia}
              onChange={(evento) => cambiar("provincia", evento.target.value)}
            >
              {PROVINCIAS.map((provincia) => (
                <option key={provincia}>{provincia}</option>
              ))}
            </select>
          </div>
          <fieldset>
            <legend className="rotulo-campo">Tipo favorito</legend>
            <div className="flex flex-wrap gap-2">
              {TIPOS.map((tipo) => (
                <button
                  key={tipo.nombre}
                  type="button"
                  className="chip"
                  aria-pressed={datos.tipo === tipo.nombre}
                  onClick={() => cambiar("tipo", tipo.nombre)}
                >
                  {tipo.nombre}
                </button>
              ))}
            </div>
          </fieldset>
          <button
            type="button"
            className="boton boton-rojo mt-1"
            onClick={descargar}
          >
            Descargar mi cédula
          </button>
          {compartible ? (
            <button
              type="button"
              className="boton boton-verde boton-chico"
              onClick={compartir}
            >
              Compartir
            </button>
          ) : null}
        </form>

        <div
          data-holo="foil"
          className="shadow-dura relative aspect-[100/63] w-full rounded-[3%]"
        >
          <canvas
            ref={lienzo}
            role="img"
            aria-label={`Cédula de Coleccionista de ${datos.nombre || "Pokedeke"}, rango ${rango}`}
            className="size-full rounded-[3%]"
          />
        </div>
      </div>

      <Stickers />
    </div>
  );
}
