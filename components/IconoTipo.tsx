import type { TipoEnergia } from "@/lib/productos";

/**
 * Ícono propio para el tipo de energía de una carta: un círculo con el color
 * del tipo y un dibujo simple. No copia los símbolos oficiales del juego.
 */
const DIBUJOS: Record<TipoEnergia, { fondo: string; tinta: string; d: string }> = {
  Planta: {
    fondo: "#3d9a46",
    tinta: "#fff",
    d: "M18 4C10.5 4 5.6 8.6 6 16c0 .5.1 1 .3 1.5L4.4 19.4l1.2 1.2 1.9-1.9c.5.2 1 .3 1.5.3C16.4 19 20 13.2 18 4Zm-4.2 5.6-4.9 6.6-1-.8 4.9-6.6 1 .8Z",
  },
  Fuego: {
    fondo: "#e0442b",
    tinta: "#fff",
    d: "M12 2.5c.8 3.4 5 5.2 5 10.2a5 5 0 0 1-10 0c0-2.6 1.4-4 2.2-5.2.3 1.6 1.1 2.6 2.1 3.1C11.6 8.2 11.9 5.4 12 2.5Z",
  },
  Agua: {
    fondo: "#2a86d1",
    tinta: "#fff",
    d: "M12 3c-2.9 4.3-5.6 7.4-5.6 10.7a5.6 5.6 0 0 0 11.2 0C17.6 10.4 14.9 7.3 12 3Z",
  },
  Rayo: {
    fondo: "#f5c518",
    tinta: "#141414",
    d: "M13.6 2.5 5.4 13.6h5.3l-1.3 7.9 8.2-11.1h-5.3l1.3-7.9Z",
  },
  Psíquico: {
    fondo: "#8f4bb0",
    tinta: "#fff",
    d: "M12 6C7 6 3.5 9.5 2.5 12c1 2.5 4.5 6 9.5 6s8.5-3.5 9.5-6c-1-2.5-4.5-6-9.5-6Zm0 2.6a3.4 3.4 0 1 1 0 6.8 3.4 3.4 0 0 1 0-6.8Zm0 2a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8Z",
  },
  Lucha: {
    fondo: "#b8612b",
    tinta: "#fff",
    d: "M7 8.4a1.5 1.5 0 0 1 3 0V8a1.5 1.5 0 0 1 3 0v.4a1.5 1.5 0 0 1 3 0v.8a1.5 1.5 0 0 1 3 0v4.3c0 3.6-2.9 6.5-6.5 6.5h-1C8.4 20 6 17.6 6 14.5V12c0-.7.4-1.2 1-1.4V8.4Z",
  },
  Oscuro: {
    fondo: "#2b3238",
    tinta: "#fff",
    d: "M14.6 3.4a8.6 8.6 0 1 0 6 13.4 7 7 0 0 1-6-13.4Z",
  },
  Metálico: {
    fondo: "#8d9aa5",
    tinta: "#fff",
    d: "M12 2.8 20 7.4v9.2l-8 4.6-8-4.6V7.4l8-4.6Zm0 5.6a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2Z",
  },
  Dragón: {
    fondo: "#b8962e",
    tinta: "#fff",
    d: "M6 4.5c2.5 3 3.5 8 2 15l-1.6-.4c1.2-6 .4-10.3-1.6-13.6L6 4.5Zm5-1c2.5 3.5 3.3 9 1.8 16l-1.6-.3c1.3-6.3.6-11-1.4-14.7l1.2-1Zm5 1c2 3 2.8 8 1.6 14.5l-1.6-.3c1.1-5.8.4-10.2-1.2-13.2l1.2-1Z",
  },
  Incoloro: {
    fondo: "#f2eee2",
    tinta: "#141414",
    d: "M12 2.5l2.4 7.1 7.1 2.4-7.1 2.4-2.4 7.1-2.4-7.1L2.5 12l7.1-2.4L12 2.5Z",
  },
  Hada: {
    fondo: "#e3779f",
    tinta: "#fff",
    d: "M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.5l-5.4 3 1.2-6-4.5-4.2 6.1-.7L12 3Z",
  },
};

export function IconoTipo({
  tipo,
  tamano = 24,
  className = "",
}: {
  tipo: TipoEnergia;
  tamano?: number;
  className?: string;
}) {
  const { fondo, tinta, d } = DIBUJOS[tipo];
  return (
    <span
      role="img"
      aria-label={`Tipo ${tipo}`}
      title={`Tipo ${tipo}`}
      className={`inline-flex shrink-0 items-center justify-center rounded-full border-2 border-tinta ${className}`}
      style={{ width: tamano, height: tamano, background: fondo, color: tinta }}
    >
      <svg viewBox="0 0 24 24" width={tamano * 0.68} height={tamano * 0.68} aria-hidden="true">
        <path d={d} fill="currentColor" fillRule="evenodd" />
      </svg>
    </span>
  );
}
