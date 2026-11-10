import type { Metadata } from "next";
import { CabeceraPagina, ZonaBlanca } from "@/components/Estructura";
import { SobreDelDia } from "@/components/SobreDelDia";

export const metadata: Metadata = {
  title: "Sobre del día", alternates: { canonical: "/sobre" },
  description:
    "Abrí un sobre virtual y pegá las cartas en tu álbum.",
};

export default function PaginaSobre() {
  return (
    <>
      <CabeceraPagina
        titulo="Sobre del día"
        texto="Un sobre cada 24 horas: rasgalo, voltea las cartas y llená tu álbum."
      />
      <ZonaBlanca>
        <SobreDelDia />
      </ZonaBlanca>
    </>
  );
}
