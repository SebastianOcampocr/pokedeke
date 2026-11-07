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
        images: {
          loader: "custom",
          loaderFile: "./lib/cargador-fotos.ts",
          // Deben coincidir con scripts/hacer-miniaturas.mjs. 900 es la foto original.
          imageSizes: [96, 192, 384],
          deviceSizes: [640, 900],
          qualities: [75],
        },
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
