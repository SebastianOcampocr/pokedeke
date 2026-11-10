"use client";

/**
 * La comprobación de Cloudflare Turnstile ("¿sos una persona?") para los
 * formularios que escriben en la hoja. Casi nunca se ve: solo aparece un
 * recuadro si Cloudflare tiene dudas. La llave de aquí es pública; la secreta
 * vive en las propiedades del script, que es el que pregunta a Cloudflare.
 * Sin llave no se pide nada.
 */
const LLAVE = process.env.NEXT_PUBLIC_TURNSTILE_SITEKEY ?? "";
const GUION = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
/** Cloudflare da 5 minutos por prueba: pasados 4 se pide otra. */
const VIDA = 4 * 60_000;
const ESPERA = 30_000;

type Turnstile = {
  render: (caja: HTMLElement, opciones: Record<string, unknown>) => string;
  remove: (id: string) => void;
};

let guion: Promise<Turnstile> | null = null;
let lista: { promesa: Promise<string>; desde: number } | null = null;

function cargar() {
  guion ??= new Promise<Turnstile>((listo, fallo) => {
    const etiqueta = document.createElement("script");
    etiqueta.src = GUION;
    etiqueta.async = true;
    etiqueta.onload = () =>
      listo((window as unknown as { turnstile: Turnstile }).turnstile);
    etiqueta.onerror = () => {
      guion = null;
      fallo(new Error("No cargó la comprobación."));
    };
    document.head.append(etiqueta);
  });
  return guion;
}

/** Devuelve la prueba, o "" si no se pudo: en ese caso la hoja rechaza el envío. */
async function pedir(): Promise<string> {
  try {
    const turnstile = await cargar();
    return await new Promise<string>((listo) => {
      const caja = document.createElement("div");
      caja.style.cssText =
        "position:fixed;left:50%;bottom:88px;transform:translateX(-50%);z-index:70";
      document.body.append(caja);
      let id = "";
      const terminar = (prueba: string) => {
        window.clearTimeout(reloj);
        try {
          if (id) turnstile.remove(id);
        } catch {
          // Ya no estaba.
        }
        caja.remove();
        listo(prueba);
      };
      const reloj = window.setTimeout(() => terminar(""), ESPERA);
      id = turnstile.render(caja, {
        sitekey: LLAVE,
        appearance: "interaction-only",
        callback: (prueba: string) => terminar(prueba),
        "error-callback": () => {
          terminar("");
          return true;
        },
      });
    });
  } catch {
    return "";
  }
}

/** Al tocar un formulario: va pidiendo la prueba para que esté lista al enviar. */
export function prepararVerificacion() {
  if (!LLAVE || typeof window === "undefined") return;
  if (lista && Date.now() - lista.desde < VIDA) return;
  lista = { promesa: pedir(), desde: Date.now() };
}

/** Cada prueba sirve una sola vez: la que se entrega aquí ya no se vuelve a usar. */
export async function tomarVerificacion() {
  if (!LLAVE || typeof window === "undefined") return "";
  prepararVerificacion();
  const actual = lista;
  lista = null;
  return (await actual?.promesa) || pedir();
}
