"use client";

import { useEffect, useState } from "react";
import {
  categoriasConProducto,
  hayPedidosEspeciales,
  hayPreventas,
} from "@/lib/productos";

const AVISOS = [
  ...categoriasConProducto().map(({ texto }) => `¡Hay ${texto.toLowerCase()}!`),
  ...(hayPreventas() ? ["¡Hay preventas!"] : []),
  ...(hayPedidosEspeciales() ? ["¡Traemos de EE. UU.!"] : []),
];

if (AVISOS.length === 0) AVISOS.push("¡Pase adelante!");

/** El letrero colgado de la portada: cambia solo y se mece si lo tocan. */
export function Letrero({ className = "" }: { className?: string }) {
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    const reloj = window.setInterval(
      () => setIndice((valor) => valor + 1),
      6500,
    );
    return () => window.clearInterval(reloj);
  }, []);

  return (
    <button
      key={indice}
      type="button"
      aria-label="Cambiar el letrero"
      className={`letrero ${className}`}
      onClick={() => setIndice((valor) => valor + 1)}
    >
      {AVISOS[indice % AVISOS.length]}
    </button>
  );
}
