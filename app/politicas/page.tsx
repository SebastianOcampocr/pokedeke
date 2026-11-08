import type { Metadata } from "next";
import { enlaceWhatsApp, TIENDA } from "@/lib/tienda";
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
        texto="Lo que conviene saber antes de comprar en Pokedeke."
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
              WhatsApp. El costo del envío lo paga quien compra. Sale de la
              tarifa de Correos, depende de tu cantón y del peso del pedido, y
              se muestra antes de confirmar. En compras desde ₡50 000, el envío
              por Correos va por nuestra cuenta. También hacemos envío entre
              tiendas: elegís la tienda de cartas donde lo retirás y el precio
              (de ₡600 a ₡900 según la tienda) se suma al mismo SINPE de los
              productos. Si tu tienda no está en la lista, te confirmamos el
              precio por WhatsApp. Lo que tarda depende de la tienda.
            </p>
            <p>
              Los envíos por Correos y entre tiendas salen los miércoles y
              sábados. Lo que se pide de sábado a martes sale el miércoles, y lo
              que se pide de miércoles a viernes sale el sábado, siempre que el
              pago ya esté confirmado. Te pasamos el número de guía por
              WhatsApp. El tiempo de entrega de Correos depende de tu zona.
            </p>

            <h2 id="cambios" className="scroll-mt-20">
              Cambios y devoluciones
            </h2>
            <p>
              En compras por internet tenés 8 días hábiles desde que recibís el
              pedido para arrepentirte de la compra. El producto debe volver en
              el mismo estado en que lo recibiste, y te devolvemos el monto por
              SINPE Móvil.
            </p>
            <p>
              Si tu producto llegó dañado o no es el que pediste,{" "}
              <a
                href={enlaceWhatsApp("¡Hola! Tengo un problema con mi pedido.")}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                escribinos por WhatsApp
              </a>{" "}
              dentro de esos 8 días hábiles con fotos del empaque y del
              producto. Te lo cambiamos o te devolvemos la plata.
            </p>
            <ul>
              <li>El producto sellado se acepta solo con el sello intacto.</li>
              <li>
                Las cartas sueltas deben volver en la misma condición en que
                salieron.
              </li>
              <li>
                Si una preventa se cancela o se atrasa más de 30 días, te
                devolvemos todo el adelanto. Si querés cancelarla vos, avisanos
                dentro de 8 días hábiles desde que pagaste el adelanto.
              </li>
            </ul>

            <h2 id="terminos" className="scroll-mt-20">
              Términos
            </h2>
            <p>
              Los precios están en colones y vale el monto que ves al confirmar
              tu pedido. El producto queda apartado por 24 horas desde que hacés
              el pedido; si no se recibe el pago en ese plazo, el apartado se
              libera. El pedido se confirma cuando verificamos que el SINPE
              entró.
            </p>

            <h2 id="privacidad" className="scroll-mt-20">
              Privacidad
            </h2>
            <p>
              Usamos tu nombre, WhatsApp, correo y dirección solo para procesar
              tu pedido y coordinar la entrega. Los guardamos en nuestras
              herramientas de trabajo y los compartimos únicamente con Correos
              de Costa Rica cuando hace falta para el envío. No los vendemos.
            </p>
            <p>
              Según la Ley 8968 de Protección de la Persona frente al
              Tratamiento de sus Datos Personales, podés pedir que te mostremos,
              corrijamos o borremos tus datos escribiendo a {TIENDA.correo}.
            </p>
          </div>
        </div>
      </ZonaBlanca>
    </>
  );
}
