import type { Metadata } from "next";
import { FormularioComentario } from "@/components/Comentarios";
import { CabeceraPagina, ZonaBlanca } from "@/components/Estructura";

export const metadata: Metadata = {
  title: "Danos tu opinión", alternates: { canonical: "/comentarios" },
  description: "Contanos cómo te fue con Pokedeke: qué te gustó y qué podemos mejorar.",
};

export default function PaginaComentarios() {
  return (
    <>
      <CabeceraPagina
        titulo="Danos tu opinión"
        texto="Somos una tienda pequeña y cada comentario cuenta: qué te gustó, qué falló o qué te gustaría encontrar."
      />
      <ZonaBlanca>
        <div className="mx-auto max-w-2xl">
          <FormularioComentario />
        </div>
      </ZonaBlanca>
    </>
  );
}
