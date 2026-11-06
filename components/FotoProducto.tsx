import Image from "next/image";
import { estaAgotado, type Producto } from "@/lib/productos";
import { RUTA_BASE } from "@/lib/tienda";

/**
 * Foto del producto dentro de una caja con `position: relative`.
 * Casi todas las fotos traen fondo blanco: `mix-blend-multiply` lo funde con
 * el color de la caja para que no se vean como cuadros pegados.
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
  const apagada = estaAgotado(producto) ? "opacity-60 grayscale" : "";

  return (
    <Image
      src={`${RUTA_BASE}${producto.fotos[indice] ?? producto.fotos[0]}`}
      alt={alt}
      fill
      sizes={sizes}
      loading={prioridad ? "eager" : "lazy"}
      fetchPriority={prioridad ? "high" : "auto"}
      className={`object-contain mix-blend-multiply ${apagada} ${className}`}
    />
  );
}
