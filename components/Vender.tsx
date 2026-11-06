"use client";

import { useState } from "react";
import { colones } from "@/lib/formato";
import { cartasSueltas, type Producto } from "@/lib/productos";
import { enlaceWhatsApp } from "@/lib/tienda";

const CONDICIONES = [
  { id: "1", texto: "Near Mint: casi perfecta" },
  { id: "0.8", texto: "Lightly Played: detallitos" },
  { id: "0.55", texto: "Played: se nota el uso" },
];

const SINPE = 0.6;
const CREDITO = 0.75;

const redondear = (monto: number) => Math.round(monto / 500) * 500;

export function CalculadoraVenta() {
  const cartas = cartasSueltas();
  if (cartas.length === 0) return null;
  return <Calculadora cartas={cartas} />;
}

function Calculadora({ cartas }: { cartas: Producto[] }) {
  const [slug, setSlug] = useState(cartas[0].slug);
  const [condicion, setCondicion] = useState(CONDICIONES[0].id);

  const carta = cartas.find((opcion) => opcion.slug === slug) ?? cartas[0];
  const base = carta.precio * Number(condicion);
  const enSinpe = redondear(base * SINPE);
  const enCredito = redondear(base * CREDITO);
  const nombre = carta.nombre.replace(" (carta suelta)", "");
  const estado = CONDICIONES.find((opcion) => opcion.id === condicion)?.texto;

  return (
    <section
      aria-label="Calculá cuánto te damos"
      className="marco shadow-dura flex flex-col gap-4 bg-crema p-5 md:p-7"
    >
      <h2 className="font-display text-[22px] leading-tight text-azul md:text-3xl">
        Calculá cuánto te damos
      </h2>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label htmlFor="venta-carta" className="rotulo-campo">
            Tu carta
          </label>
          <select
            id="venta-carta"
            className="campo"
            value={slug}
            onChange={(evento) => setSlug(evento.target.value)}
          >
            {cartas.map((opcion) => (
              <option key={opcion.slug} value={opcion.slug}>
                {opcion.nombre.replace(" (carta suelta)", "")}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="venta-condicion" className="rotulo-campo">
            ¿Cómo está?
          </label>
          <select
            id="venta-condicion"
            className="campo"
            value={condicion}
            onChange={(evento) => setCondicion(evento.target.value)}
          >
            {CONDICIONES.map((opcion) => (
              <option key={opcion.id} value={opcion.id}>
                {opcion.texto}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div aria-live="polite" className="grid grid-cols-2 gap-3">
        <div className="marco p-3">
          <p className="text-sm font-bold">Por SINPE</p>
          <p
            key={enSinpe}
            className="saltar w-fit origin-left text-2xl font-extrabold text-azul md:text-3xl"
          >
            {colones(enSinpe)}
          </p>
        </div>
        <div className="marco p-3">
          <p className="text-sm font-bold">En crédito de tienda</p>
          <p
            key={enCredito}
            className="saltar w-fit origin-left text-2xl font-extrabold text-verde-oscuro md:text-3xl"
          >
            {colones(enCredito)}
          </p>
        </div>
      </div>
      <p className="text-sm text-gris">
        Es un estimado: el precio final se confirma al ver la carta.
      </p>
      <a
        href={enlaceWhatsApp(
          `¡Hola! Quiero venderles mi ${nombre} (${estado}). La calculadora dice ${colones(enSinpe)} por SINPE. Aquí van las fotos.`,
        )}
        target="_blank"
        rel="noreferrer"
        className="boton boton-verde"
      >
        Mandar fotos por WhatsApp
      </a>
    </section>
  );
}

