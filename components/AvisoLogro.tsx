"use client";

import { useEffect } from "react";
import { cerrarAvisoLogro, LOGROS, useLogros } from "@/lib/logros";

/** Cuando ganás un sticker, se pega un momento arriba de la pantalla. */
export function AvisoLogro() {
  const { aviso } = useLogros();

  useEffect(() => {
    if (!aviso) return;
    const reloj = window.setTimeout(cerrarAvisoLogro, 4200);
    return () => window.clearTimeout(reloj);
  }, [aviso]);

  const logro = LOGROS.find((opcion) => opcion.id === aviso);
  if (!logro) return null;

  return (
    <div key={logro.id} role="status" className="aviso-logro">
      <span className="sticker">{logro.marca}</span>
      <span>
        <span className="block text-[13px] font-bold">¡Sticker nuevo!</span>
        <span className="block leading-tight font-extrabold">
          {logro.titulo}
        </span>
      </span>
    </div>
  );
}
