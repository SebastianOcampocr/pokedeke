"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";
import { anotarInteresado, pedirAviso } from "@/lib/api-pedidos";
import { TIENDA_ABIERTA } from "@/lib/tienda";
import { prepararVerificacion } from "@/lib/verificacion";

/**
 * Con `slug` es un producto agotado: la hoja le escribe sola a la persona
 * cuando vuelve a haber. Sin `slug` (juegos que vienen), solo la anota.
 */
export function BotonAvisame({
  nombreProducto,
  slug,
  enCamino = false,
  className = "",
}: {
  nombreProducto: string;
  slug?: string;
  /** Ya lo compramos y viene para el mezzanine: se avisa cuando llegue. */
  enCamino?: boolean;
  className?: string;
}) {
  const verbo = enCamino ? "llegue" : "vuelva";
  const dialogo = useRef<HTMLDialogElement>(null);
  const id = useId();
  const [listo, setListo] = useState(false);
  const [porCorreo, setPorCorreo] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  useLayoutEffect(() => {
    const nodo = dialogo.current;
    return () => {
      nodo?.close();
      setListo(false);
    };
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setListo(false);
          setError("");
          dialogo.current?.showModal();
        }}
        className={`boton boton-amarillo boton-chico ${className}`}
      >
        {slug ? "Avisame cuando " + verbo : "Avisame cuando llegue"}
      </button>
      <dialog
        ref={dialogo}
        className="marco m-auto w-[min(92vw,420px)] p-5 backdrop:bg-tinta/60"
      >
        {listo ? (
          <div className="flex flex-col gap-4">
            <p className="font-display text-2xl text-azul">¡Listo!</p>
            <p>
              {slug
                ? porCorreo
                  ? `Apenas ${verbo} ${nombreProducto} te llega un correo. Es un solo aviso.`
                  : `Apenas ${verbo} ${nombreProducto} te escribimos por WhatsApp.`
                : `Cuando llegue ${nombreProducto} te avisamos.`}
            </p>
            <button
              type="button"
              className="boton boton-amarillo"
              onClick={() => dialogo.current?.close()}
            >
              Cerrar
            </button>
          </div>
        ) : (
          <form
            onFocus={prepararVerificacion}
            className="flex flex-col gap-4"
            onSubmit={async (evento) => {
              evento.preventDefault();
              const datos = new FormData(evento.currentTarget);
              const nombre = String(datos.get("nombre") ?? "");
              const contacto = String(datos.get("contacto") ?? "");
              setPorCorreo(contacto.includes("@"));
              if (TIENDA_ABIERTA) {
                setEnviando(true);
                setError("");
                let respuesta = slug
                  ? await pedirAviso(slug, nombre, contacto)
                  : await anotarInteresado(nombre, contacto, nombreProducto);
                // Mientras la hoja no tenga la versión con avisos, queda anotado como antes.
                if (slug && !respuesta.ok && respuesta.error === "Acción desconocida.") {
                  respuesta = await anotarInteresado(nombre, contacto, nombreProducto);
                }
                setEnviando(false);
                if (!respuesta.ok) {
                  setError(respuesta.error);
                  return;
                }
              }
              setListo(true);
            }}
          >
            <p className="font-display text-xl leading-tight text-azul">
              {nombreProducto}
            </p>
            <p className="text-[15px]">
              {slug
                ? "Dejanos tu correo y te llega un aviso apenas vuelva. Si preferís WhatsApp, te escribimos nosotros."
                : "Dejanos tus datos y te escribimos apenas entre."}
            </p>
            <div>
              <label className="rotulo-campo" htmlFor={`${id}-nombre`}>
                Nombre
              </label>
              <input id={`${id}-nombre`} name="nombre" className="campo" required />
            </div>
            <div>
              <label className="rotulo-campo" htmlFor={`${id}-contacto`}>
                {slug ? "Correo o WhatsApp" : "WhatsApp o correo"}
              </label>
              <input
                id={`${id}-contacto`}
                name="contacto"
                className="campo"
                autoComplete="email"
                required
              />
            </div>
            {error ? (
              <p role="alert" className="font-bold text-rojo">
                {error}
              </p>
            ) : null}
            <div className="flex flex-col gap-3">
              <button
                type="submit"
                className="boton boton-rojo"
                disabled={enviando}
              >
                Avisarme
              </button>
              <button
                type="button"
                className="min-h-11 font-bold underline"
                onClick={() => dialogo.current?.close()}
              >
                Ahora no
              </button>
            </div>
          </form>
        )}
      </dialog>
    </>
  );
}
