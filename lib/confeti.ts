const COLORES = ["#c8201a", "#1437a8", "#ffce1f", "#ffffff", "#0e7c43"];

/** Papelitos de colores del rótulo, sin librerías ni lienzo. */
export function lanzarConfeti(cantidad = 46) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const capa = document.createElement("div");
  capa.setAttribute("aria-hidden", "true");
  Object.assign(capa.style, {
    position: "fixed",
    inset: "0",
    overflow: "hidden",
    pointerEvents: "none",
    zIndex: "70",
  });
  document.body.append(capa);

  const alto = window.innerHeight;
  const ancho = window.innerWidth;

  const vuelos = Array.from({ length: cantidad }, (_, indice) => {
    const papel = document.createElement("span");
    const lado = 7 + Math.random() * 8;
    Object.assign(papel.style, {
      position: "absolute",
      left: `${ancho / 2}px`,
      top: `${alto * 0.42}px`,
      width: `${lado}px`,
      height: `${lado * (0.6 + Math.random())}px`,
      background: COLORES[indice % COLORES.length],
      border: "1.5px solid #141414",
    });
    capa.append(papel);

    const angulo = Math.random() * Math.PI * 2;
    const fuerza = 120 + Math.random() * Math.min(ancho * 0.45, 420);
    const x = Math.cos(angulo) * fuerza;
    const y = Math.sin(angulo) * fuerza * 0.7 - 80;

    return papel.animate(
      [
        { transform: "translate(0, 0) rotate(0deg)", opacity: 1 },
        {
          transform: `translate(${x}px, ${y}px) rotate(${180 + Math.random() * 360}deg)`,
          opacity: 1,
          offset: 0.4,
        },
        {
          transform: `translate(${x * 1.15}px, ${alto * 0.75}px) rotate(${540 + Math.random() * 540}deg)`,
          opacity: 0,
        },
      ],
      {
        duration: 1300 + Math.random() * 900,
        easing: "cubic-bezier(0.15, 0.7, 0.4, 1)",
      },
    ).finished;
  });

  Promise.all(vuelos).finally(() => capa.remove());
}
