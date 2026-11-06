"use client";

import { useEffect, useRef, useState } from "react";
import { agregarAlCarrito, useCarrito } from "@/lib/carrito";
import { esPreventa, type Producto } from "@/lib/productos";
import { sonar } from "@/lib/sonido";
import { volarAlCarrito } from "@/lib/volar";
import { IconoCheque, IconoMas } from "./Iconos";

/** El + de cada tarjeta: echa una unidad al carrito sin salir del catálogo. */
export function AgregarRapido({ producto }: { producto: Producto }) {
  const { lineas } = useCarrito();
  const [listo, setListo] = useState(false);
  const reloj = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(reloj.current), []);

  const enCarrito =
    lineas.find((linea) => linea.producto.slug === producto.slug)?.cantidad ?? 0;
  const lleno = enCarrito >= producto.stock;
  const verbo = esPreventa(producto) ? "Apartar" : "Agregar";

  return (
    <button
      type="button"
      aria-label={
        lleno
          ? `Ya tenés todos los ${producto.nombre} en el carrito`
          : `${verbo} ${producto.nombre} al carrito`
      }
      disabled={lleno && !listo}
      data-listo={listo ? "" : undefined}
      className="boton-mas"
      onClick={(evento) => {
        const foto = evento.currentTarget
          .closest("article")
          ?.querySelector<HTMLElement>("[data-foto-tarjeta]");
        agregarAlCarrito(producto, 1);
        volarAlCarrito(foto);
        sonar("sello");
        setListo(true);
        window.clearTimeout(reloj.current);
        reloj.current = window.setTimeout(() => setListo(false), 1200);
      }}
    >
      {listo ? <IconoCheque tamano={20} /> : <IconoMas tamano={20} />}
    </button>
  );
}
