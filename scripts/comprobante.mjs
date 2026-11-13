#!/usr/bin/env node
/**
 * Comprobante de pago o de abono con el diseño de Pokedeke, en PDF.
 *
 *   node scripts/comprobante.mjs datos.json carpeta-de-salida
 *
 * datos.json (los datos del cliente NO van en el repo):
 * {
 *   "numero": "TCG-0005", "fecha": "2026-11-12",
 *   "cliente": "Nombre", "whatsapp": "8888-8888", "correo": "",
 *   "lineas": [{ "nombre": "…", "cantidad": 1, "precio": 180000, "slug": "…" }],
 *   "pagos": [{ "fecha": "2026-11-12", "monto": 90000, "detalle": "SINPE Móvil" }],
 *   "saldoCuando": "el 30 de Noviembre, o antes si el producto llega antes",
 *   "entrega": "Llega entre el 19 y el 22 de Noviembre."
 * }
 *
 * No es una factura electrónica de Hacienda: por eso se llama comprobante.
 * Usa el Chrome de la compu para pasarlo a PDF.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const [archivoDatos, carpeta] = process.argv.slice(2);
if (!archivoDatos || !carpeta) {
  console.error("Uso: node scripts/comprobante.mjs datos.json carpeta-de-salida");
  process.exit(1);
}

const TIENDA = {
  sinpe: "8781-2831",
  correo: "sac@pokedeke.store",
  sitio: "pokedeke.store",
  instagram: "@pokedek.cr",
};
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

const datos = JSON.parse(readFileSync(archivoDatos, "utf8"));
const colones = (monto) =>
  "₡" + Math.round(monto).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const fechaLarga = (texto) => {
  const [anio, mes, dia] = String(texto).split("-").map(Number);
  return `${dia} de ${MESES[mes - 1]} de ${anio}`;
};
const escapar = (valor) =>
  String(valor ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const comoDataUri = (archivo, tipo) =>
  existsSync(archivo) ? `data:${tipo};base64,${readFileSync(archivo).toString("base64")}` : "";

const total = datos.lineas.reduce((suma, l) => suma + l.cantidad * l.precio, 0);
const pagado = (datos.pagos || []).reduce((suma, p) => suma + p.monto, 0);
const saldo = Math.max(total - pagado, 0);
const titulo = saldo > 0 ? "Comprobante de abono" : "Comprobante de pago";
const toldo = comoDataUri(path.join(raiz, "public/correo/toldo.png"), "image/png");

const DEKE = `<svg viewBox="0 0 120 150" aria-hidden="true" class="deke"><path d="M46 126v15h-9" stroke="#141414" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M74 126v15h9" stroke="#141414" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M17 82Q6 80 7 68" stroke="#141414" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M103 82Q114 76 113 58" stroke="#141414" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/><rect x="16" y="10" width="88" height="118" rx="12" fill="#1437A8" stroke="#141414" stroke-width="4"/><rect x="25" y="19" width="70" height="100" rx="7" fill="#FFCE1F" stroke="#141414" stroke-width="3"/><circle cx="46" cy="62" r="7" fill="#141414"/><circle cx="48.5" cy="59.5" r="2.4" fill="#FFFFFF"/><path d="M67 62q7-7 14 0" stroke="#141414" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M47 81q13 15 26 0" stroke="#141414" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`;

const filas = datos.lineas
  .map((linea) => {
    const foto = linea.slug
      ? comoDataUri(path.join(raiz, "public/miniaturas", linea.slug + ".webp"), "image/webp") ||
        comoDataUri(path.join(raiz, "public/productos", linea.slug + ".webp"), "image/webp")
      : "";
    return `<tr>
      <td class="producto">${foto ? `<img src="${foto}" alt="">` : ""}<span>${escapar(linea.nombre)}</span></td>
      <td class="num">${linea.cantidad}</td>
      <td class="num">${colones(linea.precio)}</td>
      <td class="num fuerte">${colones(linea.cantidad * linea.precio)}</td>
    </tr>`;
  })
  .join("");

const pagos = (datos.pagos || [])
  .map(
    (pago) => `<div class="renglon verde"><span>Abono · ${fechaLarga(pago.fecha).replace(/ de \d{4}$/, "")}${pago.detalle ? ` · ${escapar(pago.detalle)}` : ""}</span><strong>−${colones(pago.monto)}</strong></div>`,
  )
  .join("");

const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>${titulo} ${escapar(datos.numero)} · Pokedeke</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bungee&family=Rubik:wght@400;500;700;800&display=block" rel="stylesheet">
<style>
  @page { size: letter; margin: 0; }
  :root { --amarillo:#ffce1f; --azul:#1437a8; --rojo:#c8201a; --tinta:#141414; --crema:#fff3c2; --verde:#0e7c43; --gris:#5b5b5b; }
  * { box-sizing: border-box; }
  html, body { margin: 0; background: #fff; color: var(--tinta); font-family: Rubik, system-ui, sans-serif; font-size: 13.5px; }
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .hoja { width: 8.5in; min-height: 11in; display: flex; flex-direction: column; }
  .cabecera { background: var(--amarillo); padding: 34px 48px 22px; display: flex; justify-content: space-between; align-items: center; gap: 24px; }
  .logo { font-family: Bungee, "Arial Black", sans-serif; font-size: 30px; color: #fff; background: var(--rojo); border: 3px solid var(--tinta); border-radius: 10px; padding: 8px 18px 4px; box-shadow: 5px 5px 0 var(--tinta); transform: rotate(-2deg); letter-spacing: .5px; }
  .titulo { text-align: right; }
  .titulo h1 { font-family: Bungee, "Arial Black", sans-serif; color: var(--azul); font-size: 26px; line-height: 1.05; margin: 0 0 8px; text-transform: uppercase; }
  .titulo p { margin: 2px 0; font-weight: 700; }
  .toldo { height: 26px; background: url("${toldo}") repeat-x left top / auto 26px; border-top: 3px solid var(--tinta); }
  .cuerpo { padding: 26px 48px 20px; flex: 1; display: flex; flex-direction: column; gap: 20px; }
  .tarjetas { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .marco { border: 3px solid var(--tinta); border-radius: 10px; padding: 14px 16px; }
  .marco h2 { font-size: 11.5px; letter-spacing: .8px; text-transform: uppercase; color: var(--rojo); margin: 0 0 6px; }
  .marco p { margin: 2px 0; line-height: 1.35; }
  .grande { font-weight: 800; font-size: 15px; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 11.5px; letter-spacing: .6px; text-transform: uppercase; padding: 0 8px 8px; border-bottom: 3px solid var(--tinta); }
  th.num, td.num { text-align: right; white-space: nowrap; }
  td { padding: 10px 8px; border-bottom: 1.5px solid #e4e4e4; vertical-align: middle; }
  td.producto { display: flex; align-items: center; gap: 12px; font-weight: 500; }
  td.producto img { width: 64px; height: 44px; object-fit: contain; border: 2px solid var(--tinta); border-radius: 6px; background: #fff; }
  .fuerte { font-weight: 800; }
  .resumen { display: grid; grid-template-columns: 1fr 300px; gap: 20px; align-items: start; }
  .montos { background: var(--crema); }
  .renglon { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; padding: 5px 0; }
  .renglon > :last-child, .aviso strong { white-space: nowrap; }
  .renglon.verde { color: var(--verde); font-weight: 700; }
  .renglon.total { font-weight: 800; font-size: 15px; border-bottom: 2px solid var(--tinta); padding-bottom: 8px; margin-bottom: 4px; }
  .saldo { margin-top: 6px; padding-top: 8px; border-top: 2px solid var(--tinta); }
  .saldo span { font-weight: 800; }
  .saldo strong { font-family: Bungee, "Arial Black", sans-serif; font-size: 22px; color: var(--rojo); font-weight: 400; }
  .saldo.listo strong { color: var(--verde); }
  .aviso { line-height: 1.45; }
  .aviso p { margin: 0 0 8px; }
  .gracias { display: flex; align-items: center; gap: 14px; margin-top: auto; }
  .deke { height: 74px; flex-shrink: 0; }
  .gracias p { font-family: Bungee, "Arial Black", sans-serif; color: var(--azul); font-size: 17px; margin: 0; }
  .pie { background: var(--azul); color: #fff; padding: 16px 48px; display: flex; justify-content: space-between; font-weight: 700; font-size: 12.5px; border-top: 3px solid var(--tinta); }
</style>
</head>
<body>
<div class="hoja">
  <header class="cabecera">
    <div class="logo">POKEDEKE</div>
    <div class="titulo">
      <h1>${titulo}</h1>
      <p>N.º ${escapar(datos.numero)}</p>
      <p>${fechaLarga(datos.fecha)}</p>
    </div>
  </header>
  <div class="toldo"></div>
  <main class="cuerpo">
    <section class="tarjetas">
      <div class="marco">
        <h2>Cliente</h2>
        <p class="grande">${escapar(datos.cliente)}</p>
        ${datos.whatsapp ? `<p>WhatsApp ${escapar(datos.whatsapp)}</p>` : ""}
        ${datos.correo ? `<p>${escapar(datos.correo)}</p>` : ""}
      </div>
      <div class="marco">
        <h2>Entrega</h2>
        <p>${escapar(datos.entrega || "Coordinamos la entrega por WhatsApp.")}</p>
      </div>
    </section>

    <table>
      <thead><tr><th>Producto</th><th class="num">Cant.</th><th class="num">Precio</th><th class="num">Subtotal</th></tr></thead>
      <tbody>${filas}</tbody>
    </table>

    <section class="resumen">
      <div class="aviso">
        ${
          saldo > 0
            ? `<p><strong>Falta pagar ${colones(saldo)}</strong>${datos.saldoCuando ? ` ${escapar(datos.saldoCuando)}` : ""}.</p>
               <p>Hacé el SINPE Móvil al <strong>${TIENDA.sinpe}</strong> y en el detalle poné <strong>${escapar(datos.numero)}</strong>.</p>`
            : `<p><strong>¡Pagado por completo!</strong> Gracias por tu compra.</p>`
        }
        ${datos.notas ? `<p>${escapar(datos.notas)}</p>` : ""}
      </div>
      <div class="marco montos">
        <div class="renglon total"><span>Total</span><span>${colones(total)}</span></div>
        ${pagos}
        <div class="renglon saldo ${saldo > 0 ? "" : "listo"}"><span>${saldo > 0 ? "Saldo pendiente" : "Saldo"}</span><strong>${colones(saldo)}</strong></div>
      </div>
    </section>

    <div class="gracias">${DEKE}<p>¡Gracias por comprar en Pokedeke!</p></div>
  </main>
  <footer class="pie">
    <span>${TIENDA.sitio}</span><span>${TIENDA.correo}</span><span>Instagram ${TIENDA.instagram}</span>
  </footer>
</div>
</body>
</html>`;

mkdirSync(carpeta, { recursive: true });
const base = path.join(path.resolve(carpeta), `${titulo.replace(/ /g, "-")}-${datos.numero}`);
writeFileSync(base + ".html", html);
const chrome = ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find(existsSync);
if (!chrome) {
  console.log("No hallé Chrome: quedó solo el HTML en", base + ".html");
  process.exit(0);
}
execFileSync(chrome, [
  "--headless=new",
  "--disable-gpu",
  "--no-pdf-header-footer",
  "--virtual-time-budget=8000",
  `--print-to-pdf=${base}.pdf`,
  "file://" + base + ".html",
], { stdio: "ignore" });
console.log(base + ".pdf");
