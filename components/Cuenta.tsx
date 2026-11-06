"use client";

import { useSyncExternalStore } from "react";

function suscribir(aviso: () => void) {
  const reloj = window.setInterval(aviso, 1000);
  return () => window.clearInterval(reloj);
}

const leerAhora = () => Math.floor(Date.now() / 1000) * 1000;
const sinHora = () => 0;

function Digito({ valor, rotulo }: { valor: number | null; rotulo: string }) {
  const texto = valor === null ? "--" : String(valor).padStart(2, "0");
  return (
    <span className="flex flex-col items-center gap-1">
      <span className="flex min-w-[3.1rem] justify-center overflow-hidden rounded-md border-3 border-tinta bg-white px-1.5 py-1 font-display text-[26px] leading-none text-azul md:min-w-16 md:text-4xl">
        <span key={texto} className="digito inline-block">
          {texto}
        </span>
      </span>
      <span className="text-[11px] font-bold tracking-wide uppercase">
        {rotulo}
      </span>
    </span>
  );
}

/** Reloj de preventa. Antes de hidratar muestra rayas para no dar una hora vieja. */
export function Cuenta({ llegada }: { llegada: string }) {
  const ahora = useSyncExternalStore(suscribir, leerAhora, sinHora);
  const fecha = new Intl.DateTimeFormat("es-CR", {
    day: "numeric",
    month: "long",
    timeZone: "America/Costa_Rica",
  }).format(new Date(llegada));

  const resta = ahora ? new Date(llegada).getTime() - ahora : null;

  if (resta !== null && resta <= 0) {
    return <p className="font-extrabold">¡Ya casi aterriza en el mezzanine!</p>;
  }

  const segundos = resta === null ? null : Math.floor(resta / 1000);

  return (
    <div role="timer" aria-label={`Llega el ${fecha}`} className="flex flex-wrap gap-2">
      <Digito
        valor={segundos === null ? null : Math.floor(segundos / 86400)}
        rotulo="Días"
      />
      <Digito
        valor={segundos === null ? null : Math.floor(segundos / 3600) % 24}
        rotulo="Horas"
      />
      <Digito
        valor={segundos === null ? null : Math.floor(segundos / 60) % 60}
        rotulo="Min"
      />
      <Digito valor={segundos === null ? null : segundos % 60} rotulo="Seg" />
    </div>
  );
}
