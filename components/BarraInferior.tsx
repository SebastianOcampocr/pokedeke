"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconoBuscar,
  IconoCartas,
  IconoEstante,
  IconoInicio,
} from "./Iconos";
import { SobreDibujo } from "./SobreDibujo";

const IZQUIERDA = [
  { href: "/", texto: "Inicio", Icono: IconoInicio },
  { href: "/catalogo", texto: "Catálogo", Icono: IconoCartas },
];

// "Mi lista" sigue en el corazón de arriba: aquí va Pokedeke Busca, que es lo que más vende.
const DERECHA = [
  // En pantallas de 320 px "Lo buscamos" no cabe en una línea: ahí dice "Busca".
  { href: "/busca", texto: "Lo buscamos", corto: "Busca", Icono: IconoBuscar },
  { href: "/nosotros", texto: "Mezzanine", Icono: IconoEstante },
];

/** Navegación de teléfono y tablet: abajo, donde llega el dedo. */
export function BarraInferior() {
  const ruta = usePathname();
  const actual = (href: string) => {
    const activa = href === "/" ? ruta === "/" : ruta.startsWith(href);
    return activa ? ("page" as const) : undefined;
  };

  return (
    <nav aria-label="Atajos" className="barra-inferior lg:hidden">
      {IZQUIERDA.map(({ href, texto, Icono }) => (
        <Link
          key={href}
          href={href}
          aria-current={actual(href)}
          className="barra-enlace"
        >
          <Icono tamano={22} />
          {texto}
        </Link>
      ))}
      <Link
        href="/sobre"
        aria-current={actual("/sobre")}
        className="barra-enlace"
      >
        <span className="barra-sobre block">
          <SobreDibujo />
        </span>
        Sobre
      </Link>
      {DERECHA.map(({ href, texto, corto, Icono }) => (
        <Link
          key={href}
          href={href}
          aria-current={actual(href)}
          aria-label={texto}
          className="barra-enlace"
        >
          <Icono tamano={22} />
          {corto ? (
            <>
              <span className="whitespace-nowrap max-[339px]:hidden">{texto}</span>
              <span className="min-[340px]:hidden">{corto}</span>
            </>
          ) : (
            texto
          )}
        </Link>
      ))}
    </nav>
  );
}
