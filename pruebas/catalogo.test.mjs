// El catálogo: lo que entrega la hoja, el freno y los enlaces de productos renombrados.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import { lineasDeRedireccion } from "../scripts/hacer-redirecciones.mjs";
import { armarCatalogo, enlacesViejos, revisarCambio } from "../scripts/traer-catalogo.mjs";

const require = createRequire(import.meta.url);
const { nuevaHoja } = require("./hoja-falsa.cjs");
const SIN_FOTOS = { existentes: new Set(), porClave: new Map() };
const producto = (id, slug, extra = {}) => ({ id, slug, stock: 1, precio: 1000, ...extra });
const muchos = (cuantos) => Array.from({ length: cuantos }, (_, i) => producto("C" + i, "producto-" + i));

test("la página arma el catálogo con lo que entrega la hoja", () => {
  const csv = nuevaHoja().get({ accion: "catalogo" }).t;
  const { productos } = armarCatalogo(csv, SIN_FOTOS);
  assert.deepEqual(
    productos.map((p) => p.slug).sort(),
    ["caja-pesada", "eevee-ex-174-promo", "etb-30th-celebration", "preventa-x", "sin-stock"],
  );
  const etb = productos.find((p) => p.slug === "etb-30th-celebration");
  assert.equal(etb.precio, 50000);
  assert.equal(etb.stock, 5);
  assert.equal(etb.id, "C002");
});

test("la página y la hoja deciden igual el estado y las unidades de cada producto", () => {
  const hoja = nuevaHoja();
  const cat = hoja.hojas["Catálogo web"];
  // Fila 5 Eevee (1 unidad), fila 7 el segundo lote del ETB (3 unidades), fila 12 Caja pesada.
  cat.escribir(5, 18, "Por consultar");
  cat.escribir(7, 18, "En camino");
  cat.escribir(12, 18, "no publicado");
  hoja.ctx.olvidarStock();
  const { productos } = armarCatalogo(hoja.get({ accion: "catalogo" }).t, SIN_FOTOS);
  const vivo = JSON.parse(hoja.get({ accion: "stock" }).t).productos;
  assert.equal(productos.find((p) => p.slug === "caja-pesada"), undefined);
  assert.equal(vivo["caja-pesada"], undefined);
  for (const p of productos) {
    assert.deepEqual([p.slug, p.stock, p.estado], [p.slug, vivo[p.slug].stock, vivo[p.slug].estado]);
  }
  const de = (slug) => productos.find((p) => p.slug === slug);
  assert.deepEqual([de("eevee-ex-174-promo").stock, de("eevee-ex-174-promo").estado], [0, "Por consultar"]);
  assert.deepEqual([de("etb-30th-celebration").stock, de("etb-30th-celebration").estado], [2, "Disponible"]);
  // La etiqueta vieja de preventa ya no se vende ni se muestra como etiqueta.
  assert.deepEqual([de("preventa-x").stock, de("preventa-x").estado, de("preventa-x").etiqueta], [0, "Por consultar", undefined]);
  assert.deepEqual([de("sin-stock").stock, de("sin-stock").estado], [0, "Agotado"]);
});

test("pasar productos a En camino o Por consultar no dispara el freno", () => {
  const previos = muchos(40);
  const nuevos = previos.map((p, i) => (i < 30 ? { ...p, stock: 0, estado: "Por consultar" } : p));
  assert.deepEqual(revisarCambio(previos, nuevos), []);
});

test("una celda con error de fórmula no se publica", () => {
  const csv = nuevaHoja().get({ accion: "catalogo" }).t.replace('"Caja pesada","ETB","Pokémon","","5"', '"Caja pesada","ETB","Pokémon","","#REF!"');
  assert.match(csv, /#REF!/);
  assert.throws(() => armarCatalogo(csv, SIN_FOTOS), /1 filas con errores de fórmula \(por ejemplo Caja pesada\)/);
});

test("el freno deja pasar los cambios normales", () => {
  const previos = muchos(100);
  assert.deepEqual(revisarCambio(previos, previos), []);
  assert.deepEqual(revisarCambio(previos, previos.slice(8)), [], "quitar 8 de 100 es normal");
  const vendidos = previos.map((p, i) => (i < 30 ? { ...p, stock: 0 } : p));
  assert.deepEqual(revisarCambio(previos, vendidos), [], "vender 30 de 100 es normal");
  assert.deepEqual(revisarCambio(muchos(5), []), [], "con catálogos chiquitos no aplica");
});

test("el freno para cuando desaparece o se agota mucho de golpe", () => {
  const previos = muchos(100);
  assert.match(revisarCambio(previos, previos.slice(30))[0], /^Desaparecieron 30 de 100 productos/);
  const sinStock = previos.map((p, i) => (i < 60 ? { ...p, stock: 0 } : p));
  assert.match(revisarCambio(previos, sinStock)[0], /^Se agotaron de golpe 60 de 100/);
  const caros = previos.map((p) => ({ ...p, precio: 5000 }));
  const regalados = caros.map((p, i) => (i < 10 ? { ...p, precio: 500 } : p));
  assert.match(revisarCambio(caros, regalados)[0], /^10 productos bajaron de precio más de un 80%/);
});

test("un producto renombrado no cuenta como desaparecido y deja su enlace viejo", () => {
  const previos = muchos(100);
  const nuevos = previos.map((p, i) => (i < 40 ? { ...p, slug: p.slug + "-nm" } : p));
  assert.deepEqual(revisarCambio(previos, nuevos), []);
  const enlaces = enlacesViejos(previos, nuevos);
  assert.equal(Object.keys(enlaces).length, 40);
  assert.equal(enlaces["producto-0"], "producto-0-nm");
});

test("los enlaces viejos siguen la cadena y se limpian solos", () => {
  const a = [producto("C1", "giratina"), producto("C2", "umbreon")];
  const b = [producto("C1", "giratina-nm"), producto("C2", "umbreon")];
  const c = [producto("C1", "giratina-vstar-nm"), producto("C2", "umbreon")];
  const primero = enlacesViejos(a, b);
  assert.deepEqual(primero, { giratina: "giratina-nm" });
  const segundo = enlacesViejos(b, c, primero);
  assert.deepEqual(segundo, { giratina: "giratina-vstar-nm", "giratina-nm": "giratina-vstar-nm" });
  // La dirección vieja vuelve a ser un producto de verdad: deja de redirigir.
  const d = [...c, producto("C3", "giratina")];
  assert.deepEqual(enlacesViejos(c, d, segundo), { "giratina-nm": "giratina-vstar-nm" });
  // El destino ya no está publicado: no se manda a una página que no existe.
  assert.deepEqual(enlacesViejos(c, [producto("C2", "umbreon")], segundo), {});
});

test("las redirecciones salen en el formato de Cloudflare Pages", () => {
  assert.deepEqual(lineasDeRedireccion({ giratina: "giratina-nm", "../malo": "x", bueno: "http://afuera" }), [
    "/producto/giratina /producto/giratina-nm 301",
  ]);
});
