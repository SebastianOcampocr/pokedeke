import type { Metadata } from "next";
import { TIENDA } from "@/lib/tienda";
import Link from "next/link";
import { CabeceraPagina, ZonaBlanca } from "@/components/Estructura";

export const metadata: Metadata = {
  title: "Políticas",
  description: "Envíos, cambios y devoluciones, términos y privacidad.",
};

const SECCIONES = [
  { id: "envios", titulo: "Envíos" },
  { id: "cambios", titulo: "Cambios y devoluciones" },
  { id: "terminos", titulo: "Términos" },
  { id: "privacidad", titulo: "Privacidad" },
];

export default function PaginaPoliticas() {
  return (
    <>
      <CabeceraPagina
        titulo="Políticas"
        texto="Texto de muestra para la demo. No es asesoría legal."
      />
      <ZonaBlanca>
        <div className="mx-auto max-w-2xl">
          <nav aria-label="Secciones" className="flex flex-wrap gap-2">
            {SECCIONES.map((seccion) => (
              <Link key={seccion.id} href={`#${seccion.id}`} className="chip">
                {seccion.titulo}
              </Link>
            ))}
          </nav>

          <div className="texto-legal">
            <h2 id="envios" className="scroll-mt-20">
              Envíos
            </h2>
            <p>
              Enviamos por Correos de Costa Rica a todo el país, o podés retirar
              gratis en el Edificio Omni, en San José, cuadrando día y hora por
              WhatsApp. El costo del envío lo paga quien compra y se muestra
              antes de confirmar el pedido. En compras desde ₡50 000, el envío
              por Correos va por nuestra cuenta.
            </p>
            <p>Despachamos cuando el pago esté confirmado: [plazo por definir].</p>

            <h2 id="cambios" className="scroll-mt-20">
              Cambios y devoluciones
            </h2>
            <p>
              Si tu producto llegó dañado o no es el que pediste, escribinos
              dentro de [plazo por definir] con fotos del empaque.
            </p>
            <ul>
              <li>El producto sellado se acepta solo con el sello intacto.</li>
              <li>Las cartas sueltas se revisan caso por caso.</li>
              <li>
                Los adelantos de preventa: [condiciones de devolución por
                definir].
              </li>
            </ul>

            <h2 id="terminos" className="scroll-mt-20">
              Términos
            </h2>
            <p>
              Los precios están en colones. El producto queda apartado por 24
              horas desde que hacés el pedido; si no se recibe el pago en ese
              plazo, el apartado se libera.
            </p>

            <h2 id="privacidad" className="scroll-mt-20">
              Privacidad
            </h2>
            <p>
              Usamos tu nombre, contacto y dirección solo para procesar tu
              pedido y coordinar la entrega. Podés pedir que corrijamos o
              borremos tus datos escribiendo a {TIENDA.correo}.
            </p>
            <p>
              Este borrador debe adaptarse a la Ley 8968 de Protección de la
              Persona frente al Tratamiento de sus Datos Personales.
            </p>
          </div>
        </div>
      </ZonaBlanca>
    </>
  );
}
