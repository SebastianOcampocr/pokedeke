#!/usr/bin/env node
/**
 * Arma public/_redirects, que Cloudflare Pages lee al publicar: cada dirección
 * vieja de datos/enlaces-viejos.json manda a la nueva. Ese archivo lo lleva
 * scripts/traer-catalogo.mjs; aquí no se edita nada a mano.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SLUG = /^[a-z0-9-]{1,200}$/;

export function lineasDeRedireccion(enlaces) {
  return Object.entries(enlaces)
    .filter(([viejo, nuevo]) => SLUG.test(viejo) && SLUG.test(String(nuevo)))
    .map(([viejo, nuevo]) => "/producto/" + viejo + " /producto/" + nuevo + " 301");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  let enlaces = {};
  try {
    enlaces = JSON.parse(await readFile(path.join(RAIZ, "datos/enlaces-viejos.json"), "utf8"));
  } catch {
    // Sin archivo no hay nada que redirigir.
  }
  const lineas = lineasDeRedireccion(enlaces);
  await writeFile(path.join(RAIZ, "public/_redirects"), lineas.join("\n") + (lineas.length ? "\n" : ""));
  console.log("Redirecciones de productos renombrados: " + lineas.length + ".");
}
