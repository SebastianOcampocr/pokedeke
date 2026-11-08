import masVistosGuardados from "@/datos/mas-vistos.json";
import opinionesGuardadas from "@/datos/opiniones.json";
import { buscarProducto, estaAgotado, type Producto } from "./productos";

/**
 * Lo que la portada muestra aparte del catálogo. scripts/traer-extras.mjs llena
 * estos archivos desde la hoja: no se editan a mano.
 */
export type Opinion = {
  fecha: string;
  estrellas: number;
  comentario: string;
  nombre: string;
  /** Vino del correo de "¿Cómo te fue?": es una compra real. */
  compra: boolean;
};

type Visto = { slug: string; vistas: number; agregados: number };

/** Solo las que la persona dejó mostrar y la tienda marcó para publicar. */
export const OPINIONES = opinionesGuardadas as Opinion[];

/** Con menos que esto la lista es pura casualidad: mejor no mostrarla. */
const MINIMO_DE_PUNTOS = 3;
const MINIMO_DE_PRODUCTOS = 4;

/**
 * Lo que más se mira y se agrega al carrito, con stock y que no esté ya en
 * `aparte` (lo destacado). Agregar al carrito pesa como tres vistas. Vacío si
 * todavía no hay suficientes visitas.
 */
export function masVistos(cantidad: number, aparte: string[] = []) {
  const lista = (masVistosGuardados as Visto[])
    .filter(({ vistas, agregados }) => vistas + 3 * agregados >= MINIMO_DE_PUNTOS)
    .map(({ slug }) => buscarProducto(slug))
    .filter(
      (producto): producto is Producto =>
        Boolean(producto) &&
        !estaAgotado(producto!) &&
        !aparte.includes(producto!.slug),
    )
    .slice(0, cantidad);
  return lista.length >= MINIMO_DE_PRODUCTOS ? lista : [];
}
