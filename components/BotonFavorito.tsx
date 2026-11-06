"use client";

import Link from "next/link";
import { useState } from "react";
import { cambiarFavorito, useFavoritos } from "@/lib/favoritos";
import { ganarLogro } from "@/lib/logros";
import { IconoCorazon } from "./Iconos";

export function BotonFavorito({
  slug,
  nombre,
  className = "relative",
}: {
  slug: string;
  nombre: string;
  className?: string;
}) {
  const { slugs } = useFavoritos();
  const [toques, setToques] = useState(0);
  const activo = slugs.includes(slug);

  return (
    <button
      type="button"
      aria-pressed={activo}
      aria-label={`Guardar ${nombre} en mi lista`}
      className={`flex size-11 shrink-0 cursor-pointer items-center justify-center ${className}`}
      onClick={() => {
        cambiarFavorito(slug);
        setToques((valor) => valor + 1);
        if (!activo && slugs.length + 1 >= 5) ganarLogro("lista");
      }}
    >
      <span className="flex size-8 items-center justify-center rounded-full border-2 border-tinta bg-white text-rojo">
        <span
          key={toques}
          className={activo && toques > 0 ? "corazon-activo" : undefined}
        >
          <IconoCorazon tamano={17} relleno={activo} />
        </span>
      </span>
      {activo && toques > 0 ? (
        <span key={toques} className="corazon-aro" />
      ) : null}
    </button>
  );
}

export function EnlaceFavoritos() {
  const { slugs } = useFavoritos();
  const cantidad = slugs.length;

  return (
    <Link
      href="/favoritos"
      aria-label={
        cantidad === 1 ? "Mi lista, 1 producto" : `Mi lista, ${cantidad} productos`
      }
      className="relative flex size-11 items-center justify-center"
    >
      <IconoCorazon />
      {cantidad > 0 ? (
        <span
          key={cantidad}
          className="saltar absolute top-0 right-0 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-tinta bg-azul px-1 text-[11px] font-extrabold text-white"
        >
          {cantidad}
        </span>
      ) : null}
    </Link>
  );
}
