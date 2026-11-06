"use client";

import { crearAlmacen } from "./almacen";
import { buscarProducto } from "./productos";

const MAXIMO = 8;
const VACIO: string[] = [];
const almacen = crearAlmacen<string[]>("demo-vistos", () => VACIO, VACIO);

export function useVistos(sinContar: string) {
  return almacen
    .usar()
    .filter((slug) => slug !== sinContar)
    .flatMap((slug) => {
      const producto = buscarProducto(slug);
      return producto ? [producto] : [];
    });
}

export function anotarVisto(slug: string) {
  almacen.guardar((previo) =>
    [slug, ...previo.filter((otro) => otro !== slug)].slice(0, MAXIMO),
  );
}
