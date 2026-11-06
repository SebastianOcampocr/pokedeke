"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";

export function BotonAvisame({
  nombreProducto,
  className = "",
}: {
  nombreProducto: string;
  className?: string;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const id = useId();
  const [listo, setListo] = useState(false);

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
        onClick={() => dialogo.current?.showModal()}
        className={`boton boton-amarillo boton-chico ${className}`}
      >
        Avisame cuando llegue
      </button>
      <dialog
        ref={dialogo}
        className="marco m-auto w-[min(92vw,420px)] p-5 backdrop:bg-tinta/60"
      >
        {listo ? (
          <div className="flex flex-col gap-4">
            <p className="font-display text-2xl text-azul">¡Listo!</p>
            <p>
              Cuando llegue {nombreProducto} te avisamos. En la tienda real tus
              datos quedarían en la lista de interesados.
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
            className="flex flex-col gap-4"
            onSubmit={(evento) => {
              evento.preventDefault();
              setListo(true);
            }}
          >
            <p className="font-display text-xl leading-tight text-azul">
              {nombreProducto}
            </p>
            <p className="text-[15px]">
              Dejanos tus datos y te escribimos apenas entre.
            </p>
            <div>
              <label className="rotulo-campo" htmlFor={`${id}-nombre`}>
                Nombre
              </label>
              <input id={`${id}-nombre`} className="campo" required />
            </div>
            <div>
              <label className="rotulo-campo" htmlFor={`${id}-contacto`}>
                WhatsApp o correo
              </label>
              <input id={`${id}-contacto`} className="campo" required />
            </div>
            <div className="flex flex-col gap-3">
              <button type="submit" className="boton boton-rojo">
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
