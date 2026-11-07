"use client";

import { crearAlmacen } from "./almacen";

type Album = { cartas: string[]; sobres: number; ultimoSobre?: number };

/** Cada persona abre un sobre por cada 24 horas, contadas desde el último. */
const ESPERA_ENTRE_SOBRES = 24 * 60 * 60 * 1000;

const VACIO: Album = { cartas: [], sobres: 0 };
const almacen = crearAlmacen<Album>("demo-album", () => VACIO, VACIO);

export function useAlbum() {
  return almacen.usar();
}

export function guardarSobre(slugs: string[]) {
  almacen.guardar((previo) => ({
    cartas: [...new Set([...previo.cartas, ...slugs])],
    sobres: previo.sobres + 1,
    ultimoSobre: Date.now(),
  }));
}

/** Momento en que se puede abrir el siguiente sobre. */
export function proximoSobre(ultimoSobre?: number) {
  return ultimoSobre ? ultimoSobre + ESPERA_ENTRE_SOBRES : 0;
}

/** Empezar el álbum de cero no regala un sobre: el reloj se queda. */
export function vaciarAlbum() {
  almacen.guardar(({ ultimoSobre }) => ({ ...VACIO, ultimoSobre }));
}
