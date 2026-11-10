import { colones } from "./formato";
import type { Producto } from "./productos";
import { LEMA } from "./tienda";

/**
 * Plantillas del Estudio de contenido: dibujan una imagen para redes con la
 * foto real del producto y los colores de la tienda. Nada se inventa: nombre y
 * precio salen del catálogo.
 */
export const FORMATOS = [
  { id: "cuadrado", nombre: "Post 1:1", ancho: 1080, alto: 1080 },
  { id: "vertical", nombre: "Post 4:5", ancho: 1080, alto: 1350 },
  { id: "historia", nombre: "Historia o Reel 9:16", ancho: 1080, alto: 1920 },
] as const;
export type Formato = (typeof FORMATOS)[number];

export const TIPOS_DE_CONTENIDO = [
  { id: "disponible", nombre: "Disponible", rotulo: "DISPONIBLE" },
  { id: "nuevo", nombre: "Recién llegado", rotulo: "RECIÉN LLEGADO" },
  { id: "pick", nombre: "Pokedeke Pick", rotulo: "POKEDEKE PICK" },
  // Para lo que está Por consultar: nunca dice que hay, invita a consultar.
  { id: "eeuu", nombre: "Lo buscamos", rotulo: "LO BUSCAMOS POR VOS" },
  { id: "pregunta", nombre: "Pregunta a la comunidad", rotulo: "PREGUNTA" },
] as const;
export type TipoDeContenido = (typeof TIPOS_DE_CONTENIDO)[number]["id"];

const AMARILLO = "#FFCE1F";
const AMARILLO_CLARO = "#FFDD5C";
const AZUL = "#1437A8";
const ROJO = "#C8201A";
const TINTA = "#141414";
const CREMA = "#FFF4D6";

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

/** Caja con borde negro y sombra dura, como los marcos de la página. */
function marco(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ancho: number,
  alto: number,
  relleno: string,
  sombra = 12,
) {
  ctx.fillStyle = TINTA;
  caja(ctx, x + sombra, y + sombra, ancho, alto, 22);
  ctx.fill();
  ctx.fillStyle = relleno;
  caja(ctx, x, y, ancho, alto, 22);
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = TINTA;
  ctx.stroke();
}

/** Parte un texto en renglones que quepan en `ancho`. */
function renglones(ctx: CanvasRenderingContext2D, texto: string, ancho: number) {
  const lineas: string[] = [];
  let actual = "";
  for (const palabra of texto.split(/\s+/).filter(Boolean)) {
    const prueba = actual ? actual + " " + palabra : palabra;
    if (actual && ctx.measureText(prueba).width > ancho) {
      lineas.push(actual);
      actual = palabra;
    } else {
      actual = prueba;
    }
  }
  if (actual) lineas.push(actual);
  return lineas;
}

/** Achica la letra hasta que el texto quepa en `maximo` renglones. */
function ajustar(
  ctx: CanvasRenderingContext2D,
  texto: string,
  fuente: (tamano: number) => string,
  ancho: number,
  desde: number,
  maximo: number,
) {
  let tamano = desde;
  ctx.font = fuente(tamano);
  let lineas = renglones(ctx, texto, ancho);
  while (
    tamano > 30 &&
    (lineas.length > maximo ||
      lineas.some((linea) => ctx.measureText(linea).width > ancho))
  ) {
    tamano -= 4;
    ctx.font = fuente(tamano);
    lineas = renglones(ctx, texto, ancho);
  }
  return { tamano, lineas: lineas.slice(0, maximo) };
}

function cargarFoto(ruta: string) {
  return new Promise<HTMLImageElement | null>((listo) => {
    const foto = new Image();
    foto.onload = () => listo(foto);
    foto.onerror = () => listo(null);
    foto.src = ruta;
  });
}

function toldo(ctx: CanvasRenderingContext2D, ancho: number) {
  const paso = 90;
  for (let i = 0; i * paso < ancho; i += 1) {
    ctx.fillStyle = i % 2 === 0 ? ROJO : "#FFFFFF";
    ctx.fillRect(i * paso, 0, paso, 46);
    ctx.beginPath();
    ctx.arc(i * paso + paso / 2, 46, paso / 2, 0, Math.PI);
    ctx.fill();
  }
  ctx.fillStyle = TINTA;
  ctx.fillRect(0, 0, ancho, 6);
}

