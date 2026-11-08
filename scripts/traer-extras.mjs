#!/usr/bin/env node
/**
 * Trae de la hoja lo que la portada muestra aparte del catálogo:
 *
 * - `--solo opiniones` → datos/opiniones.json: los comentarios con permiso y sí
 *   en Publicar. Se guarda en git, porque cambia poco.
 * - `--solo vistos` → datos/mas-vistos.json: lo más visto. Cambia con cada
 *   visita, así que se trae justo antes de armar la página y no se guarda.
 *
 * Sin `--solo` trae las dos. Si Google no responde o la hoja todavía no tiene
 * esta función, los archivos quedan como están.
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const texto = (valor, maximo) => String(valor ?? "").trim().slice(0, maximo);
const entero = (valor) => Math.max(Math.floor(Number(valor) || 0), 0);

export function limpiarOpiniones(lista) {
  if (!Array.isArray(lista)) return null;
  return lista
    .map((opinion) => ({
      fecha: /^\d{4}-\d{2}-\d{2}$/.test(opinion?.fecha) ? opinion.fecha : "",
      estrellas: Math.min(entero(opinion?.estrellas), 5),
      comentario: texto(opinion?.comentario, 1000),
      nombre: texto(opinion?.nombre, 40),
      compra: opinion?.compra === true,
    }))
    .filter((opinion) => opinion.comentario.length >= 3)
    .slice(0, 12);
}

export function limpiarVistos(lista) {
  if (!Array.isArray(lista)) return null;
  return lista
    .filter((visto) => /^[a-z0-9-]{1,200}$/.test(visto?.slug ?? ""))
    .map((visto) => ({
      slug: visto.slug,
      vistas: entero(visto.vistas),
      agregados: entero(visto.agregados),
    }))
    .slice(0, 40);
}

async function descargar(url) {
  for (let intento = 1; intento <= 3; intento += 1) {
    try {
      const respuesta = await fetch(url, {
        redirect: "follow",
        signal: AbortSignal.timeout(20_000),
      });
      if (respuesta.ok) return await respuesta.json();
      console.log(`Intento ${intento}: Google respondió ${respuesta.status}.`);
    } catch (error) {
      console.log(`Intento ${intento}: ${error.message}`);
    }
    await new Promise((listo) => setTimeout(listo, 3000 * intento));
  }
  return null;
}

async function guardar(nombre, datos) {
  await writeFile(path.join(RAIZ, "datos", nombre), `${JSON.stringify(datos, null, 2)}\n`);
}

async function principal() {
  const indice = process.argv.indexOf("--solo");
  const solo = indice === -1 ? null : process.argv[indice + 1];
  if (!process.env.PEDIDOS_URL) {
    console.log("Falta PEDIDOS_URL: las opiniones y lo más visto quedan como están.");
    return;
  }
  const respuesta = await descargar(`${process.env.PEDIDOS_URL}?accion=extras`);
  if (!respuesta?.ok || !("opiniones" in respuesta)) {
    console.log("La hoja no mandó opiniones ni lo más visto: quedan como están.");
    return;
  }
  if (solo !== "vistos") {
    const opiniones = limpiarOpiniones(respuesta.opiniones);
    if (opiniones) {
      await guardar("opiniones.json", opiniones);
      console.log(`Opiniones publicadas: ${opiniones.length}.`);
    }
  }
  if (solo !== "opiniones") {
    const vistos = limpiarVistos(respuesta.masVistos);
    if (vistos) {
      await guardar("mas-vistos.json", vistos);
      console.log(`Lo más visto: ${vistos.length} productos.`);
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  principal().catch((error) => {
    // Nunca frena la publicación: la portada sale con lo que ya había.
    console.log(`::warning::${error.message}`);
  });
}
