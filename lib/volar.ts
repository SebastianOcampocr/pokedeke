/**
 * La foto del producto sale volando hacia el carrito del encabezado.
 * Sin `foto`, usa la foto principal de la página de producto.
 */
export function volarAlCarrito(foto?: HTMLElement | null) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // Next conserva páginas ocultas: hay que escoger la foto que sí se ve.
  const origen =
    foto ??
    [...document.querySelectorAll<HTMLElement>("[data-foto-principal]")].find(
      (opcion) => opcion.getBoundingClientRect().width > 0,
    );
  const destino = document.querySelector<HTMLElement>("[data-carrito]");
  if (!origen || !destino) return;

  const inicio = origen.getBoundingClientRect();
  const fin = destino.getBoundingClientRect();
  const copia = origen.cloneNode(true) as HTMLElement;
  copia.removeAttribute("data-foto-principal");
  copia.setAttribute("data-copia-vuelo", "");
  copia.classList.remove("voltear");
  copia.removeAttribute("data-holo");
  copia.style.viewTransitionName = "none";
  Object.assign(copia.style, {
    position: "fixed",
    left: `${inicio.left}px`,
    top: `${inicio.top}px`,
    width: `${inicio.width}px`,
    height: `${inicio.height}px`,
    zIndex: "50",
    pointerEvents: "none",
    transformOrigin: "center",
  });
  document.body.append(copia);

  const dx = fin.left + fin.width / 2 - (inicio.left + inicio.width / 2);
  const dy = fin.top + fin.height / 2 - (inicio.top + inicio.height / 2);

  const vuelo = copia.animate(
    [
      { transform: "translate(0, 0) scale(1) rotate(0deg)", opacity: 1 },
      {
        transform: `translate(${dx * 0.45}px, ${dy * 0.45 - 40}px) scale(0.55) rotate(-14deg)`,
        opacity: 1,
        offset: 0.55,
      },
      {
        transform: `translate(${dx}px, ${dy}px) scale(0.06) rotate(12deg)`,
        opacity: 0.7,
      },
    ],
    { duration: 620, easing: "cubic-bezier(0.45, 0, 0.3, 1)" },
  );
  vuelo.finished.finally(() => {
    copia.remove();
    destino.animate(
      [
        { transform: "rotate(0) scale(1)" },
        { transform: "rotate(-14deg) scale(1.25)" },
        { transform: "rotate(10deg) scale(1.15)" },
        { transform: "rotate(0) scale(1)" },
      ],
      { duration: 340, easing: "ease-out" },
    );
  });
}
