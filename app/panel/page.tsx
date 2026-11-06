import type { Metadata } from "next";
import { CabeceraPagina, ZonaBlanca } from "@/components/Estructura";
import { Panel } from "@/components/Panel";

export const metadata: Metadata = {
  title: "Panel de administración",
  robots: { index: false, follow: false },
};

export default function PaginaPanel() {
  return (
    <>
      <CabeceraPagina
        titulo="Panel"
        texto="En la tienda real esta página pide contraseña. Aquí los pedidos son de muestra."
      />
      <ZonaBlanca>
        <Panel />
      </ZonaBlanca>
    </>
  );
}
