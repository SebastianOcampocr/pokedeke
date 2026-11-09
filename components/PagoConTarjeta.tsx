"use client";

import { useEffect, useRef, useState } from "react";
import {
  capturarPagoPaypal,
  configPaypal,
  crearPagoPaypal,
  type ConfigPaypal,
} from "@/lib/api-pedidos";
import { colones } from "@/lib/formato";

type BotonesPaypal = {
  render: (contenedor: HTMLElement) => Promise<void>;
  close?: () => Promise<void>;
};

declare global {
  interface Window {
    paypal?: {
      Buttons: (opciones: {
        style?: Record<string, string | number>;
        createOrder: () => Promise<string>;
        onApprove: (datos: { orderID: string }) => Promise<void>;
        onError?: (error: unknown) => void;
      }) => BotonesPaypal;
    };
  }
}

let sdkCargando: Promise<void> | null = null;

/** El script de PayPal se carga una sola vez, y solo en la página del pago. */
function cargarSdk(clientId: string) {
  sdkCargando ??= new Promise<void>((listo, fallo) => {
    const parametros = new URLSearchParams({
      "client-id": clientId,
      currency: "USD",
      intent: "capture",
      components: "buttons",
      "enable-funding": "card",
      "disable-funding": "paylater,venmo,credit",
      locale: "es_MX",
    });
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?${parametros}`;
    script.async = true;
    script.onload = () => listo();
    script.onerror = () => {
      sdkCargando = null;
      fallo(new Error("No cargó PayPal"));
    };
    document.head.appendChild(script);
  });
  return sdkCargando;
}

/** Lo mismo que calcula la hoja (montoEnDolares en apps-script/Pedidos.gs). */
export const enDolares = (total: number, colonesPorDolar: number) =>
  (Math.round((total / colonesPorDolar) * 100) / 100).toFixed(2);

export function useConfigPaypal() {
  const [config, setConfig] = useState<ConfigPaypal | null>(null);
  useEffect(() => {
    let vigente = true;
    void configPaypal().then((datos) => {
      if (vigente) setConfig(datos);
    });
    return () => {
      vigente = false;
    };
  }, []);
  return config;
}

/**
 * Pagar el pedido con tarjeta de débito o crédito por medio de PayPal. El cobro
 * lo crea y lo confirma la hoja: si PayPal confirma el monto completo, el pedido
 * pasa solo a Pagado. Los datos de la tarjeta nunca pasan por la tienda.
 */
export function PagoConTarjeta({
  numero,
  clave,
  total,
  titulo = "¿Preferís pagar con tarjeta?",
  alPagar,
}: {
  numero: string;
  clave: string;
  total: number;
  titulo?: string;
  alPagar: () => void;
}) {
  const config = useConfigPaypal();
  const caja = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    if (!config || !caja.current) return;
    let vigente = true;
    let botones: BotonesPaypal | null = null;
    cargarSdk(config.clientId)
      .then(() => {
        if (!vigente || !window.paypal || !caja.current) return;
        botones = window.paypal.Buttons({
          style: { layout: "vertical", shape: "rect", label: "pay", height: 48 },
          createOrder: async () => {
            setError("");
            const respuesta = await crearPagoPaypal(numero, clave);
            if (!respuesta.ok) {
              setError(respuesta.error);
              throw new Error(respuesta.error);
            }
            return respuesta.id;
          },
          onApprove: async ({ orderID }) => {
            setProcesando(true);
            const respuesta = await capturarPagoPaypal(numero, clave, orderID);
            setProcesando(false);
            if (respuesta.ok) alPagar();
            else setError(respuesta.error);
          },
          onError: () =>
            setError(
              (actual) =>
                actual ||
                "No se pudo completar el pago con tarjeta. No se te cobró nada: probá otra vez o pagá por SINPE.",
            ),
        });
        return botones.render(caja.current).then(() => {
          if (vigente) setListo(true);
        });
      })
      .catch(() => {
        if (vigente) setError("No se pudo cargar el pago con tarjeta. Pagá por SINPE o probá más tarde.");
      });
    return () => {
      vigente = false;
      void botones?.close?.().catch(() => undefined);
    };
  }, [config, numero, clave, alPagar]);

  if (!config) return null;

  return (
    <section
      aria-labelledby="pago-tarjeta"
      className="marco flex flex-col gap-3 p-5"
    >
      <h2 id="pago-tarjeta" className="font-bold">
        {titulo}
      </h2>
      <p className="leading-snug">
        Pagás con tarjeta de débito o crédito por medio de PayPal. Se cobra en
        dólares: <strong>${enDolares(total, config.colonesPorDolar)}</strong>{" "}
        ({colones(config.colonesPorDolar)} por dólar). Tu banco puede usar su
        propio tipo de cambio.
      </p>
      {config.modo === "sandbox" ? (
        <p className="rounded-md bg-crema p-2 text-sm font-bold">
          Modo de prueba: este botón no cobra plata de verdad.
        </p>
      ) : null}
      <div ref={caja} className={listo ? "" : "min-h-12"} />
      {procesando ? (
        <p role="status" className="font-bold">
          Confirmando tu pago…
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="font-bold text-rojo">
          {error}
        </p>
      ) : null}
      <p className="text-sm leading-snug text-gris">
        Los datos de tu tarjeta los maneja PayPal: nosotros nunca los vemos.
      </p>
    </section>
  );
}
