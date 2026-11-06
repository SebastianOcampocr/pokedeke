import Link from "next/link";
import { Deke } from "@/components/Deke";
import { CabeceraPagina, ZonaBlanca } from "@/components/Estructura";

export default function NoEncontrado() {
  return (
    <>
      <CabeceraPagina
        titulo="Esta carta no salió en el sobre"
        texto="No hallamos esa página."
      />
      <ZonaBlanca>
        <div className="flex items-center gap-5">
          <Deke animo="triste" className="h-32 shrink-0" />
          <Link href="/catalogo" className="boton boton-rojo">
            Ver el catálogo
          </Link>
        </div>
      </ZonaBlanca>
    </>
  );
}
