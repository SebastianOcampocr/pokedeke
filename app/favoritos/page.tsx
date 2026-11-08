import type { Metadata } from "next";
import { CabeceraPagina, ZonaBlanca } from "@/components/Estructura";
import { VistaFavoritos } from "@/components/VistaFavoritos";

export const metadata: Metadata = {
  title: "Mi lista",
  description: "Lo que te gustó, guardado para después o para mandar pistas.",
};

export default function PaginaFavoritos() {
  return (
    <>
      <CabeceraPagina
        titulo="Mi lista"
        texto="Lo que te gustó, guardado para después o para mandar pistas."
      />
      <ZonaBlanca alta>
        <VistaFavoritos />
      </ZonaBlanca>
    </>
  );
}
