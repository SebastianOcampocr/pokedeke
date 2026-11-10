import {
  esUsada,
  estaAgotado,
  PRODUCTOS,
  type Producto,
} from "@/lib/productos";
import { SITIO, TIENDA } from "@/lib/tienda";

/**
 * Lista de productos para Google Merchant Center (Google Shopping gratis).
 * Se arma con la página, así que se pone al día sola cada vez que el catálogo
 * cambia en la hoja. Google la lee desde https://pokedeke.store/google-shopping.xml.
 */
export const dynamic = "force-static";

// "Arts & Entertainment > Hobbies & Creative Arts > Collectibles > Collectible Trading Cards"
const CATEGORIA_GOOGLE = "6997";

const escapar = (texto: string) =>
  texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const monto = (colones: number) => `${colones.toFixed(2)} CRC`;

function foto(producto: Producto) {
  const primera = producto.fotos[0];
  if (!primera) return null;
  return /^https?:\/\//.test(primera) ? primera : `${SITIO}${primera}`;
}

/** "ETB Destined Rivals" → "Pokémon TCG: ETB Destined Rivals - Inglés": así calza con lo que la gente busca. */
function titulo(producto: Producto) {
  const idioma =
    producto.idioma && producto.idioma !== "Otro" ? ` - ${producto.idioma}` : "";
  const marca = /pok[eé]mon/i.test(producto.nombre) ? "" : "Pokémon TCG: ";
  return `${marca}${producto.nombre}${idioma}`.slice(0, 150);
}

function disponibilidad(producto: Producto) {
  // En camino y por consultar no se pueden comprar: para Google van como agotados.
  if (estaAgotado(producto) || producto.estado === "Pedido especial") return { estado: "out_of_stock" };
  return { estado: "in_stock" };
}

function item(producto: Producto) {
  const imagen = foto(producto);
  if (!imagen) return "";
  const { estado } = disponibilidad(producto);
  const campos: [string, string][] = [
    ["g:id", producto.id],
    ["g:title", titulo(producto)],
    ["g:description", (producto.descripcion || producto.nombre).slice(0, 5000)],
    ["g:link", `${SITIO}/producto/${producto.slug}`],
    ["g:image_link", imagen],
    ...producto.fotos
      .slice(1, 4)
      .map((otra): [string, string] => [
        "g:additional_image_link",
        /^https?:\/\//.test(otra) ? otra : `${SITIO}${otra}`,
      ]),
    ["g:availability", estado],
    ...(producto.precioAntes && producto.precioAntes > producto.precio
      ? [
          ["g:price", monto(producto.precioAntes)] as [string, string],
          ["g:sale_price", monto(producto.precio)] as [string, string],
        ]
      : [["g:price", monto(producto.precio)] as [string, string]]),
    ["g:condition", esUsada(producto) ? "used" : "new"],
    ["g:brand", "Pokémon"],
    ["g:identifier_exists", "no"],
    ["g:google_product_category", CATEGORIA_GOOGLE],
    ["g:product_type", producto.categoria],
  ];
  return `<item>\n${campos
    .map(([campo, valor]) => `  <${campo}>${escapar(valor)}</${campo}>`)
    .join("\n")}\n</item>`;
}

export function GET() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
<title>${escapar(TIENDA.nombre)}</title>
<link>${SITIO}</link>
<description>Tienda de Pokémon TCG en Costa Rica</description>
${PRODUCTOS.map(item).filter(Boolean).join("\n")}
</channel>
</rss>
`;
  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
