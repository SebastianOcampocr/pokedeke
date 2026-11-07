"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { crearAlmacen } from "@/lib/almacen";
import { lanzarConfeti } from "@/lib/confeti";
import { ganarLogro } from "@/lib/logros";
import { Deke } from "./Deke";
import { IconoEquis } from "./Iconos";

type Dicho = { texto: string; enlace?: { href: string; texto: string } };

const POR_PAGINA: { ruta: string; dicho: Dicho }[] = [
  {
    ruta: "/catalogo",
    dicho: {
      texto: "¿Muchas opciones? Yo te ayudo a escoger.",
      enlace: { href: "/guia", texto: "Ayudame, Deke" },
    },
  },
  {
    ruta: "/producto",
    dicho: { texto: "Yo mismo lo cuido en el mezzanine. Palabra de carta." },
  },
  {
    ruta: "/carrito",
    dicho: { texto: "Revisá bien, que no se te quede nada por fuera." },
  },
  {
    ruta: "/favoritos",
    dicho: { texto: "Mandale esta lista a alguien que te quiera mucho." },
  },
  {
    ruta: "/guia",
    dicho: { texto: "Tranqui, aquí nadie nace sabiendo qué es una ETB." },
  },
  {
    ruta: "/nosotros",
    dicho: { texto: "Sí, ese mezzanine lo cuido yo. Hasta los domingos." },
  },
  {
    ruta: "/caja-compartida",
    dicho: { texto: "Yo abro los sobres. Tengo patas, pero buen pulso." },
  },
  {
    ruta: "/cajas-misteriosas",
    dicho: { texto: "Las armo yo. Qué traen no lo digo ni con cosquillas." },
  },
  {
    ruta: "/cedula",
    dicho: { texto: "Sin fotocopia ni fila. Mejor trámite que este, ninguno." },
  },
  {
    ruta: "/vender",
    dicho: { texto: "¿Esa carta en el cajón? Aquí tiene mejor futuro." },
  },
  {
    ruta: "/pedido",
    dicho: { texto: "Si dice en camino, es que va en camino. Yo mismo lo vi salir." },
  },
];

const INICIO: Dicho = {
  texto: "¡Upe! Abrí el sobre del día, capaz te sale un cupón.",
  enlace: { href: "/sobre", texto: "Abrir sobre" },
};

const OCURRENCIAS = [
  "¡Ey, con cuidado, que soy edición limitada!",
  "No me doblés, que pierdo valor.",
  "Soy Near Mint, por si preguntan.",
  "Me dijeron que del mezzanine se ve todo San José. Mentira.",
  "Seguí tocando, a ver qué pasa…",
  "Ya casi. Te juro que algo pasa.",
];

// Rutas donde Deke solo estorbaría: pagar, abrir el sobre y el panel.
const SIN_DEKE = ["/pago", "/sobre", "/panel"];
const TOQUES_PARA_SHINY = 7;

const shiny = crearAlmacen<boolean>("demo-deke-shiny", () => false, false);

export function DekeCompa() {
  const ruta = usePathname();
  const esShiny = shiny.usar();
  const [dicho, setDicho] = useState<Dicho | null>(null);
  const [cerrado, setCerrado] = useState(false);
  const [brinco, setBrinco] = useState(0);
  const toques = useRef(0);
  const reloj = useRef<number | undefined>(undefined);

  const fuera = SIN_DEKE.some((opcion) => ruta.startsWith(opcion));

  useEffect(() => {
    document.documentElement.toggleAttribute("data-deke-shiny", esShiny);
  }, [esShiny]);

  function decir(nuevo: Dicho) {
    setDicho(nuevo);
    window.clearTimeout(reloj.current);
    reloj.current = window.setTimeout(() => setDicho(null), 7000);
  }

  useEffect(() => {
    if (fuera || cerrado) return;
    const propio =
      ruta === "/"
        ? INICIO
        : POR_PAGINA.find((opcion) => ruta.startsWith(opcion.ruta))?.dicho;
    if (!propio) return;
    const espera = window.setTimeout(() => {
      setDicho(propio);
      window.clearTimeout(reloj.current);
      reloj.current = window.setTimeout(() => setDicho(null), 7000);
    }, 1600);
    return () => {
      window.clearTimeout(espera);
      window.clearTimeout(reloj.current);
      setDicho(null);
    };
  }, [ruta, fuera, cerrado]);

  if (fuera || cerrado) return null;

  function tocar() {
    setBrinco((valor) => valor + 1);
    toques.current += 1;
    if (toques.current === TOQUES_PARA_SHINY) {
      shiny.guardar(() => true);
      ganarLogro("shiny");
      lanzarConfeti();
      decir({ texto: "¡Me volví shiny! Que quede entre nosotros." });
      return;
    }
    decir({
      texto:
        OCURRENCIAS[(toques.current - 1) % OCURRENCIAS.length] ??
        OCURRENCIAS[0],
    });
  }

  return (
    <div className="compa" data-escondido={dicho ? undefined : ""}>
      {dicho ? (
        <div role="status" className="globo">
          <button
            type="button"
            aria-label="Esconder a Deke"
            onClick={() => setCerrado(true)}
            className="absolute -top-3 -left-3 flex size-7 items-center justify-center rounded-full border-2 border-tinta bg-rojo text-white"
          >
            <IconoEquis tamano={13} />
          </button>
          <p>{dicho.texto}</p>
          {dicho.enlace ? (
            <Link
              href={dicho.enlace.href}
              className="mt-1 block font-extrabold text-azul underline"
            >
              {dicho.enlace.texto}
            </Link>
          ) : null}
        </div>
      ) : null}
      <button
        type="button"
        aria-label="Hablar con Deke"
        className="compa-cuerpo"
        onClick={tocar}
      >
        <span key={brinco} className={`block ${brinco ? "compa-brinco" : ""}`}>
          <Deke animo={dicho ? "guino" : "feliz"} className="w-full" />
        </span>
      </button>
    </div>
  );
}
