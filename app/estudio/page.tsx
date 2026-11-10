import type { Metadata } from "next";
import { CabeceraPagina, ZonaBlanca } from "@/components/Estructura";
import { Estudio } from "@/components/Estudio";

export const metadata: Metadata = {
  title: "Estudio de contenido",
  robots: { index: false, follow: false },
};

export default function PaginaEstudio() {
  return (
    <>
      <CabeceraPagina
        titulo="Estudio"
        texto="Para el equipo: imagen y textos para redes con los datos reales del catálogo. Esta dirección no aparece en la página."
      />
      <ZonaBlanca alta>
        <Estudio />
      </ZonaBlanca>
    </>
  );
}
