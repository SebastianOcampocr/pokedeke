import type { MetadataRoute } from "next";
import { INDEXAR, SITIO } from "@/lib/tienda";

export const dynamic = "force-static";

/** pokedeke.store se deja indexar; la copia de GitHub Pages no. */
export default function robots(): MetadataRoute.Robots {
  if (!INDEXAR) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/panel", "/estudio", "/pago", "/pagar", "/carrito"] },
    sitemap: `${SITIO}/sitemap.xml`,
  };
}
