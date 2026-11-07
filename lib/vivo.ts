"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { Producto } from "./productos";
import { PEDIDOS_URL } from "./tienda";

type Inventario = Record<
  string,
  { stock: number; precio: number; peso?: number }
>;

/** Precio especial por llevar varias unidades. La anuncia la hoja, que es la que cobra. */
export type Oferta = {
  nombre: string;
  desde: number;
  precio: number;
  slugs: string[];
  /** Lo que se escribe en el buscador del catálogo para encontrarlos. */
  buscar?: string;
};

const SIN_OFERTAS: Oferta[] = [];

/** Cada cuánto se pregunta mientras la pestaña esté a la vista. */
const CADA_MILISEGUNDOS = 15_000;

let inventario: Inventario | null = null;
let ofertas = SIN_OFERTAS;
/** Con esto la hoja responde "igual" y no repite todo el inventario. */
let version = "";
let reloj: number | undefined;
const oyentes = new Set<() => void>();

/** La página armada puede tener minutos de atraso: esto trae el dato de la hoja. */
export async function refrescarInventario() {
  if (!PEDIDOS_URL) return;
  try {
    const consulta = new URLSearchParams({ accion: "stock", version });
    const respuesta = await fetch(`${PEDIDOS_URL}?${consulta}`);
    const datos = await respuesta.json();
    if (!datos.ok || datos.igual || !datos.productos) return;
    inventario = datos.productos as Inventario;
    ofertas = Array.isArray(datos.ofertas)
      ? (datos.ofertas as Oferta[])
      : SIN_OFERTAS;
    version = datos.version ?? "";
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

const leerOfertas = () => ofertas;
const sinOfertas = () => SIN_OFERTAS;

/** Sin respuesta de la hoja no hay ofertas: así nunca se muestra un precio que no se cobra. */
export function useOfertasVivas() {
  return useSyncExternalStore(suscribir, leerOfertas, sinOfertas);
}

/**
 * La oferta de un producto, solo si en este momento alcanza el stock para
 * llegar a la cantidad que pide. Si no, sería prometer algo imposible.
 */
export function useOfertaDe(slug: string) {
  const vivo = useInventarioVivo();
  const vigentes = useOfertasVivas();
  return useMemo(() => {
    const oferta = vigentes.find((opcion) => opcion.slugs.includes(slug));
    if (!oferta || !vivo) return null;
    const hay = oferta.slugs.reduce(
      (suma, otro) => suma + (vivo[otro]?.stock ?? 0),
      0,
    );
    return hay >= oferta.desde ? oferta : null;
  }, [slug, vivo, vigentes]);
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

/** Lo agotado siempre va de último, con el stock de este momento. */
export function useAgotadosAlFinal(productos: Producto[]) {
  const vivo = useInventarioVivo();
  return useMemo(() => {
    const quedan = (producto: Producto) =>
      conDatosVivos(producto, vivo).stock > 0;
    return [
      ...productos.filter(quedan),
      ...productos.filter((producto) => !quedan(producto)),
    ];
  }, [productos, vivo]);
}

export function useProductoVivo(producto: Producto) {
  const vivo = useInventarioVivo();
  return useMemo(() => conDatosVivos(producto, vivo), [producto, vivo]);
}
