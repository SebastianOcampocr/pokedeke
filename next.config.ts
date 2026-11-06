import type { NextConfig } from "next";

/**
 * GitHub Pages sirve archivos ya armados, sin servidor, y desde una subcarpeta.
 * Con NEXT_PUBLIC_RUTA_BASE definida se arma esa versión; sin ella, todo sigue
 * igual que siempre en la compu.
 */
const rutaBase = process.env.NEXT_PUBLIC_RUTA_BASE;

const nextConfig: NextConfig = {
  ...(rutaBase
    ? {
        output: "export",
        basePath: rutaBase,
        images: { unoptimized: true },
      }
    : { cacheComponents: true, partialPrefetching: true }),
  devIndicators: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
