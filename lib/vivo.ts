"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { Producto } from "./productos";
import { PEDIDOS_URL } from "./tienda";

type Inventario = Record<
  string,
  { stock: number; precio: number; peso?: number }
>;

/** Cada cuánto se pregunta mientras la pestaña esté a la vista. */
const CADA_MILISEGUNDOS = 15_000;

let inventario: Inventario | null = null;
let reloj: number | undefined;
const oyentes = new Set<() => void>();

/** La página armada puede tener minutos de atraso: esto trae el dato de la hoja. */
export async function refrescarInventario() {
  if (!PEDIDOS_URL) return;
  try {
    const respuesta = await fetch(`${PEDIDOS_URL}?accion=stock`);
    const datos = await respuesta.json();
    if (!datos.ok || !datos.productos) return;
    inventario = datos.productos as Inventario;
    oyentes.forEach((oyente) => oyente());
  } catch {
    // Sin conexión se queda lo último que hubo. Al pedir, la hoja revisa igual.
  }
}

function alVolverALaPestana() {
  if (document.visibilityState === "visible") void refrescarInventario();
}

function suscribir(oyente: () => void) {
  oyentes.add(oyente);
  if (oyentes.size === 1) {
    void refrescarInventario();
    reloj = window.setInterval(alVolverALaPestana, CADA_MILISEGUNDOS);
    document.addEventListener("visibilitychange", alVolverALaPestana);
  }
  return () => {
    oyentes.delete(oyente);
    if (oyentes.size === 0) {
      window.clearInterval(reloj);
      document.removeEventListener("visibilitychange", alVolverALaPestana);
    }
  };
}

const leer = () => inventario;
const leerEnServidor = () => null;

export function useInventarioVivo() {
  return useSyncExternalStore(suscribir, leer, leerEnServidor);
}

/** Lo que ya no sale en la hoja se trata como agotado. */
export function conDatosVivos(producto: Producto, vivo: Inventario | null) {
  if (!vivo) return producto;
  const dato = vivo[producto.slug];
  if (!dato) return { ...producto, stock: 0 };
  return {
    ...producto,
    stock: dato.stock,
    precio: dato.precio,
    peso: dato.peso,
  };
}

export function useProductoVivo(producto: Producto) {
  const vivo = useInventarioVivo();
  return useMemo(() => conDatosVivos(producto, vivo), [producto, vivo]);
}
