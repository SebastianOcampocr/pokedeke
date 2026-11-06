"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { guardarSobre, useAlbum, vaciarAlbum } from "@/lib/album";
import { useHidratado } from "@/lib/almacen";
import { aplicarCupon, useCarrito } from "@/lib/carrito";
import { lanzarConfeti } from "@/lib/confeti";
import { colones } from "@/lib/formato";
import { ganarLogro } from "@/lib/logros";
import type { Producto } from "@/lib/productos";
import {
  abrirSobre,
  cartasDelSobre,
  CUPON_SOBRE,
  type ResultadoSobre,
} from "@/lib/sobre";
import { cambiarSonido, sonar, useSonido } from "@/lib/sonido";
import { Deke, DorsoCarta, type AnimoDeke } from "./Deke";
import { FotoProducto } from "./FotoProducto";
import { SobreDibujo } from "./SobreDibujo";

type Fase = "cerrado" | "saliendo" | "cartas";

const ARRASTRE_PARA_ABRIR = 0.62;

function CartaDelSobre({
  carta,
  indice,
  volteada,
  joya,
  nueva,
  retrasoGiro,
  alVoltear,
}: {
  carta: Producto;
  indice: number;
  volteada: boolean;
  joya: boolean;
  nueva: boolean;
  retrasoGiro: number;
  alVoltear: () => void;
}) {
  const nombre = carta.nombre.replace(" (carta suelta)", "");

  return (
    <div
      className="carta-sale flex w-[calc(33.333%-8px)] flex-col gap-1.5 md:w-40 lg:w-44"
      style={{ "--retraso": `${indice * 90}ms` } as CSSProperties}
    >
      <button
        type="button"
        className="carta-giro"
        data-volteada={volteada}
        disabled={volteada}
        aria-label={volteada ? nombre : `Voltear la carta ${indice + 1}`}
        style={{ "--retraso-giro": `${retrasoGiro}ms` } as CSSProperties}
        onClick={alVoltear}
      >
        <span className="carta-interior block">
          <span className="carta-cara block">
            <DorsoCarta className="size-full" />
          </span>
          <span className="carta-cara carta-cara-frente block">
            <span
              data-holo="foil"
              className={`relative block size-full ${volteada && joya ? "carta-joya" : ""}`}
            >
              <FotoProducto
                producto={carta}
                alt=""
                sizes="(min-width: 1024px) 176px, 33vw"
                className="mix-blend-normal"
              />
            </span>
          </span>
        </span>
      </button>
      {volteada ? (
        <div className="aparecer text-center">
          <p className="truncate text-sm font-extrabold">{nombre}</p>
          <p className="text-[13px] font-medium">
            {nueva ? "Nueva para tu álbum" : "Repetida"}
          </p>
          <Link
            href={`/producto/${carta.slug}`}
            className="text-[13px] font-bold text-azul underline"
          >
            {colones(carta.precio)} en tienda
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function BotonSonido() {
  const activo = useSonido();
  return (
    <button
      type="button"
      aria-pressed={activo}
      className="chip"
      onClick={cambiarSonido}
    >
      {activo ? "Sonido encendido" : "Encender sonido"}
    </button>
  );
}

function PremioDelSobre({ premio }: { premio: boolean }) {
  const { cupon } = useCarrito();
  const aplicado = cupon?.codigo === CUPON_SOBRE;

  if (!premio) {
    return (
      <p className="font-medium">
        Esta vez no salió cupón. Deke olió el siguiente y dice que huele bien.
      </p>
    );
  }

  return (
    <div className="flex flex-col items-start gap-2 overflow-x-clip">
      <p className="sello font-display text-2xl leading-tight text-rojo">
        ¡Te salió un cupón!
      </p>
      <p className="font-medium">
        <strong>{CUPON_SOBRE}</strong>: 5% de descuento en tu compra.
      </p>
      {aplicado ? (
        <p role="status" className="font-bold text-verde-oscuro">
          Ya quedó aplicado en tu carrito.
        </p>
      ) : (
        <button
          type="button"
          className="boton boton-rojo boton-chico"
          onClick={() => aplicarCupon(CUPON_SOBRE)}
        >
          Usarlo en mi carrito
        </button>
      )}
    </div>
  );
}

function Album() {
  const hidratado = useHidratado();
  const { cartas, sobres } = useAlbum();
  const todas = cartasDelSobre();
  const conseguidas = hidratado
    ? todas.filter((carta) => cartas.includes(carta.slug)).length
    : 0;
  const avance =
    todas.length > 0 ? Math.round((conseguidas / todas.length) * 100) : 0;

  return (
    <section aria-labelledby="titulo-album" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2
          id="titulo-album"
          className="font-display text-[22px] text-rojo md:text-3xl"
        >
          Tu álbum
        </h2>
        <p className="font-extrabold">
          {conseguidas} de {todas.length} cartas
        </p>
      </div>
      <div className="h-4 rounded-full border-2 border-tinta bg-gris-claro">
        <div
          className="pista-avance"
          style={{ width: `${avance}%`, background: "var(--color-azul)" }}
        />
      </div>
      <p className="max-w-2xl leading-snug">
        Cada carta que te sale se pega aquí. Son cartas virtuales: van a tu
        álbum, no a tu casa. Si te enamorás de una, tocala y la vemos en la
        tienda.
      </p>
      <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-10">
        {todas.map((carta) => {
          const tiene = hidratado && cartas.includes(carta.slug);
          return (
            <li key={carta.slug} className="relative aspect-[5/7]">
              {tiene ? (
                <Link
                  href={`/producto/${carta.slug}`}
                  aria-label={carta.nombre}
                  data-holo="foil"
                  className="saltar relative block size-full"
                >
                  <FotoProducto
                    producto={carta}
                    alt=""
                    sizes="(min-width: 1024px) 104px, 22vw"
                    className="mix-blend-normal"
                  />
                </Link>
              ) : (
                <DorsoCarta className="size-full opacity-25 grayscale" />
              )}
            </li>
          );
        })}
      </ul>
      {hidratado && sobres > 0 ? (
        <button
          type="button"
          className="w-fit min-h-11 cursor-pointer font-bold text-azul underline"
          onClick={vaciarAlbum}
        >
          Empezar el álbum de cero
        </button>
      ) : null}
    </section>
  );
}

export function SobreDelDia() {
  if (cartasDelSobre().length === 0) {
    return (
      <div className="flex items-center gap-4">
        <Deke className="deke h-24 shrink-0" />
        <p className="max-w-lg text-[17px] font-medium">
          Hoy no quedan cartas para el sobre. Volvé cuando entren más.
        </p>
      </div>
    );
  }
  return <JuegoDelSobre />;
}

function JuegoDelSobre() {
  const { cartas: enAlbum, sobres } = useAlbum();
  const [fase, setFase] = useState<Fase>("cerrado");
  const [resultado, setResultado] = useState<ResultadoSobre | null>(null);
  const [nuevas, setNuevas] = useState<string[]>([]);
  const [volteadas, setVolteadas] = useState<number[]>([]);
  const [todasDeUna, setTodasDeUna] = useState(false);
  const [corte, setCorte] = useState(0);
  const arrastre = useRef<number | null>(null);
  const reloj = useRef<number | undefined>(undefined);
  const zonaCartas = useRef<HTMLDivElement>(null);

  // Next deja viva esta página: al volver, el sobre debe estar cerrado otra vez.
  useLayoutEffect(
    () => () => {
      window.clearTimeout(reloj.current);
      arrastre.current = null;
      setFase("cerrado");
      setResultado(null);
      setVolteadas([]);
      setCorte(0);
    },
    [],
  );

  function abrir() {
    if (fase !== "cerrado") return;
    const sobre = abrirSobre(sobres);
    const slugs = sobre.cartas.map((carta) => carta.slug);
    arrastre.current = null;
    setCorte(1);
    setResultado(sobre);
    setNuevas(slugs.filter((slug) => !enAlbum.includes(slug)));
    setVolteadas([]);
    setTodasDeUna(false);
    setFase("saliendo");
    guardarSobre(slugs);
    sonar("rasgar");
    ganarLogro("sobre");
    const enTotal = new Set([...enAlbum, ...slugs]).size;
    if (enTotal >= 10) ganarLogro("album");
    if (enTotal >= cartasDelSobre().length) ganarLogro("completo");
    reloj.current = window.setTimeout(() => setFase("cartas"), 640);
  }

  function otroSobre() {
    setFase("cerrado");
    setResultado(null);
    setVolteadas([]);
    setCorte(0);
  }

  function festejar(sobre: ResultadoSobre) {
    if (sobre.joya) ganarLogro("joya");
    if (sobre.premio || sobre.joya) {
      lanzarConfeti();
      sonar("premio");
    }
  }

  function voltear(indice: number) {
    if (!resultado || volteadas.includes(indice)) return;
    const siguientes = [...volteadas, indice];
    setTodasDeUna(false);
    setVolteadas(siguientes);
    sonar("voltear");
    if (siguientes.length === resultado.cartas.length) festejar(resultado);
  }

  function voltearTodas() {
    if (!resultado) return;
    setTodasDeUna(true);
    setVolteadas(resultado.cartas.map((_, indice) => indice));
    festejar(resultado);
  }

  const listo = Boolean(resultado) && volteadas.length === resultado?.cartas.length;
  const animo: AnimoDeke =
    fase === "cerrado"
      ? "feliz"
      : listo && (resultado?.premio || resultado?.joya)
        ? "guino"
        : "sorpresa";

  return (
    <div className="flex flex-col gap-12">
      <section
        aria-label="Abrir el sobre del día"
        className="marco shadow-dura flex min-h-[440px] flex-col items-center justify-center gap-5 overflow-hidden bg-crema p-5 md:p-8"
      >
        {fase !== "cartas" ? (
          <>
            <div className="flex items-end gap-3">
              <div
                className="sobre"
                data-fase={fase}
                data-temblor={corte > 0 && fase === "cerrado" ? "" : undefined}
                style={{ "--corte": corte } as CSSProperties}
                onPointerDown={(evento) => {
                  if (fase !== "cerrado") return;
                  evento.currentTarget.setPointerCapture(evento.pointerId);
                  arrastre.current = evento.clientX;
                }}
                onPointerMove={(evento) => {
                  if (arrastre.current === null) return;
                  const ancho = evento.currentTarget.offsetWidth;
                  const avance = Math.min(
                    Math.abs(evento.clientX - arrastre.current) / ancho,
                    1,
                  );
                  setCorte(avance / ARRASTRE_PARA_ABRIR);
                  if (avance >= ARRASTRE_PARA_ABRIR) abrir();
                }}
                onPointerUp={() => {
                  arrastre.current = null;
                  if (fase === "cerrado") setCorte(0);
                }}
                onPointerCancel={() => {
                  arrastre.current = null;
                  setCorte(0);
                }}
              >
                <div className="sobre-tira">
                  <SobreDibujo className="size-full" />
                </div>
                <div className="sobre-cuerpo">
                  <SobreDibujo className="size-full" />
                </div>
                <div className="sobre-foil brillo brillo-solo" />
                <div className="sobre-corte" />
              </div>
              <Deke animo={animo} className="deke h-24 shrink-0 md:h-32" />
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <p className="font-display text-xl leading-tight text-azul md:text-2xl">
                Arrastrá de lado para rasgarlo
              </p>
              <button
                type="button"
                className="boton boton-rojo"
                disabled={fase !== "cerrado"}
                onClick={abrir}
              >
                Abrir sobre
              </button>
              <p className="text-sm text-gris">
                En la tienda real sería un sobre por día. En la demo, abrí los
                que querás.
              </p>
              <BotonSonido />
            </div>
          </>
        ) : null}

        {fase === "cartas" && resultado ? (
          <div ref={zonaCartas} className="flex w-full flex-col items-center gap-5">
            <div className="flex w-full flex-wrap justify-center gap-3">
              {resultado.cartas.map((carta, indice) => (
                <CartaDelSobre
                  key={carta.slug}
                  carta={carta}
                  indice={indice}
                  volteada={volteadas.includes(indice)}
                  joya={resultado.joya && indice === resultado.cartas.length - 1}
                  nueva={nuevas.includes(carta.slug)}
                  retrasoGiro={todasDeUna ? indice * 130 : 0}
                  alVoltear={() => voltear(indice)}
                />
              ))}
            </div>
            {listo ? (
              <div className="aparecer flex w-full max-w-xl flex-col items-center gap-4 border-t-3 border-tinta pt-5 text-center md:flex-row md:text-left">
                <Deke animo={animo} className="deke h-24 shrink-0" />
                <div className="flex grow flex-col items-center gap-3 md:items-start">
                  {resultado.joya ? (
                    <p className="font-display text-xl text-azul">
                      ¡Diay, te salió una joya!
                    </p>
                  ) : null}
                  <PremioDelSobre premio={resultado.premio} />
                  <button
                    type="button"
                    className="boton boton-amarillo boton-chico"
                    onClick={otroSobre}
                  >
                    Abrir otro sobre
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <p className="font-bold">Tocá cada carta para voltearla.</p>
                <button
                  type="button"
                  className="min-h-11 cursor-pointer font-bold text-azul underline"
                  onClick={voltearTodas}
                >
                  Voltear todas
                </button>
              </div>
            )}
          </div>
        ) : null}
      </section>

      <Album />
    </div>
  );
}
