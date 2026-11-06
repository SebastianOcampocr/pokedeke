"use client";

import { crearAlmacen } from "./almacen";
import { buscarProducto, precioACobrar, type Producto } from "./productos";
import { CUPONES, type Cupon } from "./tienda";
import { conDatosVivos, useInventarioVivo } from "./vivo";

type LineaGuardada = { slug: string; cantidad: number };
type Carrito = { lineas: LineaGuardada[]; cupon: string | null };

export type LineaCarrito = {
  producto: Producto;
  cantidad: number;
  precio: number;
};

const VACIO: Carrito = { lineas: [], cupon: null };
const almacen = crearAlmacen<Carrito>("demo-carrito", () => VACIO, VACIO);

export function useCarrito() {
  const carrito = almacen.usar();
  const vivo = useInventarioVivo();
  const lineas: LineaCarrito[] = carrito.lineas.flatMap((linea) => {
    const guardado = buscarProducto(linea.slug);
    if (!guardado) return [];
    const producto = conDatosVivos(guardado, vivo);
    return [
      {
        producto,
        cantidad: linea.cantidad,
        precio: precioACobrar(producto),
      },
    ];
  });
  const cupon: Cupon | null =
    CUPONES.find((opcion) => opcion.codigo === carrito.cupon) ?? null;
  const unidades = lineas.reduce((suma, linea) => suma + linea.cantidad, 0);
  return { lineas, cupon, unidades };
}

export function agregarAlCarrito(producto: Producto, cantidad: number) {
  almacen.guardar((previo) => {
    const existente = previo.lineas.find((l) => l.slug === producto.slug);
    const nueva = Math.min(
      (existente?.cantidad ?? 0) + cantidad,
      producto.stock,
    );
    const resto = previo.lineas.filter((l) => l.slug !== producto.slug);
    return {
      ...previo,
      lineas: [...resto, { slug: producto.slug, cantidad: nueva }],
    };
  });
}

export function cambiarCantidad(producto: Producto, cantidad: number) {
  almacen.guardar((previo) => ({
    ...previo,
    lineas: previo.lineas
      .map((linea) =>
        linea.slug === producto.slug
          ? { ...linea, cantidad: Math.min(cantidad, producto.stock) }
          : linea,
      )
      .filter((linea) => linea.cantidad > 0),
  }));
}

/** Devuelve falso si el código no existe, para avisarle a quien lo escribió. */
export function aplicarCupon(codigo: string) {
  const limpio = codigo.trim().toUpperCase();
  if (!CUPONES.some((opcion) => opcion.codigo === limpio)) return false;
  almacen.guardar((previo) => ({ ...previo, cupon: limpio }));
  return true;
}

export function quitarCupon() {
  almacen.guardar((previo) => ({ ...previo, cupon: null }));
}

export function vaciarCarrito() {
  almacen.guardar(() => VACIO);
}
