import Image from "next/image";
import { estadoDe, type Producto } from "@/lib/productos";
import { RUTA_BASE } from "@/lib/tienda";
import { Deke } from "./Deke";

/**
 * Foto del producto dentro de una caja con `position: relative`.
 * Casi todas las fotos traen fondo blanco: `mix-blend-multiply` lo funde con
 * el color de la caja para que no se vean como cuadros pegados.
 * Lo que todavía no tiene foto muestra a Deke, para no dejar el hueco vacío.
 */
export function FotoProducto({
  producto,
  indice = 0,
  alt,
  sizes,
  prioridad = false,
  className = "",
}: {
  producto: Producto;
  indice?: number;
  alt: string;
  sizes: string;
  prioridad?: boolean;
  className?: string;
}) {
  // Solo lo agotado se apaga: lo que viene en camino o se consulta se ve normal.
  const apagada = estadoDe(producto) === "Agotado" ? "opacity-60 grayscale" : "";
  const foto = producto.fotos[indice] ?? producto.fotos[0];

  if (!foto) {
    return (
      <span
        role={alt ? "img" : undefined}
        aria-label={alt || undefined}
        className={`sin-foto ${apagada}`}
      >
        <Deke className="h-1/2 max-h-28" />
        <span className="sin-foto-texto">Foto pronto</span>
      </span>
    );
  }

  const externa = /^https?:/.test(foto);

  return (
    <Image
      src={externa ? foto : `${RUTA_BASE}${foto}`}
      alt={alt}
      fill
      sizes={sizes}
      unoptimized={externa}
      loading={prioridad ? "eager" : "lazy"}
      fetchPriority={prioridad ? "high" : "auto"}
      className={`object-contain mix-blend-multiply ${apagada} ${className}`}
    />
  );
}
