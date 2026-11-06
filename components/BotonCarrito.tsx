"use client";

import Link from "next/link";
import { useCarrito } from "@/lib/carrito";
import { IconoCarrito } from "./Iconos";

export function BotonCarrito() {
  const { unidades } = useCarrito();
  const etiqueta =
    unidades === 1 ? "Carrito, 1 producto" : `Carrito, ${unidades} productos`;

  return (
    <Link
      href="/carrito"
      aria-label={etiqueta}
      data-carrito=""
      className="relative flex size-11 items-center justify-center"
    >
      <IconoCarrito />
      {unidades > 0 ? (
        <span
          key={unidades}
          className="saltar absolute top-0 right-0 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-tinta bg-rojo px-1 text-[11px] font-extrabold text-white"
        >
          {unidades}
        </span>
      ) : null}
    </Link>
  );
}
