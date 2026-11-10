import type { Metadata } from "next";
import { Suspense } from "react";
import {
  EstadoPedido,
  EstadoPedidoDesdeEnlace,
} from "@/components/EstadoPedido";
import { CabeceraPagina, ZonaBlanca } from "@/components/Estructura";

export const metadata: Metadata = { title: "Estado del pedido", robots: { index: false, follow: true } };

export default function PaginaPedido() {
  return (
    <>
      <CabeceraPagina
        titulo="¿En qué va mi pedido?"
        texto="Poné tu número de pedido y tu WhatsApp."
      />
      <ZonaBlanca alta>
        <Suspense fallback={<EstadoPedido />}>
          <EstadoPedidoDesdeEnlace />
        </Suspense>
      </ZonaBlanca>
    </>
  );
}
