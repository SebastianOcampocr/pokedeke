"use client";

import { useId, useState } from "react";
import { mandarComentario } from "@/lib/api-pedidos";
import { enlaceWhatsApp, PEDIDOS_URL, TIENDA_ABIERTA } from "@/lib/tienda";
import { IconoChat, IconoCheque } from "./Iconos";

const ESTRELLAS = [1, 2, 3, 4, 5];
const PALABRAS = ["", "Mal", "Regular", "Bien", "Muy bien", "¡Excelente!"];

/**
 * Comentarios de la gente: se guardan en la pestaña Comentarios de la hoja y
 * le llega un correo a la tienda. Si el servidor no responde, se manda por
 * WhatsApp para no perderlo.
 */
export function FormularioComentario() {
  const id = useId();
  const [calificacion, setCalificacion] = useState(0);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState(false);
  const [error, setError] = useState("");

  const textoWhatsApp = `¡Hola! Les dejo un comentario sobre la tienda${
    calificacion ? ` (${calificacion} de 5)` : ""
  }: ${comentario.trim()}`;

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enviando) return;
    const datos = new FormData(evento.currentTarget);
    if (!TIENDA_ABIERTA || !PEDIDOS_URL) {
      window.open(enlaceWhatsApp(textoWhatsApp), "_blank", "noopener");
      setListo(true);
      return;
    }
    setEnviando(true);
    setError("");
    const respuesta = await mandarComentario({
      calificacion,
      comentario: comentario.trim(),
      nombre: String(datos.get("nombre") ?? "").trim(),
      contacto: String(datos.get("contacto") ?? "").trim(),
      sitio: String(datos.get("sitio") ?? ""),
    });
    setEnviando(false);
    if (respuesta.ok) setListo(true);
    else setError("No pudimos guardarlo. Mandalo por WhatsApp y lo leemos igual.");
  }

  if (listo) {
    return (
      <div
        role="status"
        className="marco flex items-center gap-3 bg-white p-5 font-bold text-verde-oscuro"
      >
        <IconoCheque />
        ¡Gracias! Lo leemos todo y nos ayuda a mejorar.
      </div>
    );
  }

  return (
    <form className="marco flex flex-col gap-4 bg-white p-5" onSubmit={enviar}>
      <fieldset>
        <legend className="rotulo-campo">¿Cómo te fue con nosotros?</legend>
        <div className="flex flex-wrap items-center gap-1">
          {ESTRELLAS.map((numero) => (
            <button
              key={numero}
              type="button"
              aria-label={`${numero} de 5`}
              aria-pressed={calificacion === numero}
              onClick={() => setCalificacion(numero)}
              className={`flex size-11 items-center justify-center text-3xl leading-none ${
                numero <= calificacion ? "text-[#e0a800]" : "text-gris-medio"
              }`}
            >
              ★
            </button>
          ))}
          <span className="ml-2 font-bold">{PALABRAS[calificacion]}</span>
        </div>
      </fieldset>
      <div>
        <label className="rotulo-campo" htmlFor={`${id}-comentario`}>
          Tu comentario
        </label>
        <textarea
          id={`${id}-comentario`}
          className="campo min-h-32"
          required
          minLength={3}
          maxLength={1000}
          placeholder="Qué te gustó, qué falló, qué producto te gustaría que tengamos…"
          value={comentario}
          onChange={(evento) => setComentario(evento.target.value)}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="rotulo-campo" htmlFor={`${id}-nombre`}>
            Nombre (opcional)
          </label>
          <input id={`${id}-nombre`} name="nombre" className="campo" maxLength={80} />
        </div>
        <div>
          <label className="rotulo-campo" htmlFor={`${id}-contacto`}>
            WhatsApp o correo (opcional)
          </label>
          <input
            id={`${id}-contacto`}
            name="contacto"
            className="campo"
            maxLength={120}
            placeholder="Si querés que te respondamos"
          />
        </div>
      </div>
      {/* Solo los robots llenan este campo. */}
      <input
        name="sitio"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />
      {error ? (
        <div role="alert" className="flex flex-col gap-2">
          <p className="font-bold text-rojo">{error}</p>
          <a
            href={enlaceWhatsApp(textoWhatsApp)}
            target="_blank"
            rel="noreferrer"
            className="boton boton-verde w-fit"
          >
            <IconoChat tamano={22} />
            Mandarlo por WhatsApp
          </a>
        </div>
      ) : null}
      <button type="submit" className="boton boton-rojo w-full sm:w-fit" disabled={enviando}>
        {enviando ? "Enviando…" : "Mandar comentario"}
      </button>
    </form>
  );
}
