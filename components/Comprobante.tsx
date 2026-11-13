"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { consultarComprobante, type ComprobantePublico } from "@/lib/api-pedidos";
import { colones, fechaLarga } from "@/lib/formato";
import { buscarProducto } from "@/lib/productos";
import { enlaceWhatsApp, RUTA_BASE, TIENDA, TIENDA_ABIERTA } from "@/lib/tienda";
import { Deke } from "./Deke";
import { Seguimiento } from "./EstadoPedido";
import { IconoChat } from "./Iconos";

const leerBusqueda = () => window.location.search;
const sinBusqueda = () => "";
const noCambia = () => () => {};

/** El link que le mandamos al cliente trae ?pedido=TCG-0005&clave=…. */
function useDatosDelLink() {
  const busqueda = useSyncExternalStore(noCambia, leerBusqueda, sinBusqueda);
  return useMemo(() => {
    const parametros = new URLSearchParams(busqueda);
    const numero = parametros.get("pedido")?.trim().toUpperCase() ?? "";
    const clave = parametros.get("clave")?.trim() ?? "";
    return /^TCG-\d+$/.test(numero) && clave ? { numero, clave } : null;
  }, [busqueda]);
}

/** "12 de Noviembre de 2026". La fecha llega como 2026-11-12, en hora de Costa Rica. */
function fechaConAnio(iso: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  return `${fechaLarga(`${iso}T12:00:00-06:00`)} de ${iso.slice(0, 4)}`;
}

function tituloDe(pedido: ComprobantePublico) {
  if (pedido.estado === "Cancelado") return "Pedido cancelado";
  if (pedido.saldo <= 0) return "Comprobante de pago";
  return pedido.pagado > 0 ? "Comprobante de abono" : "Comprobante de pedido";
}

function Caja({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[10px] border-3 border-tinta p-4">
      <h3 className="mb-1.5 text-xs font-extrabold tracking-wide text-rojo uppercase">
        {titulo}
      </h3>
      {children}
    </div>
  );
}

