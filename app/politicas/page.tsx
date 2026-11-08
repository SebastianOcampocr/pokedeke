import type { Metadata } from "next";
import { enlaceWhatsApp, TIENDA } from "@/lib/tienda";
import Link from "next/link";
import { CabeceraPagina, ZonaBlanca } from "@/components/Estructura";

export const metadata: Metadata = {
  alternates: { canonical: "/politicas" },
  title: "Políticas",
  description: "Envíos, cambios y devoluciones, términos y privacidad.",
};

const SECCIONES = [
  { id: "envios", titulo: "Envíos" },
  { id: "cambios", titulo: "Cambios y devoluciones" },
  { id: "pedidos-especiales", titulo: "Productos de Estados Unidos" },
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
              Los envíos por Correos y entre tiendas salen los Miércoles y
              Sábados. Lo que se pide de Sábado a Martes sale el Miércoles, y lo
              que se pide de Miércoles a Viernes sale el Sábado, siempre que el
              pago ya esté confirmado. Te pasamos el número de guía por
              WhatsApp. El tiempo de entrega de Correos depende de tu zona.
            </p>

            <h2 id="cambios" className="scroll-mt-20">
              Cambios y devoluciones
            </h2>
            <p>
              Antes de enviar cada pedido le tomamos fotos al producto y a cómo
              va empacado, y te las mandamos por WhatsApp. Así queda claro en
              qué estado salió, para vos y para nosotros.
            </p>
            <p>
              En compras por internet tenés 8 días hábiles desde que recibís el
              pedido para arrepentirte de la compra. El producto debe volver en
              el mismo estado en que lo recibiste, según esas fotos, y te
              devolvemos el monto por SINPE Móvil en un plazo de 8 días hábiles
              desde que nos llega. Si es por arrepentimiento, el envío de vuelta
              corre por tu cuenta.
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
              producto. Te recomendamos grabar un video al abrir el paquete.
              Te lo cambiamos o te devolvemos la plata, y el envío corre por
              nuestra cuenta.
            </p>
            <ul>
              <li>
                El producto sellado se acepta solo con el sello intacto. Los
                sobres y cajas ya abiertos no se pueden devolver, porque no hay
                forma de revisar su contenido.
              </li>
              <li>
                Las cartas sueltas deben volver en la misma condición en que
                salieron, según las fotos del envío.
              </li>
              <li>
                No hacemos devoluciones ni ajustes por cambios en el precio de
                mercado de una carta después de la compra.
              </li>
              <li>
                Si una preventa se cancela o se atrasa más de 30 días, te
                devolvemos todo el adelanto. Si querés cancelarla vos, avisanos
                dentro de 8 días hábiles desde que pagaste el adelanto.
              </li>
            </ul>

            <h2 id="pedidos-especiales" className="scroll-mt-20">
              Productos de Estados Unidos
            </h2>
            <p>
              Algunos productos que casi no se consiguen en Costa Rica los
              importamos de Estados Unidos. Se marcan con “Te lo traemos de
              Estados Unidos” y funcionan así:
            </p>
            <ul>
              <li>
                Se apartan pagando el 100% por SINPE Móvil. El pago se confirma
                igual que cualquier pedido.
              </li>
              <li>
                Se entregan después de la fecha que dice cada producto. Si en tu
                pedido hay otros productos, todo se entrega junto, salvo que lo
                coordinemos distinto por WhatsApp.
              </li>
              <li>
                Hacemos todo lo posible por traerlos, pero dependen de la
                disponibilidad. Si por algo no podemos entregarte lo que
                compraste, te avisamos por WhatsApp y te devolvemos el 100% de
                lo que pagaste, por SINPE Móvil a la misma cuenta desde la que
                pagaste.
              </li>
              <li>
                Si querés cancelarlo vos, avisanos dentro de 8 días hábiles
                desde que pagaste y te devolvemos todo.
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
              Para saber qué productos interesan, guardamos de forma anónima lo
              que se agrega al carrito: los productos y las cantidades, con un
              número al azar y sin nombre ni contacto. No usamos cookies de
              publicidad. Si nos dejás un comentario, lo guardamos para mejorar
              la tienda; tu nombre y contacto son opcionales y solo los usamos
              para responderte.
            </p>
            <p>
              Según la Ley 8968 de Protección de la Persona frente al
              Tratamiento de sus Datos Personales, podés pedir que te mostremos,
              corrijamos o borremos tus datos escribiendo a{" "}
              <a href={`mailto:${TIENDA.correo}`} className="underline">
                {TIENDA.correo}
              </a>
              .
            </p>
          </div>
        </div>
      </ZonaBlanca>
    </>
  );
}
