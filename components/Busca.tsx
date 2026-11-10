"use client";

import { useSearchParams } from "next/navigation";
import { useId, useState } from "react";
import { useHidratado } from "@/lib/almacen";
import { anotarSolicitud, type OrigenBusca } from "@/lib/api-pedidos";
import { fechaLarga } from "@/lib/formato";
import { ENCARGOS_EEUU, enlaceWhatsApp, TIENDA } from "@/lib/tienda";
import { prepararVerificacion } from "@/lib/verificacion";
import { IconoChat } from "./Iconos";

/**
 * Pokedeke Busca: "¿Buscás algo que no está aquí?". Anota la solicitud en la
 * hoja (sin nombre ni contacto) y abre WhatsApp con el mensaje listo. Nunca
 * promete que se consigue: la tienda revisa y confirma disponibilidad y precio
 * antes de cobrar.
 */
export function Busca({
  origen,
  productoInicial = "",
  slug,
  titulo = "¿Buscás algo que no está aquí?",
  className = "",
}: {
  origen: OrigenBusca;
  productoInicial?: string;
  /** El producto del catálogo del que salió la consulta, si salió de uno. */
  slug?: string;
  titulo?: string;
  className?: string;
}) {
  const id = useId();
  const hidratado = useHidratado();
  const [producto, setProducto] = useState(productoInicial);
  const [cantidad, setCantidad] = useState(1);
  const [detalle, setDetalle] = useState("");
  const [presupuesto, setPresupuesto] = useState("");
  const [conDetalle, setConDetalle] = useState(false);
  const [enviado, setEnviado] = useState(false);

  // Mientras se alcance a traer de Estados Unidos en este viaje, se dice para cuándo.
  const alcanzaElViaje =
    hidratado && Date.now() <= new Date(ENCARGOS_EEUU.hasta).getTime();

  const mensaje = [
    "¡Hola! Estoy buscando: " +
      producto.trim() +
      (cantidad > 1 ? " (" + cantidad + " unidades)" : "") +
      ".",
    detalle.trim() ? "Detalle: " + detalle.trim() + "." : "",
    presupuesto.trim() ? "Mi presupuesto: " + presupuesto.trim() + "." : "",
    "¿Me ayudan a conseguirlo?",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <form
      onFocus={prepararVerificacion}
      className={"marco flex flex-col gap-3 bg-crema p-4 md:p-5 " + className}
      onSubmit={(evento) => {
        evento.preventDefault();
        // Solo los robots llenan este campo.
        if (new FormData(evento.currentTarget).get("sitio")) return;
        anotarSolicitud({
          producto: producto.trim(),
          cantidad,
          detalle: detalle.trim(),
          presupuesto: presupuesto.trim(),
          origen,
          // Si cambiaron lo que buscan, ya no es ese producto.
          ...(slug && producto.trim() === productoInicial.trim() ? { slug } : {}),
        });
        window.open(enlaceWhatsApp(mensaje), "_blank", "noopener");
        setEnviado(true);
      }}
    >
      <div>
        <h3 className="font-display text-xl leading-tight text-azul">
          {titulo}
        </h3>
        <p className="mt-1 text-[15px] leading-snug">
          Decinos qué producto de Pokémon TCG andás buscando y lo buscamos por
          vos. Revisamos si lo podemos conseguir y te confirmamos
          disponibilidad y precio por WhatsApp.
          {alcanzaElViaje
            ? " Si hay que traerlo de Estados Unidos y lo pedís antes del " +
              fechaLarga(ENCARGOS_EEUU.hasta) +
              ", te llegaría después del " +
              fechaLarga(ENCARGOS_EEUU.entrega) +
              "."
            : ""}
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="grow">
          <label className="rotulo-campo" htmlFor={id + "-producto"}>
            ¿Qué buscás?
          </label>
          <input
            id={id + "-producto"}
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
          <label className="rotulo-campo" htmlFor={id + "-cantidad"}>
            Cantidad
          </label>
          <select
            id={id + "-cantidad"}
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
      {conDetalle ? (
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="grow">
            <label className="rotulo-campo" htmlFor={id + "-detalle"}>
              Enlace o detalle (opcional)
            </label>
            <input
              id={id + "-detalle"}
              className="campo"
              maxLength={300}
              placeholder="Idioma, condición o un enlace donde lo viste"
              value={detalle}
              onChange={(evento) => setDetalle(evento.target.value)}
            />
          </div>
          <div className="sm:w-44">
            <label className="rotulo-campo" htmlFor={id + "-presupuesto"}>
              Presupuesto (opcional)
            </label>
            <input
              id={id + "-presupuesto"}
              className="campo"
              maxLength={40}
              placeholder="Ej.: ₡25 000"
              value={presupuesto}
              onChange={(evento) => setPresupuesto(evento.target.value)}
            />
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="min-h-11 w-fit text-left font-bold underline underline-offset-2"
          onClick={() => setConDetalle(true)}
        >
          Agregar enlace, detalle o presupuesto
        </button>
      )}
      <input
        name="sitio"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />
      <button type="submit" className="boton boton-verde w-full sm:w-fit">
        <IconoChat tamano={22} />
        Buscar con Pokedeke
      </button>
      {enviado ? (
        <p role="status" className="font-bold text-verde-oscuro">
          Se abrió WhatsApp con tu mensaje: mandalo para que empecemos a
          buscarlo. Si no se abrió, escribinos al {TIENDA.sinpe}.
        </p>
      ) : (
        <p className="text-sm text-gris">
          Se abre WhatsApp con tu mensaje listo; si tenés foto o captura,
          mandala ahí. No pagás nada hasta que te confirmemos el precio.
        </p>
      )}
    </form>
  );
}

const ORIGENES_DE_ENLACE = ["buscador", "agotado", "catalogo", "consultar", "camino"];

/** Lee lo que viene en el enlace, como /busca?producto=Charizard&origen=buscador. */
export function BuscaDesdeEnlace() {
  const parametros = useSearchParams();
  const origen = parametros.get("origen") ?? "";
  return (
    <Busca
      key={parametros.toString()}
      origen={
        ORIGENES_DE_ENLACE.includes(origen) ? (origen as OrigenBusca) : "busca"
      }
      productoInicial={(parametros.get("producto") ?? "").slice(0, 150)}
      slug={(parametros.get("ref") ?? "").slice(0, 200) || undefined}
      titulo={
        origen === "consultar" ? "Consultar disponibilidad" : "Contanos qué buscás"
      }
    />
  );
}
