import type { NextConfig } from "next";

/**
 * AWS y GitHub Pages sirven archivos ya armados, sin servidor. GitHub además
 * los pone en una subcarpeta (NEXT_PUBLIC_RUTA_BASE). Sin esas variables, todo
 * sigue igual que siempre en la compu.
 */
const rutaBase = process.env.NEXT_PUBLIC_RUTA_BASE;
const archivosArmados = Boolean(rutaBase) || process.env.ARCHIVOS_ARMADOS === "si";

const nextConfig: NextConfig = {
  ...(archivosArmados
    ? {
        output: "export",
        ...(rutaBase ? { basePath: rutaBase } : {}),
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
