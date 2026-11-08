import type { MetadataRoute } from "next";
import { PRODUCTOS } from "@/lib/productos";
import { SITIO, VENDER_ABIERTO } from "@/lib/tienda";

// Se arma al construir la página: el catálogo sale de datos/catalogo.json.
export const dynamic = "force-static";

const PAGINAS = [
  { ruta: "", prioridad: 1 },
  { ruta: "/catalogo", prioridad: 0.9 },
  { ruta: "/nosotros", prioridad: 0.6 },
  { ruta: "/sobre", prioridad: 0.5 },
  { ruta: "/caja-compartida", prioridad: 0.4 },
  { ruta: "/cajas-misteriosas", prioridad: 0.4 },
  { ruta: "/cedula", prioridad: 0.3 },
  { ruta: "/guia", prioridad: 0.4 },
  { ruta: "/politicas", prioridad: 0.3 },
  { ruta: "/comentarios", prioridad: 0.3 },
  ...(VENDER_ABIERTO ? [{ ruta: "/vender", prioridad: 0.4 }] : []),
];

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...PAGINAS.map(({ ruta, prioridad }) => ({
      url: `${SITIO}${ruta}`,
      changeFrequency: "daily" as const,
      priority: prioridad,
    })),
    ...PRODUCTOS.map((producto) => ({
      url: `${SITIO}/producto/${producto.slug}`,
      changeFrequency: "weekly" as const,
      priority: producto.stock > 0 ? 0.7 : 0.3,
    })),
  ];
}
