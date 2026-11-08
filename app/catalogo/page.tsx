import type { Metadata } from "next";
import { Suspense } from "react";
import { Catalogo, CatalogoDesdeEnlace } from "@/components/Catalogo";
import { CabeceraPagina, ZonaBlanca } from "@/components/Estructura";

export const metadata: Metadata = {
  alternates: { canonical: "/catalogo" },
  title: "Catálogo",
  description: "Sobres, cajas, ETB, cartas sueltas, gradadas y accesorios de Pokémon.",
};

export default function PaginaCatalogo() {
  return (
    <>
      <CabeceraPagina
        titulo="Catálogo"
        texto="Sobres, cajas, cartas sueltas, gradadas y accesorios de Pokémon."
      />
      <ZonaBlanca>
        <Suspense fallback={<Catalogo />}>
          <CatalogoDesdeEnlace />
        </Suspense>
      </ZonaBlanca>
    </>
  );
}
