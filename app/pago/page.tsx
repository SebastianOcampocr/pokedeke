import type { Metadata } from "next";
import { CabeceraPagina, ZonaBlanca } from "@/components/Estructura";
import { Pago } from "@/components/Pago";

export const metadata: Metadata = { title: "Pago" };

export default function PaginaPago() {
  return (
    <>
      <CabeceraPagina titulo="Terminar la compra" />
      <ZonaBlanca alta>
        <Pago />
      </ZonaBlanca>
    </>
  );
}
