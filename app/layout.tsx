import type { Metadata, Viewport } from "next";
import { Bungee, Rubik } from "next/font/google";
import { Suspense } from "react";
import { AvisoLogro } from "@/components/AvisoLogro";
import { BarraInferior } from "@/components/BarraInferior";
import { DekeCompa } from "@/components/DekeCompa";
import { EfectosGlobales } from "@/components/EfectosGlobales";
import { Encabezado, PiePagina } from "@/components/Estructura";
import { INDEXAR, SITIO, TIENDA } from "@/lib/tienda";
import "./globals.css";

const bungee = Bungee({
  variable: "--font-bungee",
  weight: "400",
  subsets: ["latin", "latin-ext"],
});

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITIO),
  title: {
    default: `${TIENDA.nombre} · Tienda de Pokémon TCG en Costa Rica`,
    template: `%s · ${TIENDA.nombre}`,
  },
  description:
    "Pokedeke es una tienda de Pokémon TCG en Costa Rica: cartas sueltas, sobres, ETB y cajas en colones, con envío a todo el país y pago por SINPE Móvil.",
  applicationName: TIENDA.nombre,
  keywords: ["Pokedeke", "Pokedeke Store", "TCG Costa Rica", "Pokémon TCG Costa Rica", "cartas Pokémon Costa Rica"],
  openGraph: {
    type: "website",
    siteName: TIENDA.nombre,
    locale: "es_CR",
  },
  // La copia de GitHub Pages no se indexa: solo pokedeke.store.
  robots: INDEXAR ? { index: true, follow: true } : { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#FFCE1F",
  // Samsung Internet solo respeta la página si esta dice que maneja el modo
  // oscuro. Los colores se quedan fijos con `color-scheme` en globals.css.
  colorScheme: "light dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-CR"
      data-scroll-behavior="smooth"
      className={`${bungee.variable} ${rubik.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col pb-[calc(63px+env(safe-area-inset-bottom))] lg:pb-0">
        <Encabezado />
        <main className="flex grow flex-col">{children}</main>
        <PiePagina />
        <EfectosGlobales />
        <AvisoLogro />
        <Suspense fallback={null}>
          <BarraInferior />
          <DekeCompa />
        </Suspense>
      </body>
    </html>
  );
}
