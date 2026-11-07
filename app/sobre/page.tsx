import type { Metadata } from "next";
import { CabeceraPagina, ZonaBlanca } from "@/components/Estructura";
import { SobreDelDia } from "@/components/SobreDelDia";

export const metadata: Metadata = {
  title: "Sobre del día",
  description:
    "Abrí un sobre virtual y pegá las cartas en tu álbum.",
};

export default function PaginaSobre() {
  return (
    <>
      <CabeceraPagina
        titulo="Sobre del día"
        texto="Rasgalo, voltea las cartas y llená tu álbum."
      />
      <ZonaBlanca>
        <SobreDelDia />
      </ZonaBlanca>
    </>
  );
}
