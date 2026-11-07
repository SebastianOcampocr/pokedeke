"use client";

import Link from "next/link";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  guardarSobre,
  proximoSobre,
  useAlbum,
  vaciarAlbum,
} from "@/lib/album";
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
import { CUPONES } from "@/lib/tienda";
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

/** Dibujar todo el álbum junto trabaría los celulares cuando hay cientos de cartas. */
const CARTAS_POR_TANDA = 40;

function PremioDelSobre({ premio }: { premio: boolean }) {
  const { cupon } = useCarrito();
  const aplicado = cupon?.codigo === CUPON_SOBRE;

  if (!CUPONES.some((opcion) => opcion.codigo === CUPON_SOBRE)) return null;

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
  const [cantidad, setCantidad] = useState(CARTAS_POR_TANDA);
  const pegadas = useMemo(
    () => new Set(hidratado ? cartas : []),
    [hidratado, cartas],
  );
  // Primero las que ya salieron, para que el álbum muestre lo conseguido.
  const todas = useMemo(() => {
    const cartasDisponibles = cartasDelSobre();
    return [
      ...cartasDisponibles.filter((carta) => pegadas.has(carta.slug)),
      ...cartasDisponibles.filter((carta) => !pegadas.has(carta.slug)),
    ];
  }, [pegadas]);
  const conseguidas = todas.filter((carta) => pegadas.has(carta.slug)).length;
  const restantes = todas.length - cantidad;
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
        {todas.slice(0, cantidad).map((carta) => {
          const tiene = pegadas.has(carta.slug);
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
      {restantes > 0 ? (
        <button
          type="button"
          className="boton boton-amarillo boton-chico w-fit"
          onClick={() => setCantidad((valor) => valor + CARTAS_POR_TANDA)}
        >
          Ver {Math.min(restantes, CARTAS_POR_TANDA)} cartas más
        </button>
      ) : null}
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

/** Cuánto falta y cuándo sale, con la hora del teléfono de quien lo ve. */
function ProximoSobre({ hasta, ahora }: { hasta: number; ahora: number }) {
  const minutos = Math.max(Math.ceil((hasta - ahora) / 60_000), 1);
  const horas = Math.floor(minutos / 60);
  const espera =
    horas > 0 ? `${horas} h ${minutos % 60} min` : `${minutos} min`;
  const momento = new Intl.DateTimeFormat("es-CR", {
    weekday: "long",
    hour: "numeric",
    minute: "2-digit",
  }).format(hasta);

  return (
    <p role="status" className="font-medium">
      Tu próximo sobre sale en <strong>{espera}</strong> ({momento}).
    </p>
  );
}

function JuegoDelSobre() {
  const hidratado = useHidratado();
  const { cartas: enAlbum, sobres, ultimoSobre } = useAlbum();
  const siguiente = proximoSobre(ultimoSobre);
  const [ahora, setAhora] = useState(0);
  const [fase, setFase] = useState<Fase>("cerrado");
  const [resultado, setResultado] = useState<ResultadoSobre | null>(null);
  const [nuevas, setNuevas] = useState<string[]>([]);
  const [volteadas, setVolteadas] = useState<number[]>([]);
  const [todasDeUna, setTodasDeUna] = useState(false);
  const [corte, setCorte] = useState(0);
  const arrastre = useRef<number | null>(null);
  const reloj = useRef<number | undefined>(undefined);
  const zonaCartas = useRef<HTMLDivElement>(null);

  const bloqueado = hidratado && ahora > 0 && ahora < siguiente;

  // El sobre se libera solo cuando se cumple el tiempo, sin recargar.
  useLayoutEffect(() => setAhora(Date.now()), [siguiente]);
  useEffect(() => {
    if (!bloqueado) return;
    const tic = window.setInterval(() => setAhora(Date.now()), 10_000);
    return () => window.clearInterval(tic);
  }, [bloqueado]);

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
    if (fase !== "cerrado" || Date.now() < siguiente) return;
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
        {bloqueado && fase === "cerrado" ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <Deke animo="guino" className="deke h-28" />
            <p className="font-display text-2xl leading-tight text-azul">
              Ya abriste tu sobre de hoy
            </p>
            <ProximoSobre hasta={siguiente} ahora={ahora} />
            <Link href="/catalogo" className="boton boton-amarillo boton-chico">
              Ver el catálogo
            </Link>
          </div>
        ) : fase !== "cartas" ? (
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
                Un sobre cada 24 horas. Las cartas son virtuales y van a tu
                álbum.
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
                  {bloqueado ? (
                    <ProximoSobre hasta={siguiente} ahora={ahora} />
                  ) : (
                    <button
                      type="button"
                      className="boton boton-amarillo boton-chico"
                      onClick={otroSobre}
                    >
                      Abrir otro sobre
                    </button>
                  )}
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
