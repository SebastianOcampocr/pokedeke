import type { Metadata } from "next";
import { Comprobante } from "@/components/Comprobante";
import { ZonaBlanca } from "@/components/Estructura";

export const metadata: Metadata = {
  title: "Tu comprobante",
  robots: { index: false, follow: false },
};

export default function PaginaComprobante() {
  return (
    <ZonaBlanca alta>
      <Comprobante />
    </ZonaBlanca>
  );
}
