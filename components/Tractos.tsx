"use client";

import { useState } from "react";
import { colones } from "@/lib/formato";
import { estaAgotado, seAparta, type Producto } from "@/lib/productos";
import { enlaceWhatsApp } from "@/lib/tienda";

const DESDE = 30000;
const OPCIONES = [2, 3, 4];
const CUANDO = ["Hoy", "En 15 días", "En 30 días", "En 45 días"];

/**
 * Apartado a la tica: se paga por partes y el producto se queda guardado hasta
 * el último tracto. No es crédito, así que no hay intereses ni riesgo de cobro.
 */
export function Tractos({ producto }: { producto: Producto }) {
  const [tractos, setTractos] = useState(3);

  if (producto.precio < DESDE) return null;
  if (estaAgotado(producto) || seAparta(producto)) return null;

  const cuota = Math.ceil(producto.precio / tractos / 100) * 100;
  const ultima = producto.precio - cuota * (tractos - 1);
  const montos = Array.from({ length: tractos }, (_, indice) =>
    indice === tractos - 1 ? ultima : cuota,
  );

  return (
    <details className="pregunta marco">
      <summary>Apartalo en tractos, sin intereses</summary>
      <div className="flex flex-col gap-3 p-4">
        <div
          role="group"
          aria-label="Cantidad de tractos"
          className="flex flex-wrap gap-2"
        >
          {OPCIONES.map((opcion) => (
            <button
              key={opcion}
              type="button"
              className="chip"
              aria-pressed={tractos === opcion}
              onClick={() => setTractos(opcion)}
            >
              {opcion} tractos
            </button>
          ))}
        </div>
        <ol className="flex flex-col gap-1 text-[15px]">
          {montos.map((monto, indice) => (
            <li key={CUANDO[indice]} className="flex justify-between gap-3">
              <span>{CUANDO[indice]}</span>
              <span className="font-extrabold">{colones(monto)}</span>
            </li>
          ))}
        </ol>
        <p className="text-sm leading-snug text-gris">
          Te lo guardamos en el mezzanine y te lo entregamos con el último
          tracto.
        </p>
        <a
          href={enlaceWhatsApp(
            `¡Hola! Quiero apartar ${producto.nombre} en ${tractos} tractos de ${colones(cuota)}.`,
          )}
          target="_blank"
          rel="noreferrer"
          className="boton boton-amarillo boton-chico"
        >
          Apartarlo por WhatsApp
        </a>
      </div>
    </details>
  );
}
