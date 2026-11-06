"use client";

import { useEffect, useRef } from "react";

/** Cuenta desde cero al aparecer. Sin JavaScript se ve el número final. */
export function Contador({ valor }: { valor: number }) {
  const caja = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const nodo = caja.current;
    if (!nodo || valor === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cuadro = 0;
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada.isIntersecting) return;
        observador.disconnect();
        const inicio = performance.now();
        const duracion = 900;
        function paso(ahora: number) {
          if (!nodo) return;
          const avance = Math.min((ahora - inicio) / duracion, 1);
          const suave = 1 - (1 - avance) ** 3;
          nodo.textContent = String(Math.round(valor * suave));
          if (avance < 1) cuadro = requestAnimationFrame(paso);
        }
        cuadro = requestAnimationFrame(paso);
      },
      { threshold: 0.6 },
    );
    observador.observe(nodo);

    return () => {
      observador.disconnect();
      cancelAnimationFrame(cuadro);
    };
  }, [valor]);

  return <span ref={caja}>{valor}</span>;
}
