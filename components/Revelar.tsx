"use client";

import { useLayoutEffect, useRef, type CSSProperties } from "react";

/**
 * Hace saltar una tarjeta cuando aparece al bajar por la página.
 * Solo esconde lo que está más abajo de la pantalla y ya en el navegador:
 * si la conexión va lenta o no hay JavaScript, todo se ve normal.
 */
export function Revelar({
  children,
  indice = 0,
  efecto,
}: {
  children: React.ReactNode;
  indice?: number;
  efecto?: "sello";
}) {
  const caja = useRef<HTMLDivElement>(null);
  const yaSalio = useRef(false);

  useLayoutEffect(() => {
    const nodo = caja.current;
    if (!nodo || yaSalio.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (nodo.getBoundingClientRect().top < window.innerHeight) return;

    nodo.dataset.revelar = "espera";

    function alTerminar(evento: AnimationEvent) {
      if (evento.target !== nodo || !nodo) return;
      nodo.removeEventListener("animationend", alTerminar);
      nodo.dataset.revelar = "listo";
    }

    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada.isIntersecting) return;
        observador.disconnect();
        yaSalio.current = true;
        nodo.addEventListener("animationend", alTerminar);
        nodo.dataset.revelar = "sale";
      },
      { rootMargin: "0px 0px -6% 0px" },
    );
    observador.observe(nodo);

    return () => {
      observador.disconnect();
      if (!yaSalio.current) delete nodo.dataset.revelar;
    };
  }, []);

  return (
    <div
      ref={caja}
      data-efecto={efecto}
      style={{ "--retraso": `${(indice % 4) * 70}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}
