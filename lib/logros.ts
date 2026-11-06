"use client";

import { crearAlmacen } from "./almacen";

export const LOGROS = [
  { id: "sobre", marca: "1", titulo: "Primer sobre", texto: "Abriste tu primer sobre del día." },
  { id: "album", marca: "10", titulo: "Álbum en camino", texto: "Juntaste 10 cartas en tu álbum." },
  { id: "completo", marca: "★", titulo: "Álbum completo", texto: "Tenés todas las cartas del álbum." },
  { id: "joya", marca: "◆", titulo: "Manos de oro", texto: "Te salió una joya en un sobre." },
  { id: "lista", marca: "♥", titulo: "Lista larga", texto: "Guardaste 5 productos en tu lista." },
  { id: "guia", marca: "?", titulo: "Bien asesorado", texto: "Dejaste que Deke te ayudara a escoger." },
  { id: "pedido", marca: "₡", titulo: "Cliente de confianza", texto: "Hiciste tu primer pedido." },
  { id: "cedula", marca: "ID", titulo: "Papeles al día", texto: "Sacaste tu Cédula de Coleccionista." },
  { id: "shiny", marca: "S", titulo: "Descubriste el secreto", texto: "Volviste shiny a Deke." },
] as const;

export type IdLogro = (typeof LOGROS)[number]["id"];

type Estado = { ganados: IdLogro[]; aviso: IdLogro | null };

const VACIO: Estado = { ganados: [], aviso: null };
const almacen = crearAlmacen<Estado>("demo-logros", () => VACIO, VACIO);

export function useLogros() {
  return almacen.usar();
}

export function ganarLogro(id: IdLogro) {
  almacen.guardar((previo) =>
    previo.ganados.includes(id)
      ? previo
      : { ganados: [...previo.ganados, id], aviso: id },
  );
}

export function cerrarAvisoLogro() {
  almacen.guardar((previo) => ({ ...previo, aviso: null }));
}

const RANGOS = [
  { desde: 8, nombre: "Socio honorario de Deke" },
  { desde: 6, nombre: "Vecino del mezzanine" },
  { desde: 4, nombre: "Cazador de sobres" },
  { desde: 2, nombre: "Cliente de confianza" },
  { desde: 0, nombre: "Novato de pulpería" },
];

export function rangoPorLogros(cantidad: number) {
  return (
    RANGOS.find((rango) => cantidad >= rango.desde)?.nombre ??
    "Novato de pulpería"
  );
}
