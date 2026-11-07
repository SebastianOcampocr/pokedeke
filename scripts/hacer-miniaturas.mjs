#!/usr/bin/env node
/**
 * Crea versiones más pequeñas de cada foto de public/productos. La página las
 * ofrece todas y cada navegador baja la que le sirve según su pantalla, así que
 * una tarjeta de catálogo no descarga una foto de 900 píxeles.
 *
 * Corre solo antes de `npm run build`. Los anchos deben coincidir con
 * `imageSizes` y `deviceSizes` en next.config.ts.
 */
import { mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ORIGEN = path.join(RAIZ, "public/productos");
const DESTINO = path.join(RAIZ, "public/miniaturas");
const ANCHOS = [96, 192, 384, 640];
const AL_MISMO_TIEMPO = 8;

async function fecha(archivo) {
  try {
    return (await stat(archivo)).mtimeMs;
  } catch {
    return 0;
  }
}

async function achicar(nombre, ancho) {
  const origen = path.join(ORIGEN, nombre);
  const destino = path.join(DESTINO, String(ancho), nombre);
  if ((await fecha(destino)) >= (await fecha(origen))) return false;
  await sharp(origen)
    .resize({ width: ancho, withoutEnlargement: true })
    .webp({ quality: 78 })
    .toFile(destino);
  return true;
}

async function principal() {
  await Promise.all(
    ANCHOS.map((ancho) =>
      mkdir(path.join(DESTINO, String(ancho)), { recursive: true }),
    ),
  );
  const fotos = (await readdir(ORIGEN)).filter((nombre) => nombre.endsWith(".webp"));
  const tareas = fotos.flatMap((nombre) =>
    ANCHOS.map((ancho) => () => achicar(nombre, ancho)),
  );

  let hechas = 0;
  while (tareas.length > 0) {
    const tanda = await Promise.all(
      tareas.splice(0, AL_MISMO_TIEMPO).map((tarea) => tarea()),
    );
    hechas += tanda.filter(Boolean).length;
  }
  console.log(`Miniaturas: ${fotos.length} fotos, ${hechas} archivos nuevos.`);
}

await principal();
