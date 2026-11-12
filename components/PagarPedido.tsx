"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { lanzarConfeti } from "@/lib/confeti";
import { colones } from "@/lib/formato";
import { enlaceWhatsApp, TIENDA, TIENDA_ABIERTA } from "@/lib/tienda";
import { IconoChat, IconoCheque } from "./Iconos";
import { PagoConTarjeta } from "./PagoConTarjeta";

const leerBusqueda = () => window.location.search;
const sinBusqueda = () => "";
const noCambia = () => () => {};

/**
 * El link que le mandamos al cliente trae ?pedido=TCG-0004&clave=…&total=50500.
 * El total solo es para mostrarlo: lo que se cobra lo calcula la hoja con la
 * clave del pedido, así que cambiarlo en el link no cambia el cobro.
 */
function usePedidoDelLink() {
  const busqueda = useSyncExternalStore(noCambia, leerBusqueda, sinBusqueda);
  return useMemo(() => {
    const parametros = new URLSearchParams(busqueda);
    const numero = parametros.get("pedido")?.trim().toUpperCase() ?? "";
    const clave = parametros.get("clave")?.trim() ?? "";
    const total = Number(parametros.get("total"));
    return /^TCG-\d+$/.test(numero) && clave && total > 0
      ? { numero, clave, total }
      : null;
  }, [busqueda]);
}

/** Pagar con tarjeta un pedido ya hecho, sin volver a armar el carrito. */
export function PagarPedido() {
  const pedido = usePedidoDelLink();
  const [pagado, setPagado] = useState(false);
  const alPagar = useCallback(() => {
    setPagado(true);
    lanzarConfeti();
  }, []);

  if (!pedido || !TIENDA_ABIERTA) {
    return (
      <div className="marco mx-auto flex max-w-xl flex-col gap-3 p-5">
        <p className="font-bold">Este link de pago no está completo.</p>
        <p className="leading-snug">
          Escribinos por WhatsApp y te ayudamos a terminar el pago.
        </p>
        <a
          href={enlaceWhatsApp("Hola, quiero pagar mi pedido con tarjeta.")}
          target="_blank"
          rel="noreferrer"
          className="boton boton-verde w-fit"
        >
          <IconoChat tamano={22} />
          Escribir por WhatsApp
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5">
      <div className="marco flex flex-col gap-1 bg-crema p-5">
        <p className="font-bold">Pedido {pedido.numero}</p>
        <p className="text-4xl font-extrabold text-azul">
          {colones(pedido.total)}
        </p>
      </div>

      {pagado ? (
        <p
          role="status"
          className="marco flex items-center gap-3 bg-white p-5 font-bold text-verde-oscuro"
        >
          <IconoCheque />
          ¡Listo! Recibimos tu pago con tarjeta y tu pedido ya está confirmado.
          Te mandamos la confirmación por correo.
        </p>
      ) : (
        <>
          <PagoConTarjeta
            numero={pedido.numero}
            clave={pedido.clave}
            total={pedido.total}
            titulo="Pagá con tarjeta"
            alPagar={alPagar}
          />
          <p className="text-sm leading-snug">
            ¿Preferís SINPE Móvil? Hacelo al <strong>{TIENDA.sinpe}</strong>{" "}
            con <strong>{pedido.numero}</strong> en el detalle y mandanos el
            comprobante por{" "}
            <a
              href={enlaceWhatsApp(`Hola, ya hice el SINPE del pedido ${pedido.numero}.`)}
              target="_blank"
              rel="noreferrer"
              className="font-bold underline underline-offset-2"
            >
              WhatsApp
            </a>
            .
          </p>
        </>
      )}
    </div>
  );
}
