"use client";

import { useId, useState } from "react";
import { useHidratado } from "@/lib/almacen";
import { fechaLarga } from "@/lib/formato";
import { ENCARGOS_EEUU, enlaceWhatsApp } from "@/lib/tienda";
import { IconoChat } from "./Iconos";

/**
 * "¿Buscás algo que no está?": arma el mensaje y abre WhatsApp. El precio se
 * confirma por ahí antes de cobrar, así que no guarda nada.
 */
export function EncargoEEUU({ className = "" }: { className?: string }) {
  const id = useId();
  const hidratado = useHidratado();
  const [producto, setProducto] = useState("");
  const [cantidad, setCantidad] = useState(1);

  // Pasada la fecha ya no se alcanza a comprar: el formulario desaparece solo.
  if (hidratado && Date.now() > new Date(ENCARGOS_EEUU.hasta).getTime()) {
    return null;
  }

  const mensaje = `¡Hola! Quiero que me traigan de Estados Unidos: ${producto.trim()}${
    cantidad > 1 ? ` (${cantidad} unidades)` : ""
  }. ¿Cuánto me sale?`;

  return (
    <form
      className={`marco flex flex-col gap-3 bg-crema p-4 md:p-5 ${className}`}
      onSubmit={(evento) => {
        evento.preventDefault();
        window.open(enlaceWhatsApp(mensaje), "_blank", "noopener");
      }}
    >
      <div>
        <h3 className="font-display text-xl leading-tight text-azul">
          ¿Buscás algo que no está aquí?
        </h3>
        <p className="mt-1 text-[15px] leading-snug">
          Decinos qué producto de Pokémon TCG querés y te lo cotizamos por
          WhatsApp. Si lo conseguimos, te lo entregamos después del{" "}
          {fechaLarga(ENCARGOS_EEUU.entrega)}. Pedilo antes del{" "}
          {fechaLarga(ENCARGOS_EEUU.hasta)}.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="grow">
          <label className="rotulo-campo" htmlFor={`${id}-producto`}>
            Producto
          </label>
          <input
            id={`${id}-producto`}
            className="campo"
            required
            minLength={3}
            maxLength={150}
            placeholder="Ej.: Booster Box de Phantasmal Flames"
            value={producto}
            onChange={(evento) => setProducto(evento.target.value)}
          />
        </div>
        <div className="sm:w-28">
          <label className="rotulo-campo" htmlFor={`${id}-cantidad`}>
            Cantidad
          </label>
          <select
            id={`${id}-cantidad`}
            className="campo"
            value={cantidad}
            onChange={(evento) => setCantidad(Number(evento.target.value))}
          >
            {[1, 2, 3, 4, 5].map((numero) => (
              <option key={numero} value={numero}>
                {numero}
              </option>
            ))}
          </select>
        </div>
      </div>
      <button type="submit" className="boton boton-verde w-full sm:w-fit">
        <IconoChat tamano={22} />
        Pedir precio por WhatsApp
      </button>
      <p className="text-sm text-gris">
        No pagás nada hasta que te confirmemos el precio.
      </p>
    </form>
  );
}
