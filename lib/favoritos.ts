"use client";

import { crearAlmacen } from "./almacen";
import { buscarProducto } from "./productos";

const VACIO: string[] = [];
const almacen = crearAlmacen<string[]>("demo-favoritos", () => VACIO, VACIO);

export function useFavoritos() {
  const slugs = almacen.usar();
  const productos = slugs.flatMap((slug) => {
    const producto = buscarProducto(slug);
    return producto ? [producto] : [];
  });
  return { slugs, productos };
}

export function cambiarFavorito(slug: string) {
  almacen.guardar((previo) =>
    previo.includes(slug)
      ? previo.filter((otro) => otro !== slug)
      : [...previo, slug],
  );
}
