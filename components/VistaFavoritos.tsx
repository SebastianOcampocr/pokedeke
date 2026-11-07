"use client";

import Link from "next/link";
import { useHidratado } from "@/lib/almacen";
import { agregarAlCarrito } from "@/lib/carrito";
import { useFavoritos } from "@/lib/favoritos";
import { colones } from "@/lib/formato";
import { estaAgotado } from "@/lib/productos";
import { enlaceCompartir, TIENDA } from "@/lib/tienda";
import { useAgotadosAlFinal } from "@/lib/vivo";
import { Deke } from "./Deke";
import { IconoChat } from "./Iconos";
import { TarjetaProducto } from "./TarjetaProducto";

export function VistaFavoritos() {
  const hidratado = useHidratado();
  const { productos } = useFavoritos();
  const ordenados = useAgotadosAlFinal(productos);

  if (!hidratado) return <p>Cargando tu lista…</p>;

  if (productos.length === 0) {
    return (
      <div className="marco flex items-center gap-4 bg-crema p-6">
        <Deke animo="sorpresa" className="h-28 shrink-0 md:h-36" />
        <div className="flex flex-col items-start gap-3">
          <p className="font-display text-2xl leading-tight text-azul">
            Tu lista está vacía
          </p>
          <p>
            Tocá el corazón de lo que te guste y aquí te lo guardamos. Sirve
            para antojos, cumpleaños y para mandarle pistas a alguien.
          </p>
          <Link href="/catalogo" className="boton boton-rojo">
            Ver el catálogo
          </Link>
        </div>
      </div>
    );
  }

  const disponibles = productos.filter((producto) => !estaAgotado(producto));
  const total = disponibles.reduce((suma, producto) => suma + producto.precio, 0);
  const mensaje = [
    `Esta es mi lista de ${TIENDA.nombre}:`,
    ...productos.map(
      (producto) => `• ${producto.nombre}: ${colones(producto.precio)}`,
    ),
  ].join("\n");

  return (
    <div className="flex flex-col gap-6">
      <div className="marco shadow-dura flex flex-col gap-3 bg-crema p-4 md:flex-row md:items-center md:justify-between">
        <p className="text-lg font-extrabold">
          {productos.length === 1
            ? "1 producto"
            : `${productos.length} productos`}
          {total > 0 ? ` · ${colones(total)}` : ""}
        </p>
        <div className="flex flex-col gap-3 md:flex-row">
          <a
            href={enlaceCompartir(mensaje)}
            target="_blank"
            rel="noreferrer"
            className="boton boton-verde boton-chico"
          >
            <IconoChat tamano={18} />
            Mandar la lista por WhatsApp
          </a>
          {disponibles.length > 0 ? (
            <button
              type="button"
              className="boton boton-rojo boton-chico"
              onClick={() =>
                disponibles.forEach((producto) =>
                  agregarAlCarrito(producto, 1),
                )
              }
            >
              Echar todo al carrito
            </button>
          ) : null}
        </div>
      </div>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {ordenados.map((producto) => (
          <TarjetaProducto key={producto.slug} producto={producto} />
        ))}
      </div>
    </div>
  );
}
