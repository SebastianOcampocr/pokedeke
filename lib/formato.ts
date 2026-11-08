import type { Cupon } from "./tienda";

/** ₡45 000, con espacio que no se parte al final de una línea. */
export function colones(monto: number) {
  const cifras = Math.round(monto)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `₡${cifras}`;
}

const DIAS_Y_MESES =
  /(?<![\p{L}])(lunes|martes|miércoles|jueves|viernes|sábado|domingo|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre|ene|feb|mar|abr|may|jun|jul|ago|sept|set|oct|nov|dic)(?![\p{L}])/giu;

/**
 * La tienda escribe los días y los meses con mayúscula ("Miércoles 12 de
 * Noviembre"), aunque Intl los da en minúscula.
 */
export function conMayusculas(texto: string) {
  return texto.replace(
    DIAS_Y_MESES,
    (nombre) => nombre.charAt(0).toUpperCase() + nombre.slice(1),
  );
}

/** "5 de Diciembre". */
export function fechaLarga(iso: string) {
  return conMayusculas(
    new Intl.DateTimeFormat("es-CR", {
      day: "numeric",
      month: "long",
      timeZone: "America/Costa_Rica",
    }).format(new Date(iso)),
  );
}

/** "5 Dic". */
export function fechaCorta(iso: string) {
  return conMayusculas(
    new Intl.DateTimeFormat("es-CR", {
      day: "numeric",
      month: "short",
      timeZone: "America/Costa_Rica",
    }).format(new Date(iso)),
  );
}

export function calcularTotales(
  lineas: { precio: number; cantidad: number }[],
  cupon: Cupon | null,
  costoEnvio: number,
) {
  const subtotal = lineas.reduce(
    (suma, linea) => suma + linea.precio * linea.cantidad,
    0,
  );
  let descuento = 0;
  if (cupon?.tipo === "porcentaje") {
    descuento = Math.round((subtotal * cupon.valor) / 100);
  } else if (cupon?.tipo === "monto") {
    descuento = Math.min(cupon.valor, subtotal);
  }
  return {
    subtotal,
    descuento,
    envio: costoEnvio,
    total: subtotal - descuento + costoEnvio,
  };
}
