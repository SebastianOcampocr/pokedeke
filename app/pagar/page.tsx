import type { Metadata } from "next";
import { CabeceraPagina, ZonaBlanca } from "@/components/Estructura";
import { PagarPedido } from "@/components/PagarPedido";

export const metadata: Metadata = {
  title: "Pagá tu pedido",
  robots: { index: false, follow: false },
};

export default function PaginaPagar() {
  return (
    <>
      <CabeceraPagina titulo="Pagá tu pedido" />
      <ZonaBlanca alta>
        <PagarPedido />
      </ZonaBlanca>
    </>
  );
}