function Hoja({ pedido }: { pedido: ComprobantePublico }) {
  const titulo = tituloDe(pedido);
  return (
    <article className="comprobante-hoja marco overflow-hidden bg-white">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b-3 border-tinta bg-amarillo px-5 py-5 sm:px-7">
        <span className="-rotate-2 rounded-[10px] border-3 border-tinta bg-rojo px-4 pt-1.5 pb-0.5 font-display text-2xl text-white shadow-dura">
          POKEDEKE
        </span>
        <div className="text-right">
          <h2 className="font-display text-xl leading-tight text-azul uppercase sm:text-2xl">
            {titulo}
          </h2>
          <p className="font-bold">N.º {pedido.numero}</p>
          <p className="font-bold">{fechaConAnio(pedido.fecha)}</p>
        </div>
      </div>

      <div className="flex flex-col gap-5 p-5 sm:p-7">
        <div className="grid gap-4 sm:grid-cols-2">
          <Caja titulo="Cliente">
            <p className="text-[15px] font-extrabold">{pedido.cliente}</p>
            {pedido.whatsapp ? <p>WhatsApp {pedido.whatsapp}</p> : null}
            {pedido.correo ? <p className="break-all">{pedido.correo}</p> : null}
          </Caja>
          <Caja titulo="Entrega">
            <p className="font-bold">{pedido.envio}</p>
            {pedido.direccion && pedido.direccion !== "Retiro coordinado por WhatsApp" ? (
              <p>
                {[pedido.ubicacion, pedido.direccion].filter(Boolean).join(" · ")}
              </p>
            ) : null}
            {pedido.entrega ? <p>{pedido.entrega}</p> : null}
            {pedido.especial ? <p>Se entrega {pedido.especial}.</p> : null}
            {pedido.guia ? (
              <p>
                Número de guía: <strong>{pedido.guia}</strong>
              </p>
            ) : null}
          </Caja>
        </div>

        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b-3 border-tinta text-xs tracking-wide uppercase">
              <th className="pr-2 pb-2">Producto</th>
              <th className="px-2 pb-2 text-right">Cant.</th>
              <th className="hidden px-2 pb-2 text-right sm:table-cell">Precio</th>
              <th className="pb-2 pl-2 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {pedido.lineas.map((linea) => {
              const foto = buscarProducto(linea.slug)?.fotos?.[0];
              return (
                <tr key={linea.slug + linea.nombre} className="border-b-2 border-gris-claro">
                  <td className="py-2.5 pr-2">
                    <span className="flex items-center gap-3 font-medium">
                      {foto ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={foto.startsWith("http") ? foto : RUTA_BASE + foto}
                          alt=""
                          className="hidden h-11 w-16 shrink-0 rounded-md border-2 border-tinta bg-white object-contain sm:block"
                        />
                      ) : null}
                      {linea.nombre}
                    </span>
                  </td>
                  <td className="px-2 py-2.5 text-right align-middle">{linea.cantidad}</td>
                  <td className="hidden px-2 py-2.5 text-right align-middle whitespace-nowrap sm:table-cell">
                    {colones(linea.precio)}
                  </td>
                  <td className="py-2.5 pl-2 text-right align-middle font-extrabold whitespace-nowrap">
                    {colones(linea.precio * linea.cantidad)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="grid items-start gap-5 sm:grid-cols-[1fr_300px]">
          <div className="leading-relaxed sm:order-none">
            {pedido.estado === "Cancelado" ? (
              <p className="font-bold">Este pedido se canceló.</p>
            ) : pedido.saldo > 0 ? (
              <>
                <p>
                  <strong className="whitespace-nowrap">Falta pagar {colones(pedido.saldo)}</strong>
                  {pedido.saldoCuando ? ` (${pedido.saldoCuando})` : ""}.
                </p>
                <p className="mt-2">
                  Hacé el SINPE Móvil al <strong>{TIENDA.sinpe}</strong> y en el
                  detalle poné <strong className="whitespace-nowrap">{pedido.numero}</strong>.
                </p>
              </>
            ) : (
              <p>
                <strong>¡Pagado por completo!</strong> Gracias por tu compra.
              </p>
            )}
          </div>
          <div className="rounded-[10px] border-3 border-tinta bg-crema p-4">
            {pedido.costoEnvio > 0 || pedido.descuento > 0 ? (
              <>
                <p className="flex justify-between gap-3 py-0.5">
                  <span>Productos</span>
                  <span>{colones(pedido.subtotal)}</span>
                </p>
                {pedido.descuento > 0 ? (
                  <p className="flex justify-between gap-3 py-0.5">
                    <span>Descuento</span>
                    <span>−{colones(pedido.descuento)}</span>
                  </p>
                ) : null}
                {pedido.costoEnvio > 0 ? (
                  <p className="flex justify-between gap-3 py-0.5">
                    <span>Envío</span>
                    <span>{colones(pedido.costoEnvio)}</span>
                  </p>
                ) : null}
              </>
            ) : null}
            <p className="mb-1 flex justify-between gap-3 border-b-2 border-tinta pt-0.5 pb-2 text-[15px] font-extrabold">
              <span>Total</span>
              <span>{colones(pedido.total)}</span>
            </p>
            {pedido.pagos.map((pago, indice) => (
              <p
                key={indice}
                className="flex items-baseline justify-between gap-3 py-1 font-bold text-verde-oscuro"
              >
                <span>
                  {pedido.saldo > 0 || pedido.pagos.length > 1 ? "Abono" : "Pagado"}
                  {pago.fecha ? ` · ${fechaLarga(`${pago.fecha}T12:00:00-06:00`)}` : ""}
                  {pago.metodo ? ` · ${pago.metodo}` : ""}
                </span>
                <span className="whitespace-nowrap">−{colones(pago.monto)}</span>
              </p>
            ))}
            <p className="mt-1.5 flex items-baseline justify-between gap-3 border-t-2 border-tinta pt-2">
              <span className="font-extrabold">{pedido.saldo > 0 ? "Saldo pendiente" : "Saldo"}</span>
              <span
                className={`font-display text-2xl whitespace-nowrap ${pedido.saldo > 0 ? "text-rojo" : "text-verde-oscuro"}`}
              >
                {colones(pedido.saldo)}
              </span>
            </p>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-3">
          <Deke animo="guino" className="h-16 shrink-0" />
          <p className="font-display text-lg text-azul">¡Gracias por comprar en Pokedeke!</p>
        </div>
      </div>

      <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 border-t-3 border-tinta bg-azul px-5 py-3 text-sm font-bold text-white sm:px-7">
        <span>pokedeke.store</span>
        <span>{TIENDA.correo}</span>
        <span>Instagram @pokedek.cr</span>
      </div>
    </article>
  );
}

/**
 * El comprobante que le mandamos al cliente por WhatsApp: lo que compró, lo que
 * pagó, lo que falta y en qué va el pedido. Se puede guardar como PDF.
 */
export function Comprobante() {
  const datos = useDatosDelLink();
  const [pedido, setPedido] = useState<ComprobantePublico | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!datos || !TIENDA_ABIERTA) return;
    let vigente = true;
    void consultarComprobante(datos.numero, datos.clave).then((respuesta) => {
      if (!vigente) return;
      if (respuesta.ok && respuesta.pedido) setPedido(respuesta.pedido);
      else setError(respuesta.ok ? "No pudimos abrir tu comprobante." : respuesta.error);
    });
    return () => {
      vigente = false;
    };
  }, [datos]);

  if (!datos || !TIENDA_ABIERTA || error) {
    return (
      <div className="marco mx-auto flex max-w-xl flex-col gap-3 p-5">
        <p className="font-bold">{error || "Este link de comprobante no está completo."}</p>
        <p className="leading-snug">Escribinos por WhatsApp y te lo mandamos de nuevo.</p>
        <a
          href={enlaceWhatsApp("Hola, no pude abrir mi comprobante.")}
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

  if (!pedido) {
    return (
      <p role="status" className="mx-auto max-w-xl font-bold">
        Buscando tu comprobante…
      </p>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="solo-pantalla flex flex-wrap gap-3">
        <button type="button" className="boton boton-rojo" onClick={() => window.print()}>
          Guardar o imprimir (PDF)
        </button>
        <a
          href={enlaceWhatsApp(`Hola, tengo una consulta sobre mi pedido ${pedido.numero}.`)}
          target="_blank"
          rel="noreferrer"
          className="boton boton-verde"
        >
          <IconoChat tamano={22} />
          Escribinos
        </a>
      </div>
      <Hoja pedido={pedido} />
      <section className="solo-pantalla flex flex-col gap-3" aria-labelledby="seguimiento">
        <h2 id="seguimiento" className="font-display text-2xl text-azul">
          ¿En qué va tu pedido?
        </h2>
        <Seguimiento pedido={pedido} />
      </section>
    </div>
  );
}
