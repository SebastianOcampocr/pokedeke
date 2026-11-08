"use client";

import { crearAlmacen } from "./almacen";
import { avisarCarrito, contarVisita } from "./api-pedidos";
import { buscarProducto, precioACobrar, type Producto } from "./productos";
import { CUPONES, type Cupon } from "./tienda";
import {
  conDatosVivos,
  useInventarioVivo,
  useOfertasVivas,
  type Oferta,
} from "./vivo";

type LineaGuardada = { slug: string; cantidad: number };
type Carrito = { lineas: LineaGuardada[]; cupon: string | null };

export type LineaCarrito = {
  producto: Producto;
  cantidad: number;
  precio: number;
  /** Con oferta: el precio de antes y el nombre de la oferta. */
  precioNormal?: number;
  oferta?: Oferta;
};

const VACIO: Carrito = { lineas: [], cupon: null };
const almacen = crearAlmacen<Carrito>("demo-carrito", () => VACIO, VACIO);

/* ---------- Pestaña Carritos: qué hay en cada carrito, sin datos personales ---------- */

const CLAVE_ID = "pokedeke-carrito-id";
const ESPERA_MS = 4000;
let pendiente: ReturnType<typeof setTimeout> | undefined;

/** Un número al azar por carrito. Después de un pedido se cambia por otro. */
export function idDelCarrito(nuevo = false) {
  try {
    let id = nuevo ? null : window.localStorage.getItem(CLAVE_ID);
    if (!id) {
      id =
        typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
      window.localStorage.setItem(CLAVE_ID, id);
    }
    return id;
  } catch {
    return "";
  }
}

function mandarCarrito(alSalir = false) {
  clearTimeout(pendiente);
  pendiente = undefined;
  const id = idDelCarrito();
  if (id) avisarCarrito(id, almacen.leer().lineas, alSalir);
}

/** Espera unos segundos para mandar un solo aviso aunque la persona toque varias veces. */
function contarCarrito() {
  clearTimeout(pendiente);
  pendiente = setTimeout(() => mandarCarrito(), ESPERA_MS);
}

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", () => {
    if (pendiente !== undefined) mandarCarrito(true);
  });
}

/** Debe calcular igual que aplicarOfertas en apps-script/Pedidos.gs. */
export function aplicarOfertas(lineas: LineaCarrito[], ofertas: Oferta[]) {
  return ofertas.reduce((actuales, oferta) => {
    const entra = (linea: LineaCarrito) =>
      oferta.slugs.includes(linea.producto.slug);
    const unidades = actuales
      .filter(entra)
      .reduce((suma, linea) => suma + linea.cantidad, 0);
    if (unidades < oferta.desde) return actuales;
    return actuales.map((linea) =>
      entra(linea) && linea.precio > oferta.precio
        ? {
            ...linea,
            precioNormal: linea.precioNormal ?? linea.precio,
            precio: oferta.precio,
            oferta,
          }
        : linea,
    );
  }, lineas);
}

export function useCarrito() {
  const carrito = almacen.usar();
  const vivo = useInventarioVivo();
  const ofertas = useOfertasVivas();
  const base: LineaCarrito[] = carrito.lineas.flatMap((linea) => {
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
  const lineas = aplicarOfertas(base, ofertas);
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
  contarCarrito();
  contarVisita(producto.slug, "carrito");
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
  contarCarrito();
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

/**
 * Después de un pedido, el script ya marcó el carrito como "Pidió": no se avisa
 * que quedó vacío y el próximo carrito lleva un número nuevo.
 */
export function vaciarCarrito({ trasPedido = false } = {}) {
  almacen.guardar(() => VACIO);
  if (trasPedido) {
    clearTimeout(pendiente);
    pendiente = undefined;
    idDelCarrito(true);
  } else {
    contarCarrito();
  }
}
