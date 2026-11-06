"use client";

import { crearAlmacen } from "./almacen";

type Estado = { mios: number[] };

const VACIO: Estado = { mios: [] };
const almacen = crearAlmacen<Estado>("demo-caja-compartida", () => VACIO, VACIO);

export function useCupos() {
  return almacen.usar();
}

export function apartarCupos(numeros: number[]) {
  almacen.guardar((previo) => ({
    mios: [...previo.mios, ...numeros].sort((a, b) => a - b),
  }));
}

export function soltarCupos() {
  almacen.guardar(() => VACIO);
}
