"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { hayPedidosEspeciales } from "@/lib/productos";
import {
  IconoAvion,
  IconoCartas,
  IconoCorazon,
  IconoEstante,
  IconoInicio,
} from "./Iconos";
import { SobreDibujo } from "./SobreDibujo";

const IZQUIERDA = [
  { href: "/", texto: "Inicio", Icono: IconoInicio },
  { href: "/catalogo", texto: "Catálogo", Icono: IconoCartas },
];

// Mientras haya productos de Estados Unidos, ocupan el lugar de "Mi lista",
// que igual queda en el corazón de arriba.
const DERECHA = [
  hayPedidosEspeciales()
    ? {
        href: "/catalogo?etiqueta=Pedido%20especial",
        texto: "De EE. UU.",
        Icono: IconoAvion,
      }
    : { href: "/favoritos", texto: "Mi lista", Icono: IconoCorazon },
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
      {DERECHA.map(({ href, texto, Icono }) => (
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
    </nav>
  );
}