export type Publicacion = {
  formato: Formato;
  tipo: TipoDeContenido;
  /** Para "pregunta" puede faltar. */
  producto?: Producto;
  /** Solo Pokedeke Pick: por qué lo escogieron, en palabras del equipo. */
  motivo?: string;
  /** Solo "pregunta". */
  pregunta?: string;
  /** La primera lámina de un carrusel: un título grande en vez de un producto. */
  portada?: { rotulo: string; titulo: string; subtitulo: string };
};

/**
 * Dibuja la publicación. Devuelve false si la foto no se pudo usar (por
 * ejemplo, si es de otro sitio): la imagen queda sin foto y no se debe publicar.
 */
export async function dibujarPlantilla(
  lienzo: HTMLCanvasElement,
  { formato, tipo, producto, motivo, pregunta, portada }: Publicacion,
) {
  const estilos = getComputedStyle(document.documentElement);
  const titulos = estilos.getPropertyValue("--font-bungee") || "sans-serif";
  const textos = estilos.getPropertyValue("--font-rubik") || "sans-serif";
  await Promise.all([
    document.fonts.load("40px " + titulos.split(",")[0]),
    document.fonts.load("700 28px " + textos.split(",")[0]),
  ]).catch(() => undefined);
  const deTitulo = (tamano: number) => tamano + "px " + titulos;
  const deTexto = (tamano: number) => "700 " + tamano + "px " + textos;

  const ctx = lienzo.getContext("2d");
  if (!ctx) return false;
  const { ancho, alto } = formato;
  lienzo.width = ancho;
  lienzo.height = alto;
  // En historias y reels, Instagram tapa una franja arriba y otra abajo.
  const historia = formato.id === "historia";
  const arriba = historia ? 210 : 0;
  const abajo = historia ? 290 : 0;
  const margen = 64;

  // Fondo con rayos de rótulo.
  ctx.fillStyle = AMARILLO;
  ctx.fillRect(0, 0, ancho, alto);
  ctx.save();
  ctx.translate(ancho / 2, alto * 0.52);
  ctx.fillStyle = AMARILLO_CLARO;
  for (let rayo = 0; rayo < 16; rayo += 1) {
    ctx.rotate((Math.PI * 2) / 16);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-110, -2400);
    ctx.lineTo(110, -2400);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  toldo(ctx, ancho);

  // Logo y rótulo del tipo de contenido.
  const ySuperior = arriba + 124;
  ctx.save();
  ctx.translate(margen, ySuperior);
  ctx.rotate(-0.03);
  ctx.font = deTitulo(46);
  const anchoLogo = ctx.measureText("POKEDEKE").width + 44;
  marco(ctx, 0, 0, anchoLogo, 84, ROJO, 8);
  ctx.fillStyle = "#FFFFFF";
  ctx.textBaseline = "middle";
  ctx.fillText("POKEDEKE", 22, 44);
  ctx.restore();

  const rotulo =
    portada?.rotulo ??
    TIPOS_DE_CONTENIDO.find((opcion) => opcion.id === tipo)?.rotulo ??
    "";
  ctx.save();
  ctx.font = deTitulo(34);
  const anchoRotulo = ctx.measureText(rotulo).width + 40;
  ctx.translate(ancho - margen - anchoRotulo, ySuperior + 10);
  ctx.rotate(0.02);
  ctx.fillStyle = AZUL;
  caja(ctx, 0, 0, anchoRotulo, 66, 12);
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = TINTA;
  ctx.stroke();
  ctx.fillStyle = "#FFFFFF";
  ctx.textBaseline = "middle";
  ctx.fillText(rotulo, 20, 35);
  ctx.restore();

  // Pie: la dirección y el lema.
  const yPie = alto - abajo - 108;
  ctx.fillStyle = TINTA;
  ctx.fillRect(0, yPie, ancho, 108);
  ctx.textBaseline = "middle";
  ctx.fillStyle = AMARILLO;
  ctx.font = deTitulo(44);
  ctx.fillText("pokedeke.store", margen, yPie + 56);
  ctx.fillStyle = "#FFFFFF";
  ctx.font = deTexto(26);
  ctx.textAlign = "right";
  ctx.fillText(LEMA, ancho - margen, yPie + 56);
  ctx.textAlign = "left";

  const yZona = ySuperior + 84 + 44;
  const altoZona = yPie - 44 - yZona;
  const anchoZona = ancho - margen * 2;

  if (portada || tipo === "pregunta" || !producto) {
    // Una pregunta (o el título del carrusel) grande en una tarjeta crema.
    const texto = portada?.titulo || pregunta || "¿Qué carta andás buscando?";
    const altoTarjeta = Math.min(altoZona, 640);
    const yTarjeta = yZona + (altoZona - altoTarjeta) / 2;
    marco(ctx, margen, yTarjeta, anchoZona, altoTarjeta, CREMA);
    const ajuste = ajustar(ctx, texto, deTitulo, anchoZona - 110, 84, 5);
    const salto = ajuste.tamano * 1.15;
    const altoTexto = ajuste.lineas.length * salto;
    ctx.fillStyle = AZUL;
    ctx.font = deTitulo(ajuste.tamano);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ajuste.lineas.forEach((linea, indice) => {
      ctx.fillText(
        linea,
        ancho / 2,
        yTarjeta + (altoTarjeta - altoTexto - 70) / 2 + salto * (indice + 0.5),
      );
    });
    ctx.fillStyle = TINTA;
    ctx.font = deTexto(36);
    ctx.fillText(
      portada?.subtitulo ?? "Contanos en los comentarios",
      ancho / 2,
      yTarjeta + altoTarjeta - 64,
    );
    ctx.textAlign = "left";
    return true;
  }

  // Nombre (y el motivo del Pick) abajo; la foto ocupa lo que queda.
  const nombre = ajustar(ctx, producto.nombre, deTitulo, anchoZona, 60, 3);
  const saltoNombre = nombre.tamano * 1.12;
  const altoNombre = nombre.lineas.length * saltoNombre;
  ctx.font = deTexto(34);
  const lineasMotivo =
    tipo === "pick" && motivo?.trim()
      ? renglones(ctx, motivo.trim(), anchoZona - 60).slice(0, 4)
      : [];
  const altoMotivo = lineasMotivo.length ? lineasMotivo.length * 44 + 44 : 0;
  const altoFoto = altoZona - altoNombre - 34 - (altoMotivo ? altoMotivo + 22 : 0);
  const lado = Math.min(anchoZona - 60, altoFoto);
  const xFoto = (ancho - lado) / 2;
  const yFoto = yZona + (altoFoto - lado) / 2;

  // Una foto de otro sitio no se puede descargar dentro de la imagen: cuenta como sin foto.
  const propia = producto.fotos[0] && !/^https?:/.test(producto.fotos[0]);
  const foto = propia ? await cargarFoto(producto.fotos[0]) : null;
  ctx.save();
  ctx.translate(xFoto + lado / 2, yFoto + lado / 2);
  ctx.rotate(0.025);
  marco(ctx, -lado / 2, -lado / 2, lado, lado, "#FFFFFF", 14);
  let fotoLista = false;
  if (foto) {
    const hueco = lado - 64;
    const escala = Math.min(hueco / foto.width, hueco / foto.height);
    try {
      ctx.drawImage(
        foto,
        (-foto.width * escala) / 2,
        (-foto.height * escala) / 2,
        foto.width * escala,
        foto.height * escala,
      );
      fotoLista = true;
    } catch {
      fotoLista = false;
    }
  }
  ctx.restore();

  // El precio, como calcomanía sobre la esquina de la foto.
  ctx.save();
  ctx.font = deTitulo(66);
  const precio = tipo === "eeuu" ? "Consultanos" : colones(producto.precio);
  const anchoPrecio = ctx.measureText(precio).width + 52;
  ctx.translate(
    Math.min(xFoto + lado - anchoPrecio * 0.72, ancho - margen - anchoPrecio),
    yFoto + lado - 78,
  );
  ctx.rotate(-0.06);
  marco(ctx, 0, 0, anchoPrecio, 108, CREMA, 10);
  ctx.fillStyle = ROJO;
  ctx.textBaseline = "middle";
  ctx.fillText(precio, 26, 58);
  ctx.restore();

  ctx.fillStyle = AZUL;
  ctx.font = deTitulo(nombre.tamano);
  ctx.textBaseline = "middle";
  const yNombre = yZona + altoFoto + 34;
  nombre.lineas.forEach((linea, indice) => {
    ctx.fillText(linea, margen, yNombre + saltoNombre * (indice + 0.5));
  });

  if (lineasMotivo.length) {
    const yMotivo = yNombre + altoNombre + 22;
    ctx.fillStyle = CREMA;
    caja(ctx, margen, yMotivo, anchoZona, altoMotivo, 16);
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = TINTA;
    ctx.stroke();
    ctx.fillStyle = TINTA;
    ctx.font = deTexto(34);
    lineasMotivo.forEach((linea, indice) => {
      ctx.fillText(linea, margen + 30, yMotivo + 22 + 44 * (indice + 0.5));
    });
  }
  return fotoLista;
}
