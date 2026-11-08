import type { Metadata } from "next";
import { CabeceraPagina, ZonaBlanca } from "@/components/Estructura";
import { VistaCarrito } from "@/components/VistaCarrito";

export const metadata: Metadata = { title: "Carrito" };

export default function PaginaCarrito() {
  return (
    <>
      <CabeceraPagina titulo="Tu carrito" />
      <ZonaBlanca alta>
        <VistaCarrito />
      </ZonaBlanca>
    </>
  );
}
