"use client";

import { crearAlmacen } from "./almacen";

type Sonido = "rasgar" | "voltear" | "sello" | "premio";

// Apagado de entrada: nadie espera que una tienda suene sin pedirlo.
const almacen = crearAlmacen<boolean>("demo-sonido", () => false, false);
let audio: AudioContext | null = null;

export function useSonido() {
  return almacen.usar();
}

export function cambiarSonido() {
  almacen.guardar((previo) => !previo);
  if (almacen.leer()) sonar("sello");
}

function tono(
  ctx: AudioContext,
  frecuencia: number,
  inicio: number,
  duracion: number,
  volumen = 0.14,
) {
  const onda = ctx.createOscillator();
  const nivel = ctx.createGain();
  onda.type = "square";
  onda.frequency.value = frecuencia;
  nivel.gain.setValueAtTime(volumen, ctx.currentTime + inicio);
  nivel.gain.exponentialRampToValueAtTime(
    0.001,
    ctx.currentTime + inicio + duracion,
  );
  onda.connect(nivel).connect(ctx.destination);
  onda.start(ctx.currentTime + inicio);
  onda.stop(ctx.currentTime + inicio + duracion);
}

/** Ruido filtrado: suena a papel metálico rompiéndose. */
function rasgado(ctx: AudioContext) {
  const largo = Math.floor(ctx.sampleRate * 0.34);
  const buffer = ctx.createBuffer(1, largo, ctx.sampleRate);
  const datos = buffer.getChannelData(0);
  for (let i = 0; i < largo; i += 1) {
    const corte = Math.sin((i / largo) * 90) > 0.2 ? 1 : 0.25;
    datos[i] = (Math.random() * 2 - 1) * corte * (1 - i / largo);
  }
  const fuente = ctx.createBufferSource();
  const filtro = ctx.createBiquadFilter();
  const nivel = ctx.createGain();
  fuente.buffer = buffer;
  filtro.type = "highpass";
  filtro.frequency.value = 1800;
  nivel.gain.value = 0.3;
  fuente.connect(filtro).connect(nivel).connect(ctx.destination);
  fuente.start();
}

/** Una campana con armónicos que se apagan solos: el "ching" de la caja. */
function campana(ctx: AudioContext, frecuencia: number, inicio: number, volumen: number) {
  [1, 2.4, 4.1].forEach((multiplo, indice) => {
    const onda = ctx.createOscillator();
    const nivel = ctx.createGain();
    onda.type = "sine";
    onda.frequency.value = frecuencia * multiplo;
    const desde = ctx.currentTime + inicio;
    const largo = 0.9 / (indice + 1);
    nivel.gain.setValueAtTime(0.0001, desde);
    nivel.gain.exponentialRampToValueAtTime(volumen / (indice + 1), desde + 0.01);
    nivel.gain.exponentialRampToValueAtTime(0.0001, desde + largo);
    onda.connect(nivel).connect(ctx.destination);
    onda.start(desde);
    onda.stop(desde + largo);
  });
}

/** "Ka-ching": el golpe de la gaveta y dos campanas. */
function caja(ctx: AudioContext) {
  const largo = Math.floor(ctx.sampleRate * 0.07);
  const buffer = ctx.createBuffer(1, largo, ctx.sampleRate);
  const datos = buffer.getChannelData(0);
  for (let i = 0; i < largo; i += 1) datos[i] = (Math.random() * 2 - 1) * (1 - i / largo);
  const golpe = ctx.createBufferSource();
  const filtro = ctx.createBiquadFilter();
  const nivel = ctx.createGain();
  golpe.buffer = buffer;
  filtro.type = "bandpass";
  filtro.frequency.value = 2400;
  nivel.gain.value = 0.35;
  golpe.connect(filtro).connect(nivel).connect(ctx.destination);
  golpe.start();
  campana(ctx, 1568, 0.08, 0.16);
  campana(ctx, 2093, 0.16, 0.14);
}

/**
 * Se llama dentro del clic de "Hacer el pedido": iPhone solo deja sonar si el
 * audio se prepara en el mismo toque, y el pedido tarda un par de segundos.
 */
export function prepararAudio() {
  try {
    audio ??= new AudioContext();
    if (audio.state === "suspended") void audio.resume();
  } catch {
    // Sin audio la tienda sigue igual.
  }
}

/** La caja registradora al confirmarse una compra. Suena aunque los demás sonidos estén apagados: es una sola vez y viene de un clic. */
export function sonarCompra() {
  try {
    audio ??= new AudioContext();
    if (audio.state === "suspended") void audio.resume();
    caja(audio);
  } catch {
    // Sin audio la tienda sigue igual.
  }
}

export function sonar(sonido: Sonido) {
  if (!almacen.leer()) return;
  try {
    audio ??= new AudioContext();
    if (audio.state === "suspended") void audio.resume();
    if (sonido === "rasgar") rasgado(audio);
    if (sonido === "voltear") tono(audio, 660, 0, 0.07);
    if (sonido === "sello") tono(audio, 150, 0, 0.1, 0.2);
    if (sonido === "premio") {
      [523, 659, 784, 1047].forEach((nota, indice) =>
        tono(audio as AudioContext, nota, indice * 0.09, 0.16),
      );
    }
  } catch {
    // Sin audio la tienda sigue igual.
  }
}
