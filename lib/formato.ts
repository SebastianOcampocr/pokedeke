import type { Cupon } from "./tienda";

/** ₡45 000, con espacio que no se parte al final de una línea. */
export function colones(monto: number) {
  const cifras = Math.round(monto)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `₡${cifras}`;
}

/** "5 de diciembre". */
export function fechaLarga(iso: string) {
  return new Intl.DateTimeFormat("es-CR", {
    day: "numeric",
    month: "long",
    timeZone: "America/Costa_Rica",
  }).format(new Date(iso));
}

export function fechaCorta(iso: string) {
  return new Intl.DateTimeFormat("es-CR", {
    day: "numeric",
    month: "short",
    timeZone: "America/Costa_Rica",
  }).format(new Date(iso));
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
