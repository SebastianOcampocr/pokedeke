"use client";

import { useEffect } from "react";

const INCLINACION = { foil: 20, suave: 9 };

/**
 * Un solo oyente para toda la página: inclina las tarjetas con `data-holo`,
 * hace que los ojos de Deke sigan al puntero y mueve la portada.
 */
export function EfectosGlobales() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let activo: HTMLElement | null = null;
    let cuadro = 0;
    let evento: PointerEvent | null = null;

    function soltar() {
      if (!activo) return;
      activo.removeAttribute("data-holo-activo");
      activo.style.removeProperty("--rx");
      activo.style.removeProperty("--ry");
      activo = null;
    }

    function inclinar(actual: PointerEvent) {
      const objetivo =
        actual.target instanceof Element
          ? actual.target.closest<HTMLElement>("[data-holo]")
          : null;
      if (activo && activo !== objetivo) soltar();
      if (!objetivo) return;

      const caja = objetivo.getBoundingClientRect();
      const x = (actual.clientX - caja.left) / caja.width;
      const y = (actual.clientY - caja.top) / caja.height;
      const fuerza =
        INCLINACION[objetivo.dataset.holo === "foil" ? "foil" : "suave"];
      objetivo.style.setProperty("--x", `${x * 100}%`);
      objetivo.style.setProperty("--y", `${y * 100}%`);
      objetivo.style.setProperty("--rx", `${(0.5 - y) * fuerza}deg`);
      objetivo.style.setProperty("--ry", `${(x - 0.5) * fuerza}deg`);
      objetivo.setAttribute("data-holo-activo", "");
      activo = objetivo;
    }

    function mirar(actual: PointerEvent) {
      document.querySelectorAll<SVGElement>("[data-deke]").forEach((deke) => {
        const caja = deke.getBoundingClientRect();
        // Next deja páginas ocultas: esas no tienen tamaño y no se tocan.
        if (caja.width === 0) return;
        const dx = actual.clientX - (caja.left + caja.width / 2);
        const dy = actual.clientY - (caja.top + caja.height * 0.4);
        const distancia = Math.hypot(dx, dy) || 1;
        const alcance = Math.min(distancia / 110, 1) * 3.6;
        deke.style.setProperty("--ojo-x", `${(dx / distancia) * alcance}px`);
        deke.style.setProperty("--ojo-y", `${(dy / distancia) * alcance}px`);
      });
    }

    function mover(actual: PointerEvent) {
      const portada = document.querySelector<HTMLElement>("[data-paralaje]");
      if (!portada) return;
      const x = actual.clientX / window.innerWidth - 0.5;
      const y = actual.clientY / window.innerHeight - 0.5;
      portada.style.setProperty("--px", x.toFixed(3));
      portada.style.setProperty("--py", y.toFixed(3));
    }

    function pintar() {
      cuadro = 0;
      if (!evento) return;
      inclinar(evento);
      if (evento.pointerType === "mouse") {
        mirar(evento);
        mover(evento);
      }
    }

    function alMover(actual: PointerEvent) {
      evento = actual;
      if (!cuadro) cuadro = requestAnimationFrame(pintar);
    }

    document.addEventListener("pointermove", alMover, { passive: true });
    document.addEventListener("pointerdown", alMover, { passive: true });
    document.addEventListener("pointerup", soltar);
    document.addEventListener("pointercancel", soltar);
    document.documentElement.addEventListener("pointerleave", soltar);

    return () => {
      cancelAnimationFrame(cuadro);
      document.removeEventListener("pointermove", alMover);
      document.removeEventListener("pointerdown", alMover);
      document.removeEventListener("pointerup", soltar);
      document.removeEventListener("pointercancel", soltar);
      document.documentElement.removeEventListener("pointerleave", soltar);
    };
  }, []);

  return null;
}
