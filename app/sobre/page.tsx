import type { Metadata } from "next";
import { CabeceraPagina, ZonaBlanca } from "@/components/Estructura";
import { SobreDelDia } from "@/components/SobreDelDia";

export const metadata: Metadata = {
  title: "Sobre del día",
  description:
    "Abrí un sobre virtual, pegá las cartas en tu álbum y probá suerte con un cupón.",
};

export default function PaginaSobre() {
  return (
    <>
      <CabeceraPagina
        titulo="Sobre del día"
        texto="Rasgalo, voltea las cartas y llená tu álbum. Capaz te sale un cupón."
      />
      <ZonaBlanca>
        <SobreDelDia />
      </ZonaBlanca>
    </>
  );
}
