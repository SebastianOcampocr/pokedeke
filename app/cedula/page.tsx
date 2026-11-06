import type { Metadata } from "next";
import { Cedula } from "@/components/Cedula";
import { CabeceraPagina, ZonaBlanca } from "@/components/Estructura";

export const metadata: Metadata = {
  title: "Cédula de Coleccionista",
  description:
    "Sacá tu cédula de la República del Mezzanine, juntá stickers y compartila.",
};

export default function PaginaCedula() {
  return (
    <>
      <CabeceraPagina
        titulo="Cédula de Coleccionista"
        texto="El único trámite que da gusto hacer: sin filas, sin fotocopias y con stickers."
      />
      <ZonaBlanca>
        <Cedula />
      </ZonaBlanca>
    </>
  );
}
