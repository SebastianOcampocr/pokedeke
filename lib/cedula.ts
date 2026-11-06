export const PROVINCIAS = [
  "San José",
  "Alajuela",
  "Cartago",
  "Heredia",
  "Guanacaste",
  "Puntarenas",
  "Limón",
];

export const TIPOS = [
  { nombre: "Eléctrico", color: "#FFCE1F", fuerte: "#141414" },
  { nombre: "Fuego", color: "#C8201A", fuerte: "#FFFFFF" },
  { nombre: "Agua", color: "#1437A8", fuerte: "#FFFFFF" },
  { nombre: "Planta", color: "#0E7C43", fuerte: "#FFFFFF" },
  { nombre: "Psíquico", color: "#8A2BE2", fuerte: "#FFFFFF" },
  { nombre: "Siniestro", color: "#2B2B33", fuerte: "#FFFFFF" },
];

export type DatosCedula = {
  nombre: string;
  provincia: string;
  tipo: string;
  rango: string;
  cartas: number;
  totalCartas: number;
  stickers: string[];
};

/** Siempre da el mismo número para el mismo nombre. */
export function numeroCedula(nombre: string) {
  let suma = 7;
  for (const letra of nombre.trim().toLowerCase()) {
    suma = (suma * 31 + (letra.codePointAt(0) ?? 0)) % 99999999;
  }
  const cifras = String(suma).padStart(8, "0");
  return `7-${cifras.slice(0, 4)}-${cifras.slice(4)}`;
}

const ANCHO = 1000;
const ALTO = 630;

function recortar(ctx: CanvasRenderingContext2D, texto: string, maximo: number) {
  if (ctx.measureText(texto).width <= maximo) return texto;
  let corto = texto;
  while (corto.length > 1 && ctx.measureText(`${corto}…`).width > maximo) {
    corto = corto.slice(0, -1);
  }
  return `${corto}…`;
}

function caja(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ancho: number,
  alto: number,
  radio: number,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, ancho, alto, radio);
}

function dibujarDeke(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
) {
  ctx.lineWidth = 7;
  ctx.strokeStyle = "#141414";
  ctx.fillStyle = color;
  caja(ctx, x, y, 170, 228, 20);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#FFCE1F";
  caja(ctx, x + 17, y + 17, 136, 194, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#141414";
  for (const ojo of [55, 115]) {
    ctx.beginPath();
    ctx.arc(x + ojo, y + 96, 13, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#FFFFFF";
  for (const ojo of [60, 120]) {
    ctx.beginPath();
    ctx.arc(x + ojo, y + 91, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.lineWidth = 9;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(x + 85, y + 122, 30, 0.2 * Math.PI, 0.8 * Math.PI);
  ctx.stroke();
}

/** Dibuja la cédula en un lienzo: lo que se ve es lo que se descarga. */
export async function dibujarCedula(
  lienzo: HTMLCanvasElement,
  datos: DatosCedula,
) {
  const estilos = getComputedStyle(document.documentElement);
  const titulos = estilos.getPropertyValue("--font-bungee") || "sans-serif";
  const textos = estilos.getPropertyValue("--font-rubik") || "sans-serif";
  // Solo la fuente principal: la de respaldo usa Arial, que en Linux no existe.
  // Si tampoco llega (por ejemplo, al salir de la página), se dibuja igual.
  await Promise.all([
    document.fonts.load(`40px ${titulos.split(",")[0]}`),
    document.fonts.load(`700 28px ${textos.split(",")[0]}`),
  ]).catch(() => undefined);

  const ctx = lienzo.getContext("2d");
  if (!ctx) return;
  lienzo.width = ANCHO;
  lienzo.height = ALTO;
  const tipo = TIPOS.find((opcion) => opcion.nombre === datos.tipo) ?? TIPOS[0];

  // Fondo y rayos de rótulo.
  ctx.fillStyle = "#FFF3C2";
  caja(ctx, 6, 6, ANCHO - 12, ALTO - 12, 30);
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.translate(ANCHO * 0.72, ALTO * 0.62);
  ctx.fillStyle = "rgba(255, 206, 31, 0.55)";
  for (let rayo = 0; rayo < 14; rayo += 1) {
    ctx.rotate((Math.PI * 2) / 14);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-70, -800);
    ctx.lineTo(70, -800);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Encabezado con toldo.
  ctx.save();
  caja(ctx, 6, 6, ANCHO - 12, ALTO - 12, 30);
  ctx.clip();
  ctx.fillStyle = "#C8201A";
  ctx.fillRect(0, 0, ANCHO, 112);
  ctx.fillStyle = "#141414";
  ctx.fillRect(0, 112, ANCHO, 6);
  ctx.restore();

  ctx.fillStyle = "#FFFFFF";
  ctx.font = `38px ${titulos}`;
  ctx.fillText("REPÚBLICA DEL MEZZANINE", 40, 58);
  ctx.font = `700 25px ${textos}`;
  ctx.fillStyle = "#FFCE1F";
  ctx.fillText("Cédula de Coleccionista · Pokedeke", 42, 94);

  dibujarDeke(ctx, 48, 152, tipo.color);

  // Datos.
  const campos: [string, string][] = [
    ["NOMBRE", datos.nombre || "Tu nombre aquí"],
    ["NÚMERO", numeroCedula(datos.nombre || "Pokedeke")],
    ["PROVINCIA", datos.provincia],
    ["TIPO FAVORITO", datos.tipo],
    ["RANGO", datos.rango],
  ];
  campos.forEach(([rotulo, valor], indice) => {
    const y = 160 + indice * 66;
    ctx.fillStyle = "#4A4A4A";
    ctx.font = `700 17px ${textos}`;
    ctx.fillText(rotulo, 262, y);
    ctx.fillStyle = "#141414";
    ctx.font = `700 ${indice === 0 ? 34 : 29}px ${textos}`;
    ctx.fillText(recortar(ctx, valor, 690), 262, y + 34);
  });

  // Pie: cartas y stickers.
  ctx.fillStyle = "#141414";
  ctx.fillRect(6, 498, ANCHO - 12, 5);
  ctx.font = `20px ${titulos}`;
  ctx.fillStyle = "#1437A8";
  ctx.fillText(`${datos.cartas}/${datos.totalCartas} cartas`, 40, 552);
  ctx.font = `700 17px ${textos}`;
  ctx.fillStyle = "#4A4A4A";
  ctx.fillText("Válida en todo el mezzanine", 40, 582);

  datos.stickers.slice(0, 8).forEach((marca, indice) => {
    const x = 400 + indice * 76;
    ctx.beginPath();
    ctx.arc(x, 556, 31, 0, Math.PI * 2);
    ctx.fillStyle = "#FFCE1F";
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#141414";
    ctx.stroke();
    ctx.fillStyle = "#C8201A";
    ctx.font = `21px ${titulos}`;
    ctx.textAlign = "center";
    ctx.fillText(marca, x, 564);
    ctx.textAlign = "left";
  });

  ctx.lineWidth = 9;
  ctx.strokeStyle = "#141414";
  caja(ctx, 6, 6, ANCHO - 12, ALTO - 12, 30);
  ctx.stroke();
}
