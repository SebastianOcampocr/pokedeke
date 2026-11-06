"use client";

import { crearAlmacen } from "./almacen";

type Album = { cartas: string[]; sobres: number };

const VACIO: Album = { cartas: [], sobres: 0 };
const almacen = crearAlmacen<Album>("demo-album", () => VACIO, VACIO);

export function useAlbum() {
  return almacen.usar();
}

export function guardarSobre(slugs: string[]) {
  almacen.guardar((previo) => ({
    cartas: [...new Set([...previo.cartas, ...slugs])],
    sobres: previo.sobres + 1,
  }));
}

export function vaciarAlbum() {
  almacen.guardar(() => VACIO);
}
